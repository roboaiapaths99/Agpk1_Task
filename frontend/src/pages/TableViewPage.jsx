import React, { useState, useMemo, useCallback } from 'react';
import * as ReactQuery from '@tanstack/react-query';
import {
    ArrowUpDown, ArrowUp, ArrowDown, Filter, Columns, CheckSquare, Trash2,
    Edit3, Users, Loader2, Table2, LayoutGrid, Search, X, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { taskService, profileService } from '../services/api/apiServices';
import { useNavigate } from 'react-router-dom';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
    open: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    in_review: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
    done: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_COLORS = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-500',
};

const STATUSES = ['open', 'in_progress', 'in_review', 'completed', 'blocked', 'done'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

const TableViewPage = () => {
    const { useQuery, useMutation, useQueryClient } = ReactQuery;
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [sortField, setSortField] = useState('updatedAt');
    const [sortDir, setSortDir] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [editingCell, setEditingCell] = useState(null); // { taskId, field }
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const { data: tasksData, isLoading } = useQuery({
        queryKey: ['all-tasks'],
        queryFn: async () => { const res = await taskService.getAll(); return res.tasks || res.data?.tasks || res.data || res; },
    });

    const { data: usersData } = useQuery({
        queryKey: ['all-users'],
        queryFn: async () => { const res = await profileService.getAllUsers(); return res.users || res.data?.users || res.data || res; },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => taskService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
            setEditingCell(null);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || 'Failed to update task';
            toast.error(msg);
            setEditingCell(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => taskService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-tasks'] }),
    });

    const tasks = useMemo(() => {
        const safeData = tasksData?.tasks || tasksData?.data?.tasks || tasksData?.data || tasksData || [];
        let list = Array.isArray(safeData) ? safeData : [];

        // Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t => t.title?.toLowerCase().includes(q) || t.key?.toLowerCase().includes(q));
        }
        if (filterStatus) list = list.filter(t => t.status === filterStatus);
        if (filterPriority) list = list.filter(t => t.priority === filterPriority);

        // Sort
        list = [...list].sort((a, b) => {
            let valA = a[sortField], valB = b[sortField];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [tasksData, searchQuery, filterStatus, filterPriority, sortField, sortDir]);

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    const selectAll = () => {
        if (selectedIds.size === tasks.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(tasks.map(t => t._id)));
    };

    const bulkAction = async (action, value) => {
        for (const id of selectedIds) {
            await taskService.update(id, { [action]: value });
        }
        queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
        setSelectedIds(new Set());
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
        return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
    };

    const InlineEdit = ({ task, field }) => {
        const isEditing = editingCell?.taskId === task._id && editingCell?.field === field;
        const val = task[field];

        if (field === 'status') {
            return (
                <select value={val} onChange={(e) => updateMutation.mutate({ id: task._id, data: { status: e.target.value } })}
                    className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 bg-transparent border-0 outline-none cursor-pointer rounded-lg w-full">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
            );
        }
        if (field === 'priority') {
            return (
                <select value={val} onChange={(e) => updateMutation.mutate({ id: task._id, data: { priority: e.target.value } })}
                    className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 bg-transparent border-0 outline-none cursor-pointer rounded-lg w-full">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            );
        }
        if (field === 'assignee') {
            const safeUsers = usersData?.users || usersData?.data?.users || usersData?.data || usersData || [];
            const users = Array.isArray(safeUsers) ? safeUsers : [];
            return (
                <select value={task.assignee?._id || ''} onChange={(e) => updateMutation.mutate({ id: task._id, data: { assignee: e.target.value || null } })}
                    className="text-xs px-2 py-1 bg-transparent border-0 outline-none cursor-pointer rounded-lg w-full">
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
            );
        }
        if (field === 'dueDate') {
            return (
                <input type="date" value={val ? new Date(val).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateMutation.mutate({ id: task._id, data: { dueDate: e.target.value || null } })}
                    className="text-xs px-2 py-1 bg-transparent border-0 outline-none cursor-pointer" />
            );
        }
        if (field === 'storyPoints') {
            return isEditing ? (
                <input type="number" defaultValue={val || ''} autoFocus className="w-14 text-xs px-1 py-0.5 border rounded outline-none text-center"
                    onBlur={(e) => { updateMutation.mutate({ id: task._id, data: { storyPoints: Number(e.target.value) || 0 } }); setEditingCell(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} />
            ) : (
                <span onClick={() => setEditingCell({ taskId: task._id, field: 'storyPoints' })} className="cursor-pointer hover:bg-slate-100 px-2 py-0.5 rounded">{val || '–'}</span>
            );
        }
        return <span className="text-sm text-slate-700 truncate">{val || '–'}</span>;
    };

    return (
        <div className="p-6 md:p-10 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 italic tracking-tight">Table View</h1>
                    <p className="text-sm text-slate-400 mt-1">Spreadsheet-style task management with inline editing</p>
                </div>
                <button onClick={() => navigate('/tasks')} className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
                    <LayoutGrid className="w-4 h-4" /> Kanban View
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks..." className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none">
                    <option value="">All Status</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none">
                    <option value="">All Priority</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs font-bold text-primary">{selectedIds.size} selected</span>
                        <select onChange={(e) => { if (e.target.value) bulkAction('status', e.target.value); e.target.value = ''; }}
                            className="px-2 py-1 text-xs border rounded-lg">
                            <option value="">Bulk Status...</option>
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        <button onClick={() => { for (const id of selectedIds) deleteMutation.mutate(id); setSelectedIds(new Set()); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-3 py-3 w-10">
                                        <input type="checkbox" checked={selectedIds.size === tasks.length && tasks.length > 0}
                                            onChange={selectAll} className="rounded" />
                                    </th>
                                    {[
                                        { key: 'key', label: 'Key', w: 'w-24' },
                                        { key: 'title', label: 'Title', w: 'min-w-[200px]' },
                                        { key: 'status', label: 'Status', w: 'w-32' },
                                        { key: 'priority', label: 'Priority', w: 'w-28' },
                                        { key: 'assignee', label: 'Assignee', w: 'w-36' },
                                        { key: 'dueDate', label: 'Due Date', w: 'w-32' },
                                        { key: 'storyPoints', label: 'Points', w: 'w-20' },
                                    ].map(col => (
                                        <th key={col.key} className={cn('px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 select-none', col.w)}
                                            onClick={() => toggleSort(col.key)}>
                                            <span className="flex items-center gap-1">{col.label} <SortIcon field={col.key} /></span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task, i) => (
                                    <tr
                                        key={task._id}
                                        className={cn(
                                            "hover:bg-slate-50 transition-colors group cursor-pointer",
                                            selectedIds.has(task._id) && "bg-primary/5"
                                        )}
                                        onClick={(e) => {
                                            // Don't open modal if clicking on checkbox, edit cell, or delete button
                                            if (e.target.closest('.no-click') || editingCell?.taskId === task._id) return;
                                            setSelectedTaskId(task._id);
                                            setIsTaskModalOpen(true);
                                        }}
                                    >
                                        <td className="w-12 px-6 py-4 no-click">
                                            <button
                                                onClick={() => toggleSelect(task._id)}
                                                className={cn(
                                                    "w-5 h-5 rounded border transition-all flex items-center justify-center",
                                                    selectedIds.has(task._id) ? "bg-primary border-primary text-white" : "border-slate-300 text-transparent"
                                                )}
                                            >
                                                <CheckSquare className="w-3 h-3" />
                                            </button>
                                        </td>
                                        <td className="px-3 text-xs font-mono text-slate-400">{task.key || '–'}</td>
                                        <td className="px-3 text-sm font-semibold text-slate-800 truncate max-w-[300px]">{task.title}</td>
                                        <td className="px-3">
                                            <span className={cn('inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', STATUS_COLORS[task.status] || 'bg-slate-100 text-slate-500')}>
                                                <InlineEdit task={task} field="status" />
                                            </span>
                                        </td>
                                        <td className="px-3">
                                            <span className={cn('inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', PRIORITY_COLORS[task.priority] || 'bg-slate-100 text-slate-500')}>
                                                <InlineEdit task={task} field="priority" />
                                            </span>
                                        </td>
                                        <td className="px-3"><InlineEdit task={task} field="assignee" /></td>
                                        <td className="px-3"><InlineEdit task={task} field="dueDate" /></td>
                                        <td className="px-6 py-4 text-right no-click">
                                            <button
                                                onClick={() => deleteMutation.mutate(task._id)}
                                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {tasks.length === 0 && (
                        <div className="text-center py-12">
                            <Table2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">No tasks match your filters.</p>
                        </div>
                    )}
                    <div className="p-4 border-t bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div>Total: {tasks.length} tasks</div>
                        <div>Last updated: {new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
            )}

            {isTaskModalOpen && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    isOpen={isTaskModalOpen}
                    onClose={() => {
                        setIsTaskModalOpen(false);
                        setSelectedTaskId(null);
                    }}
                />
            )}
        </div>
    );
};

export default TableViewPage;
