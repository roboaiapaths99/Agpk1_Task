import React, { useState } from 'react';
import {
    Clock, ShieldCheck, AlertTriangle, Plus,
    Trash2, Edit3, Save, X, CheckCircle2,
    Info, Settings2, BarChart3, ArrowLeft
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slaService } from '../services/api/apiServices';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

const SLAPage = () => {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);

    const { data: policiesData, isLoading } = useQuery({
        queryKey: ['sla-policies'],
        queryFn: slaService.getAll
    });

    const safePolicies = policiesData?.data?.policies || policiesData?.policies || policiesData?.data || policiesData || [];
    const policies = Array.isArray(safePolicies) ? safePolicies : [];

    const createMutation = useMutation({
        mutationFn: slaService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
            toast.success('SLA Policy established');
            setIsAdding(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => slaService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
            toast.success('Policy configuration synced');
            setEditingPolicy(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: slaService.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
            toast.success('Policy decommissioned');
        }
    });

    const handleSave = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            priority: formData.get('priority'),
            responseTimeLimit: Number(formData.get('responseTimeLimit')),
            resolutionTimeLimit: Number(formData.get('resolutionTimeLimit')),
            isActive: true
        };

        if (editingPolicy) {
            updateMutation.mutate({ id: editingPolicy._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const priorities = [
        { value: 'critical', color: 'bg-rose-500', text: 'text-rose-600' },
        { value: 'high', color: 'bg-orange-500', text: 'text-orange-600' },
        { value: 'medium', color: 'bg-indigo-500', text: 'text-indigo-600' },
        { value: 'low', color: 'bg-slate-500', text: 'text-slate-600' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 italic tracking-tight uppercase">SLA Policy Engine</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">Define organizational service level commitments and automated escalation paths.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:brightness-125 transition-all shadow-xl active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    NEW COMMITMENT
                </button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Policy List */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem]" />)}
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="p-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <Settings2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-400 italic">No Active Policies</h3>
                            <p className="text-sm text-slate-400">Establish your first SLA to begin automated monitoring.</p>
                        </div>
                    ) : (
                        policies.map(policy => (
                            <div key={policy._id} className="group relative bg-white border border-slate-100 p-6 rounded-[2.5rem] hover:shadow-2xl hover:shadow-indigo-100 transition-all">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-3 h-3 rounded-full animate-pulse",
                                            priorities.find(p => p.value === policy.priority)?.color
                                        )} />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{policy.name}</h3>
                                            <span className="text-[10px] font-black uppercase text-slate-400">{policy.priority} Priority Tier</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingPolicy(policy)}
                                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteMutation.mutate(policy._id)}
                                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-2">
                                            <Clock className="w-3 h-3" /> Target Response
                                        </div>
                                        <div className="text-2xl font-black text-slate-900">{policy.responseTimeLimit}h</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-2">
                                            <BarChart3 className="w-3 h-3 text-indigo-500" /> Target Resolution
                                        </div>
                                        <div className="text-2xl font-black text-indigo-600">{policy.resolutionTimeLimit}h</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Info & Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Settings2 className="w-32 h-32" />
                        </div>
                        <h4 className="text-lg font-black uppercase italic mb-4 relative z-10">Compliance Engine</h4>
                        <p className="text-slate-400 text-sm font-medium mb-6 relative z-10">
                            Our SLA engine monitors the delta between task inception and state transitions in real-time.
                        </p>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Dynamic priority mapping
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Automated escalation
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Immutable breach logs
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100">
                        <div className="flex items-center gap-3 mb-3">
                            <Info className="w-5 h-5 text-indigo-600" />
                            <h5 className="font-black text-indigo-900 uppercase text-xs">Best Practices</h5>
                        </div>
                        <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                            Enterprise clients typically expect 24h resolution for <span className="font-bold underline">High</span> priority and 4h for <span className="font-bold underline">Critical</span> infrastructure events.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal Overlay for Add/Edit */}
            {(isAdding || editingPolicy) && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <form onSubmit={handleSave} className="p-10 space-y-8">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic">
                                    {editingPolicy ? 'Refine Policy' : 'New commitment'}
                                </h2>
                                <p className="text-slate-500 font-medium">Configure the target metrics for system response.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Policy Name</label>
                                    <input
                                        name="name"
                                        defaultValue={editingPolicy?.name}
                                        required
                                        placeholder="e.g. Standard Support SLA"
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Priority Tier</label>
                                        <select
                                            name="priority"
                                            defaultValue={editingPolicy?.priority || 'medium'}
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="critical">Critical</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Response (Hrs)</label>
                                        <input
                                            name="responseTimeLimit"
                                            type="number"
                                            defaultValue={editingPolicy?.responseTimeLimit || 4}
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Resolution (Hrs)</label>
                                    <input
                                        name="resolutionTimeLimit"
                                        type="number"
                                        defaultValue={editingPolicy?.resolutionTimeLimit || 24}
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setEditingPolicy(null); }}
                                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl shadow-indigo-200 hover:brightness-110 rotate-1 transition-all active:scale-95"
                                >
                                    {editingPolicy ? 'SYNC CHANGES' : 'DEPLOY POLICY'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SLAPage;
