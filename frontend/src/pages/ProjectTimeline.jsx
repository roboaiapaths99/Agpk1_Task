import React from 'react';
import * as ReactQuery from '@tanstack/react-query';
import {
    Calendar, ChevronLeft, ChevronRight, Plus, Layers, Folder, Users, Clock,
    Paperclip, X, Loader2, GitMerge, ShieldCheck
} from 'lucide-react';
import { projectService, taskService, attachmentService, guestService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import {
    format, addDays, addMonths, startOfDay, startOfWeek, startOfMonth,
    differenceInCalendarDays, getWeek, isWithinInterval
} from 'date-fns';
import CreateProjectModal from '../components/Project/CreateProjectModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import { toast } from 'react-hot-toast';
import PresenceAvatars from '../components/common/PresenceAvatars';

// ─── Helpers (Native fallbacks if needed, but using date-fns now) ────────────────
const diffDays = (a, b) => differenceInCalendarDays(a, b);

const getLabel = (d, type) => {
    if (type === 'Day') return format(d, 'EEE d');
    if (type === 'Week') return `${format(d, 'MMM d')} (W${getWeek(d)})`;
    if (type === 'Month') return format(d, 'MMM yy');
    return format(d, 'P');
};

const PRIORITY_COLORS = {
    critical: 'bg-rose-500', high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-sky-500', default: 'bg-slate-300'
};
const STATUS_BAR = {
    completed: 'bg-emerald-400/80 border-emerald-300',
    'in-progress': 'bg-blue-500/80 border-blue-400',
    review: 'bg-violet-500/80 border-violet-400',
    blocked: 'bg-rose-400/80 border-rose-300',
    default: 'bg-slate-400/60 border-slate-300',
};

const ProjectTimeline = () => {
    const { useQuery, useMutation, useQueryClient } = ReactQuery;
    const queryClient = useQueryClient();
    const [selectedProject, setSelectedProject] = React.useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [viewType, setViewType] = React.useState('Week');
    const [guestLink, setGuestLink] = React.useState(null);
    const [isGeneratingLink, setIsGeneratingLink] = React.useState(false);
    const [selectedTaskId, setSelectedTaskId] = React.useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
    const [offset, setOffset] = React.useState(0); // navigation offset

    const handleTaskClick = (taskId) => { setSelectedTaskId(taskId); setIsTaskModalOpen(true); };

    // ─── Data Fetching ───────────────────────────────────────────
    const { data: projectsRaw, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll(),
    });

    const projects = Array.isArray(projectsRaw?.projects) ? projectsRaw.projects
        : Array.isArray(projectsRaw?.data?.projects) ? projectsRaw.data.projects
            : Array.isArray(projectsRaw) ? projectsRaw : [];

    const { data: ganttRaw } = useQuery({
        queryKey: ['gantt', selectedProject?._id],
        queryFn: () => projectService.getGantt(selectedProject._id),
        enabled: !!selectedProject?._id,
    });

    const ganttTasks = Array.isArray(ganttRaw?.tasks) ? ganttRaw.tasks
        : Array.isArray(ganttRaw?.data?.tasks) ? ganttRaw.data.tasks
            : Array.isArray(ganttRaw) ? ganttRaw : [];

    const { data: timelineRaw } = useQuery({
        queryKey: ['timeline-view'],
        queryFn: () => taskService.getTimeline(),
        enabled: !selectedProject,
    });

    const timelineTasks = Array.isArray(timelineRaw?.tasks) ? timelineRaw.tasks
        : Array.isArray(timelineRaw?.data?.tasks) ? timelineRaw.data.tasks
            : Array.isArray(timelineRaw) ? timelineRaw : [];

    const { data: attachmentsRaw } = useQuery({
        queryKey: ['project-attachments', selectedProject?._id],
        queryFn: () => attachmentService.getByProject(selectedProject._id),
        enabled: !!selectedProject?._id,
    });

    const attachments = Array.isArray(attachmentsRaw?.attachments) ? attachmentsRaw.attachments
        : Array.isArray(attachmentsRaw?.data?.attachments) ? attachmentsRaw.data.attachments
            : Array.isArray(attachmentsRaw) ? attachmentsRaw : [];

    const uploadAttachment = useMutation({
        mutationFn: (formData) => attachmentService.upload(formData),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-attachments', selectedProject._id] }),
    });

    const deleteAttachment = useMutation({
        mutationFn: (id) => attachmentService.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-attachments', selectedProject._id] }),
    });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', selectedProject._id);
        uploadAttachment.mutate(formData);
    };

    const handleGenerateGuestLink = async () => {
        if (!selectedProject) return;
        setIsGeneratingLink(true);
        try {
            const response = await guestService.createLink(selectedProject._id);
            const token = response.data.token;
            setGuestLink(`${window.location.origin}/guest/${token}`);
        } catch (error) {
            console.error('Failed to generate guest link:', error);
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const displayTasks = selectedProject ? ganttTasks : timelineTasks;

    // ─── Timeline Date Math (proper) ─────────────────────────────
    const today = startOfDay(new Date());

    const getTimelineConfig = () => {
        const cfg = { columns: [], colWidth: 0, totalDays: 0, start: null, end: null };

        if (viewType === 'Day') {
            const start = addDays(today, offset * 14 - 2);
            const count = 14;
            for (let i = 0; i < count; i++) {
                const d = addDays(start, i);
                cfg.columns.push({ label: getLabel(d, 'Day'), date: d, isToday: diffDays(d, today) === 0 });
            }
            cfg.start = start;
            cfg.end = addDays(start, count);
            cfg.totalDays = count;
        } else if (viewType === 'Week') {
            const baseWeek = startOfWeek(today, { weekStartsOn: 1 });
            const start = addDays(baseWeek, offset * 8 * 7 - 7);
            const count = 8;
            for (let i = 0; i < count; i++) {
                const weekStart = addDays(start, i * 7);
                cfg.columns.push({
                    label: getLabel(weekStart, 'Week'),
                    date: weekStart,
                    isToday: isWithinInterval(today, { start: weekStart, end: addDays(weekStart, 6) })
                });
            }
            cfg.start = start;
            cfg.end = addDays(start, count * 7);
            cfg.totalDays = count * 7;
        } else { // Month
            const baseMonth = startOfMonth(today);
            const start = addMonths(baseMonth, offset * 6 - 1);
            const count = 6;
            for (let i = 0; i < count; i++) {
                const monthStart = addMonths(start, i);
                const isCurrentMonth = monthStart.getMonth() === today.getMonth() && monthStart.getFullYear() === today.getFullYear();
                cfg.columns.push({
                    label: getLabel(monthStart, 'Month'),
                    date: monthStart,
                    isToday: isCurrentMonth
                });
            }
            cfg.start = start;
            cfg.end = addMonths(start, count);
            cfg.totalDays = diffDays(addMonths(start, count), start);
        }
        return cfg;
    };

    const tl = getTimelineConfig();

    const getBarStyle = (task) => {
        const taskStart = task.startDate ? startOfDay(new Date(task.startDate)) : null;
        const taskEnd = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;

        if (!taskStart && !taskEnd) return null;

        const effectiveStart = taskStart || taskEnd;
        const effectiveEnd = taskEnd || addDays(effectiveStart, 1);

        const leftDays = diffDays(effectiveStart, tl.start);
        const widthDays = Math.max(1, diffDays(effectiveEnd, effectiveStart));

        const leftPct = Math.max(0, (leftDays / tl.totalDays) * 100);
        const widthPct = Math.max(2, (widthDays / tl.totalDays) * 100);

        return { left: `${leftPct}%`, width: `${Math.min(widthPct, 100 - leftPct)}%` };
    };

    const todayPct = (() => {
        const d = diffDays(today, tl.start);
        if (d < 0 || d > tl.totalDays) return null;
        return (d / tl.totalDays) * 100;
    })();

    // Reset offset when switching views
    React.useEffect(() => { setOffset(0); }, [viewType]);

    // ─── Render ──────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 rounded" />
                <div className="h-64 bg-slate-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Projects & Timeline</h1>
                        <PresenceAvatars 
                            resourceType={selectedProject ? "PROJECT" : "GLOBAL"} 
                            resourceId={selectedProject ? selectedProject._id : (projects[0]?.organizationId || 'timeline')} 
                        />
                    </div>
                    <p className="text-slate-500 mt-1">Visualize dependencies and delivery schedules.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedProject && (
                        <button
                            onClick={handleGenerateGuestLink}
                            disabled={isGeneratingLink}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                        >
                            {isGeneratingLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                            Share Preview
                        </button>
                    )}
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
            </div>

            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

            {guestLink && (
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">Secure Guest Link Generated</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{guestLink}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { navigator.clipboard.writeText(guestLink); toast.success('Copied!'); }}
                            className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:text-primary transition-all"
                        >Copy Link</button>
                        <button onClick={() => setGuestLink(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Project Cards */}
            {projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            onClick={() => setSelectedProject(selectedProject?._id === project._id ? null : project)}
                            className={cn(
                                "glass-card p-5 cursor-pointer transition-all hover:shadow-md group",
                                selectedProject?._id === project._id && "ring-2 ring-primary"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <Folder className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">{project.name}</h3>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{project.description || 'No description'}</p>
                            <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 font-bold uppercase">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {project.members?.length || 0} members</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {project.status || 'active'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════ GANTT CHART ═══════════════ */}
            <div className="glass-card overflow-hidden">
                {/* Chart Header with View Toggle + Nav */}
                <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 italic">
                        {selectedProject ? selectedProject.name + ' — Gantt View' : 'All Tasks Timeline'}
                    </h3>
                    <div className="flex items-center gap-3">
                        {/* Navigation */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setOffset(o => o - 1)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all"
                                title="Previous"
                            ><ChevronLeft className="w-4 h-4" /></button>
                            <button
                                onClick={() => setOffset(0)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest transition-all"
                            >Today</button>
                            <button
                                onClick={() => setOffset(o => o + 1)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all"
                                title="Next"
                            ><ChevronRight className="w-4 h-4" /></button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                            {['Day', 'Week', 'Month'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setViewType(v)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        v === viewType ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >{v}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart Body */}
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[900px]">
                        {/* Column Headers */}
                        <div className="flex border-b bg-slate-50/50">
                            <div className="w-56 shrink-0 p-3 border-r font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                                Task Name
                            </div>
                            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${tl.columns.length}, 1fr)` }}>
                                {tl.columns.map((col, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "p-3 text-center border-r last:border-r-0 font-bold text-[10px] uppercase tracking-tighter whitespace-nowrap",
                                            col.isToday ? 'text-primary bg-primary/5' : 'text-slate-400'
                                        )}
                                    >{col.label}</div>
                                ))}
                            </div>
                        </div>

                        {/* Task Rows */}
                        <div className="divide-y divide-slate-50 relative">
                            {displayTasks.length === 0 ? (
                                <div className="p-16 text-center text-slate-400 italic font-medium">
                                    {selectedProject ? 'No tasks in this project yet.' : 'No tasks scheduled. Create a project first!'}
                                </div>
                            ) : displayTasks.map((task, idx) => {
                                const barStyle = getBarStyle(task);
                                const statusClass = STATUS_BAR[task.status] || STATUS_BAR.default;
                                const prioColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.default;

                                return (
                                    <div key={task._id || idx} className="flex hover:bg-slate-50/80 transition-colors group h-12">
                                        {/* Task Name */}
                                        <div
                                            className="w-56 shrink-0 flex items-center gap-2.5 px-3 border-r cursor-pointer"
                                            onClick={() => handleTaskClick(task._id)}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full shrink-0", prioColor)} />
                                            <span className="text-xs font-bold text-slate-700 truncate group-hover:text-primary transition-colors">
                                                {task.title}
                                            </span>
                                        </div>
                                        {/* Bar Area */}
                                        <div className="flex-1 relative">
                                            {/* Today marker */}
                                            {todayPct !== null && (
                                                <div
                                                    className="absolute top-0 bottom-0 w-px bg-rose-400/40 z-10"
                                                    style={{ left: `${todayPct}%` }}
                                                />
                                            )}
                                            {barStyle && (
                                                <div
                                                    className={cn(
                                                        "absolute h-7 rounded-md border transition-all cursor-pointer hover:brightness-110 hover:shadow-md active:scale-[0.99]",
                                                        statusClass
                                                    )}
                                                    style={{
                                                        left: barStyle.left,
                                                        width: barStyle.width,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)'
                                                    }}
                                                    onClick={() => handleTaskClick(task._id)}
                                                    title={`${task.title}\n${task.startDate ? new Date(task.startDate).toLocaleDateString() : '?'} → ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '?'}`}
                                                >
                                                    <div className="flex items-center h-full px-2 overflow-hidden">
                                                        <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">{task.title}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Assets Section */}
            {selectedProject && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Paperclip className="w-5 h-5 text-primary" />
                            <h3 className="font-bold italic">Project Assets — {selectedProject.name}</h3>
                        </div>
                        <label className="btn-primary py-2 px-4 text-xs cursor-pointer">
                            <Plus className="w-4 h-4" /> Upload Document
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                    <div className="p-6">
                        {uploadAttachment.isPending && (
                            <div className="flex items-center gap-3 text-primary text-sm font-bold italic animate-pulse mb-6">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Transmitting encrypted asset...
                            </div>
                        )}
                        {attachments.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-slate-400 italic text-sm font-medium">No project-level documents found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {attachments.map((file) => (
                                    <div key={file._id} className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                                                <Paperclip className="w-4 h-4" />
                                            </div>
                                            <button
                                                onClick={() => deleteAttachment.mutate(file._id)}
                                                className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            ><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 truncate mb-1" title={file.originalName}>
                                            {file.originalName}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">
                                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt ?? Date.now()).toLocaleDateString()}
                                        </p>
                                        <a
                                            href={`/api/v1/attachments/download/${file._id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
                                        >View Asset</a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {isTaskModalOpen && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    isOpen={isTaskModalOpen}
                    onClose={() => { setIsTaskModalOpen(false); setSelectedTaskId(null); }}
                />
            )}
        </div>
    );
};

export default ProjectTimeline;
