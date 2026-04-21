import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GripVertical, MoreVertical, Play, ChevronDown, ChevronRight, Layers, Layout, Bookmark, CheckSquare, Bug, Zap } from 'lucide-react';
import { taskService, sprintService, projectService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';

const ISSUE_TYPE_ICONS = {
    story: { icon: Bookmark, color: 'text-green-500' },
    task: { icon: CheckSquare, color: 'text-blue-500' },
    bug: { icon: Bug, color: 'text-red-500' },
    epic: { icon: Zap, color: 'text-purple-500' },
};

const BacklogItem = ({ task, onSelect }) => {
    const type = ISSUE_TYPE_ICONS[task.issueType?.toLowerCase()] || ISSUE_TYPE_ICONS.task;
    return (
        <div
            draggable
            onDragStart={(e) => e.dataTransfer.setData('taskId', task._id)}
            onClick={() => onSelect(task)}
            className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer group"
        >
            <div className="flex items-center gap-2 min-w-[100px]">
                <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                <type.icon className={cn("w-3.5 h-3.5", type.color)} />
                <span className="text-[10px] font-black text-slate-400 group-hover:text-primary transition-colors">{task.key || `T-${task._id?.slice(-3)}`}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">{task.title}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                    task.priority === 'critical' ? 'bg-red-50 text-red-500' :
                        task.priority === 'high' ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'
                )}>
                    {task.priority || 'medium'}
                </span>
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {task.assignee?.name?.substring(0, 2).toUpperCase() || '?'}
                </div>
            </div>
        </div>
    );
};

const SprintSection = ({ sprint, tasks, onAddTask, onSelectTask, onStartSprint }) => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
        <div
            className="glass-card overflow-hidden transition-all"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('taskId');
                onAddTask(taskId, sprint._id);
            }}
        >
            <div className="p-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <h3 className="font-bold text-slate-900 italic">{sprint.name}</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tasks.length} issues</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                        sprint.status === 'active' ? 'bg-green-50 text-green-500' : 'bg-slate-100 text-slate-400'
                    )}>
                        {sprint.status}
                    </span>
                    {sprint.status !== 'active' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onStartSprint(sprint._id); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:scale-105 transition-all"
                        >
                            <Play className="w-3 h-3 fill-current" />
                            Start Sprint
                        </button>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="p-2 space-y-2 min-h-[50px]">
                    {tasks.map(task => (
                        <BacklogItem key={task._id} task={task} onSelect={onSelectTask} />
                    ))}
                    {tasks.length === 0 && (
                        <div className="py-8 text-center text-slate-300 text-xs italic font-medium">Plan your issues here</div>
                    )}
                </div>
            )}
        </div>
    );
};

const Backlog = () => {
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

    const { data: tasksRaw, isLoading: tLoading } = useQuery({
        queryKey: ['tasks', selectedProject?._id],
        queryFn: () => taskService.getAll({ project: selectedProject?._id }),
        enabled: !!selectedProject?._id
    });

    const { data: sprintsRaw, isLoading: sLoading } = useQuery({
        queryKey: ['sprints', selectedProject?._id],
        queryFn: () => sprintService.getByProject(selectedProject?._id),
        enabled: !!selectedProject?._id
    });

    const safeTasks = tasksRaw?.tasks || tasksRaw?.data?.tasks || tasksRaw?.data || tasksRaw || [];
    const tasks = Array.isArray(safeTasks) ? safeTasks : [];
    const sprints = Array.isArray(sprintsRaw?.sprints) ? sprintsRaw.sprints
        : Array.isArray(sprintsRaw?.data) ? sprintsRaw.data
            : Array.isArray(sprintsRaw) ? sprintsRaw : [];

    const unassignedTasks = tasks.filter(t => !t.sprint);
    const sprintTasks = (sprintId) => tasks.filter(t => t.sprint?._id === sprintId || t.sprint === sprintId);

    const createSprintMutation = useMutation({
        mutationFn: () => sprintService.create({ name: `Sprint ${sprints.length + 1}`, projectId: selectedProject._id }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints', selectedProject?._id] })
    });

    const startSprintMutation = useMutation({
        mutationFn: (id) => sprintService.update(id, { status: 'active', startDate: new Date() }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sprints', selectedProject?._id] });
            queryClient.invalidateQueries({ queryKey: ['tasks', selectedProject?._id] });
        }
    });

    const addTaskToSprintMutation = useMutation({
        mutationFn: ({ taskId, sprintId }) => taskService.update(taskId, { sprint: sprintId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', selectedProject?._id] });
        }
    });

    const handleAddTaskToSprint = (taskId, sprintId) => {
        addTaskToSprintMutation.mutate({ taskId, sprintId });
    };


    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Backlog Management</h1>
                    <p className="text-slate-500 mt-1">Plan your upcoming engineering cycles.</p>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none ring-1 ring-slate-100 focus:ring-primary/20 transition-all"
                        value={selectedProject?._id}
                        onChange={(e) => setSelectedProject(projects.find(p => p._id === e.target.value))}
                    >
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <button
                        onClick={() => createSprintMutation.mutate()}
                        disabled={!selectedProject?._id || createSprintMutation.isPending}
                        className="btn-primary disabled:opacity-50"
                    >

                        <Plus className="w-4 h-4" />
                        Create Sprint
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Sprints */}
                <div className="space-y-4">
                    {sprints.map(s => (
                        <SprintSection
                            key={s._id}
                            sprint={s}
                            tasks={sprintTasks(s._id)}
                            onSelectTask={setActiveTask}
                            onStartSprint={(id) => startSprintMutation.mutate(id)}
                            onAddTask={handleAddTaskToSprint}
                        />
                    ))}

                </div>

                {/* Backlog */}
                <div className="glass-card overflow-hidden">
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Layers className="w-5 h-5 text-primary" />
                            <h3 className="font-bold italic">Backlog</h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unassignedTasks.length} issues</span>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        {tLoading ? (
                            <div className="py-20 text-center animate-pulse italic text-slate-400 font-bold">Fetching backlog items...</div>
                        ) : unassignedTasks.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-slate-400 text-sm font-bold italic">No items in backlog.</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 text-primary text-xs font-bold flex items-center gap-2 mx-auto hover:underline"
                                >
                                    <Plus className="w-4 h-4" /> Create Issue
                                </button>
                            </div>
                        ) : (
                            unassignedTasks.map(task => (
                                <BacklogItem
                                    key={task._id}
                                    task={task}
                                    onSelect={setActiveTask}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {activeTask && (
                <TaskDetailModal
                    task={activeTask}
                    onClose={() => setActiveTask(null)}
                    onUpdate={() => {
                        queryClient.invalidateQueries({ queryKey: ['tasks', selectedProject?._id] });
                    }}
                />
            )}

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                projectId={selectedProject?._id}
            />
        </div>
    );
};

export default Backlog;
