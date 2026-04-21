import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
    Users, Clock, CreditCard, ChevronRight, 
    Plus, Download, FileText, CheckCircle2,
    AlertCircle, Search, Filter, History
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api/axios';
import { financeReportService } from '../../../services/api/apiServices';
import { cn } from '../../../lib/utils';
import { BASE_URL } from '../../../services/api/axios';
import { formatCurrency, formatDate } from '../../../lib/formatters';
const PayrollDashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Payroll Runs
    const { data: runsData, isLoading: runsLoading } = useQuery({
        queryKey: ['payroll-runs'],
        queryFn: async () => {
            const res = await api.get('/finance/payroll/runs');
            return res.data;
        }
    });

    // Fetch Dashboard Metrics for YTD stats
    const { data: dashData } = useQuery({
        queryKey: ['finance-dashboard'],
        queryFn: () => financeReportService.getDashboard(),
    });

    const runs = runsData?.data || [];
    const payrollYTD = dashData?.data?.summary?.payrollYTD || 0;

    // Mutation for finalizing payroll
    const finalizeMutation = useMutation({
        mutationFn: async (id) => {
            return await api.post(`/finance/payroll/runs/${id}/finalize`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['payroll-runs']);
        }
    });

    // Download Logic for a specific run (Summary)
    // Note: Since individual payslips are in RunDetails, this could download a bulk ZIP or a summary PDF.
    // For now, let's link it to a future summary endpoint or just open the details.
    const handleDownloadSummary = async (runId) => {
        const t = toast.loading('Generating Summary PDF...');
        try {
            const res = await api.get(`/finance/payroll/runs/${runId}/summary`);
            if (res.data?.data?.pdfUrl) {
                window.open(`${BASE_URL}${res.data.data.pdfUrl}`, '_blank');
                toast.success('Summary downloaded', { id: t });
            }
        } catch (error) {
            console.error('Download summary error:', error);
            toast.error('Failed to generate summary', { id: t });
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">
                        PAYROLL <span className="text-primary">ENGINE</span>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Dynamic salary processing and automated disbursement.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/finance/payroll/profiles')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Users className="w-4 h-4 text-primary" />
                        Manage Profiles
                    </button>
                    <button
                        onClick={() => navigate('/finance/payroll/new')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Payroll Run
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Run</p>
                        <h4 className="text-lg font-black text-slate-900 italic mt-0.5 uppercase">
                            {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </h4>
                    </div>
                </div>
                <div className="glass-card p-6 border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Paid (YTD)</p>
                        <h4 className="text-lg font-black text-slate-900 italic mt-0.5">{formatCurrency(payrollYTD)}</h4>
                    </div>
                </div>
                <div className="glass-card p-6 border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Staff</p>
                        <h4 className="text-lg font-black text-slate-900 italic mt-0.5">{runs[0]?.employeeCount || 0} Employees</h4>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="glass-card border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <h3 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        Recent Payroll Cycles
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search cycles..."
                                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cycle Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Staff</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Disbursement</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {runsLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8 h-12 bg-slate-50/20" />
                                    </tr>
                                ))
                            ) : runs.map((run) => (
                                <tr key={run._id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/finance/payroll/runs/${run._id}`)}>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter italic">{run.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            {formatDate(run.periodStart)} - {formatDate(run.periodEnd)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                {run.employeeCount}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-slate-900 italic">{formatCurrency(run.totalNet)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                            run.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            run.status === 'processed' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            "bg-slate-50 text-slate-500 border-slate-100"
                                        )}>
                                            {run.status === 'paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {run.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                                            {run.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {run.status === 'draft' ? (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); finalizeMutation.mutate(run._id); }}
                                                    className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all active:scale-90"
                                                    title="Finalize Run"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadSummary(run._id); }}
                                                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-all active:scale-90"
                                                    title="Download Summary"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State */}
            {!runsLoading && runs.length === 0 && (
                <div className="glass-card p-20 border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                        <CreditCard className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Zero cycles processed</h3>
                    <p className="text-slate-400 text-xs mt-2 max-w-sm font-medium leading-relaxed">
                        Ready to automate your employee disbursement? Start by creating your first dynamic payroll cycle.
                    </p>
                    <button
                        onClick={() => navigate('/finance/payroll/new')}
                        className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
                    >
                        Initialize First Run
                    </button>
                </div>
            )}
        </div>
    );
};

export default PayrollDashboard;
