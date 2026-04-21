import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft, Save, Trash2, Building2, Calendar,
    Tag, FileText, ShoppingCart, IndianRupee, AlertCircle,
    CheckCircle2, CreditCard, Loader2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { expenseService, branchService } from '../../../services/api/apiServices';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
    'Office Supplies', 'Travel', 'Utilities', 'Salaries',
    'Marketing', 'Software', 'Rent', 'Miscellaneous'
];

const PAYMENT_METHODS = [
    'Bank Transfer', 'Credit Card', 'Cash', 'UPI', 'Check'
];

const ExpenseForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = Boolean(id && id !== 'new');

    const [formData, setFormData] = useState({
        merchant: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: CATEGORIES[0],
        paymentMethod: PAYMENT_METHODS[0],
        referenceNumber: '',
        description: '',
        branchId: '',
        taxAmount: 0,
        status: 'pending'
    });

    // Queries
    const { data: expenseData, isLoading: isLoadingExpense } = useQuery({
        queryKey: ['expense', id],
        queryFn: () => expenseService.getById(id),
        enabled: isEdit
    });

    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getAll()
    });

    const branches = branchesData?.data?.data?.branches || branchesData?.data?.branches || branchesData?.data || [];

    useEffect(() => {
        if (expenseData) {
            const exp = expenseData?.data?.data?.expense || expenseData?.data?.expense || expenseData?.data || expenseData;
            setFormData({
                merchant: exp.merchant || exp.title || exp.vendor || '',
                amount: (exp.amount || 0).toString(),
                date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '',
                category: exp.category || CATEGORIES[0],
                paymentMethod: exp.paymentMethod || PAYMENT_METHODS[0],
                referenceNumber: exp.referenceNumber || '',
                description: exp.description || exp.notes || '',
                branchId: exp.branchId?._id || exp.branchId || '',
                taxAmount: exp.taxAmount || 0,
                status: exp.status || 'pending'
            });
        }
    }, [expenseData]);

    // Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                ...data,
                amount: parseFloat(data.amount) || 0,
                taxAmount: parseFloat(data.taxAmount || 0)
            };
            return isEdit ? expenseService.update(id, payload) : expenseService.create(payload);
        },
        onSuccess: () => {
            toast.success(`Expense ${isEdit ? 'updated' : 'recorded'} successfully`);
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            navigate('/finance/expenses');
        },
        onError: (error) => {
            const msg = error?.response?.data?.message || error?.message || 'Failed to save expense';
            toast.error(msg);
            console.error('Expense save error:', error?.response?.data || error);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => expenseService.remove(id),
        onSuccess: () => {
            toast.success('Expense deleted');
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            navigate('/finance/expenses');
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Delete failed')
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.merchant || !formData.amount) {
            toast.error('Please fill in merchant and amount');
            return;
        }
        saveMutation.mutate(formData);
    };

    if (isEdit && isLoadingExpense) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/finance/expenses')}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isEdit ? 'Edit Expense Record' : 'Record New Expense'}
                        </h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {isEdit ? `Ref: ${formData.referenceNumber || id}` : 'Enter operational spend details'}
                        </p>
                    </div>
                </div>
                {isEdit && (
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('Delete this record?')) deleteMutation.mutate();
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all shadow-sm disabled:opacity-50"
                    >
                        {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-8 bg-white/40 border border-white/20 shadow-xl shadow-slate-200/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" /> Transaction Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Merchant / Vendor *</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.merchant}
                                        onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                                        placeholder="e.g. Amazon Web Services"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                             <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Transaction Amount *</label>
                                 <div className="relative group">
                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black italic z-10">₹</span>
                                     <input
                                         type="number"
                                         step="0.01"
                                         min="0"
                                         required
                                         value={formData.amount}
                                         onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                         placeholder="0.00"
                                         className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all font-black text-slate-900 text-lg"
                                     />
                                 </div>
                             </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Date *</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</label>
                                <div className="relative group">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all font-bold text-slate-700 appearance-none"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Description / Notes</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the purpose of this expense..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all font-medium text-slate-600 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6 border border-white/20 bg-rose-500/5">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-rose-500" /> Attribution
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Allocated Branch</label>
                                <select
                                    value={formData.branchId}
                                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all font-bold text-slate-700 appearance-none"
                                >
                                    <option value="">Select Branch (Optional)</option>
                                    {Array.isArray(branches) && branches.map(branch => (
                                        <option key={branch._id} value={branch._id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Payment Method</label>
                                <div className="relative group">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all font-bold text-slate-700 appearance-none"
                                    >
                                        {PAYMENT_METHODS.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Reference Number</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.referenceNumber}
                                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                        placeholder="Invoice # / Receipt #"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border border-white/20">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Validation
                        </h3>
                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={saveMutation.isPending}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-sm shadow-xl shadow-slate-200 disabled:opacity-50"
                            >
                                {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {saveMutation.isPending ? 'Processing...' : (isEdit ? 'Update Record' : 'Post Expense')}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/finance/expenses')}
                                className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all font-black text-xs uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                        <div className="mt-6 flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                                This transaction will be posted to the general ledger and impact the branch's cash flow in real-time.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
