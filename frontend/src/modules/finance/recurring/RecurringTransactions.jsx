import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api/axios';
import { toast } from 'react-hot-toast';
import { RefreshCw, Plus, FileText, IndianRupee, Clock, Calendar, CheckCircle2, PauseCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';

const RecurringTransactions = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: 'invoice',
        frequency: 'monthly',
        nextRunDate: new Date().toISOString().split('T')[0],
        amount: '',
        customerId: '',
        merchant: '',
        category: ''
    });

    const { data: recurringData, isLoading } = useQuery({
        queryKey: ['recurring-templates'],
        queryFn: async () => {
            const res = await api.get('/finance/recurring');
            return res.data.data.templates;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                title: data.name,
                type: data.type,
                frequency: data.frequency,
                nextRunDate: data.nextRunDate,
                data: {}
            };
            if (data.type === 'invoice') {
                payload.data = {
                    customerId: data.customerId,
                    items: [{ description: 'Recurring Charge', quantity: 1, price: Number(data.amount) }],
                    tax: 0,
                    total: Number(data.amount)
                };
            } else {
                payload.data = {
                    merchant: data.merchant,
                    category: data.category,
                    amount: Number(data.amount)
                };
            }
            return api.post('/finance/recurring', payload);
        },
        onSuccess: () => {
            toast.success('Recurring Template Created');
            queryClient.invalidateQueries({ queryKey: ['recurring-templates'] });
            setIsCreateOpen(false);
            setFormData({ name: '', type: 'invoice', frequency: 'monthly', nextRunDate: '', amount: '', customerId: '', merchant: '', category: '' });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || 'Failed to create template');
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (id) => api.patch(`/finance/recurring/${id}/toggle`),
        onSuccess: () => {
            toast.success('Template status updated');
            queryClient.invalidateQueries({ queryKey: ['recurring-templates'] });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-blue-600" />
                        Automation & Recurring
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Set up automated schedules for invoices and expenses.</p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-4 h-4" /> New Template
                </button>
            </div>

            {isCreateOpen && (
                <div className="glass-card p-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-slate-900">Create New Template</h2>
                        <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2 text-sm bg-slate-100 rounded-lg">Cancel</button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Template Name</label>
                            <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" placeholder="e.g. Monthly Rent" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm text-slate-700" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="invoice">Invoice Generation</option>
                                <option value="expense">Expense Logging</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Amount (INR)</label>
                            <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Frequency</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm text-slate-700" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Start/Next Run Date</label>
                            <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm text-slate-700" value={formData.nextRunDate} onChange={e => setFormData({...formData, nextRunDate: e.target.value})} />
                        </div>

                        {formData.type === 'expense' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Merchant</label>
                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" placeholder="Merchant Name" value={formData.merchant} onChange={e => setFormData({...formData, merchant: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" placeholder="Expense Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                                </div>
                            </>
                        )}
                        
                        <div className="md:col-span-2 pt-2">
                            <button disabled={createMutation.isPending} type="submit" className="w-full bg-slate-900 hover:bg-black text-white px-5 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10 disabled:opacity-50">
                                {createMutation.isPending ? 'Activating...' : 'Activate Automation'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recurringData?.map(template => (
                        <div key={template._id} className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 border border-slate-200/50">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn("p-3 rounded-2xl shadow-sm", template.type === 'invoice' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                        {template.type === 'invoice' ? <FileText className="w-5 h-5" /> : <IndianRupee className="w-5 h-5" />}
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1",
                                        template.status === 'active' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {template.status === 'active' ? <Clock className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                                        {template.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{template.title}</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1 capitalize">{template.frequency} • {template.type}</p>
                                
                                <div className="mt-6 flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Execution</p>
                                        <p className="text-sm font-bold text-slate-700">{formatDate(template.nextRunDate)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-lg font-black text-slate-900 bg-clip-text">
                                    {template.type === 'invoice' 
                                        ? '+' + formatCurrency(template.data?.total || 0)
                                        : '-' + formatCurrency(template.data?.amount || 0)}
                                </span>
                                <button 
                                    onClick={() => toggleStatusMutation.mutate(template._id)}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                                >
                                    {template.status === 'active' ? 'Pause' : 'Resume'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {(!recurringData || recurringData.length === 0) && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                            <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700">No Automations Found</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">Create a recurring template to automatically generate invoices or expenses on a schedule.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecurringTransactions;
