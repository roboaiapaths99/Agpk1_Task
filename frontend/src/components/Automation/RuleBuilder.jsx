import React from 'react';
import {
    Plus,
    ArrowRight,
    ChevronDown,
    Trash2,
    Play,
    CheckCircle2,
    Circle,
    AlertCircle,
    Save,
    X,
    Zap,
    Cpu,
    Mail,
    Smartphone,
    Server,
    Settings2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { automationService } from '../../services/api/apiServices';
import { cn } from '../../lib/utils';

const BuilderCard = ({ title, children, icon: Icon, color }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden group hover:border-primary/20 transition-all">
        <div className={cn("p-4 border-b flex items-center gap-3", color)}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Icon className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-white text-xs uppercase tracking-[0.2em]">{title}</h4>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

const RuleBuilder = ({ onCancel }) => {
    const queryClient = useQueryClient();
    const [name, setName] = React.useState('');
    const [triggerEvent, setTriggerEvent] = React.useState('TASK_STATUS_CHANGED');
    const [actionType, setActionType] = React.useState('notify');
    const [config, setConfig] = React.useState({ email: '', message: '' });

    const createRule = useMutation({
        mutationFn: (data) => automationService.createRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
            onCancel();
        }
    });

    const handleSubmit = () => {
        if (!name.trim()) {
            toast.error('Please enter a rule name');
            return;
        }
        createRule.mutate({
            name,
            triggerEvent,
            actions: [{ type: actionType, config }],
            isActive: true
        });
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Untitled Automation Rule..."
                        className="bg-transparent border-none outline-none text-2xl font-black text-slate-800 italic placeholder:text-slate-300 w-96"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={createRule.isPending}
                        className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {createRule.isPending ? 'Publishing...' : 'Publish Rule'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 items-center">
                {/* Trigger */}
                <div className="lg:col-span-5">
                    <BuilderCard title="Trigger (When)" icon={Cpu} color="bg-primary">
                        <div className="space-y-4">
                            <div className="relative">
                                <select
                                    value={triggerEvent}
                                    onChange={(e) => setTriggerEvent(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-primary/10"
                                >
                                    <option value="TASK_STATUS_CHANGED">Task Status Changes</option>
                                    <option value="TASK_OVERDUE">Task Is Overdue</option>
                                    <option value="COMMENT_ADDED">Specific Comment Added</option>
                                    <option value="CHECKLIST_COMPLETED">Checklist Completed</option>
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Conditions (Optional)</p>
                                <button className="flex items-center gap-2 text-xs font-bold text-primary hover:gap-3 transition-all">
                                    <Plus className="w-4 h-4" /> Add Filter Logic
                                </button>
                            </div>
                        </div>
                    </BuilderCard>
                </div>

                {/* Arrow */}
                <div className="lg:col-span-1 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300">
                        <ArrowRight className="w-8 h-8" />
                    </div>
                </div>

                {/* Action */}
                <div className="lg:col-span-11">
                    <BuilderCard title="Action (Then)" icon={Server} color="bg-indigo-500">
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div
                                    onClick={() => setActionType('notify')}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer",
                                        actionType === 'notify' ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50 opacity-50"
                                    )}
                                >
                                    <Mail className={cn("w-6 h-6", actionType === 'notify' ? "text-primary" : "text-slate-300")} />
                                    <span className={cn("text-xs font-bold", actionType === 'notify' ? "text-primary" : "text-slate-400")}>Notification</span>
                                </div>
                                <div
                                    onClick={() => setActionType('change_status')}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer",
                                        actionType === 'change_status' ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50 opacity-50"
                                    )}
                                >
                                    <Settings2 className={cn("w-6 h-6", actionType === 'change_status' ? "text-primary" : "text-slate-300")} />
                                    <span className={cn("text-xs font-bold", actionType === 'change_status' ? "text-primary" : "text-slate-400")}>Change Status</span>
                                </div>
                                <div
                                    onClick={() => setActionType('assign_task')}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer",
                                        actionType === 'assign_task' ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50 opacity-50"
                                    )}
                                >
                                    <Cpu className={cn("w-6 h-6", actionType === 'assign_task' ? "text-primary" : "text-slate-300")} />
                                    <span className={cn("text-xs font-bold", actionType === 'assign_task' ? "text-primary" : "text-slate-400")}>Assign To</span>
                                </div>
                                <div
                                    onClick={() => setActionType('add_tag')}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer",
                                        actionType === 'add_tag' ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50 opacity-50"
                                    )}
                                >
                                    <Zap className={cn("w-6 h-6", actionType === 'add_tag' ? "text-primary" : "text-slate-300")} />
                                    <span className={cn("text-xs font-bold", actionType === 'add_tag' ? "text-primary" : "text-slate-400")}>Tag/Flag</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 space-y-4">
                                {actionType === 'notify' && (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Recipient (e.g., manager@corp.com)"
                                            value={config.email || ''}
                                            onChange={(e) => setConfig({ ...config, email: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                                        />
                                        <textarea
                                            placeholder="Message content..."
                                            value={config.message || ''}
                                            onChange={(e) => setConfig({ ...config, message: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none min-h-[100px] resize-none"
                                        />
                                    </>
                                )}
                                {actionType === 'change_status' && (
                                    <select
                                        value={config.status || 'completed'}
                                        onChange={(e) => setConfig({ ...config, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold appearance-none outline-none"
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                )}
                                {actionType === 'assign_task' && (
                                    <input
                                        type="text"
                                        placeholder="User ID or Email"
                                        value={config.assigneeId || ''}
                                        onChange={(e) => setConfig({ ...config, assigneeId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                                    />
                                )}
                                {actionType === 'add_tag' && (
                                    <input
                                        type="text"
                                        placeholder="Tag name (e.g., Urgent)"
                                        value={config.tag || ''}
                                        onChange={(e) => setConfig({ ...config, tag: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                                    />
                                )}
                            </div>
                        </div>
                    </BuilderCard>
                </div>
            </div>

            <div className="bg-indigo-900 rounded-[3rem] p-12 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-4xl font-black italic tracking-tight mb-2">Pro Tip: Multi-step Chains</h3>
                        <p className="text-indigo-200 font-medium max-w-xl">You can chain multiple actions to create complex approval workflows or automated dependency resolution paths.</p>
                    </div>
                    <button className="px-10 py-5 bg-white text-indigo-900 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm">
                        Browse Templates
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RuleBuilder;
