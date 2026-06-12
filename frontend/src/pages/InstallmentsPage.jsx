import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import toast from 'react-hot-toast';
import { Calendar, DollarSign, User, Phone, CheckCircle, AlertCircle, Eye, CreditCard } from 'lucide-react';

export default function InstallmentsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('active');
    const [page, setPage] = useState(1);

    // Selected plan details modal
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

    // Record payment modal
    const [activeScheduleItem, setActiveScheduleItem] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Payment Form State
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    // Fetch Installments
    const { data, isLoading } = useQuery({
        queryKey: ['installments', { search, status, page }],
        queryFn: async () => {
            const res = await api.get('/installments', {
                params: { search, status, page, limit: 10 }
            });
            return res.data;
        },
        placeholderData: (prev) => prev
    });

    // Fetch single installment details
    const { data: planDetails, isLoading: isDetailsLoading } = useQuery({
        queryKey: ['installment', selectedPlanId],
        queryFn: async () => {
            const res = await api.get(`/installments/${selectedPlanId}`);
            return res.data.data;
        },
        enabled: !!selectedPlanId
    });

    // Fetch Bank Accounts (for card/bank transfer/koko payments)
    const { data: bankAccountsData } = useQuery({
        queryKey: ['bank-accounts'],
        queryFn: async () => {
            const res = await api.get('/bank-accounts');
            return res.data.data || [];
        }
    });
    const bankAccounts = bankAccountsData || [];

    // Mutation: Record payment for installment
    const recordPaymentMutation = useMutation({
        mutationFn: async ({ planId, payload }) => {
            const res = await api.post(`/installments/${planId}/pay`, payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Installment payment recorded successfully');
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['installment', selectedPlanId] });
            queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
            setIsPaymentModalOpen(false);
            setActiveScheduleItem(null);
            resetPaymentForm();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to record payment');
        }
    });

    const resetPaymentForm = () => {
        setPaymentAmount('');
        setPaymentMethod('cash');
        setSelectedBankAccountId('');
        setChequeNumber('');
        setChequeDate('');
        setPaymentNotes('');
    };

    const handleOpenPaymentModal = (item) => {
        setActiveScheduleItem(item);
        setPaymentAmount(item.amount.toString());
        setIsPaymentModalOpen(true);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!paymentMethod) {
            toast.error('Please select a payment method');
            return;
        }

        if (['card', 'bank_transfer', 'koko'].includes(paymentMethod) && !selectedBankAccountId) {
            toast.error('Please select a bank account');
            return;
        }

        if (paymentMethod === 'cheque') {
            if (!chequeNumber || !chequeDate) {
                toast.error('Cheque details are required');
                return;
            }
        }

        const payload = {
            installmentNo: activeScheduleItem.installmentNo,
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
            bankAccountId: selectedBankAccountId || undefined,
            chequeNumber: paymentMethod === 'cheque' ? chequeNumber : undefined,
            chequeDate: paymentMethod === 'cheque' ? chequeDate : undefined,
            notes: paymentNotes
        };

        recordPaymentMutation.mutate({ planId: selectedPlanId, payload });
    };

    const handleOpenPlanModal = (id) => {
        setSelectedPlanId(id);
        setIsPlanModalOpen(true);
    };

    // Helper formatting functions
    const fmt = (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val || 0);
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-LK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadgeType = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'active': return 'warning';
            case 'defaulted': return 'danger';
            case 'paid': return 'success';
            case 'overdue': return 'danger';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Installments Tracker"
                description="Manage and track customer installment plans"
            />

            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Search customer or plan"
                        placeholder="Search by name, phone, INST number..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                    <Select
                        label="Status"
                        options={[
                            { value: 'active', label: 'Active Plans' },
                            { value: 'completed', label: 'Completed Plans' },
                            { value: 'defaulted', label: 'Defaulted Plans' },
                            { value: '', label: 'All Plans' }
                        ]}
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </Card>

            {/* List */}
            <Card>
                {isLoading ? (
                    <div className="p-16 text-center text-gray-500">Loading installment plans...</div>
                ) : !data?.data?.length ? (
                    <div className="p-16 text-center text-gray-500">No installment plans found.</div>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase">
                                        <th className="p-4">Plan No</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4">Invoice</th>
                                        <th className="p-4">Total Amount</th>
                                        <th className="p-4">Paid (Down Payment)</th>
                                        <th className="p-4">Outstanding</th>
                                        <th className="p-4">Progress</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                                    {data.data.map((plan) => {
                                        const paidVal = (plan.totalAmount - plan.remainingAmount) || 0;
                                        const pct = plan.totalAmount > 0 ? Math.round((paidVal / plan.totalAmount) * 100) : 0;
                                        return (
                                            <tr key={plan._id} className="hover:bg-gray-50/50">
                                                <td className="p-4 font-bold text-indigo-600">{plan.installmentNumber}</td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-900">{plan.customerName || 'Walk-in Customer'}</div>
                                                    <div className="text-xs text-gray-500">{plan.customerPhone || 'N/A'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => navigate(`/invoices/${plan.invoiceId?._id}`)}
                                                        className="hover:underline text-indigo-600 font-medium"
                                                    >
                                                        {plan.invoiceId?.invoiceNumber || 'INV-N/A'}
                                                    </button>
                                                </td>
                                                <td className="p-4 font-semibold">{fmt(plan.totalAmount)}</td>
                                                <td className="p-4">
                                                    <div>{fmt(paidVal)}</div>
                                                    <div className="text-[10px] text-gray-400">Down: {fmt(plan.downPayment)}</div>
                                                </td>
                                                <td className="p-4 font-bold text-rose-600">{fmt(plan.remainingAmount)}</td>
                                                <td className="p-4 w-40">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-600">{pct}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge type={getStatusBadgeType(plan.status)}>
                                                        {plan.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenPlanModal(plan._id)}
                                                        className="inline-flex items-center gap-1.5"
                                                    >
                                                        <Eye size={14} /> View Plan
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile & Tablet Card View */}
                        <div className="lg:hidden divide-y divide-gray-100">
                            {data.data.map((plan) => {
                                const paidVal = (plan.totalAmount - plan.remainingAmount) || 0;
                                const pct = plan.totalAmount > 0 ? Math.round((paidVal / plan.totalAmount) * 100) : 0;
                                return (
                                    <div key={plan._id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold text-indigo-600 text-sm">{plan.installmentNumber}</span>
                                                <h4 className="font-semibold text-gray-900 text-sm mt-0.5">{plan.customerName || 'Walk-in Customer'}</h4>
                                                <span className="text-xs text-gray-500">{plan.customerPhone || 'N/A'}</span>
                                            </div>
                                            <Badge type={getStatusBadgeType(plan.status)}>
                                                {plan.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl">
                                            <div>
                                                <span className="text-gray-400 block uppercase tracking-wider text-[9px]">Total Invoice</span>
                                                <span className="font-semibold text-gray-800">{fmt(plan.totalAmount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block uppercase tracking-wider text-[9px]">Outstanding</span>
                                                <span className="font-bold text-rose-600">{fmt(plan.remainingAmount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block uppercase tracking-wider text-[9px]">Paid</span>
                                                <span className="font-medium text-green-600">{fmt(paidVal)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block uppercase tracking-wider text-[9px]">Down Payment</span>
                                                <span className="font-medium text-gray-700">{fmt(plan.downPayment)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pt-1">
                                            <div className="flex-1 flex items-center gap-2">
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-indigo-600 h-1.5 rounded-full"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-gray-500">{pct}%</span>
                                            </div>
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenPlanModal(plan._id)}
                                                className="inline-flex items-center gap-1.5"
                                            >
                                                <Eye size={14} /> View Plan
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
                {data?.pagination && data.pagination.pages > 1 && (
                    <div className="p-4 border-t">
                        <Pagination
                            currentPage={page}
                            totalPages={data.pagination.pages}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </Card>

            {/* Plan details modal */}
            <Modal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                title={`Installment Schedule - ${planDetails?.installmentNumber || ''}`}
                size="lg"
            >
                {isDetailsLoading || !planDetails ? (
                    <div className="p-12 text-center text-gray-500">Loading plan schedule...</div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Summary cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Customer Details</span>
                                <div className="mt-2 flex items-center gap-2">
                                    <User size={16} className="text-gray-400" />
                                    <span className="font-semibold text-gray-900 text-sm">{planDetails.customerName}</span>
                                </div>
                                {planDetails.customerPhone && (
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                        <Phone size={12} className="text-gray-400" />
                                        <span>{planDetails.customerPhone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Billing Summary</span>
                                <div className="mt-1.5 flex justify-between text-xs text-gray-600">
                                    <span>Total:</span>
                                    <span className="font-semibold">{fmt(planDetails.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Down Payment:</span>
                                    <span className="font-semibold">{fmt(planDetails.downPayment)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-indigo-600 font-semibold border-t pt-1 mt-1">
                                    <span>Outstanding:</span>
                                    <span>{fmt(planDetails.remainingAmount)}</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Terms</span>
                                <div className="mt-2 text-sm font-semibold text-gray-900">
                                    {planDetails.numberOfInstallments} Installments
                                </div>
                                <div className="text-xs text-gray-500 capitalize mt-1">
                                    Interval: {planDetails.installmentInterval}
                                </div>
                            </div>
                        </div>

                        {/* Schedule table */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment Schedule</h4>
                            
                            {/* Desktop View */}
                            <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600">
                                            <th className="p-3">#</th>
                                            <th className="p-3">Due Date</th>
                                            <th className="p-3">Amount Due</th>
                                            <th className="p-3">Paid Amount</th>
                                            <th className="p-3">Paid Date</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                                        {planDetails.schedule.map((item) => (
                                            <tr key={item._id} className="hover:bg-gray-50/20">
                                                <td className="p-3 font-semibold">{item.installmentNo}</td>
                                                <td className="p-3">{formatDate(item.dueDate)}</td>
                                                <td className="p-3 font-semibold">{fmt(item.amount)}</td>
                                                <td className="p-3">{item.paidAmount > 0 ? fmt(item.paidAmount) : '-'}</td>
                                                <td className="p-3">{formatDate(item.paidDate)}</td>
                                                <td className="p-3">
                                                    <Badge type={getStatusBadgeType(item.status)}>
                                                        {item.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {item.status !== 'paid' && planDetails.status === 'active' && (
                                                        <Button
                                                            variant="primary"
                                                            size="xs"
                                                            onClick={() => handleOpenPaymentModal(item)}
                                                        >
                                                            Pay
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden space-y-3">
                                {planDetails.schedule.map((item) => (
                                    <div key={item._id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-800 text-sm">Installment #{item.installmentNo}</span>
                                            <Badge type={getStatusBadgeType(item.status)}>
                                                {item.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <div>
                                                <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Due Date</span>
                                                <span className="font-medium text-gray-800">{formatDate(item.dueDate)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Amount Due</span>
                                                <span className="font-bold text-indigo-600">{fmt(item.amount)}</span>
                                            </div>
                                            {item.paidAmount > 0 && (
                                                <>
                                                    <div>
                                                        <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Paid Amount</span>
                                                        <span className="font-medium text-green-600">{fmt(item.paidAmount)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Paid Date</span>
                                                        <span className="font-medium text-gray-800">{formatDate(item.paidDate)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {item.status !== 'paid' && planDetails.status === 'active' && (
                                            <div className="pt-2 border-t border-gray-50 flex justify-end">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleOpenPaymentModal(item)}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Pay Installment
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Record Payment modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title={`Record Installment Payment - No. ${activeScheduleItem?.installmentNo || ''}`}
                size="md"
            >
                <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="text-amber-600 mt-0.5" size={18} />
                        <div className="text-xs text-amber-900">
                            <p className="font-bold">Important Note</p>
                            <p className="mt-1">Recording this payment will generate a cleared transaction receipt in the customer ledger and tally with the selected bank account immediately.</p>
                        </div>
                    </div>

                    <Input
                        label="Payment Amount (LKR)"
                        type="number"
                        step="any"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                    />

                    <Select
                        label="Payment Method"
                        required
                        options={[
                            { value: 'cash', label: 'Cash' },
                            { value: 'card', label: 'Card Payment' },
                            { value: 'bank_transfer', label: 'Bank Transfer' },
                            { value: 'cheque', label: 'Cheque' },
                            { value: 'koko', label: 'Koko (BNPL)' }
                        ]}
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    />

                    {/* Bank account selector */}
                    {['card', 'bank_transfer', 'koko'].includes(paymentMethod) && (
                        <Select
                            label="Deposit Bank Account"
                            required
                            options={[
                                { value: '', label: '-- Select Bank Account --' },
                                ...bankAccounts.map(b => ({
                                    value: b._id,
                                    label: `${b.bankName} - ${b.accountName} (${b.accountNumber})`
                                }))
                            ]}
                            value={selectedBankAccountId}
                            onChange={(e) => setSelectedBankAccountId(e.target.value)}
                        />
                    )}

                    {/* Cheque inputs */}
                    {paymentMethod === 'cheque' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Cheque Number"
                                required
                                value={chequeNumber}
                                onChange={(e) => setChequeNumber(e.target.value)}
                            />
                            <Input
                                label="Cheque Date"
                                type="date"
                                required
                                value={chequeDate}
                                onChange={(e) => setChequeDate(e.target.value)}
                            />
                        </div>
                    )}

                    <Input
                        label="Notes (Optional)"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Add transaction remarks..."
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setIsPaymentModalOpen(false)}
                            disabled={recordPaymentMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            loading={recordPaymentMutation.isPending}
                        >
                            Submit Payment
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
