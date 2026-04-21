import React from 'react';
import { 
    ChevronLeft, Download, CheckCircle2, 
    User, Clock, IndianRupee, FileText,
    ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api/axios';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../lib/formatters';

const PayrollRunDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch Payroll Run
    const { data: runData, isLoading: runLoading } = useQuery({
        queryKey: ['payroll-run', id],
        queryFn: async () => {
            const res = await api.get(`/finance/payroll/runs`); // Need specific run GET usually, but using list for now
            return res.data?.data?.find(r => r._id === id);
        }
    });

    // Fetch Payslips
    const { data: payslipsData, isLoading: payslipsLoading } = useQuery({
        queryKey: ['payroll-payslips', id],
        queryFn: async () => {
            const res = await api.get(`/finance/payroll/runs/${id}/payslips`);
            return res.data;
        }
    });

    const run = runData;
    const payslips = payslipsData?.data || [];

    // Finalize Mutation
    const finalizeMutation = useMutation({
        mutationFn: async () => {
            return await api.post(`/finance/payroll/runs/${id}/finalize`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['payroll-run', id]);
            toast.success('Payroll finalized and records locked.');
        }
    });

    // Download Payslip
    const downloadMutation = useMutation({
        mutationFn: async (payslipId) => {
            const res = await api.get(`/finance/payroll/payslips/${payslipId}/download`);
            return res.data?.data?.pdfUrl;
        },
        onSuccess: (url) => {
            if (url) {
                // Determine base URL for static files
                const staticBase = window.location.origin.includes('localhost') 
                    ? 'http://localhost:5000' 
                    : '';
                
                // Open PDF in new tab
                window.open(`${staticBase}${url}`, '_blank');
            }
        }
    });

    if (runLoading || payslipsLoading) return <div className="p-10 text-center font-black animate-pulse">LOADING ENGINE DATA...</div>;

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/finance/payroll')}
                        className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-primary transition-all active:scale-90 shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">
                            {run?.name}
                        </h1>
                        <p className="text-slate-500 mt-0.5 font-medium text-xs">
                            Cycle status: <span className={cn(
                                "font-black uppercase tracking-widest ml-1",
                                run?.status === 'processed' ? "text-blue-500" : "text-slate-400"
                            )}>{run?.status}</span>
                        </p>
                    </div>
                </div>
                
                {run?.status === 'draft' && (
                    <button
                        onClick={() => finalizeMutation.mutate()}
                        disabled={finalizeMutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Finalize & Generate Payslips
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 border-l-4 border-slate-900">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gross Total</p>
                    <h4 className="text-xl font-black text-slate-900 mt-1 italic">{run ? formatCurrency(run.totalGross) : '₹0'}</h4>
                </div>
                <div className="glass-card p-6 border-l-4 border-emerald-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Net Disbursement</p>
                    <h4 className="text-xl font-black text-slate-900 mt-1 italic">{run ? formatCurrency(run.totalNet) : '₹0'}</h4>
                </div>
                <div className="glass-card p-6 border-l-4 border-rose-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tax & Deductions</p>
                    <h4 className="text-xl font-black text-slate-900 mt-1 italic text-rose-500">{run ? formatCurrency(run.totalGross - run.totalNet) : '₹0'}</h4>
                </div>
                <div className="glass-card p-6 border-l-4 border-blue-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Staff Count</p>
                    <h4 className="text-xl font-black text-slate-900 mt-1 italic">{run?.employeeCount} Users</h4>
                </div>
            </div>

            {/* Payslips List */}
            <div className="glass-card border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <h3 className="text-xs font-black italic uppercase tracking-tighter flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Individual Payslips
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Hours</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Gross Pay</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Deductions</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Pay</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payslips.map((slip) => (
                                <tr key={slip._id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-600">
                                                {slip.employeeId?.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 italic uppercase">{slip.employeeId?.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Rate: {formatCurrency(slip.hourlyRate)}/hr</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-600 text-xs italic">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            {slip.totalHours.toFixed(1)} hrs
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-black text-slate-900">{formatCurrency(slip.grossSalary)}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-rose-500 italic">-{formatCurrency(slip.taxDeduction + slip.insuranceDeduction)}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-primary italic">{formatCurrency(slip.netSalary)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            {slip.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={() => downloadMutation.mutate(slip._id)}
                                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-all active:scale-90"
                                                title="Print PDF"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PayrollRunDetails;
