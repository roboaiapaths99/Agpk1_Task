import React, { useState } from 'react';
import { X, Folder, AlignLeft, Shield, Zap, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as ReactQuery from '@tanstack/react-query';
import { projectService, workflowService } from '../../services/api/apiServices';

const CreateProjectModal = ({ isOpen, onClose }) => {
    const { useQuery, useMutation, useQueryClient } = ReactQuery;
    const queryClient = useQueryClient();
    const { data: workflows } = useQuery({
        queryKey: ['workflows'],
        queryFn: async () => {
            const res = await workflowService.getAll();
            return res.workflows;

        }
    });

    const [formData, setFormData] = useState({
        name: '',
        key: '',
        description: '',
        category: 'Software',
        defaultWorkflowId: '' // Will be set once workflows load
    });

    // Sync default workflow when data loads
    React.useEffect(() => {
        if (workflows?.length > 0 && !formData.defaultWorkflowId) {
            setFormData(prev => ({ ...prev, defaultWorkflowId: workflows[0]._id }));
        }
    }, [workflows]);

    const createProject = useMutation({
        mutationFn: projectService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onClose();
            setFormData({ name: '', key: '', description: '', category: 'Software', defaultWorkflowId: workflows?.[0]?._id || '' });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.defaultWorkflowId) return;
        createProject.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="relative h-32 bg-slate-900 p-8 flex items-end">
                    <div className="absolute top-0 right-0 p-6">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tight">Launch New Project</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Enterprise Work Management</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                <Folder className="w-3 h-3" />
                                Project Name
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Phoenix Initiative"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value, key: e.target.value.substring(0, 3).toUpperCase() })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                <Shield className="w-3 h-3" />
                                Key
                            </label>
                            <input
                                required
                                type="text"
                                maxLength={5}
                                placeholder="PHX"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                            <AlignLeft className="w-3 h-3" />
                            Description
                        </label>
                        <textarea
                            placeholder="Briefly describe the project objectives..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[80px] resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                <Target className="w-3 h-3" />
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none"
                            >
                                <option value="Software">Software</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Operations">Operations</option>
                                <option value="HR">HR</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                <Zap className="w-3 h-3" />
                                Workflow
                            </label>
                            <select
                                required
                                value={formData.defaultWorkflowId}
                                onChange={(e) => setFormData({ ...formData, defaultWorkflowId: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none"
                            >
                                {workflows?.length > 0 ? (
                                    workflows.map(wf => (
                                        <option key={wf._id} value={wf._id}>{wf.name}</option>
                                    ))
                                ) : (
                                    <option value="">No workflows available</option>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-slate-500 text-xs font-black uppercase tracking-widest hover:text-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createProject.isPending || !formData.defaultWorkflowId}
                            className="px-10 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {createProject.isPending ? 'Deploying...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
