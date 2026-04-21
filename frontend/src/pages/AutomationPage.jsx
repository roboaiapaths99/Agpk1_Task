import React from 'react';
import {
    Zap,
    Trash2,
    Plus,
    Play,
    Settings2,
    Clock,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import RuleBuilder from '../components/Automation/RuleBuilder';

const AutomationPage = () => {
    const [showBuilder, setShowBuilder] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: rulesRaw, isLoading } = useQuery({
        queryKey: ['automation-rules'],
        queryFn: automationService.getRules,
    });

    const toggleRule = useMutation({
        mutationFn: ({ id, isActive }) => automationService.updateRule(id, { isActive: !isActive }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
    });

    const deleteRule = useMutation({
        mutationFn: (id) => automationService.deleteRule(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
    });

    const rulesData = rulesRaw?.data || rulesRaw || {};
    const rules = Array.isArray(rulesData?.rules) ? rulesData.rules
        : Array.isArray(rulesData) ? rulesData : [];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic underline decoration-primary/30 decoration-4 underline-offset-8">Automation Hub</h1>
                    <p className="text-slate-500 mt-2 font-medium">Design triggers and actions to streamline your operational workflows.</p>
                </div>

                <button
                    onClick={() => setShowBuilder(true)}
                    className="btn-primary px-8 py-3.5"
                >
                    <Plus className="w-5 h-5" />
                    Create New Rule
                </button>
            </div>

            {showBuilder ? (
                <RuleBuilder onCancel={() => setShowBuilder(false)} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {isLoading ? (
                        <div className="md:col-span-2 p-24 text-center animate-pulse italic text-slate-400 font-bold tracking-widest uppercase text-xs">Initializing rule engines...</div>
                    ) : rules.length === 0 ? (
                        <div className="md:col-span-2 glass-card py-32 flex flex-col items-center justify-center text-center border-dashed">
                            <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mb-8 border border-primary/10">
                                <Zap className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 italic">No active automations</h3>
                            <p className="text-slate-500 mt-3 max-w-sm font-medium">Automate repetitive tasks by creating your first rule. Triggers can be status changes, overdue tasks, or specific comments.</p>
                        </div>
                    ) : (
                        rules.map(rule => (
                            <div key={rule._id} className="glass-card p-8 flex items-start gap-8 group hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                                <div className={cn(
                                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-all duration-700 shadow-sm",
                                    rule.isActive ? "bg-primary text-white border-primary shadow-primary/20 scale-110" : "bg-slate-50 text-slate-300 border-slate-100"
                                )}>
                                    <Zap className={cn("w-8 h-8", rule.isActive && "animate-pulse")} />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-black text-slate-900 text-xl italic tracking-tight">{rule.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => deleteRule.mutate(rule._id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div
                                                onClick={() => toggleRule.mutate({ id: rule._id, isActive: rule.isActive })}
                                                className={cn(
                                                    "w-12 h-6 rounded-full relative cursor-pointer transition-all duration-500",
                                                    rule.isActive ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-slate-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-sm",
                                                    rule.isActive ? "right-1" : "left-1"
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        When <span className="font-black text-primary italic px-1.5 py-0.5 bg-primary/5 rounded-md">{rule.triggerEvent || rule.trigger}</span> occurs, {rule.actions?.[0]?.type === 'notify' ? 'then notify ' : 'then '}
                                        <span className="font-black text-slate-800 italic px-1.5 py-0.5 bg-slate-100 rounded-md">
                                            {rule.actions?.[0]?.type || rule.action}
                                        </span>.
                                    </p>

                                    <div className="flex items-center gap-6 mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {rule.executionCount || 0} Runs
                                        </div>
                                        {rule.isActive && (
                                            <div className="flex items-center gap-2 text-green-500">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Operational
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AutomationPage;
