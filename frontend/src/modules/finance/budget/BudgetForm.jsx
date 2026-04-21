import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, DollarSign, Calendar, Tag, Activity } from 'lucide-react';
import { cn } from '../../../lib/utils';

const CATEGORIES = [
    'Software',
    'Hardware',
    'Marketing',
    'Operations',
    'Payroll',
    'Travel',
    'Office Supplies',
    'Utilities',
    'Miscellaneous'
];

const BudgetForm = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false }) => {
    const [formData, setFormData] = useState({
        category: 'Software',
        limitAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        notifications: {
            threshold80: true,
            threshold100: true
        }
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                category: initialData.category,
                limitAmount: initialData.limitAmount,
                startDate: new Date(initialData.startDate).toISOString().split('T')[0],
                endDate: new Date(initialData.endDate).toISOString().split('T')[0],
                notifications: initialData.notifications || { threshold80: true, threshold100: true }
            });
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 shadow-black/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">
                            {initialData ? 'Update' : 'Define'} <span className="text-primary">Budget</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Set fiscal boundaries and prevent overspending.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Tag className="w-3 h-3 text-primary" />
                                Spending Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none outline-none"
                                required
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Limit Amount */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <DollarSign className="w-3 h-3 text-primary" />
                                Budget Limit
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black italic">₹</span>
                                <input
                                    type="number"
                                    value={formData.limitAmount}
                                    onChange={(e) => setFormData({ ...formData, limitAmount: parseFloat(e.target.value) })}
                                    className="w-full h-12 pl-8 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="Enter limit amount"
                                    required
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-primary" />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                required
                            />
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-primary" />
                                End Date
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Sync & Alerts</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600 italic">Alert at 80% utilization</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.notifications.threshold80}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        notifications: { ...formData.notifications, threshold80: e.target.checked }
                                    })}
                                />
                                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-all"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600 italic">Critical alert at 100%</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.notifications.threshold100}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        notifications: { ...formData.notifications, threshold100: e.target.checked }
                                    })}
                                />
                                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-all"></div>
                            </label>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] h-12 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Activity className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 text-emerald-400" />
                                    {initialData ? 'Update Policy' : 'Activate Budget'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BudgetForm;
