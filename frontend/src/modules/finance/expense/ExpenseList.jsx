import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Filter, Plus, TrendingDown, Download,
    ArrowRight, Tag, Building2, Calendar, MoreVertical,
    FileText, CheckCircle2, AlertCircle, ShoppingCart, Trash2, Clock
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { expenseService } from '../../../services/api/apiServices';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '../../../services/api/axios';

const STATUS_CONFIG = {
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending', icon: AlertCircle },
    approved: { color: 'bg-blue-100 text-blue-700', label: 'Approved', icon: FileText },
    paid: { color: 'bg-emerald-100 text-emerald-700', label: 'Paid', icon: CheckCircle2 },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected', icon: Trash2 }
};

const CATEGORIES = [
    'Office Supplies', 'Travel', 'Utilities', 'Salaries',
    'Marketing', 'Software', 'Rent', 'Miscellaneous'
];

const ExpenseList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Queries
    const { data: expensesData, isLoading } = useQuery({
        queryKey: ['expenses', statusFilter, categoryFilter],
        queryFn: async () => {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (categoryFilter !== 'all') params.category = categoryFilter;
            const res = await expenseService.getAll(params);
            return res?.data?.data?.expenses || res?.data?.expenses || res?.data || [];
        }
    });

    const filteredExpenses = useMemo(() => {
        let list = Array.isArray(expensesData) ? expensesData : [];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(exp =>
                exp.merchant?.toLowerCase().includes(q) ||
                exp.description?.toLowerCase().includes(q) ||
                exp.expenseNumber?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [expensesData, searchQuery]);



    const handleExport = async () => {
        const t = toast.loading('Generating export...');
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (categoryFilter !== 'all') params.category = categoryFilter;
            
            const res = await expenseService.exportExcel(params);
            if (res.data?.data?.excelUrl) {
                window.open(`${BASE_URL}${res.data.data.excelUrl}`, '_blank');
                toast.success('Export generated successfully', { id: t });
            } else {
                throw new Error('No URL returned');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export expenses', { id: t });
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        <TrendingDown className="w-8 h-8 text-rose-500" />
                        Expense Tracking
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Monitor operational costs, vendor payments, and category-wise spend.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={() => navigate('/finance/expenses/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-bold text-sm shadow-lg shadow-rose-200"
                    >
                        <Plus className="w-4 h-4" /> Record Expense
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Spend', value: filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0), color: 'text-slate-900' },
                    { label: 'Paid', value: filteredExpenses.filter(e => e.status === 'paid').reduce((acc, exp) => acc + exp.amount, 0), color: 'text-emerald-600' },
                    { label: 'Pending Approval', value: filteredExpenses.filter(e => e.status === 'pending').reduce((acc, exp) => acc + exp.amount, 0), color: 'text-amber-600' },
                    {
                        label: 'This Month', value: filteredExpenses.filter(e => {
                            const date = new Date(e.date);
                            const today = new Date();
                            return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                        }).reduce((acc, exp) => acc + exp.amount, 0), color: 'text-primary'
                    }
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-4 flex flex-col justify-between">
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">{stat.label}</span>
                        <span className={cn("text-xl font-black mt-1", stat.color)}>{formatCurrency(stat.value)}</span>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by merchant, description or #"
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold text-slate-600 cursor-pointer pr-4"
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold text-slate-600 cursor-pointer pr-4"
                        >
                            <option value="all">All Status</option>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Syncing cost data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense #</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant / Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredExpenses.map((expense) => {
                                    const StatusIcon = STATUS_CONFIG[expense.status]?.icon || Clock;
                                    return (
                                        <tr
                                            key={expense._id}
                                            className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                                            onClick={() => navigate(`/finance/expenses/${expense._id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 group-hover:text-rose-500 transition-colors">#{expense.expenseNumber}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {expense.referenceNumber || 'No Reference'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400">
                                                        <ShoppingCart className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">{expense.merchant}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{expense.category}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                        STATUS_CONFIG[expense.status]?.color || 'bg-slate-100'
                                                    )}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {STATUS_CONFIG[expense.status]?.label || expense.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-500">
                                                    {formatDate(expense.date)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-slate-900">{formatCurrency(expense.amount)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-slate-600 transition-all">
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredExpenses.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-black text-slate-900">No expenses recorded</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Record your first operational spend to start tracking your burn rate.</p>
                        <button
                            onClick={() => navigate('/finance/expenses/new')}
                            className="mt-6 px-6 py-2 bg-rose-500/10 text-rose-600 rounded-xl font-black text-xs hover:bg-rose-500/20 transition-all"
                        >
                            Add Expense
                        </button>
                    </div>
                )}

                <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Active Audit Trail Optimized</span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-rose-500" /> Cost Control Active
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ExpenseList;
