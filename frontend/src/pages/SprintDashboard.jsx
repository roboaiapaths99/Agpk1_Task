import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, sprintService, projectService } from '../services/api/apiServices';
import { Layout, List, Filter, Plus, Search, ChevronDown, Zap, Target, Calendar, Bug, CheckSquare, Bookmark, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import { useSocket } from '../hooks/useSocket';
import useAuthStore from '../store/useAuth';

const ISSUE_TYPE_ICONS = {
    story: { icon: Bookmark, color: 'text-green-500', bg: 'bg-green-50' },
    task: { icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
    bug: { icon: Bug, color: 'text-red-500', bg: 'bg-red-50' },
    epic: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' },
};

const TaskCard = ({ task, onClick }) => {
    const type = ISSUE_TYPE_ICONS[task.issueType?.toLowerCase()] || ISSUE_TYPE_ICONS.task;
    return (
        <div
            onClick={onClick}
            className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <type.icon className={cn("w-3 h-3", type.color)} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-primary transition-colors">
                        {task.key || `T-${task._id?.slice(-3)}`}
                    </span>
                </div>
                <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                    task.priority === 'critical' ? 'bg-red-50 text-red-500' :
                        task.priority === 'high' ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'
                )}>
                    {task.priority || 'medium'}
                </span>
            </div>
            <p className="text-xs font-bold text-slate-700 leading-relaxed mb-3">{task.title}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                    {task.storyPoints && (
                        <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-700">
                            {task.storyPoints}
                        </span>
                    )}
                </div>
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {task.assignee?.name?.substring(0, 2).toUpperCase() || '?'}
                </div>
            </div>
        </div>
    );
};

const STATUS_COLUMNS = [
    { id: 'open', label: 'To Do', color: 'border-slate-200 text-slate-500 bg-slate-50/50' },
    { id: 'in_progress', label: 'In Progress', color: 'border-blue-200 text-blue-500 bg-blue-50/30' },
    { id: 'in_review', label: 'In Review', color: 'border-purple-200 text-purple-500 bg-purple-50/30' },
    { id: 'completed', label: 'Done', color: 'border-green-200 text-green-500 bg-green-50/30' },
];

const SprintDashboard = () => {
    const queryClient = useQueryClient();
    const [selectedProject, setSelectedProject] = React.useState(null);
    const [activeTask, setActiveTask] = React.useState(null);
    const [showCreateModal, setShowCreateModal] = React.useState(false);

    const { data: projectsRaw } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const safeProjects = projectsRaw?.projects || projectsRaw?.data?.projects || projectsRaw?.data || projectsRaw || [];
    const projects = Array.isArray(safeProjects) ? safeProjects : [];

    React.useEffect(() => {
        if (!selectedProject && projects.length > 0) {
            setSelectedProject(projects[0]);
        }
    }, [projects, selectedProject]);

    const { data: sprintsRaw } = useQuery({
        queryKey: ['sprints', selectedProject?._id],
        queryFn: () => sprintService.getByProject(selectedProject?._id),
        enabled: !!selectedProject?._id
    });

    const sprints = Array.isArray(sprintsRaw?.sprints) ? sprintsRaw.sprints
        : Array.isArray(sprintsRaw?.data) ? sprintsRaw.data
            : Array.isArray(sprintsRaw) ? sprintsRaw : [];
    const activeSprint = sprints.find(s => s.status === 'active');

    const { data: tasksRaw, isLoading } = useQuery({
        queryKey: ['tasks', activeSprint?._id],
        queryFn: () => taskService.getAll({ sprint: activeSprint?._id }),
        enabled: !!activeSprint?._id
    });

    const safeTasks = tasksRaw?.tasks || tasksRaw?.data?.tasks || tasksRaw?.data || tasksRaw || [];
    const tasks = Array.isArray(safeTasks) ? safeTasks : [];

    const statusMutation = useMutation({
        mutationFn: ({ taskId, status }) => taskService.update(taskId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint?._id] });
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || 'Transition blocked by workflow rules';
            toast.error(msg, { duration: 4000 });
        }
    });

    const completeSprintMutation = useMutation({
        mutationFn: () => sprintService.update(activeSprint?._id, { status: 'completed' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sprints', selectedProject?._id] });
            queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint?._id] });
            toast.success('Sprint completed successfully');
        },
        onError: () => {
            toast.error('Failed to complete sprint');
        }
    });

    const handleDrop = (e, status) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            statusMutation.mutate({ taskId, status });
        }
    };


    const { organization } = useAuthStore();
    const { subscribeToEvent } = useSocket(organization?._id || organization?.id);

    React.useEffect(() => {
        subscribeToEvent('task_updated', (data) => {
            console.log('Real-time Task Update Received in Sprint Dashboard:', data);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        });
    }, [subscribeToEvent, queryClient]);

    const handleCompleteSprint = () => {
        if (window.confirm('Complete this sprint? All incomplete tasks will be moved back to the backlog.')) {
            completeSprintMutation.mutate();
        }
    };

    if (!selectedProject) return (
        <div className="p-24 text-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl mb-4" />
                <div className="h-4 w-48 bg-slate-100 rounded-full mb-2" />
                <div className="h-3 w-32 bg-slate-50 rounded-full" />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Execution Layer
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic">
                            {activeSprint?.name || 'No Active Sprint'}
                        </h1>
                        {activeSprint && (
                            <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                                Live
                            </span>
                        )}
                    </div>
                    {activeSprint && (
                        <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 italic mt-2">
                            <span className="flex items-center gap-2 transition-colors hover:text-slate-600 cursor-default">
                                <Target className="w-4 h-4 text-primary" /> {activeSprint.goal || 'No objective defined'}
                            </span>
                            <span className="flex items-center gap-2 transition-colors hover:text-slate-600 cursor-default border-l border-slate-200 pl-6">
                                <Calendar className="w-4 h-4 text-primary" /> End Date: {new Date(activeSprint.endDate || Date.now() + 604800000).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <select
                            className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3.5 text-xs font-black text-slate-600 outline-none focus:border-primary/20 transition-all appearance-none pr-12 shadow-sm group-hover:border-slate-200"
                            value={selectedProject?._id}
                            onChange={(e) => setSelectedProject(projects.find(p => p._id === e.target.value))}
                        >
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>

                    {activeSprint && (
                        <button
                            onClick={handleCompleteSprint}
                            disabled={completeSprintMutation.isPending}
                            className="btn-primary px-8 py-3.5 shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm disabled:opacity-50"
                        >
                            {completeSprintMutation.isPending ? 'Finalizing...' : 'Complete Sprint'}
                        </button>
                    )}
                </div>
            </div>

            {!activeSprint ? (
                <div className="py-32 flex flex-col items-center justify-center glass-card border-none bg-slate-50/50">
                    <Layout className="w-16 h-16 text-slate-200 mb-6" />
                    <h3 className="text-xl font-bold text-slate-800 italic mb-2">No Sprint is currently active</h3>
                    <p className="text-slate-400 text-sm italic mb-6">Go to the backlog to plan and start your next sprint.</p>
                    <a href="/backlog" className="btn-primary">Go to Backlog</a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[600px]">
                    {STATUS_COLUMNS.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div
                                key={col.id}
                                className="flex flex-col gap-4 min-h-[500px]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >

                                <div className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border-b-2 font-black italic text-[11px] uppercase tracking-widest",
                                    col.color
                                )}>
                                    {col.label}
                                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-[9px]">{colTasks.length}</span>
                                </div>
                                <div className="flex-1 space-y-3 p-1 rounded-2xl bg-slate-50/30">
                                    {colTasks.map(task => (
                                        <div
                                            key={task._id}
                                            draggable
                                            onDragStart={(e) => e.dataTransfer.setData('taskId', task._id)}
                                            className="cursor-move"
                                        >
                                            <TaskCard
                                                task={task}
                                                onClick={() => setActiveTask(task)}
                                            />
                                        </div>
                                    ))}

                                    <button onClick={() => setShowCreateModal(true)} className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase hover:text-primary transition-colors border-2 border-dashed border-transparent hover:border-primary/20 rounded-xl group/btn">
                                        <Plus className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                                        Add Issue
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTask && (
                <TaskDetailModal
                    task={activeTask}
                    onClose={() => setActiveTask(null)}
                    onUpdate={() => {
                        queryClient.invalidateQueries({ queryKey: ['kanban'] });
                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                    }}
                />
            )}

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
};

export default SprintDashboard;
