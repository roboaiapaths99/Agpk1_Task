import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save, X, Plus, Trash2, Calculator, Info,
    FileText, User, Building2, Calendar, Hash,
    Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { invoiceService, branchService } from '../../../services/api/apiServices';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PresenceAvatars from '../../../components/common/PresenceAvatars';
import { formatCurrency } from '../../../lib/formatters';

const InvoiceForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        clientName: '',
        clientEmail: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        branchId: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 18 }],
        notes: '',
        terms: 'Standard 15-day payment terms apply.'
    });

    // Fetch invoice for editing
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['invoice', id],
        queryFn: () => invoiceService.getById(id),
        enabled: isEdit,
    });

    // Populate form when edit data arrives
    useEffect(() => {
        if (invoiceData && isEdit) {
            const inv = invoiceData?.data?.data?.invoice || invoiceData?.data?.invoice || invoiceData?.data || invoiceData;
            setFormData({
                invoiceNumber: inv.invoiceNumber || '',
                clientName: inv.customerId?.name || inv.clientName || '',
                clientEmail: inv.customerId?.email || inv.clientEmail || '',
                date: inv.issuedDate ? new Date(inv.issuedDate).toISOString().split('T')[0] : new Date(inv.createdAt).toISOString().split('T')[0],
                dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
                branchId: inv.branchId?._id || inv.branchId || '',
                items: (inv.items && inv.items.length > 0) ? inv.items.map(i => ({
                    description: i.description || '',
                    quantity: i.quantity || 1,
                    unitPrice: i.unitPrice || 0,
                    taxRate: i.taxRate || 0
                })) : [{ description: '', quantity: 1, unitPrice: 0, taxRate: 18 }],
                notes: inv.notes || '',
                terms: inv.terms || ''
            });
        }
    }, [invoiceData, isEdit]);

    // Fetch branches
    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getAll()
    });

    const branches = branchesData?.data?.data?.branches || branchesData?.data?.branches || branchesData?.data || [];

    // Mutations
    const mutation = useMutation({
        mutationFn: (data) => isEdit ? invoiceService.update(id, data) : invoiceService.create(data),
        onSuccess: () => {
            toast.success(isEdit ? 'Invoice updated successfully' : 'Invoice created successfully');
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            navigate('/finance/invoices');
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to save invoice';
            toast.error(msg);
            console.error('Invoice save error:', err?.response?.data || err);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => invoiceService.remove(id),
        onSuccess: () => {
            toast.success('Invoice deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            navigate('/finance/invoices');
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || 'Failed to delete invoice');
        }
    });

    // Form Helpers
    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 18 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index, field, value) => {
        const nextItems = [...formData.items];
        nextItems[index] = {
            ...nextItems[index],
            [field]: field === 'description' ? value : Number(value) || 0
        };
        setFormData(prev => ({ ...prev, items: nextItems }));
    };

    // Calculations — all in plain rupees (no paise conversion)
    const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const totalTax = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    const total = subtotal + totalTax;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.items.some(i => !i.description || i.unitPrice <= 0)) {
            return toast.error('Please fill all line items with valid prices');
        }
        if (!formData.clientName || !formData.clientEmail) {
            return toast.error('Please enter client name and email');
        }

        mutation.mutate({
            ...formData,
            subtotal,
            tax: totalTax,
            total
        });
    };

    if (isEdit && isLoadingInvoice) {
        return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">
                        {isEdit ? 'EDIT' : 'CREATE'} <span className="text-primary">INVOICE</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Multi-branch compliant billing with automated ledger sync.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isEdit && <PresenceAvatars resourceType="invoice" resourceId={id} />}
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Delete this invoice? This action cannot be undone.')) deleteMutation.mutate();
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all disabled:opacity-50"
                        >
                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate('/finance/invoices')}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-all underline decoration-slate-200 underline-offset-4"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all font-black text-sm shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEdit ? 'Update Invoice' : 'Issue Invoice'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Top Section: Client & Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <User className="w-3 h-3" /> Client Details
                        </h3>
                        <div className="space-y-4 font-bold">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-tighter">Client Name / Business</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.clientName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                                    placeholder="Enter client name..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-tighter">Client Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.clientEmail}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Hash className="w-3 h-3" /> Invoice Meta
                        </h3>
                        <div className="grid grid-cols-2 gap-4 font-bold">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-tighter">Invoice # (auto-generated if empty)</label>
                                <input
                                    type="text"
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                                    placeholder="Auto-generated"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-tighter">Branch</label>
                                <select
                                    value={formData.branchId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none cursor-pointer"
                                >
                                    <option value="">Select Branch (Optional)</option>
                                    {Array.isArray(branches) && branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-tighter">Issue Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-tighter">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Calculator className="w-3 h-3" /> Line Items
                        </h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-xs font-black text-primary hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/30">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-3 min-w-[300px]">Description</th>
                                    <th className="px-6 py-3 w-32">Qty</th>
                                    <th className="px-6 py-3 w-32 text-right">Unit Price (₹)</th>
                                    <th className="px-6 py-3 w-32 text-center">GST %</th>
                                    <th className="px-6 py-3 w-32 text-right">Total (₹)</th>
                                    <th className="px-6 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {formData.items.map((item, index) => {
                                    const lineTotal = item.quantity * item.unitPrice * (1 + item.taxRate / 100);
                                    return (
                                        <tr key={index} className="group transition-colors active:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    placeholder="Service or product description..."
                                                    className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                    className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none text-right"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={item.taxRate}
                                                    onChange={(e) => updateItem(index, 'taxRate', e.target.value)}
                                                    className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
                                                >
                                                    <option value="0">0% (Nil)</option>
                                                    <option value="5">5% (GST)</option>
                                                    <option value="12">12% (GST)</option>
                                                    <option value="18">18% (GST)</option>
                                                    <option value="28">28% (GST)</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                                                {formatCurrency(lineTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="glass-card p-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Notes & Payment Terms</h3>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional notes for the client..."
                                className="w-full h-24 bg-slate-50 border-none rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="glass-card p-6 bg-slate-900 text-white space-y-4 divide-y divide-white/10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 pb-2">Invoice Summary</h3>
                        <div className="pt-4 space-y-3">
                            <div className="flex justify-between text-sm font-bold text-white/70">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-white/70">
                                <span>Tax (GST)</span>
                                <span>{formatCurrency(totalTax, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="pt-4 flex justify-between text-xl font-black italic">
                                <span>Total</span>
                                <span>{formatCurrency(total, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div className="pt-6 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl -z-10" />
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter leading-tight italic">
                                This invoice will be cryptographically locked upon issue. Multi-branch ledger entries will be posted automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;
