import React from 'react';
import {
    X, MessageSquare, CheckSquare, Activity, Info, User, Calendar,
    Paperclip, Plus, Send, Loader2, Trash2, Archive, Layers, Link as LinkIcon,
    GitMerge, Search, History, Clock, Sparkles, FileText, Image, Video, FileArchive, Link2, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { taskService, workflowService, attachmentService, commonService, projectService } from '../../services/api/apiServices';
import { cn } from '../../lib/utils';
import WorklogList from './WorklogList';
import { format } from 'date-fns';
import AIBreakdownModal from '../AI/AIBreakdownModal';

const TabButton = ({ active, icon: Icon, label, onClick, count }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-bold text-sm",
            active ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
        )}
    >
        <Icon className="w-4 h-4" />
        {label}
        {count > 0 && <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{count}</span>}
    </button>
);

const STATUS_OPTIONS = ['open', 'in_progress', 'in_review', 'completed', 'blocked'];

const TaskDetailModal = ({ task: initialTask, taskId, onClose, onUpdate, isOpen }) => {
    const queryClient = useQueryClient();
    const [currentTaskId, setCurrentTaskId] = React.useState(taskId || initialTask?._id);
    const [taskIdHistory, setTaskIdHistory] = React.useState([]);

    React.useEffect(() => {
        if (isOpen) {
            setCurrentTaskId(taskId || initialTask?._id);
            setTaskIdHistory([]);
        }
    }, [isOpen, taskId, initialTask]);

    const handleNavigateToTask = (id) => {
        setTaskIdHistory(prev => [...prev, currentTaskId]);
        setCurrentTaskId(id);
    };

    const handleNavigateBack = () => {
        setTaskIdHistory(prev => {
            const copy = [...prev];
            const prevId = copy.pop();
            if (prevId) {
                setCurrentTaskId(prevId);
            }
            return copy;
        });
    };

    const [activeTab, setActiveTab] = React.useState('details');
    const [newComment, setNewComment] = React.useState('');
    const [newChecklistItem, setNewChecklistItem] = React.useState('');
    const [newChildText, setNewChildText] = React.useState({});
    const [subTaskForm, setSubTaskForm] = React.useState({
        title: '',
        assignee: '',
        priority: 'medium',
    });
    const [linkSearch, setLinkSearch] = React.useState('');
    const [linkType, setLinkType] = React.useState('is_blocked_by');
    const [linkSearchResults, setLinkSearchResults] = React.useState([]);
    const [isSearchingLinks, setIsSearchingLinks] = React.useState(false);
    const [showTransitionReason, setShowTransitionReason] = React.useState(false);
    const [pendingStatus, setPendingStatus] = React.useState(null);
    const [transitionReason, setTransitionReason] = React.useState('');
    const [editingTitle, setEditingTitle] = React.useState(false);
    const [title, setTitle] = React.useState(initialTask?.title || '');
    const [description, setDescription] = React.useState(initialTask?.description || '');
    const [issueType, setIssueType] = React.useState(initialTask?.issueType || 'task');
    const [storyPoints, setStoryPoints] = React.useState(initialTask?.storyPoints || '');
    const [startDate, setStartDate] = React.useState(initialTask?.startDate || '');
    const [dueDate, setDueDate] = React.useState(initialTask?.dueDate || '');
    const [isAIBreakdownOpen, setIsAIBreakdownOpen] = React.useState(false);
    const [showLinkForm, setShowLinkForm] = React.useState(false);
    const [linkUrl, setLinkUrl] = React.useState('');
    const [linkName, setLinkName] = React.useState('');

    // ─── Queries ────────────────────────────────────────────
    const { data: fetchedTaskRaw, isLoading: isTaskLoading } = useQuery({
        queryKey: ['task-detail', currentTaskId],
        queryFn: () => taskService.getById(currentTaskId),
        enabled: !!currentTaskId,
    });

    const task = fetchedTaskRaw?.task || fetchedTaskRaw?.data?.task || fetchedTaskRaw?.data || initialTask;

    const { data: projectMembersRaw } = useQuery({
        queryKey: ['project-members', task?.project?._id || task?.project],
        queryFn: () => projectService.getMembers(task?.project?._id || task?.project),
        enabled: !!(task?.project?._id || task?.project),
    });

    const projectMembers = Array.isArray(projectMembersRaw?.members) ? projectMembersRaw.members
        : Array.isArray(projectMembersRaw?.data?.members) ? projectMembersRaw.data.members
            : Array.isArray(projectMembersRaw?.data) ? projectMembersRaw.data : [];

    React.useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setIssueType(task.issueType || 'task');
            setStoryPoints(task.storyPoints || '');
            setStartDate(task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '');
            setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
        }
    }, [task]);

    // ─── Queries ────────────────────────────────────────────
    const { data: commentsRaw } = useQuery({
        queryKey: ['comments', currentTaskId],
        queryFn: () => taskService.getComments(currentTaskId),
        enabled: !!currentTaskId && activeTab === 'comments',
    });

    const { data: checklistsRaw } = useQuery({
        queryKey: ['checklists', currentTaskId],
        queryFn: () => taskService.getChecklists(currentTaskId),
        enabled: !!currentTaskId && activeTab === 'checklist',
    });

    const { data: activityRaw } = useQuery({
        queryKey: ['activity', currentTaskId],
        queryFn: () => workflowService.getHistory(currentTaskId),
        enabled: !!currentTaskId && activeTab === 'activity',
    });

    const { data: subtasksRaw } = useQuery({
        queryKey: ['subtasks', currentTaskId],
        queryFn: () => taskService.getSubTasks(currentTaskId),
        enabled: !!currentTaskId && activeTab === 'subtasks',
    });

    const { data: attachmentsRaw } = useQuery({
        queryKey: ['attachments', currentTaskId],
        queryFn: () => attachmentService.getByTask(currentTaskId),
        enabled: !!currentTaskId && activeTab === 'attachments',
    });

    const comments = Array.isArray(commentsRaw?.comments) ? commentsRaw.comments
        : Array.isArray(commentsRaw?.data?.comments) ? commentsRaw.data.comments
            : Array.isArray(commentsRaw?.data) ? commentsRaw.data : [];

    const checklists = Array.isArray(checklistsRaw?.checklists) ? checklistsRaw.checklists
        : Array.isArray(checklistsRaw?.data?.checklists) ? checklistsRaw.data.checklists
            : Array.isArray(checklistsRaw?.data) ? checklistsRaw.data : [];

    const activities = Array.isArray(activityRaw?.history) ? activityRaw.history
        : Array.isArray(activityRaw?.data?.history) ? activityRaw.data.history
            : Array.isArray(activityRaw?.data) ? activityRaw.data : [];

    const attachments = Array.isArray(attachmentsRaw?.attachments) ? attachmentsRaw.attachments
        : Array.isArray(attachmentsRaw?.data?.attachments) ? attachmentsRaw.data.attachments
            : Array.isArray(attachmentsRaw?.data) ? attachmentsRaw.data : [];

    const subtasks = Array.isArray(subtasksRaw?.subTasks) ? subtasksRaw.subTasks
        : Array.isArray(subtasksRaw?.data?.subTasks) ? subtasksRaw.data.subTasks
            : Array.isArray(subtasksRaw?.data) ? subtasksRaw.data : [];

    // ─── Mutations ──────────────────────────────────────────
    const { data: projectWorkflow } = useQuery({
        queryKey: ['workflow', task?.workflowId],
        queryFn: async () => {
            const res = await workflowService.getById(task.workflowId);
            return res.workflow || res.data?.workflow || res;
        },
        enabled: !!task?.workflowId
    });

    const updateTask = useMutation({
        mutationFn: (data) => taskService.update(task?._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            queryClient.invalidateQueries({ queryKey: ['recent-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task-detail', taskId || initialTask?._id] });
            onUpdate?.();
        },
    });

    const addComment = useMutation({
        mutationFn: (content) => taskService.addComment(task?._id, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', task?._id] });
            setNewComment('');
        },
    });

    const addChecklist = useMutation({
        mutationFn: (data) => taskService.addChecklist(task?._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists', task?._id] });
            setNewChecklistItem('');
        },
    });

    const addSubTask = useMutation({
        mutationFn: (data) => taskService.createSubTask(task._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subtasks', task._id] });
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            setSubTaskForm({ title: '', assignee: '', priority: 'medium' });
            toast.success('Sub-task created');
        },
        onError: () => toast.error('Failed to create sub-task')
    });


    const addLink = useMutation({
        mutationFn: (data) => taskService.addDependency(task._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            onUpdate?.();
            setLinkSearch('');
            setLinkSearchResults([]);
        },
    });

    const removeLink = useMutation({
        mutationFn: (data) => taskService.removeDependency(task._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            onUpdate?.();
        },
    });

    const changeStatus = useMutation({
        mutationFn: ({ status, reason }) => taskService.changeStatus(task._id, status, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            onUpdate?.();
            setShowTransitionReason(false);
            setTransitionReason('');
            setPendingStatus(null);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || 'Transition blocked by workflow rules';
            toast.error(msg, { duration: 4000 });
        },
    });

    const uploadAttachment = useMutation({
        mutationFn: (formData) => attachmentService.upload(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', task._id] });
        },
    });

    const addLinkAttachment = useMutation({
        mutationFn: ({ url, filename }) => attachmentService.addLink(task._id, url, filename),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', task._id] });
            setShowLinkForm(false);
            setLinkUrl('');
            setLinkName('');
            toast.success('Link attached successfully!');
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || 'Failed to attach link';
            toast.error(msg);
        }
    });

    const deleteTask = useMutation({
        mutationFn: () => taskService.delete(task._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            onClose();
        },
    });

    const archiveTask = useMutation({
        mutationFn: () => taskService.update(task._id, { archived: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            onClose();
        },
    });

    const deleteAttachment = useMutation({
        mutationFn: (id) => attachmentService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', task._id] });
        },
    });

    const handleSaveTitle = () => {
        if (title.trim() && title !== task.title) {
            updateTask.mutate({ title: title.trim() });
        }
        setEditingTitle(false);
    };

    const handleSaveDescription = () => {
        if (description !== task.description) {
            updateTask.mutate({ description });
        }
    };

    const handleTrackTask = () => {
        const event = new CustomEvent('TRACK_TASK', { detail: task });
        window.dispatchEvent(event);
    };

    const handleStatusChange = (newStatus) => {
        const transition = projectWorkflow?.transitions?.find(t => t.from === task.status && t.to === newStatus);
        if (transition?.requiresComment) {
            setPendingStatus(newStatus);
            setShowTransitionReason(true);
        } else {
            changeStatus.mutate({ status: newStatus });
        }
    };

    const confirmStatusChange = () => {
        if (pendingStatus) {
            changeStatus.mutate({ status: pendingStatus, reason: transitionReason });
        }
    };

    const handleSaveIssueType = (val) => {
        setIssueType(val);
        updateTask.mutate({ issueType: val });
    };

    const handleSaveStoryPoints = () => {
        const val = parseInt(storyPoints);
        if (!isNaN(val) && val !== task.storyPoints) {
            updateTask.mutate({ storyPoints: val });
        }
    };

    const handleSaveStartDate = (val) => {
        setStartDate(val);
        updateTask.mutate({ startDate: val || null });
    };

    const handleSaveDueDate = (val) => {
        setDueDate(val);
        updateTask.mutate({ dueDate: val || null });
    };

    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        addComment.mutate(newComment.trim());
    };

    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim()) return;

        try {
            if (checklists.length > 0) {
                // Add to first existing checklist
                await taskService.addChecklistItem(checklists[0]._id, { title: newChecklistItem.trim() });
            } else {
                // Create new checklist
                await addChecklist.mutateAsync({ title: 'Checklist', items: [{ title: newChecklistItem.trim() }] });
            }
            queryClient.invalidateQueries({ queryKey: ['checklists', task._id] });
            setNewChecklistItem('');
            toast.success('Checklist item added');
        } catch (err) {
            toast.error('Failed to add checklist item');
        }
    };


    const handleToggleChecklistItem = async (checklistId, itemId, completed) => {
        try {
            await taskService.updateChecklistItem(checklistId, itemId, { completed: !completed });
            queryClient.invalidateQueries({ queryKey: ['checklists', task._id] });
        } catch (err) {
            toast.error('Failed to update checklist item');
        }
    };

    const handleAssignChecklistItem = async (checklistId, itemId, assigneeId) => {
        try {
            await taskService.updateChecklistItem(checklistId, itemId, { assignee: assigneeId || null });
            queryClient.invalidateQueries({ queryKey: ['checklists', task._id] });
            toast.success('Assignee updated');
        } catch (err) {
            toast.error('Failed to update assignee');
        }
    };

    const handleDeleteChecklistItem = async (checklistId, itemId) => {
        try {
            await taskService.deleteChecklistItem(checklistId, itemId);
            queryClient.invalidateQueries({ queryKey: ['checklists', task._id] });
            toast.success('Checklist item deleted');
        } catch (err) {
            toast.error('Failed to delete checklist item');
        }
    };

    const handleDeleteChecklist = async (checklistId) => {
        try {
            await taskService.deleteChecklist(checklistId);
            queryClient.invalidateQueries({ queryKey: ['checklists', task._id] });
            toast.success('Checklist deleted');
        } catch (err) {
            toast.error('Failed to delete checklist');
        }
    };

    const handleToggleChecklistChild = async (checklist, item, childIdx, completed) => {
        try {
            const updatedChildren = item.children.map((child, idx) => 
                idx === childIdx ? { ...child, completed } : child
            );
            await taskService.updateChecklistItem(checklist._id, item._id, { children: updatedChildren });
            queryClient.invalidateQueries({ queryKey: ['checklists', task._id] });
        } catch (err) {
            toast.error('Failed to update sub-item');
        }
    };

    const handleAddChecklistChild = async (checklist, item, title) => {
        if (!title.trim()) return;
        try {
            const updatedChildren = [...(item.children || []), { title: title.trim(), completed: false }];
            await taskService.updateChecklistItem(checklist._id, item._id, { children: updatedChildren });
            queryClient.invalidateQueries({ queryKey: ['checklists', task._id] });
            toast.success('Sub-item added');
        } catch (err) {
            toast.error('Failed to add sub-item');
        }
    };


    const handleAddSubTask = (e) => {
        e.preventDefault();
        if (!subTaskForm.title.trim()) return;
        addSubTask.mutate({
            title: subTaskForm.title.trim(),
            priority: subTaskForm.priority,
            ...(subTaskForm.assignee && { assignee: subTaskForm.assignee }),
        });
    };

    const handleLinkSearch = async (val) => {
        setLinkSearch(val);
        if (val.length < 2) {
            setLinkSearchResults([]);
            return;
        }
        setIsSearchingLinks(true);
        try {
            const res = await commonService.search(val);
            const results = (res.data?.results || []).filter(item => item._id !== task._id);
            setLinkSearchResults(results);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearchingLinks(false);
        }
    };

    const handleAddLink = (targetTaskId) => {
        addLink.mutate({ targetTaskId, type: linkType });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', task._id);
        uploadAttachment.mutate(formData);
    };

    const calculateProgress = (checklist) => {
        if (!checklist.items || checklist.items.length === 0) return 0;
        const completed = checklist.items.filter(item => item.completed).length;
        return Math.round((completed / checklist.items.length) * 100);
    };

    if (!task) return null;

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

                <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="p-6 border-b flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {taskIdHistory.length > 0 && (
                                <button
                                    onClick={handleNavigateBack}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors mr-1 shrink-0"
                                    title="Go back to parent task"
                                >
                                    <ArrowLeft className="w-4.5 h-4.5" />
                                </button>
                            )}
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest shrink-0">
                                {task.key || `T-${task._id?.slice(-3)}`}
                            </span>
                            {editingTitle ? (
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                                    className="text-xl font-bold text-slate-900 italic flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-primary/20"
                                    autoFocus
                                />
                            ) : (
                                <h2
                                    className="text-xl font-bold text-slate-900 italic truncate cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => setEditingTitle(true)}
                                >
                                    {task.title}
                                </h2>
                            )}

                            {/* Status Dropdown */}
                            <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={cn(
                                    "text-xs font-bold uppercase px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer",
                                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                            task.status === 'in_review' ? 'bg-purple-100 text-purple-700' :
                                                task.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                )}
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={() => window.confirm('Archive this task?') && archiveTask.mutate()}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-orange-500 transition-all"
                                title="Archive Task"
                            >
                                <Archive className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => window.confirm('Permanently delete this task?') && deleteTask.mutate()}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                                title="Delete Task"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="w-px h-6 bg-slate-100 mx-2" />
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b bg-slate-50/50 overflow-x-auto">
                        <TabButton active={activeTab === 'details'} icon={Info} label="Details" onClick={() => setActiveTab('details')} />
                        <TabButton active={activeTab === 'subtasks'} icon={Layers} label="Sub-tasks" onClick={() => setActiveTab('subtasks')} count={subtasks.length} />
                        <TabButton active={activeTab === 'links'} icon={LinkIcon} label="Links" onClick={() => setActiveTab('links')} count={task.dependencies?.length || 0} />
                        <TabButton active={activeTab === 'comments'} icon={MessageSquare} label="Comments" onClick={() => setActiveTab('comments')} count={comments.length} />
                        <TabButton active={activeTab === 'checklist'} icon={CheckSquare} label="Checklist" onClick={() => setActiveTab('checklist')} />
                        <TabButton active={activeTab === 'worklogs'} icon={Clock} label="Worklogs" onClick={() => setActiveTab('worklogs')} />
                        <TabButton active={activeTab === 'attachments'} icon={Paperclip} label="Attachments" onClick={() => setActiveTab('attachments')} count={attachments.length} />
                        <TabButton active={activeTab === 'git'} icon={GitMerge} label="Development" onClick={() => setActiveTab('git')} count={(task.linkedCommits?.length || 0) + (task.linkedPRs?.length || 0)} />
                        <TabButton active={activeTab === 'activity'} icon={Activity} label="Activity" onClick={() => setActiveTab('activity')} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {/* ─── Details ─────────────────────────────── */}
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2 space-y-8">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h4>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={handleSaveDescription}
                                            placeholder="Add a description..."
                                            rows={8}
                                            className="w-full text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Issue Type</h4>
                                        <select
                                            value={issueType}
                                            onChange={(e) => handleSaveIssueType(e.target.value)}
                                            className="w-full text-xs font-bold uppercase px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="task">Task</option>
                                            <option value="bug">Bug</option>
                                            <option value="story">Story</option>
                                            <option value="epic">Epic</option>
                                        </select>
                                    </div>

                                    {issueType === 'epic' && (
                                        <div className="pt-2">
                                            <button
                                                onClick={() => setIsAIBreakdownOpen(true)}
                                                className="w-full py-3 bg-primary/10 text-primary rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all group"
                                            >
                                                <Sparkles className="w-4 h-4 animate-pulse group-hover:animate-none" />
                                                AI Epic Breakdown
                                            </button>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Story Points</h4>
                                        <input
                                            type="number"
                                            value={storyPoints}
                                            onChange={(e) => setStoryPoints(e.target.value)}
                                            onBlur={handleSaveStoryPoints}
                                            placeholder="0"
                                            className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Priority</h4>
                                        <span className={cn(
                                            "text-xs font-bold uppercase px-3 py-1.5 rounded-lg",
                                            task.priority === 'critical' ? 'bg-red-100 text-red-600' :
                                                task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                                    task.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                        )}>
                                            {task.priority || 'Medium'}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Assignee</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                                                {(task.assignee?.name || 'NA').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{task.assignee?.name || 'Unassigned'}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight">{task.assignee?.role || ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Start Date</h4>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => handleSaveStartDate(e.target.value)}
                                                className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Due Date</h4>
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => handleSaveDueDate(e.target.value)}
                                                className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <button
                                            onClick={handleTrackTask}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10 hover:shadow-primary/20 active:scale-95"
                                        >
                                            <Clock className="w-4 h-4" />
                                            Track Execution
                                        </button>
                                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase mt-3 tracking-tighter">
                                            Current total: <span className="text-slate-900 italic">{(task.actualHours || 0).toFixed(1)}h</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Worklogs ────────────────────────────── */}
                        {activeTab === 'worklogs' && (
                            <div className="max-w-2xl mx-auto">
                                <WorklogList taskId={task._id} />
                            </div>
                        )}

                        {/* ─── Sub-tasks ───────────────────────────── */}
                        {activeTab === 'subtasks' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h4 className="font-bold text-slate-800 italic">Child Issues</h4>
                                </div>

                                <form onSubmit={handleAddSubTask} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={subTaskForm.title}
                                            onChange={(e) => setSubTaskForm({ ...subTaskForm, title: e.target.value })}
                                            placeholder="Subtask summary / what needs to be done?"
                                            className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3 items-center justify-between">
                                        <div className="flex gap-4 items-center">
                                            {/* Assignee select */}
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-500 font-bold">Assignee:</span>
                                                <select
                                                    value={subTaskForm.assignee}
                                                    onChange={(e) => setSubTaskForm({ ...subTaskForm, assignee: e.target.value })}
                                                    className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-semibold focus:ring-1 focus:ring-primary/20 outline-none"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {projectMembers.map(u => (
                                                        <option key={u._id} value={u._id}>{u.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Priority select */}
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-500 font-bold">Priority:</span>
                                                <select
                                                    value={subTaskForm.priority}
                                                    onChange={(e) => setSubTaskForm({ ...subTaskForm, priority: e.target.value })}
                                                    className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-semibold focus:ring-1 focus:ring-primary/20 outline-none"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                    <option value="critical">Critical</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={addSubTask.isPending || !subTaskForm.title.trim()}
                                            className="px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {addSubTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                            Create Subtask
                                        </button>
                                    </div>
                                </form>

                                {subtasks.length === 0 ? (
                                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                        <p className="text-slate-400 italic text-sm">No sub-tasks yet. Break this task down into smaller parts.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {subtasks.map((st) => (
                                            <div 
                                                key={st._id} 
                                                onClick={() => handleNavigateToTask(st._id)}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/30 hover:bg-slate-50 cursor-pointer transition-all group shadow-sm"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        st.status === 'completed' ? "bg-green-500" : "bg-blue-500"
                                                    )} />
                                                    <div className="min-w-0">
                                                        <p className={cn("text-sm font-bold text-slate-900 truncate", st.status === 'completed' && "text-slate-400 line-through")}>
                                                            {st.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                                {st.key || `T-${st._id?.slice(-3)}`}
                                                            </span>
                                                            <span className="text-[10px] text-slate-300">•</span>
                                                            <span className="text-[10px] font-bold text-slate-500 italic">
                                                                {st.assignee?.name || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                                        st.priority === 'critical' ? 'bg-red-50 text-red-600' :
                                                            st.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                                                st.priority === 'medium' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                                                    )}>
                                                        {st.priority || 'medium'}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                                        st.status === 'completed' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                                                    )}>
                                                        {st.status?.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── Links ─────────────────────────────── */}
                        {activeTab === 'links' && (
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Link Issue</h4>
                                    <div className="flex gap-3">
                                        <select
                                            value={linkType}
                                            onChange={(e) => setLinkType(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="is_blocked_by">is blocked by</option>
                                            <option value="blocks">blocks</option>
                                            <option value="relates_to">relates to</option>
                                        </select>
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={linkSearch}
                                                onChange={(e) => handleLinkSearch(e.target.value)}
                                                placeholder="Search by key or title..."
                                                className="w-full bg-white border border-slate-200 rounded-xl px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

                                            {/* Search Results Dropdown */}
                                            {linkSearchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-sm max-h-60 overflow-y-auto">
                                                    {linkSearchResults.map((res) => (
                                                        <button
                                                            key={res._id}
                                                            onClick={() => handleAddLink(res._id)}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-none flex items-center justify-between group"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-900 truncate italic">{res.title}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{res.key}</p>
                                                            </div>
                                                            <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Links</h4>
                                    {(!task.dependencies || task.dependencies.length === 0) ? (
                                        <p className="text-center text-slate-400 italic py-8 border-2 border-dashed border-slate-100 rounded-3xl">This task has no explicit links.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {task.dependencies.map((dep, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/30 transition-all group shadow-sm">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                            <GitMerge className="w-5 h-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{dep.type?.replace(/_/g, ' ')}</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{dep.task?.key}</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-900 truncate italic">{dep.task?.title}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                                            dep.task?.status === 'completed' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                                                        )}>
                                                            {dep.task?.status?.replace(/_/g, ' ')}
                                                        </span>
                                                        <button
                                                            onClick={() => removeLink.mutate({ targetTaskId: dep.task?._id, type: dep.type })}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── Comments ────────────────────────────── */}
                        {activeTab === 'comments' && (
                            <div className="space-y-6 max-w-2xl mx-auto">
                                {comments.length === 0 ? (
                                    <p className="text-center text-slate-400 italic py-8">No comments yet. Start the conversation!</p>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map((comment) => (
                                            <div key={comment._id} className="flex gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-[11px]">
                                                    {(comment.author?.name || 'U').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-xs font-bold text-slate-900 italic">{comment.author?.name || 'User'}</p>
                                                        <p className="text-[10px] text-slate-400">{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</p>
                                                    </div>
                                                    <p className="text-sm text-slate-700">{comment.content || comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={handleSubmitComment} className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3 px-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                                    />
                                    <button
                                        type="submit"
                                        disabled={addComment.isPending || !newComment.trim()}
                                        className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {addComment.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ─── Checklist ───────────────────────────── */}
                        {activeTab === 'checklist' && (
                            <div className="max-w-xl mx-auto space-y-6">
                                {checklists.length === 0 ? (
                                    <p className="text-center text-slate-400 italic py-8">No checklists yet. Add one below.</p>
                                ) : (
                                    checklists.map((checklist) => (
                                        <div key={checklist._id} className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-slate-700">{checklist.title || 'Checklist'}</h4>
                                                    <span className="text-xs bg-slate-200 text-slate-650 px-2 py-0.5 rounded-full font-bold">
                                                        {calculateProgress(checklist)}%
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteChecklist(checklist._id)}
                                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Delete Checklist"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="bg-primary h-1.5 transition-all duration-300" 
                                                    style={{ width: `${calculateProgress(checklist)}%` }}
                                                />
                                            </div>

                                            <div className="space-y-2.5">
                                                {checklist.items?.map((item) => (
                                                    <div key={item._id} className="p-3.5 rounded-xl bg-white border border-slate-100 hover:border-primary/20 transition-all group shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleToggleChecklistItem(checklist._id, item._id, item.completed)}
                                                                className="w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center hover:border-primary transition-colors shrink-0"
                                                            >
                                                                {item.completed && <CheckSquare className="w-4 h-4 text-primary" />}
                                                            </button>
                                                            <span className={cn("text-sm font-semibold text-slate-800 flex-1 min-w-0 truncate", item.completed && "text-slate-400 line-through")}>
                                                                {item.title || item.text}
                                                            </span>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {/* Assignee select */}
                                                                <select
                                                                    value={item.assignee || ''}
                                                                    onChange={(e) => handleAssignChecklistItem(checklist._id, item._id, e.target.value)}
                                                                    className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 text-[10px] font-bold text-slate-650 focus:ring-1 focus:ring-primary/20 outline-none max-w-[120px]"
                                                                >
                                                                    <option value="">Unassigned</option>
                                                                    {projectMembers.map(u => (
                                                                        <option key={u._id} value={u._id}>{u.name}</option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    onClick={() => handleDeleteChecklistItem(checklist._id, item._id)}
                                                                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors"
                                                                    title="Delete item"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Sub-items (Children) list */}
                                                        {item.children && item.children.length > 0 && (
                                                            <div className="pl-8 mt-2 space-y-2 border-l-2 border-slate-100">
                                                                {item.children.map((child, childIdx) => (
                                                                    <div key={child._id || childIdx} className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleToggleChecklistChild(checklist, item, childIdx, !child.completed)}
                                                                            className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-primary transition-colors shrink-0"
                                                                        >
                                                                            {child.completed && <CheckSquare className="w-3 h-3 text-primary" />}
                                                                        </button>
                                                                        <span className={cn("text-xs font-semibold text-slate-605", child.completed && "text-slate-400 line-through")}>
                                                                            {child.title}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Add Sub-item Form */}
                                                        <div className="flex gap-2 pl-8 mt-2.5">
                                                            <input
                                                                type="text"
                                                                placeholder="Add sub-item..."
                                                                value={newChildText[item._id] || ''}
                                                                onChange={(e) => setNewChildText({ ...newChildText, [item._id]: e.target.value })}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleAddChecklistChild(checklist, item, newChildText[item._id] || '');
                                                                        setNewChildText({ ...newChildText, [item._id]: '' });
                                                                    }
                                                                }}
                                                                className="flex-1 bg-slate-50 border border-slate-150 rounded-lg py-1 px-2 text-[11px] font-medium outline-none focus:ring-1 focus:ring-primary/20"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    handleAddChecklistChild(checklist, item, newChildText[item._id] || '');
                                                                    setNewChildText({ ...newChildText, [item._id]: '' });
                                                                }}
                                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-650"
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}

                                <div className="flex gap-3 pt-4">
                                    <input
                                        type="text"
                                        value={newChecklistItem}
                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                        placeholder="Add checklist item..."
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <button
                                        onClick={handleAddChecklistItem}
                                        disabled={addChecklist.isPending}
                                        className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── Development (Git) ───────────────────── */}
                        {activeTab === 'git' && (
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Linked Commits</h4>
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">Automated Sync</span>
                                    </div>
                                    {(!task.linkedCommits || task.linkedCommits.length === 0) ? (
                                        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                                            <p className="text-slate-400 italic text-sm font-medium">No commits linked to this task yet.</p>
                                            <p className="text-[10px] text-slate-300 font-bold uppercase mt-2 tracking-widest">Tip: Include {task.key} in your commit message</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {task.linkedCommits.map((commit, idx) => (
                                                <div key={idx} className="flex flex-col p-5 rounded-2xl bg-white border border-slate-100 hover:border-primary/30 transition-all group shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest font-mono bg-primary/5 px-2 py-1 rounded-lg">
                                                            sha: {commit.hash?.slice(0, 7)}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">{new Date(commit.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 mb-2 leading-relaxed">{commit.message}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[8px] font-black">
                                                            {commit.author?.[0]?.toUpperCase()}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase italic">By {commit.author}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pull Requests</h4>
                                    {(!task.linkedPRs || task.linkedPRs.length === 0) ? (
                                        <p className="text-center text-slate-400 italic py-8 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">No pull requests linked.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {task.linkedPRs.map((pr, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/30 transition-all shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                                            <GitMerge className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 italic">#{pr.number} {pr.title}</p>
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                                                pr.status === 'merged' ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                                                            )}>
                                                                {pr.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <a href={pr.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-[10px] font-black uppercase tracking-tighter transition-colors">View on Git</a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── Activity ────────────────────────────── */}
                        {activeTab === 'activity' && (
                            <div className="max-w-2xl mx-auto space-y-4">
                                {activities.length === 0 ? (
                                    <p className="text-center text-slate-400 italic py-8">No activity recorded yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {activities.map((act, idx) => (
                                            <div key={act._id || idx} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                                    {idx < activities.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                                                </div>
                                                <div className="pb-4">
                                                    <p className="text-sm text-slate-700">
                                                        <span className="font-bold">{act.triggeredBy?.name || 'System'}</span>
                                                        {' '}changed status from <span className="font-black uppercase text-[10px] text-slate-400">{act.fromState}</span> to <span className="font-black uppercase text-[10px] text-primary">{act.toState}</span>
                                                    </p>
                                                    {act.reason && <p className="text-xs text-slate-400 mt-0.5 italic">Reason: {act.reason}</p>}
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        {act.createdAt ? new Date(act.createdAt).toLocaleString() : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── Attachments ─────────────────────────── */}
                        {activeTab === 'attachments' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h4 className="font-bold text-slate-800 italic">Task Assets</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowLinkForm(!showLinkForm)}
                                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                                        >
                                            <Link2 className="w-4 h-4" />
                                            {showLinkForm ? 'Cancel Link' : 'Add Link'}
                                        </button>
                                        <label className="btn-primary py-2 px-4 text-xs cursor-pointer flex items-center gap-2">
                                            <Paperclip className="w-4 h-4" />
                                            Attach File
                                            <input type="file" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </div>

                                {showLinkForm && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (!linkUrl.trim()) return;
                                            addLinkAttachment.mutate({ url: linkUrl.trim(), filename: linkName.trim() });
                                        }}
                                        className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4"
                                    >
                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attach a Link</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://example.com"
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Link text / description (optional)"
                                                value={linkName}
                                                onChange={(e) => setLinkName(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={addLinkAttachment.isPending}
                                            className="btn-primary py-2 px-6 text-xs flex items-center gap-2"
                                        >
                                            {addLinkAttachment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            Add Link
                                        </button>
                                    </form>
                                )}

                                {uploadAttachment.isPending && (
                                    <div className="flex items-center gap-3 text-primary text-sm font-bold italic animate-pulse">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading asset...
                                    </div>
                                )}

                                {attachments.length === 0 ? (
                                    <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                        <p className="text-slate-400 italic text-sm font-medium">No attachments yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {attachments.map((file) => {
                                            const isLink = file.type === 'link';
                                            const isImage = !isLink && file.mimetype?.startsWith('image/');
                                            const isVideo = !isLink && file.mimetype?.startsWith('video/');
                                            const isPdf = !isLink && file.mimetype?.includes('pdf');
                                            const isArchive = !isLink && (file.mimetype?.includes('zip') || file.mimetype?.includes('tar') || file.mimetype?.includes('rar'));

                                            // Determine correct icon
                                            let Icon = Paperclip;
                                            if (isLink) Icon = Link2;
                                            else if (isImage) Icon = Image;
                                            else if (isVideo) Icon = Video;
                                            else if (isPdf) Icon = FileText;
                                            else if (isArchive) Icon = FileArchive;

                                            return (
                                                <div key={file._id} className="glass-card p-4 border-slate-100 hover:border-primary/30 transition-all group flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={cn(
                                                                    "p-2 rounded-lg text-slate-500",
                                                                    isLink ? "bg-blue-50 text-blue-600" :
                                                                    isImage ? "bg-green-50 text-green-600" :
                                                                    isVideo ? "bg-purple-50 text-purple-600" : "bg-slate-100"
                                                                )}>
                                                                    <Icon className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-slate-900 truncate" title={file.originalName}>
                                                                        {file.originalName}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                                        {isLink ? 'Link' : `${(file.size / 1024).toFixed(1)} KB`} • {file.uploadedBy?.name || 'User'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => deleteAttachment.mutate(file._id)}
                                                                className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {/* Inline Video Player for video files */}
                                                        {isVideo && file._id && (
                                                            <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 bg-black">
                                                                <video
                                                                    src={`/api/attachments/download/${file._id}`}
                                                                    controls
                                                                    className="w-full max-h-[180px] object-contain"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Inline Image Preview for image files */}
                                                        {isImage && file._id && (
                                                            <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                                                <img
                                                                    src={`/api/attachments/download/${file._id}`}
                                                                    alt={file.originalName}
                                                                    className="w-full max-h-[180px] object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
                                                        {isLink ? (
                                                            <a
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                                                            >
                                                                Open Link <Link2 className="w-3 h-3" />
                                                            </a>
                                                        ) : (
                                                            <a
                                                                href={`/api/attachments/download/${file._id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                                            >
                                                                Download
                                                            </a>
                                                        )}
                                                        <span className="text-[10px] text-slate-300 font-bold">
                                                            {new Date(file.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Transition Reason Modal */}
            {showTransitionReason && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                            <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Transition Reason</h2>
                        <p className="text-sm text-slate-500 font-medium mb-6 italic">
                            This workflow transition ({task.status} → {pendingStatus}) requires a justification according to the project rules.
                        </p>
                        <textarea
                            value={transitionReason}
                            onChange={(e) => setTransitionReason(e.target.value)}
                            placeholder="Why is this change being made?"
                            className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:border-primary focus:ring-0 transition-all mb-6 resize-none"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowTransitionReason(false); setPendingStatus(null); }}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={!transitionReason.trim() || changeStatus.isPending}
                                className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                {changeStatus.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* AI Breakdown Modal */}
            <AIBreakdownModal
                isOpen={isAIBreakdownOpen}
                onClose={() => setIsAIBreakdownOpen(false)}
                epic={task}
                onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ['kanban'] });
                    queryClient.invalidateQueries({ queryKey: ['subtasks', task._id] });
                    onUpdate?.();
                }}
            />
        </>
    );
};

export default TaskDetailModal;
