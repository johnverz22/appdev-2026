import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, ClipboardList, AlertCircle, Loader2,
    User, Package, Search, Filter, TrendingUp,
    ShoppingCart, Users, DollarSign,
} from 'lucide-react';
import djangoApi from '../config/djangoApi';
import { usePageTitle } from '../hooks/usePageTitle';

const STATUS_COLORS = {
    confirmed: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    cancelled:  'bg-red-500/10 border-red-500/30 text-red-400',
    pending:    'bg-amber-500/10 border-amber-500/30 text-amber-400',
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-white font-bold text-xl leading-tight">{value}</p>
        </div>
    </div>
);

// ── Order row ─────────────────────────────────────────────────────────────────
const OrderRow = ({ order }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer"
            onClick={() => setExpanded(e => !e)}
        >
            {/* Summary row */}
            <div className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-semibold text-sm">Order #{order.id}</p>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{order.username}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500 flex-shrink-0">
                                {new Date(order.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                        {order.status}
                    </span>
                    <span className="text-emerald-400 font-bold text-sm w-20 text-right">
                        ${Number(order.total).toFixed(2)}
                    </span>
                    <span className="text-slate-600 text-xs">{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {/* Expanded items */}
            {expanded && (
                <div className="border-t border-white/10 px-5 py-4 bg-white/[0.02]">
                    <p className="text-slate-500 text-xs mb-2 uppercase tracking-wide">Items</p>
                    <div className="space-y-1.5">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-slate-300">
                                    {item.name}
                                    <span className="text-slate-500 ml-1.5">× {item.qty}</span>
                                </span>
                                <span className="text-slate-400">
                                    ${(Number(item.price) * item.qty).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-slate-600 text-xs mt-3">
                        Placed at {new Date(order.created_at).toLocaleString()}
                    </p>
                </div>
            )}
        </div>
    );
};

// ── Orders page ───────────────────────────────────────────────────────────────
const Orders = () => {
    usePageTitle('All Orders');
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [search, setSearch]   = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        djangoApi.get('/api/orders/all')
            .then(({ data }) => setOrders(data))
            .catch((err) => setError(err.response?.data?.error || 'Failed to load orders.'))
            .finally(() => setLoading(false));
    }, []);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const revenue   = orders.reduce((s, o) => s + Number(o.total), 0);
        const userSet   = new Set(orders.map(o => o.username));
        return {
            total:   orders.length,
            revenue: revenue.toFixed(2),
            users:   userSet.size,
        };
    }, [orders]);

    // ── Filtered list ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return orders.filter(o => {
            const matchSearch = !q
                || o.username.toLowerCase().includes(q)
                || String(o.id).includes(q);
            const matchStatus = statusFilter === 'all' || o.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [orders, search, statusFilter]);

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="fixed top-[-15%] right-[-10%] w-[40%] h-[40%] bg-amber-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg text-white">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">All Orders</h1>
                            <p className="text-slate-400 text-sm mt-0.5">Admin view · Django service</p>
                        </div>
                    </div>
                    <Link to="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                        Loading orders…
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <StatCard icon={ShoppingCart}  label="Total Orders"   value={stats.total}          color="bg-amber-500/20 text-amber-400" />
                            <StatCard icon={DollarSign}    label="Total Revenue"  value={`$${stats.revenue}`}  color="bg-emerald-500/20 text-emerald-400" />
                            <StatCard icon={Users}         label="Unique Customers" value={stats.users}        color="bg-violet-500/20 text-violet-400" />
                        </div>

                        {/* Search + filter */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-5">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search by username or order ID…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {/* Results count */}
                        <p className="text-slate-500 text-xs mb-3">
                            {filtered.length === orders.length
                                ? `${orders.length} orders`
                                : `${filtered.length} of ${orders.length} orders`}
                        </p>

                        {/* Empty state */}
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
                                <TrendingUp className="w-10 h-10 text-slate-700" />
                                <p className="text-sm">
                                    {orders.length === 0
                                        ? 'No orders have been placed yet.'
                                        : 'No orders match your search.'}
                                </p>
                            </div>
                        )}

                        {/* Order list — click to expand items */}
                        <div className="space-y-3">
                            {filtered.map(order => (
                                <OrderRow key={order.id} order={order} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Orders;
