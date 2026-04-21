import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, MoreHorizontal, Calendar, MessageSquare, CheckSquare,
    Search, Filter, LayoutGrid, List, GripVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { taskService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import PresenceAvatars from '../components/common/PresenceAvatars';
import { useSocket } from '../hooks/useSocket';
import useAuthStore from '../store/useAuth';

// ─── Priority Badge ─────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
    const colors = {
        low: 'bg-slate-100 text-slate-600',
        medium: 'bg-blue-100 text-blue-600',
        high: 'bg-orange-100 text-orange-600',
        critical: 'bg-red-100 text-red-600',
    };
    return (
        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", colors[priority] || colors.low)}>
            {priority}
        </span>
    );
};

// ─── Task Card ──────────────────────────────────────────────
const TaskCard = ({ task, onClick }) => (
    <div
        onClick={() => onClick(task)}
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-primary transition-colors">
                    {task.key || `T-${task._id?.slice(-3)}`}
                </span>
                <PriorityBadge priority={task.priority} />
            </div>
            <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
        <h4 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h4>

        {task.description && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center gap-4 mt-4 text-slate-400">
            <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">
                    {task.issueType?.[0] || 'T'}
                </div>
                {task.storyPoints && (
                    <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-700">
                        {task.storyPoints}
                    </span>
                )}
            </div>
            {task.dueDate && (
                <div className="flex items-center gap-1 text-[11px] font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
            )}
        </div>

        <div className="flex items-center justify-between mt-4">
            <div className="flex -space-x-2">
                {task.assignee ? (
                    <div className="w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                        {(task.assignee?.name || task.assignee?.email || '?').substring(0, 2).toUpperCase()}
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-400 font-bold">?</div>
                )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">#{task._id?.slice(-5)}</div>
        </div>
    </div>
);

// ─── Kanban Column ──────────────────────────────────────────
const KanbanColumn = ({ title, tasks, status, onTaskClick, onStatusChange, wipLimit }) => {
    const isOverLimit = wipLimit && tasks.length > wipLimit;
    const statusColors = {
        open: 'bg-slate-500',
        in_progress: 'bg-blue-500',
        in_review: 'bg-purple-500',
        completed: 'bg-green-500',
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) onStatusChange(taskId, status);
    };

    return (
        <div
            className={cn(
                "flex flex-col w-80 shrink-0 h-full p-2 rounded-3xl transition-all duration-500",
                isOverLimit ? "bg-rose-50/50 ring-2 ring-rose-200/50" : "bg-transparent"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", statusColors[status] || 'bg-slate-400')} />
                    <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest italic">{title}</h3>
                    <div className="flex items-center gap-1">
                        <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black",
                            isOverLimit ? "bg-rose-500 text-white animate-pulse" : "bg-slate-200 text-slate-600"
                        )}>
                            {tasks.length}
                        </span>
                        {wipLimit && (
                            <span className="text-[10px] font-bold text-slate-400">/ {wipLimit}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pb-6 custom-scrollbar">
                {tasks.map(task => (
                    <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('taskId', task._id)}
                    >
                        <TaskCard task={task} onClick={onTaskClick} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── List Row ───────────────────────────────────────────────
const TaskListRow = ({ task, onClick }) => (
    <div
        onClick={() => onClick(task)}
        className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group border-b border-slate-100 last:border-0"
    >
        <div className={cn(
            "w-2 h-8 rounded-full",
            task.status === 'completed' ? 'bg-green-500' :
                task.status === 'in_progress' ? 'bg-blue-500' :
                    task.status === 'in_review' ? 'bg-purple-500' : 'bg-slate-300'
        )} />
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">{task.key || `T-001`}</span>
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{task.title}</p>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{task.status?.replace(/_/g, ' ')}</p>
        </div>
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
            <span className="text-xs text-slate-400 font-medium">
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
        )}
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
            {(task.assignee?.name || '?').substring(0, 2).toUpperCase()}
        </div>
    </div>
);

// ─── Main Board ─────────────────────────────────────────────
const TaskBoard = () => {
    const queryClient = useQueryClient();
    const [selectedTask, setSelectedTask] = React.useState(null);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [viewMode, setViewMode] = React.useState('kanban');
    const [search, setSearch] = React.useState('');
    const [groupBy, setGroupBy] = React.useState('none'); // none, priority, assignee

    const wipLimits = {
        open: 10,
        in_progress: 5,
        in_review: 3,
        completed: 100
    };

    const { data: kanbanRaw, isLoading } = useQuery({
        queryKey: ['kanban'],
        queryFn: taskService.getKanban,
    });

    const statusMutation = useMutation({
        mutationFn: ({ taskId, status }) => taskService.changeStatus(taskId, status),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            queryClient.invalidateQueries({ queryKey: ['recent-tasks'] });

            // Emit socket event
            emitEvent('task_moved', {
                taskId: variables.taskId,
                newStatus: variables.status
            });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || 'Transition blocked by workflow rules';
            toast.error(msg, { duration: 4000 });
        }
    });

    const { organization } = useAuthStore();
    const { emitEvent, subscribeToEvent } = useSocket(organization?._id || organization?.id);

    React.useEffect(() => {
        subscribeToEvent('task_updated', (data) => {
            console.log('Real-time Task Update Received:', data);
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            queryClient.invalidateQueries({ queryKey: ['recent-tasks'] });
        });
    }, [subscribeToEvent, queryClient]);

    // Safe data extraction - API returns { columns: [ { _id: 'open', tasks: [...] }, ... ] }
    const kanbanRawData = kanbanRaw?.columns || kanbanRaw?.data?.columns || kanbanRaw?.data || kanbanRaw || [];
    // Convert aggregation array to object keyed by status
    const kanban = Array.isArray(kanbanRawData)
        ? kanbanRawData.reduce((acc, group) => { acc[group._id] = group.tasks || []; return acc; }, {})
        : kanbanRawData;
    const columns = [
        { title: 'To Do', status: 'open', tasks: Array.isArray(kanban.open) ? kanban.open : [] },
        { title: 'In Progress', status: 'in_progress', tasks: Array.isArray(kanban.in_progress) ? kanban.in_progress : [] },
        { title: 'In Review', status: 'in_review', tasks: Array.isArray(kanban.in_review) ? kanban.in_review : [] },
        { title: 'Done', status: 'completed', tasks: Array.isArray(kanban.completed) ? kanban.completed : [] },
    ];

    const allTasks = columns.flatMap(col => col.tasks);
    const filteredTasks = search
        ? allTasks.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
        : allTasks;

    const handleStatusChange = (taskId, newStatus) => {
        statusMutation.mutate({ taskId, status: newStatus });
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-72 bg-slate-100 rounded" />
                </div>
                <div className="flex gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-80 space-y-3">
                            <div className="h-6 w-24 bg-slate-200 rounded" />
                            {[1, 2].map(j => <div key={j} className="h-32 bg-slate-100 rounded-xl" />)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['kanban'] })}
                />
            )}

            <CreateTaskModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Project Roadmap</h1>
                    <p className="text-slate-500 mt-1">Manage and track your engineering sprint.</p>
                </div>

                <div className="flex items-center gap-3">
                    <PresenceAvatars resourceType="taskboard" resourceId="kanban" />
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn("p-2 rounded-lg transition-all", viewMode === 'kanban' ? "bg-white shadow-sm text-primary" : "text-slate-500")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white shadow-sm text-primary" : "text-slate-500")}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        <Plus className="w-4 h-4" />
                        New Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter tasks..."
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:text-primary transition-colors"
                        >
                            <option value="none">Grouping: None</option>
                            <option value="priority">Grouping: Priority</option>
                            <option value="assignee">Grouping: Assignee</option>
                        </select>
                    </div>
                </div>
                <div className="text-xs font-bold text-slate-400">
                    {allTasks.length} total tasks
                </div>
            </div>

            {/* Views */}
            {viewMode === 'kanban' ? (
                <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                    {groupBy === 'none' ? (
                        <div className="flex gap-6 h-full min-w-max">
                            {columns.map(col => (
                                <KanbanColumn
                                    key={col.status}
                                    {...col}
                                    wipLimit={wipLimits[col.status]}
                                    onTaskClick={setSelectedTask}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-12 min-w-max">
                            {Array.from(new Set(allTasks.map(t =>
                                groupBy === 'priority' ? t.priority : (t.assignee?.name || 'Unassigned')
                            ))).map(groupName => (
                                <div key={groupName} className="space-y-4">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="h-[2px] flex-1 bg-slate-100" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            {groupBy}: <span className="text-slate-900">{groupName}</span>
                                        </h4>
                                        <div className="h-[2px] flex-1 bg-slate-100" />
                                    </div>
                                    <div className="flex gap-6">
                                        {columns.map(col => (
                                            <KanbanColumn
                                                key={`${groupName}-${col.status}`}
                                                {...col}
                                                tasks={col.tasks.filter(t =>
                                                    (groupBy === 'priority' ? t.priority : (t.assignee?.name || 'Unassigned')) === groupName
                                                )}
                                                wipLimit={wipLimits[col.status]}
                                                onTaskClick={setSelectedTask}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto glass-card p-2">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 italic">
                            No tasks found. Create your first task!
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <TaskListRow key={task._id} task={task} onClick={setSelectedTask} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskBoard;
