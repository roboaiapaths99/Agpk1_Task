import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Bell, Mail, MessageSquare, Plus, Trash2, 
    Save, AlertTriangle, CheckCircle2, Info, ChevronRight,
    Settings, Shield, Clock, PlusCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { organizationService } from '../../../services/api/apiServices';
import { cn } from '../../../lib/utils';

const DunningSettings = () => {
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState({
        enabled: true,
        stages: []
    });

    const { data: orgData, isLoading } = useQuery({
        queryKey: ['organization'],
        queryFn: () => organizationService.get()
    });

    useEffect(() => {
        if (orgData?.data?.dunningSettings) {
            setSettings(orgData.data.dunningSettings);
        }
    }, [orgData]);

    const updateMutation = useMutation({
        mutationFn: (newSettings) => organizationService.update({ dunningSettings: newSettings }),
        onSuccess: () => {
            toast.success('Dunning settings updated');
            queryClient.invalidateQueries({ queryKey: ['organization'] });
        },
        onError: (err) => toast.error(err.message || 'Failed to update settings')
    });

    const handleToggle = () => {
        setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    const addStage = () => {
        const newStage = {
            daysAfterDue: settings.stages.length > 0 
                ? Math.max(...settings.stages.map(s => s.daysAfterDue)) + 7 
                : 1,
            action: 'remind',
            channels: ['email'],
            template: ''
        };
        setSettings(prev => ({
            ...prev,
            stages: [...prev.stages, newStage].sort((a, b) => a.daysAfterDue - b.daysAfterDue)
        }));
    };

    const removeStage = (index) => {
        setSettings(prev => ({
            ...prev,
            stages: prev.stages.filter((_, i) => i !== index)
        }));
    };

    const updateStage = (index, updates) => {
        setSettings(prev => ({
            ...prev,
            stages: prev.stages.map((s, i) => i === index ? { ...s, ...updates } : s)
        }));
    };

    const toggleChannel = (stageIndex, channel) => {
        const stage = settings.stages[stageIndex];
        const channels = stage.channels.includes(channel)
            ? stage.channels.filter(c => c !== channel)
            : [...stage.channels, channel];
        
        updateStage(stageIndex, { channels });
    };

    const handleSave = () => {
        updateMutation.mutate(settings);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-blue-600" />
                        Dunning Automation
                    </h1>
                    <p className="text-slate-500 mt-1">Configure automated payment reminders for overdue invoices.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleToggle}
                        className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2",
                            settings.enabled ? "bg-blue-600" : "bg-slate-200"
                        )}
                    >
                        <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            settings.enabled ? "translate-x-6" : "translate-x-1"
                        )} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {!settings.enabled && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-8">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-900">Automation Paused</p>
                        <p className="text-sm text-amber-700 mt-0.5">Automated reminders are currently disabled. No notifications will be sent to customers.</p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Reminder Stages</h3>
                                <p className="text-sm text-slate-500">Define the schedule and content for reminders.</p>
                            </div>
                        </div>
                        <button
                            onClick={addStage}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            <PlusCircle className="w-4 h-4 text-blue-600" />
                            Add Stage
                        </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {settings.stages.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-slate-300" />
                                </div>
                                <h4 className="text-slate-800 font-medium">No cycles configured</h4>
                                <p className="text-slate-500 text-sm mt-1">Click "Add Stage" to start building your dunning workflow.</p>
                            </div>
                        ) : (
                            settings.stages.map((stage, idx) => (
                                <div key={idx} className="p-6 hover:bg-slate-50/30 transition-colors group">
                                    <div className="flex items-start gap-6">
                                        <div className="flex-shrink-0 pt-1">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-grow space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Delay</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={stage.daysAfterDue}
                                                                onChange={(e) => updateStage(idx, { daysAfterDue: parseInt(e.target.value) })}
                                                                className="w-16 px-2 py-1 border border-slate-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                                            />
                                                            <span className="text-sm text-slate-600 font-medium">days after due</span>
                                                        </div>
                                                    </div>

                                                    <div className="h-10 w-px bg-slate-200 mx-2" />

                                                    <div className="flex flex-col">
                                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Severity</label>
                                                        <select
                                                            value={stage.action}
                                                            onChange={(e) => updateStage(idx, { action: e.target.value })}
                                                            className="px-2 py-1 border border-slate-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                        >
                                                            <option value="remind">Friendly Reminder</option>
                                                            <option value="warn">Strong Warning</option>
                                                            <option value="restrict">Service Restriction</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => removeStage(idx)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-medium text-slate-700">Channels:</span>
                                                    <div className="flex gap-2">
                                                        {[
                                                            { id: 'email', icon: Mail, label: 'Email' },
                                                            { id: 'slack', icon: MessageSquare, label: 'Slack' },
                                                            { id: 'in_app', icon: Bell, label: 'In-App' }
                                                        ].map(ch => (
                                                            <button
                                                                key={ch.id}
                                                                onClick={() => toggleChannel(idx, ch.id)}
                                                                className={cn(
                                                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
                                                                    stage.channels.includes(ch.id)
                                                                        ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                                                )}
                                                            >
                                                                <ch.icon className="w-3.5 h-3.5" />
                                                                {ch.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                                                        Message Template
                                                        <span className="text-[10px] text-slate-400 font-normal">Supports placeholders like {"{invoice_number}"}</span>
                                                    </label>
                                                    <textarea
                                                        value={stage.template}
                                                        onChange={(e) => updateStage(idx, { template: e.target.value })}
                                                        placeholder="Enter your reminder message here..."
                                                        rows={3}
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50/50 hover:bg-white transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110">
                        <Shield className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-400" />
                            Security & Logic
                        </h3>
                        <p className="text-slate-400 text-sm mt-2 max-w-lg">
                            Dunning cycles are executed every 24 hours at 2:00 AM UTC. 
                            Notifications are suppressed if an invoice is marked as "Paid" or "Cancelled" during the cycle.
                        </p>
                        <div className="mt-6 flex items-center gap-4">
                             <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-3">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Next Execution</span>
                                    <span className="text-sm font-medium">Tomorrow, 02:00 AM</span>
                                </div>
                             </div>
                             <div className="px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">System Status</span>
                                    <span className="text-sm font-medium text-emerald-400">Operational</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DunningSettings;
