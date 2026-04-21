import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Clock, AlertTriangle, Mail, Phone, ExternalLink, Search,
    Filter, MoreHorizontal, CheckCircle2, ChevronRight,
    ArrowUpRight, MessageSquare, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/formatters';
import { financeReportService } from '../../../services/api/apiServices';
import { formatDistanceToNow } from 'date-fns';

const DunningList = ({ branchId }) => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState('all'); // all, high, medium, low

    const { data: dunningData, isLoading } = useQuery({
        queryKey: ['dunning-list', branchId],
        queryFn: () => financeReportService.getDunningList({ branchId })
    });

    const { data: historyData } = useQuery({
        queryKey: ['dunning-history', branchId],
        queryFn: () => financeReportService.getDunningHistory({ limit: 5 })
    });

    const dunningMutation = useMutation({
        mutationFn: (payload) => financeReportService.recordDunningAction(payload),
        onSuccess: () => {
            queryClient.invalidateQueries(['dunning-list']);
            queryClient.invalidateQueries(['dunning-history']);
            toast.success('Collection action recorded successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to record action');
        }
    });

    const customers = dunningData?.data?.data || dunningData?.data || dunningData || [];
    const history = historyData?.data?.data || historyData?.data || [];

    const handleAction = (customer, type) => {
        dunningMutation.mutate({
            customerId: customer.id,
            actionType: type,
            note: `Manual ${type} follow-up for ${formatCurrency(customer.totalOverdue)} overdue.`
        });
    };



    const getRiskColor = (score) => {
        if (score >= 80) return 'text-red-600 bg-red-50';
        if (score >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-emerald-600 bg-emerald-50';
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRisk = riskFilter === 'all' || 
                           (riskFilter === 'high' && c.riskScore >= 70) ||
                           (riskFilter === 'medium' && c.riskScore >= 30 && c.riskScore < 70) ||
                           (riskFilter === 'low' && c.riskScore < 30);
        return matchesSearch && matchesRisk;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Collection Queue...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 bg-gradient-to-br from-white to-rose-50/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap">Total At Risk</span>
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-black text-rose-600">{formatCurrency(customers.reduce((acc, c) => acc + c.totalOverdue, 0))}</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{customers.length} overdue customers</p>
                </div>
                
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap">High Risk Accounts</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">{customers.filter(c => c.riskScore >= 70).length}</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Requiring immediate action</p>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap">Collection Status</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black text-emerald-600">84%</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Average recovery rate (30 days)</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="glass-card">
                {/* Search / Filters */}
                <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by customer name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            {['all', 'high', 'medium', 'low'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRiskFilter(r)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                        riskFilter === r ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Customer</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Total Overdue</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right text-nowrap">Oldest Invoice</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">Risk Score</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {customer.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900">{customer.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{customer.email || 'No email registered'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-rose-600">{formatCurrency(customer.totalOverdue)}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{customer.itemCount} overdue items</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-slate-700">{customer.oldestInvoiceDays} days</span>
                                            <span className="text-[10px] font-bold text-slate-400 text-nowrap">Past due since {customer.oldestInvoiceDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center">
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black tracking-widest",
                                                getRiskColor(customer.riskScore)
                                            )}>
                                                {customer.riskScore}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                title="Send Dunning Email"
                                                disabled={dunningMutation.isPending}
                                                onClick={() => handleAction(customer, 'Email')}
                                                className="p-2 bg-white border border-slate-100 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm disabled:opacity-50"
                                            >
                                                {dunningMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                            </button>
                                            <button 
                                                title="Log Call"
                                                disabled={dunningMutation.isPending}
                                                onClick={() => handleAction(customer, 'Call')}
                                                className="p-2 bg-white border border-slate-100 rounded-lg hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm disabled:opacity-50"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                title="Send Notice"
                                                disabled={dunningMutation.isPending}
                                                onClick={() => handleAction(customer, 'Notice')}
                                                className="p-2 bg-white border border-slate-100 rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all shadow-sm disabled:opacity-50"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="w-px h-4 bg-slate-100 mx-1" />
                                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-100 mb-2" />
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Excellent Work!</p>
                                            <p className="text-xs font-bold text-slate-400">No customers match your current filter criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Collection Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" /> Recent Follow-ups
                    </h4>
                    <div className="space-y-4">
                        {history.length > 0 ? history.map((log, i) => (
                            <div key={log.id || i} className="flex gap-4 p-3 bg-slate-50/50 rounded-xl border border-slate-50 hover:bg-white transition-all group/item">
                                <div className={cn(
                                    "w-2 h-2 rounded-full mt-1.5 shadow-lg",
                                    log.metadata?.actionType === 'Email' ? "bg-primary shadow-primary/20" :
                                    log.metadata?.actionType === 'Call' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-500 shadow-indigo-500/20"
                                )} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            {log.metadata?.actionType} to {log.metadata?.customerName}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 mt-1 line-clamp-1 group-hover/item:line-clamp-none transition-all">
                                        {log.description}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent follows</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6 bg-slate-900 text-white group overflow-hidden relative">
                    <div className="relative z-10">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Strategy Insight
                        </h4>
                        <p className="text-sm font-black leading-relaxed">
                            Focus collections on accounts with <span className="text-emerald-400">Aging > 61 Days</span>. 
                            Statistically, these have a 30% higher default risk in the next quarter.
                        </p>
                        <button className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2">
                            Run Collection Workflow <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-2xl -translate-y-1/2 translate-x-1/2 rounded-full group-hover:bg-primary/30 transition-all duration-700" />
                </div>
            </div>
        </div>
    );
};

export default DunningList;
