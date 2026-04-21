import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Filter, Plus, Building2, Download,
    ArrowRight, MapPin, Phone, Mail, MoreVertical,
    CheckCircle2, AlertCircle, Trash2, Edit
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { branchService } from '../../../services/api/apiServices';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const BranchList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    // Queries
    const { data: branches, isLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await branchService.getAll();
            return res.branches || res.data?.branches || res.data || [];
        }
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id) => branchService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['branches']);
            toast.success('Branch deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete branch');
        }
    });

    const filteredBranches = useMemo(() => {
        let list = Array.isArray(branches) ? branches : [];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(branch =>
                branch.name?.toLowerCase().includes(q) ||
                branch.code?.toLowerCase().includes(q) ||
                branch.city?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [branches, searchQuery]);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this branch?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-indigo-500" />
                        Branch Management
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Manage organizational branches, locations, and contact details.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/finance/branches/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-200"
                    >
                        <Plus className="w-4 h-4" /> Add Branch
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, code or city"
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all text-sm"
                    />
                </div>
            </div>

            {/* List */}
            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Loading branches...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Code</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name / Location</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredBranches.map((branch) => (
                                    <tr
                                        key={branch._id}
                                        className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                                        onClick={() => navigate(`/finance/branches/${branch._id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-slate-900">#{branch.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{branch.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tight flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {branch.city || 'No City'}, {branch.state || 'No State'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {branch.phone && (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {branch.phone}
                                                    </span>
                                                )}
                                                {branch.email && (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {branch.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                branch.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {branch.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/finance/branches/${branch._id}/edit`);
                                                    }}
                                                    className="p-2 hover:bg-blue-50 rounded-lg text-slate-300 hover:text-blue-600 transition-all"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(branch._id, e)}
                                                    className="p-2 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-600 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredBranches.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-black text-slate-900">No branches found</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Start by adding your first organizational branch.</p>
                        <button
                            onClick={() => navigate('/finance/branches/new')}
                            className="mt-6 px-6 py-2 bg-indigo-500/10 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-500/20 transition-all"
                        >
                            Add Your First Branch
                        </button>
                    </div>
                )}

                <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Multi-Branch Configuration Active</span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-500" /> Operational Scoping Active
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BranchList;
