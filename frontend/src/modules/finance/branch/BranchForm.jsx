import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft, Save, Trash2, Building2, MapPin,
    Phone, Mail, Globe, AlertCircle,
    CheckCircle2, Info
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { branchService } from '../../../services/api/apiServices';
import { toast } from 'react-hot-toast';

const BranchForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = Boolean(id && id !== 'new');

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        zipCode: '',
        phone: '',
        email: '',
        isActive: true
    });

    // Queries
    const { data: branchData, isLoading: isLoadingBranch } = useQuery({
        queryKey: ['branch', id],
        queryFn: () => branchService.getById(id),
        enabled: isEdit
    });

    useEffect(() => {
        if (branchData) {
            const branch = branchData.branch || branchData.data?.branch || branchData.data || branchData;
            setFormData({
                name: branch.name || '',
                code: branch.code || '',
                address: branch.address || '',
                city: branch.city || '',
                state: branch.state || '',
                country: branch.country || 'India',
                zipCode: branch.zipCode || '',
                phone: branch.phone || '',
                email: branch.email || '',
                isActive: branch.isActive !== undefined ? branch.isActive : true
            });
        }
    }, [branchData]);

    // Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => {
            return isEdit ? branchService.update(id, data) : branchService.create(data);
        },
        onSuccess: () => {
            toast.success(`Branch ${isEdit ? 'updated' : 'created'} successfully`);
            queryClient.invalidateQueries(['branches']);
            navigate('/finance/branches');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || error.message || 'Failed to save branch');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.code) {
            toast.error('Name and Code are required');
            return;
        }
        saveMutation.mutate(formData);
    };

    if (isLoadingBranch) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/finance/branches')}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isEdit ? 'Edit Branch Details' : 'Configure New Branch'}
                        </h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {isEdit ? `Code: ${formData.code}` : 'Define organizational location metadata'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-8 bg-white/40 border border-white/20 shadow-xl shadow-slate-200/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Core Identification
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Branch Name *</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Mumbai HQ / Bangalore Tech Center"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Branch Code *</label>
                                <div className="relative group">
                                    <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        disabled={isEdit}
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. MUM01"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-black text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location Details
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Building name, Street, Area..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-medium text-slate-600 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">State</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={formData.zipCode}
                                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Country</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6 border border-white/20 bg-indigo-500/5">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-indigo-500" /> Contact Info
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Primary Phone</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Office Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="branch@organization.com"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-200 text-indigo-600 focus:ring-4 focus:ring-indigo-500/5"
                                />
                                <label htmlFor="isActive" className="text-sm font-black text-slate-700 cursor-pointer">Mark as Active Branch</label>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border border-white/20">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Save Configuration
                        </h3>
                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={saveMutation.isLoading}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-sm shadow-xl shadow-slate-200 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {saveMutation.isLoading ? 'Syncing...' : (isEdit ? 'Update Branch' : 'Register Branch')}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/finance/branches')}
                                className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all font-black text-xs uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BranchForm;
