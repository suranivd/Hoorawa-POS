import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Installment from '../models/Installment.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import BankAccount from '../models/BankAccount.js';
import { updateCustomerBalance } from './invoiceController.js';

/**
 * GET /api/installments
 * List installment plans
 */
export const getInstallments = asyncHandler(async (req, res) => {
    const { status, customerId, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (search) {
        filter.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            { customerPhone: { $regex: search, $options: 'i' } },
            { installmentNumber: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [installments, total] = await Promise.all([
        Installment.find(filter)
            .populate('customerId', 'displayName customerCode')
            .populate('invoiceId', 'invoiceNumber grandTotal paymentStatus')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Installment.countDocuments(filter)
    ]);

    res.json({
        success: true,
        data: installments,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    });
});

/**
 * GET /api/installments/:id
 * Get single installment details
 */
export const getInstallmentById = asyncHandler(async (req, res) => {
    const installment = await Installment.findById(req.params.id)
        .populate('customerId', 'displayName customerCode primaryContact')
        .populate('invoiceId', 'invoiceNumber grandTotal amountPaid balanceDue paymentStatus');

    if (!installment) {
        res.status(404);
        throw new Error('Installment plan not found');
    }

    res.json({ success: true, data: installment });
});

/**
 * POST /api/installments/:id/pay
 * Pay an installment schedule item
 */
export const payInstallment = asyncHandler(async (req, res) => {
    const { installmentNo, amount, method, bankAccountId, chequeNumber, chequeDate, notes } = req.body;

    const installment = await Installment.findById(req.params.id);
    if (!installment) {
        res.status(404);
        throw new Error('Installment plan not found');
    }

    if (installment.status === 'completed') {
        res.status(400);
        throw new Error('Installment plan is already fully paid');
    }

    const scheduleItem = installment.schedule.find(item => item.installmentNo === Number(installmentNo));
    if (!scheduleItem) {
        res.status(404);
        throw new Error(`Installment number ${installmentNo} not found in schedule`);
    }

    if (scheduleItem.status === 'paid') {
        res.status(400);
        throw new Error(`Installment number ${installmentNo} is already paid`);
    }

    const paymentAmount = Number(amount) || scheduleItem.amount;

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            // 1. Create a Payment record
            const payment = new Payment({
                direction: 'received',
                customerId: installment.customerId,
                partyName: installment.customerName,
                amount: paymentAmount,
                method,
                chequeNumber: method === 'cheque' ? chequeNumber : undefined,
                chequeDate: method === 'cheque' ? chequeDate : undefined,
                chequeStatus: method === 'cheque' ? 'pending' : undefined,
                bankAccountId: ['card', 'bank_transfer', 'koko'].includes(method) ? bankAccountId : undefined,
                allocations: [{
                    documentType: 'invoice',
                    documentId: installment.invoiceId,
                    amount: paymentAmount
                }],
                status: ['cash', 'card', 'bank_transfer', 'koko'].includes(method) ? 'cleared' : 'confirmed',
                notes: notes || `Paid installment #${installmentNo} for ${installment.installmentNumber}`,
                receivedBy: req.user._id,
                createdBy: req.user._id
            });
            await payment.save({ session });

            // 2. If Bank Transfer, Card, Koko, update BankAccount balance
            if (['card', 'bank_transfer', 'koko'].includes(method) && bankAccountId) {
                const bankAcc = await BankAccount.findById(bankAccountId).session(session);
                if (bankAcc) {
                    bankAcc.currentBalance = +(bankAcc.currentBalance + paymentAmount).toFixed(2);
                    await bankAcc.save({ session });
                }
            }

            // 3. If Cheque, create the separate Cheque document as well
            if (method === 'cheque') {
                const Cheque = (await import('../models/Cheque.js')).default;
                const cheque = new Cheque({
                    chequeNumber,
                    chequeDate,
                    amount: paymentAmount,
                    bankName: 'Installment Cheque',
                    direction: 'incoming',
                    payeeName: installment.customerName,
                    paymentId: payment._id,
                    customerId: installment.customerId,
                    createdBy: req.user._id,
                    status: 'pending',
                    notes: `Created from installment payment #${installmentNo} of ${installment.installmentNumber}`
                });
                await cheque.save({ session });
            }

            // 4. Update the schedule item
            scheduleItem.paidAmount = +(scheduleItem.paidAmount + paymentAmount).toFixed(2);
            scheduleItem.paidDate = new Date();
            scheduleItem.status = 'paid';
            scheduleItem.paymentId = payment._id;

            // 5. Update overall installment status/remaining amount
            installment.remainingAmount = +(installment.remainingAmount - paymentAmount).toFixed(2);
            if (installment.remainingAmount <= 0) {
                installment.remainingAmount = 0;
                installment.status = 'completed';
            }

            // Check if there are any other unpaid installments. If all are paid, mark completed.
            const allPaid = installment.schedule.every(item => item.status === 'paid');
            if (allPaid) {
                installment.status = 'completed';
            }
            await installment.save({ session });

            // 6. Update the linked Invoice payment status and amounts
            const invoice = await Invoice.findById(installment.invoiceId).session(session);
            if (invoice) {
                invoice.amountPaid = +(invoice.amountPaid + paymentAmount).toFixed(2);
                invoice.balanceDue = +(invoice.balanceDue - paymentAmount).toFixed(2);
                if (invoice.balanceDue <= 0) {
                    invoice.balanceDue = 0;
                    invoice.paymentStatus = 'paid';
                    invoice.fullyPaidAt = new Date();
                } else {
                    invoice.paymentStatus = 'partially_paid';
                }
                await invoice.save({ session });
            }

            // 7. Recalculate customer credit balance to reflect payment
            await updateCustomerBalance(installment.customerId, session);
        });

        const updatedInstallment = await Installment.findById(installment._id)
            .populate('customerId', 'displayName customerCode')
            .populate('invoiceId', 'invoiceNumber grandTotal paymentStatus');

        res.json({ success: true, data: updatedInstallment });
    } catch (err) {
        res.status(400);
        throw new Error(err.message || 'Failed to record installment payment');
    } finally {
        session.endSession();
    }
});
