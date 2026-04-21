import React from 'react';
import {
    X,
    Sparkles,
    CheckCircle2,
    Plus,
    ChevronRight,
    Loader2,
    AlertCircle,
    Info
} from 'lucide-react';
import { aiService, taskService } from '../../services/api/apiServices';
import { cn } from '../../lib/utils';

const AIBreakdownModal = ({ isOpen, onClose, epic, onUpdate }) => {
    const [suggestions, setSuggestions] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectedTasks, setSelectedTasks] = React.useState([]);
    const [isCreating, setIsCreating] = React.useState(false);

    React.useEffect(() => {
        if (isOpen && epic) {
            fetchBreakdown();
        }
    }, [isOpen, epic]);

    const fetchBreakdown = async () => {
        setIsLoading(true);
        try {
            const res = await aiService.breakdownEpic(epic._id);
            setSuggestions(res.data.suggestions || []);
            setSelectedTasks(res.data.suggestions.map((_, i) => i)); // All selected by default
        } catch (error) {
            console.error('Failed to fetch AI breakdown:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTask = (index) => {
        setSelectedTasks(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleCreateTasks = async () => {
        setIsCreating(true);
        try {
            const tasksToCreate = suggestions.filter((_, i) => selectedTasks.includes(i));
            for (const task of tasksToCreate) {
                await taskService.create({
                    ...task,
                    project: epic.project,
                    parent: epic._id, // Link as sub-tasks
                    organizationId: epic.organizationId,
                    issueType: 'task'
                });
            }
            onUpdate?.();
            onClose();
        } catch (error) {
            console.error('Failed to create tasks:', error);
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="bg-slate-900 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">AI Epic Breakdown</h2>
                            <p className="text-slate-400 text-xs">Transforming <span className="text-white italic">{epic.title}</span> into actionable tasks.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-slate-500 font-medium animate-pulse italic">Analyzing objectives and suggesting sub-tasks...</p>
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Suggested Implementation Plan</h3>
                                <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                    {selectedTasks.length} SELECTED
                                </div>
                            </div>

                            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {suggestions.map((task, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleToggleTask(i)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                            selectedTasks.includes(i)
                                                ? "bg-primary/5 border-primary shadow-sm"
                                                : "bg-slate-50 border-transparent hover:border-slate-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            selectedTasks.includes(i)
                                                ? "bg-primary border-primary text-white"
                                                : "border-slate-300 bg-white"
                                        )}>
                                            {selectedTasks.includes(i) && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={cn(
                                                "font-bold text-sm truncate",
                                                selectedTasks.includes(i) ? "text-slate-900" : "text-slate-600"
                                            )}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                                    {task.priority} Priority
                                                </span>
                                                <span className="text-[10px] font-bold text-primary">
                                                    {task.storyPoints} Story Points
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                    These tasks will be created as **sub-tasks** of the current Epic. You can always refine them later in the backlog.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No suggestions found. Try adding more details to the Epic description.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateTasks}
                        disabled={selectedTasks.length === 0 || isCreating}
                        className="btn-primary px-8"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Create {selectedTasks.length} Tasks
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIBreakdownModal;
