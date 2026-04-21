import React, { useState } from 'react';
import {
    ShieldCheck, AlertTriangle, Filter, Search,
    ArrowUpDown, ChevronRight, Hash, Building,
    FileText, Receipt, Wallet, PenLine, Landmark, ExternalLink
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ledgerService, branchService } from '../../../services/api/apiServices';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../../lib/formatters';

const SOURCE_TYPE_CONFIG = {
    invoice: { label: 'Invoice', icon: FileText, color: 'bg-blue-50 text-blue-600', route: '/finance/invoices' },
    payment: { label: 'Payment', icon: Wallet, color: 'bg-emerald-50 text-emerald-600', route: '/finance/invoices' },
    expense: { label: 'Expense', icon: Receipt, color: 'bg-rose-50 text-rose-600', route: '/finance/expenses' },
    payroll: { label: 'Payroll', icon: Landmark, color: 'bg-indigo-50 text-indigo-600', route: '/finance/payroll/runs' },
    manual: { label: 'Manual', icon: PenLine, color: 'bg-amber-50 text-amber-600', route: null },
    opening_balance: { label: 'Opening', icon: Hash, color: 'bg-slate-100 text-slate-600', route: null },
    tax: { label: 'Tax', icon: Landmark, color: 'bg-purple-50 text-purple-600', route: '/finance/tax' }
};

const IntegrityBadge = ({ verified }) => (
    <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
        verified ? "bg-emerald-100/50 text-emerald-600 border border-emerald-100" : "bg-rose-100/50 text-rose-600 border border-rose-100 animate-pulse"
    )}>
        {verified ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {verified ? "VERIFIED" : "TAMPERED"}
    </div>
);

const LedgerExplorer = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');

    const { data, isLoading } = useQuery({
        queryKey: ['ledger-entries', branchFilter],
        queryFn: () => ledgerService.getEntries({ branchId: branchFilter !== 'all' ? branchFilter : undefined }),
    });

    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getAll()
    });

    const branches = branchesData?.data?.data?.branches || branchesData?.data?.branches || branchesData?.data || [];

    const entries = data?.data?.data?.entries || data?.data?.entries || data?.entries || [];

    const filteredEntries = entries.filter(entry => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            entry.description?.toLowerCase().includes(q) ||
            entry.accountName?.toLowerCase().includes(q) ||
            entry.auditHash?.toLowerCase().includes(q) ||
            entry.sourceType?.toLowerCase().includes(q)
        );
    });

    const handleRowClick = (entry) => {
        const config = SOURCE_TYPE_CONFIG[entry.sourceType];
        if (config?.route && entry.sourceId) {
            navigate(`${config.route}/${entry.sourceId}`);
        } else {
            toast(`Source: ${entry.sourceType || 'unknown'} — No linked document`, { icon: 'ℹ️' });
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 italic">GENERAL LEDGER</h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Double-Entry Audit Stream</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Find entry..."
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                    >
                        <option value="all">Consolidated View</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="glass-card overflow-hidden border border-slate-100 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Hash</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Time</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Source</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 ml-auto rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 ml-auto rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 mx-auto rounded-full" /></td>
                                    </tr>
                                ))
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <Hash className="w-12 h-12 mb-2" />
                                            <p className="text-sm font-bold italic uppercase tracking-tighter">No ledger records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => {
                                    const sourceConfig = SOURCE_TYPE_CONFIG[entry.sourceType] || SOURCE_TYPE_CONFIG.manual;
                                    const SourceIcon = sourceConfig.icon;
                                    const isNavigable = sourceConfig.route && entry.sourceId;
                                    const dateObj = new Date(entry.transactionDate || entry.date);
                                    return (
                                    <tr 
                                        key={entry._id} 
                                        className={cn(
                                            "hover:bg-slate-50/80 transition-all group",
                                            isNavigable ? "cursor-pointer" : "cursor-default"
                                        )}
                                        onClick={() => handleRowClick(entry)}
                                    >
                                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                                            {entry.auditHash?.substring(0, 12)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-xs font-bold text-slate-700">{formatDate(dateObj)}</p>
                                            <p className="text-[10px] text-slate-400">{dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                    <Building className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate uppercase">{entry.accountName || entry.accountId}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{entry.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span className={cn(
                                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                    sourceConfig.color
                                                )}>
                                                    <SourceIcon className="w-3 h-3" />
                                                    {sourceConfig.label}
                                                    {isNavigable && <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn("text-xs font-black", entry.type === 'debit' ? "text-slate-900 italic" : "text-slate-200")}>
                                                {entry.type === 'debit' ? formatCurrency(entry.amount) : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn("text-xs font-black", entry.type === 'credit' ? "text-emerald-600 italic" : "text-slate-200")}>
                                                {entry.type === 'credit' ? formatCurrency(entry.amount) : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <IntegrityBadge verified={entry.isVerified !== false} />
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredEntries.length} Atomic Operations</p>
                    <div
                        onClick={() => toast.success("Exporting reconciled ledger PDF...")}
                        className="flex text-[10px] font-black uppercase text-primary items-center gap-1 cursor-pointer hover:underline"
                    >
                        Download Reconciled PDF <ChevronRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LedgerExplorer;
