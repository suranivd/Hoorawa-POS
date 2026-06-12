import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';

const installmentScheduleSchema = new mongoose.Schema({
    installmentNo: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    paidDate: { type: Date },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending',
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
});

const installmentSchema = new mongoose.Schema({
    installmentNumber: { type: String, unique: true, uppercase: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customerName: String,
    customerPhone: String,
    totalAmount: { type: Number, required: true },
    downPayment: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    numberOfInstallments: { type: Number, required: true },
    installmentInterval: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },
    schedule: [installmentScheduleSchema],
    status: {
        type: String,
        enum: ['active', 'completed', 'defaulted'],
        default: 'active',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
}, { timestamps: true });

installmentSchema.pre('save', async function () {
    if (this.isNew && !this.installmentNumber) {
        const seq = await getNextSequence('installment');
        this.installmentNumber = `INST-${seq}`;
    }
});

// Soft delete check
installmentSchema.pre(/^find/, function (next) {
    if (!this.getOptions || !this.getOptions().includeDeleted) {
        this.where({ deletedAt: null });
    }
    if (typeof next === 'function') next();
});

const Installment = mongoose.model('Installment', installmentSchema);
export default Installment;
