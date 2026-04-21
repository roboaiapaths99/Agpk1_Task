import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Filter, Plus, FileText, Download, MoreVertical,
    CheckCircle2, Clock, AlertCircle, Trash2, ExternalLink,
    ChevronRight, ArrowUpDown, Wallet, Building2, User, History, Settings
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { invoiceService, branchService } from '../../../services/api/apiServices';
import { BASE_URL } from '../../../services/api/axios';
import api from '../../../services/api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuditTimeline from '../audit/AuditTimeline';
import { X } from 'lucide-react';
import PresenceAvatars from '../../../components/common/PresenceAvatars';
import { formatCurrency, formatDate } from '../../../lib/formatters';

const STATUS_CONFIG = {
    draft: { color: 'bg-slate-100 text-slate-600', label: 'Draft', icon: Clock },
    sent: { color: 'bg-blue-100 text-blue-700', label: 'Sent', icon: FileText },
    paid: { color: 'bg-emerald-100 text-emerald-700', label: 'Paid', icon: CheckCircle2 },
    partial: { color: 'bg-amber-100 text-amber-700', label: 'Partial', icon: Clock },
    overdue: { color: 'bg-red-100 text-red-700', label: 'Overdue', icon: AlertCircle },
    cancelled: { color: 'bg-slate-200 text-slate-500', label: 'Cancelled', icon: Trash2 },
};
const InvoiceList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');
    const [showHistoryId, setShowHistoryId] = useState(null);

    // Fetch Invoices
    const { data: invoicesData, isLoading } = useQuery({
        queryKey: ['invoices', statusFilter, branchFilter],
        queryFn: () => invoiceService.getAll({ 
            status: statusFilter === 'all' ? undefined : statusFilter,
            branch: branchFilter === 'all' ? undefined : branchFilter
        })
    });

    const invoices = useMemo(() => {
        const resData = invoicesData?.data?.data || invoicesData?.data;
        if (Array.isArray(resData)) return resData;
        if (resData && Array.isArray(resData.invoices)) return resData.invoices;
        return [];
    }, [invoicesData]);

    // Fetch Branches for filter
    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getAll()
    });

    const availableBranches = branchesData?.data?.data?.branches || branchesData?.data?.branches || [];

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => invoiceService.remove(id),
        onSuccess: () => {
            toast.success('Invoice deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
        onError: (err) => toast.error(err.message || 'Failed to delete invoice')
    });

    // Download/Export Mutation
    const downloadMutation = useMutation({
        mutationFn: (id) => invoiceService.downloadInvoice(id),
        onSuccess: (response) => {
            const url = response.data.url.startsWith('http') 
                ? response.data.url 
                : `${BASE_URL.replace('/api/v1', '')}${response.data.url}`;
            window.open(url, '_blank');
        },
        onError: (err) => toast.error(err.message || 'Failed to download invoice')
    });

    const handleExport = () => {
        toast.promise(
            invoiceService.exportExcel({ status: statusFilter, branch: branchFilter }),
            {
                loading: 'Preparing export...',
                success: (res) => {
                    const url = res.data.url.startsWith('http') 
                        ? res.data.url 
                        : `${BASE_URL.replace('/api/v1', '')}${res.data.url}`;
                    window.open(url, '_blank');
                    return 'Export ready!';
                },
                error: 'Export failed'
            }
        );
    };

    // Filtered Invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const matchesSearch = 
                invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                invoice.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [invoices, searchQuery]);

    // Stats
    const { totalInvoiced, collected, outstanding, overdue } = useMemo(() => {
        return filteredInvoices.reduce((acc, inv) => {
            acc.totalInvoiced += inv.totalAmount;
            if (inv.status === 'paid') acc.collected += inv.totalAmount;
            else if (inv.status === 'overdue') acc.overdue += inv.totalAmount;
            else acc.outstanding += inv.totalAmount;
            return acc;
        }, { totalInvoiced: 0, collected: 0, outstanding: 0, overdue: 0 });
    }, [filteredInvoices]);

    const selectedInvoice = useMemo(() => 
        filteredInvoices.find(i => i._id === showHistoryId),
        [filteredInvoices, showHistoryId]
    );

    return (
        <div className="p-6 md:p-10 space-y-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                            <Wallet className="w-8 h-8 text-primary" />
                            Invoice Management
                        </h1>
                        <PresenceAvatars resourceType="FINANCE" resourceId="invoices" />
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Manage client billing, payments, and credit notes across branches.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/finance/invoices/settings')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm"
                    >
                        <Settings className="w-4 h-4" /> Dunning
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/finance/invoices/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-200"
                    >
                        <Plus className="w-4 h-4" /> Create Invoice
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Invoiced', value: totalInvoiced, color: 'text-slate-900' },
                    { label: 'Collected', value: collected, color: 'text-emerald-600' },
                    { label: 'Outstanding', value: outstanding, color: 'text-amber-600' },
                    { label: 'Overdue', value: overdue, color: 'text-red-500' }
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
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by invoice number or client..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
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
                    {Array.isArray(availableBranches) && availableBranches.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="bg-transparent outline-none text-sm font-bold text-slate-600 cursor-pointer pr-4"
                            >
                                <option value="all">All Branches</option>
                                {availableBranches.map(b => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Fetching financial records...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredInvoices.map((invoice) => {
                                    const StatusIcon = STATUS_CONFIG[invoice.status]?.icon || Clock;
                                    return (
                                        <tr
                                            key={invoice._id}
                                            className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                                            onClick={() => navigate(`/finance/invoices/${invoice._id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">#{invoice.invoiceNumber}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {formatDate(invoice.createdAt, 'short')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">{invoice.customerId?.name || 'Walk-in Client'}</span>
                                                        <span className="text-[10px] text-slate-400">{invoice.branchId?.name || 'Main Branch'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                        STATUS_CONFIG[invoice.status]?.color || 'bg-slate-100'
                                                    )}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {STATUS_CONFIG[invoice.status]?.label || invoice.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    invoice.status === 'overdue' ? 'text-red-500' : 'text-slate-500'
                                                )}>
                                                    {invoice.dueDate ? formatDate(invoice.dueDate, 'short') : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowHistoryId(invoice._id);
                                                        }}
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                                                        title="Activity Log"
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={downloadMutation.isPending}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadMutation.mutate(invoice._id);
                                                        }}
                                                        className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
                                                        title="Download PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Delete this invoice?')) {
                                                                deleteMutation.mutate(invoice._id);
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-all"
                                                        title="Delete Invoice"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredInvoices.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-black text-slate-900">No invoices found</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Try adjusting your filters or create a new invoice to get started.</p>
                        <button
                            type="button"
                            onClick={() => navigate('/finance/invoices/new')}
                            className="mt-6 px-6 py-2 bg-primary/10 text-primary rounded-xl font-black text-xs hover:bg-primary/20 transition-all"
                        >
                            Create First Invoice
                        </button>
                    </div>
                )}

                <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Showing {filteredInvoices.length} entries</span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> System Secure
                    </span>
                </div>
            </div>

            {/* History Slide-over */}
            {showHistoryId && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowHistoryId(null)}
                    />
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in-right">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-primary" />
                                    Activity Log
                                </h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                    Invoice #{selectedInvoice?.invoiceNumber || ''}
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowHistoryId(null)}
                                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
                            <AuditTimeline entityId={showHistoryId} entityType="Invoice" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
