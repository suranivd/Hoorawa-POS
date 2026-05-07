import { useNavigate } from 'react-router-dom';
import {
    DollarSign, ShoppingCart, TrendingUp, AlertTriangle,
    Package, Factory, FileText, Users, CreditCard, ArrowRight,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, CartesianGrid, Legend,
} from 'recharts';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { Calendar } from 'lucide-react';
import {
    useDashboardKpis, useRevenueChart, useTopProducts, useTopCustomers,
} from '../features/reports/useReports';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { data: kpisData, isLoading } = useDashboardKpis();
    const { data: revenueData } = useRevenueChart(6);
    const { data: topProductsData } = useTopProducts({ period: 'month', limit: 5 });
    const { data: topCustomersData } = useTopCustomers({ period: 'month', limit: 5 });

    const k = kpisData?.data;

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const fmtDate = (d) => new Intl.DateTimeFormat('en-LK', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);

    const fmt = (n) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(n || 0);
    const fmtShort = (n) => {
        if (n >= 1000000) return `LKR ${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `LKR ${(n / 1000).toFixed(0)}k`;
        return fmt(n);
    };

    if (isLoading || !k) return <div className="py-16 text-center text-gray-500">Loading dashboard...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                        {getTimeGreeting()}, <span className="text-indigo-600">{user?.firstName}!</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                        Here's what's happening with your store today
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm text-sm font-medium text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    {fmtDate(new Date())}
                </div>
            </div>

            {/* Primary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard
                    label="Revenue This Month" value={fmtShort(k.revenue.thisMonth)}
                    icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50"
                    trend={k.revenue.growth} accentColor="bg-green-500"
                    subtext={`${k.revenue.invoiceCount} invoices`} />
                <KpiCard
                    label="Orders Today" value={k.orders.today}
                    icon={ShoppingCart} iconColor="text-blue-600" iconBg="bg-blue-50"
                    accentColor="bg-blue-500"
                    subtext={`${k.orders.thisMonth} this month`}
                    onClick={() => navigate('/sales-orders')} />
                <KpiCard
                    label="Outstanding Receivables" value={fmtShort(k.receivables.total)}
                    icon={CreditCard} iconColor="text-amber-600" iconBg="bg-amber-50"
                    accentColor="bg-amber-500"
                    subtext={k.receivables.overdueCount > 0
                        ? `${fmtShort(k.receivables.overdue)} overdue (${k.receivables.overdueCount})`
                        : 'No overdue'}
                    onClick={() => navigate('/invoices')} />
                <KpiCard
                    label="Low Stock Alerts" value={k.stock.lowStockCount}
                    icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50"
                    accentColor="bg-red-500"
                    subtext="Products at or below reorder level"
                    onClick={() => navigate('/reports/inventory/low-stock')} />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard label="Pending Approvals" value={k.orders.pendingApproval}
                    icon={FileText} iconColor="text-indigo-600" iconBg="bg-indigo-50" accentColor="bg-indigo-500" />
                <KpiCard label="Pending Dispatch" value={k.orders.pendingDispatch}
                    icon={Package} iconColor="text-purple-600" iconBg="bg-purple-50" accentColor="bg-purple-500" />
                <KpiCard label="Active Production" value={k.production.active}
                    icon={Factory} iconColor="text-pink-600" iconBg="bg-pink-50" accentColor="bg-pink-500"
                    subtext={`${k.production.completedThisMonth} completed this month`} />
                <KpiCard label="Active Customers" value={k.customers.total}
                    icon={Users} iconColor="text-cyan-600" iconBg="bg-cyan-50" accentColor="bg-cyan-400"
                    subtext={`${k.customers.newThisMonth} new this month`} />
            </div>

            {/* Revenue Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-2 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (Last 6 Months)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={revenueData?.data || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => fmt(v)} />
                            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2}
                                dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <Button fullWidth variant="outline" onClick={() => navigate('/sales-orders/new')}>
                            New Sales Order <ArrowRight size={14} className="ml-auto" />
                        </Button>
                        <Button fullWidth variant="outline" onClick={() => navigate('/payments/new')}>
                            Record Payment <ArrowRight size={14} className="ml-auto" />
                        </Button>
                        <Button fullWidth variant="outline" onClick={() => navigate('/purchase-orders/new')}>
                            New Purchase Order <ArrowRight size={14} className="ml-auto" />
                        </Button>
                        <Button fullWidth variant="outline" onClick={() => navigate('/reports')}>
                            View All Reports <ArrowRight size={14} className="ml-auto" />
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Top Products & Top Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">Top Products This Month</h3>
                        <Button variant="outline" size="sm" onClick={() => navigate('/reports/sales')}>View All</Button>
                    </div>
                    {topProductsData?.data?.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 text-sm">No sales this month yet</p>
                    ) : (
                        <div className="space-y-2">
                            {(topProductsData?.data || []).map((p, idx) => (
                                <div key={p._id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center text-xs font-semibold">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">{p.productName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{p.productCode}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{fmt(p.revenue)}</p>
                                        <p className="text-xs text-gray-500">{p.quantitySold} units</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">Top Customers This Month</h3>
                        <Button variant="outline" size="sm" onClick={() => navigate('/customers')}>View All</Button>
                    </div>
                    {topCustomersData?.data?.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 text-sm">No invoices this month yet</p>
                    ) : (
                        <div className="space-y-2">
                            {(topCustomersData?.data || []).map((c, idx) => (
                                <div key={c._id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">{c.customerName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{c.customerCode}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{fmt(c.totalInvoiced)}</p>
                                        <p className="text-xs text-gray-500">{c.invoiceCount} invoice{c.invoiceCount !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Low Stock Alerts */}
            {k.stock.lowStockItems.length > 0 && (
                <Card className="p-6 border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                            <AlertTriangle size={18} /> Low Stock Alerts
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => navigate('/stock')}>View Stock</Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {k.stock.lowStockItems.slice(0, 10).map((item) => (
                            <div key={item.productId} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded">
                                <div>
                                    <p className="text-sm font-medium">{item.productName}</p>
                                    <p className="text-xs text-gray-600 font-mono">{item.productCode}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="danger">{item.available} left</Badge>
                                    <p className="text-xs text-gray-600 mt-1">Reorder at: {item.reorderLevel}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}