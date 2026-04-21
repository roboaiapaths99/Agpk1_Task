import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { financeReportService, branchService } from '../../../services/api/apiServices';
import AgingReport from './AgingReport';
import DunningList from './DunningList';
import { cn } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/formatters';
import api, { BASE_URL } from '../../../services/api/axios';
import { toast } from 'react-hot-toast';
import { 
    Clock, AlertTriangle, ShieldCheck, 
    ChevronRight, Info, TrendingUp, TrendingDown,
    BarChart3, PieChart, Building2, Calendar,
    Download, Printer, Share2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import PresenceAvatars from '../../../components/common/PresenceAvatars';

const ReportHub = () => {
    const [activeTab, setActiveTab] = useState('pl'); // pl, bs, cashflow, aging, dunning
    const [branchId, setBranchId] = useState('all');
    const [timeframe, setTimeframe] = useState('mtd');

    const { data: reportData, isLoading } = useQuery({
        queryKey: ['financial-report', activeTab, branchId, timeframe],
        queryFn: async () => {
            const params = { branchId, timeframe };
            if (activeTab === 'pl') return financeReportService.getPLReport(params);
            if (activeTab === 'bs') return financeReportService.getBalanceSheet(params);
            if (activeTab === 'cashflow') return financeReportService.getCashFlow(params);
            return {};
        },
        enabled: ['pl', 'bs', 'cashflow'].includes(activeTab)
    });

    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getAll()
    });

    const branches = branchesData?.data?.data?.branches || branchesData?.data?.branches || branchesData?.data || [];

    const [showDistModal, setShowDistModal] = useState(false);
    const [distEmails, setDistEmails] = useState('');

    const exportMutation = useMutation({
        mutationFn: async (exportData) => {
            const res = await api.post('/finance/reports/export', exportData);
            return res.data;
        },
        onSuccess: (data) => {
            if (data?.data?.pdfUrl) {
                window.open(`${BASE_URL}${data.data.pdfUrl}`, '_blank');
                toast.success('Report exported successfully');
            }
        },
        onError: (error) => {
            console.error('Export error:', error);
            toast.error('Failed to export report');
        }
    });

    const excelMutation = useMutation({
        mutationFn: async (exportData) => {
            const res = await api.post('/finance/reports/export/excel', exportData);
            return res.data;
        },
        onSuccess: (data) => {
            if (data?.data?.excelUrl) {
                window.open(`${BASE_URL}${data.data.excelUrl}`, '_blank');
                toast.success('Excel report exported successfully');
            }
        },
        onError: (error) => {
            console.error('Export error:', error);
            toast.error('Failed to export Excel report');
        }
    });

    const distributeMutation = useMutation({
        mutationFn: async (distData) => {
            const res = await api.post('/finance/reports/distribute', distData);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Report distributed successfully');
            setShowDistModal(false);
            setDistEmails('');
        },
        onError: (error) => {
            console.error('Distribution error:', error);
            toast.error('Failed to distribute report');
        }
    });

    const handleExport = () => {
        const reportTypeMap = {
            'pl': 'profit_and_loss',
            'bs': 'balance_sheet',
            'cashflow': 'cashflow'
        };
        const type = reportTypeMap[activeTab];
        if (!type) {
            toast.error('Export not supported for this report type');
            return;
        }
        exportMutation.mutate({ type, branchId, timeframe });
    };

    const handleExportExcel = () => {
        const reportTypeMap = {
            'pl': 'profit_and_loss',
            'bs': 'balance_sheet',
            'cashflow': 'cashflow'
        };
        const type = reportTypeMap[activeTab];
        if (!type) {
            toast.error('Export not supported for this report type');
            return;
        }
        excelMutation.mutate({ type, branchId, timeframe });
    };

    const confirmDistribution = () => {
        const reportTypeMap = {
            'pl': 'profit_and_loss',
            'bs': 'balance_sheet',
            'cashflow': 'cashflow'
        };
        const type = reportTypeMap[activeTab];
        if (!type) {
            toast.error('Distribution not supported for this report type');
            return;
        }
        const emails = distEmails.split(',').map(e => e.trim()).filter(e => e);
        distributeMutation.mutate({
            type,
            branchId,
            timeframe,
            recipients: emails.length > 0 ? emails : undefined
        });
    };

    const handleDistribute = () => {
        setShowDistModal(true);
    };

    const renderPL = () => {
        const data = reportData?.data?.data || reportData?.data || reportData || {};
        const income = data.revenue || [];
        const expenses = data.expenses || [];
        const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);
        const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const netProfit = totalIncome - totalExpenses;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard title="Total Revenue" value={totalIncome} type="up" color="text-emerald-600" />
                    <SummaryCard title="Total Expenses" value={totalExpenses} type="down" color="text-rose-600" />
                    <SummaryCard title="Net Profit/Loss" value={netProfit} type={netProfit >= 0 ? 'up' : 'down'} color={netProfit >= 0 ? 'text-primary' : 'text-rose-600'} />
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Revenue Breakdown</h3>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="p-6 space-y-4">
                            {income.length > 0 ? income.map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">{item.category}</span>
                                        <div className="w-48 h-1.5 bg-slate-50 rounded-full mt-1.5 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${(item.amount / totalIncome) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                                </div>
                            )) : <p className="text-xs text-slate-400 text-center py-4">No revenue data for this period</p>}
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Expense Categories</h3>
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="p-6 space-y-4">
                            {expenses.length > 0 ? expenses.map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">{item.category}</span>
                                        <div className="w-48 h-1.5 bg-slate-50 rounded-full mt-1.5 overflow-hidden">
                                            <div
                                                className="h-full bg-rose-500 rounded-full"
                                                style={{ width: `${(item.amount / totalExpenses) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                                </div>
                            )) : <p className="text-xs text-slate-400 text-center py-4">No expense data for this period</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBS = () => {
        const data = reportData?.data?.data || reportData?.data || reportData || {};
        const assets = data.assets || [];
        const liabilities = data.liabilities || [];
        const equity = data.equity || [];
        const totalAssets = data.totalAssets || assets.reduce((acc, curr) => acc + curr.amount, 0);
        const totalLiabEquity = (data.totalLiabilities || 0) + (data.totalEquity || 0);

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                        Assets <span>{formatCurrency(totalAssets)}</span>
                    </h3>
                    <div className="glass-card divide-y divide-slate-50">
                        {assets.map((item, i) => (
                            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                                <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                        Liabilities & Equity <span>{formatCurrency(totalLiabEquity)}</span>
                    </h3>
                    <div className="space-y-6">
                        <div className="glass-card divide-y divide-slate-50 border-l-4 border-l-rose-500">
                            {liabilities.map((item, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="glass-card divide-y divide-slate-50 border-l-4 border-l-blue-500">
                            {equity.map((item, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCashFlow = () => {
        const data = reportData?.data?.data || reportData?.data || reportData || {};
        const flowData = data.data || [];

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-indigo-50/30 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Monthly Cash Movements</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Cash & Bank Account Analysis</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Inflow</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Outflow</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Flow</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {flowData.length > 0 ? flowData.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/30 transition-all">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.period}</td>
                                        <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right">{formatCurrency(item.inflow)}</td>
                                        <td className="px-6 py-4 text-sm font-black text-rose-600 text-right">{formatCurrency(item.outflow)}</td>
                                        <td className={cn(
                                            "px-6 py-4 text-sm font-black text-right",
                                            item.net >= 0 ? "text-indigo-600" : "text-rose-600"
                                        )}>
                                            {formatCurrency(item.net)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-xs text-slate-400 font-bold">
                                            No cash flow activities recorded in the selected period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-indigo-600" />
                            Fiscal Reporting Hub
                        </h1>
                        <PresenceAvatars resourceType="report" resourceId={activeTab} />
                    </div>
                    <p className="text-sm text-slate-400 mt-1 font-medium">High-fidelity P&L, Balance Sheets, and audit-ready disclosures.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100/80 p-1 rounded-xl">
                        {[
                            { id: 'pl', label: 'Profit & Loss', icon: TrendingUp },
                            { id: 'bs', label: 'Balance Sheet', icon: PieChart },
                            { id: 'cashflow', label: 'Cash Flow', icon: BarChart3 },
                            { id: 'aging', label: 'Aging Reports', icon: Clock },
                            { id: 'dunning', label: 'Collection Hub', icon: AlertTriangle }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                    activeTab === tab.id
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden xl:block mx-2" />

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="text-xs font-bold text-slate-600 bg-transparent outline-none pr-4"
                        >
                            <option value="all">Consolidated (All)</option>
                            {branches.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="text-xs font-bold text-slate-600 bg-transparent outline-none pr-4"
                        >
                            <option value="mtd">Month to Date</option>
                            <option value="qtd">Quarter to Date</option>
                            <option value="ytd">Year to Date</option>
                            <option value="last_fy">Last Fiscal Year</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleExport}
                        disabled={exportMutation.isPending}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-90 disabled:opacity-50"
                    >
                        <Download className={cn("w-4 h-4", exportMutation.isPending && "animate-pulse")} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {isLoading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400">Compiling financial data structures...</p>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'pl' && renderPL()}
                    {activeTab === 'bs' && renderBS()}
                    {activeTab === 'cashflow' && renderCashFlow()}
                    {activeTab === 'aging' && <AgingReport branchId={branchId} />}
                    {activeTab === 'dunning' && <DunningList branchId={branchId} />}
                </div>
            )}

            {/* Audit Footer */}
            <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl text-white overflow-hidden relative group">
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Internal Disclosure Status</p>
                    <div className="flex items-center gap-4">
                        <h4 className="text-lg font-black tracking-tight">Report Generation Integrity Verified</h4>
                        <span className="px-3 py-1 bg-emerald-500 text-[10px] font-black rounded-lg">LIVE SYNC</span>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button 
                        onClick={handleExport}
                        disabled={exportMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        {exportMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Printer className="w-4 h-4" />
                        )}
                        Print PDF
                    </button>
                    <button 
                        onClick={handleExportExcel}
                        disabled={excelMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        {excelMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Export Excel
                    </button>
                    <button 
                        onClick={handleDistribute}
                        disabled={distributeMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        {distributeMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Share2 className="w-4 h-4" />
                        )}
                        Distribute
                    </button>
                </div>
                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full group-hover:bg-indigo-500/30 transition-all duration-700" />
            </div>

            {/* Distribution Modal */}
            {showDistModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 w-full max-w-lg shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
                                <Share2 className="w-8 h-8 text-slate-900" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Distribute Report</h3>
                                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                                    {[
                                        { id: 'pl', label: 'Profit & Loss' },
                                        { id: 'bs', label: 'Balance Sheet' },
                                        { id: 'cashflow', label: 'Cash Flow' },
                                        { id: 'aging', label: 'Aging Reports' },
                                        { id: 'dunning', label: 'Collection Hub' }
                                    ].find(t => t.id === activeTab)?.label}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Recipient Email(s)</label>
                                <textarea
                                    value={distEmails}
                                    onChange={(e) => setDistEmails(e.target.value)}
                                    placeholder="Enter multiple emails separated by commas..."
                                    className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                />
                                <p className="text-[10px] text-slate-400 mt-3 font-bold">Leave empty to use default organization distribution list.</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    onClick={() => setShowDistModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDistribution}
                                    disabled={distributeMutation.isPending}
                                    className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {distributeMutation.isPending ? 'Sending...' : 'Confirm Send'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SummaryCard = ({ title, value, type, color }) => {
    const Icon = type === 'up' ? ArrowUpRight : ArrowDownRight;

    return (
        <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
            <div className="flex items-end justify-between mt-4">
                <span className={cn("text-2xl font-black tracking-tighter", color)}>{formatCurrency(value)}</span>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform",
                    type === 'up' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                )}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

export default ReportHub;
