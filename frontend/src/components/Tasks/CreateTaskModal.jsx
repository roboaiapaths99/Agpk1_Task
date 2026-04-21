import React from 'react';
import { X, Plus, Calendar, User, Flag, Layers } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { taskService, projectService, profileService } from '../../services/api/apiServices';
import { cn } from '../../lib/utils';

const PRIORITIES = [
    { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-600' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-600' },
];

const CreateTaskModal = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [form, setForm] = React.useState({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        project: '',
        tags: '',
        issueType: 'task',
        storyPoints: '',
    });

    const { data: usersRaw } = useQuery({
        queryKey: ['users'],
        queryFn: profileService.getAllUsers,
        enabled: isOpen,
    });

    const { data: projectsRaw } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll(),
        enabled: isOpen,
    });

    const users = Array.isArray(usersRaw?.users) ? usersRaw.users
        : Array.isArray(usersRaw?.data?.users) ? usersRaw.data.users
            : Array.isArray(usersRaw?.data) ? usersRaw.data : [];
    const projects = Array.isArray(projectsRaw?.projects) ? projectsRaw.projects
        : Array.isArray(projectsRaw?.data?.projects) ? projectsRaw.data.projects
            : Array.isArray(projectsRaw?.data) ? projectsRaw.data : [];

    const createMutation = useMutation({
        mutationFn: (data) => taskService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['recent-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['report-workload'] });
            onClose();
            setForm({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '', project: '', tags: '', issueType: 'task', storyPoints: '' });
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            priority: form.priority,
            ...(form.assignee && { assignee: form.assignee }),
            ...(form.dueDate && { dueDate: form.dueDate }),
            ...(form.project && { project: form.project }),
            ...(form.tags && { tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
            issueType: form.issueType,
            ...(form.storyPoints && { storyPoints: parseInt(form.storyPoints) }),
        };
        createMutation.mutate(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 italic">Create New Task</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Task Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Implement user authentication"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe the task..."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                <Flag className="w-3 h-3 inline mr-1" />Priority
                            </label>
                            <div className="flex gap-2">
                                {PRIORITIES.map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, priority: p.value })}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                            form.priority === p.value ? `${p.color} ring-2 ring-offset-1 ring-primary/30` : "bg-slate-100 text-slate-400"
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                <Calendar className="w-3 h-3 inline mr-1" />Due Date
                            </label>
                            <input
                                type="date"
                                value={form.dueDate}
                                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Issue Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Issue Type</label>
                            <select
                                value={form.issueType}
                                onChange={(e) => setForm({ ...form, issueType: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            >
                                <option value="task">Task</option>
                                <option value="bug">Bug</option>
                                <option value="story">Story</option>
                                <option value="epic">Epic</option>
                            </select>
                        </div>

                        {/* Story Points */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Story Points</label>
                            <input
                                type="number"
                                value={form.storyPoints}
                                onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Assignee */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                <User className="w-3 h-3 inline mr-1" />Assignee
                            </label>
                            <select
                                value={form.assignee}
                                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            >
                                <option value="">Unassigned</option>
                                <option value="">Unassigned</option>
                                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                            </select>
                        </div>

                        {/* Project */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                <Layers className="w-3 h-3 inline mr-1" />Project
                            </label>
                            <select
                                value={form.project}
                                onChange={(e) => setForm({ ...form, project: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            >
                                <option value="">No Project</option>
                                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            placeholder="e.g. backend, urgent, sprint-3"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        />
                    </div>

                    {/* Error */}
                    {createMutation.isError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold">
                            {createMutation.error?.message || 'Failed to create task. Please try again.'}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !form.title.trim()}
                            className="btn-primary disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
