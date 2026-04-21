import React, { useState } from 'react';
import { 
    Calendar, Calculator, Save, X, 
    AlertCircle, Sparkles, CheckCircle2,
    CalendarDays, Users, IndianRupee
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api/axios';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

const PayrollRunForm = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: `Payroll Cycle - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        periodStart: '',
        periodEnd: ''
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/finance/payroll/runs', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Payroll cycle initialized successfully');
            queryClient.invalidateQueries(['payroll-runs']);
            navigate('/finance/payroll');
        },
        onError: (error) => {
            const msg = error?.response?.data?.message || error?.message || 'Failed to initialize payroll cycle';
            toast.error(msg);
            console.error('Payroll init error:', error?.response?.data || error);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 animate-in slide-in-from-top-4 duration-500">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">
                        INITIALIZE <span className="text-primary">PAYROLL</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-md">Start a new payroll cycle. The engine will automatically calculate dues based on time logs and staff profiles.</p>
                </div>
                <button 
                    onClick={() => navigate('/finance/payroll')}
                    className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="glass-card p-8 border border-slate-100 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    {/* Run Name */}
                    <div className="space-y-2 relative z-10">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payroll Cycle Name</label>
                        <div className="relative">
                            <Sparkles className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Q1 Technical Staff Payroll"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
                                <CalendarDays className="w-3 h-3" /> Period Start Date
                            </label>
                            <input
                                required
                                type="date"
                                value={formData.periodStart}
                                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
                                <CalendarDays className="w-3 h-3" /> Period End Date
                            </label>
                            <input
                                required
                                type="date"
                                value={formData.periodEnd}
                                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* AI Preview Notice */}
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                            <Calculator className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">Smart Calculation Active</h4>
                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                Once you initialize, we will sweep all <span className="font-bold text-primary italic">completed billable hours</span> within this range.
                                You can review and adjust individual payslips in the next step.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="flex-1 bg-slate-900 text-white rounded-2xl py-5 text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {createMutation.isPending ? 'Processing...' : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Initialize Engine
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/finance/payroll')}
                        className="px-8 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PayrollRunForm;
