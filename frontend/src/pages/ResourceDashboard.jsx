import React, { useState } from 'react';
import * as ReactQuery from '@tanstack/react-query';
import {
    Users, Calendar, Clock, BarChart3, AlertCircle, Plus, ChevronLeft, ChevronRight, Loader2, Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api/axios';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const ResourceDashboard = () => {
    const { useQuery } = ReactQuery;
    const [weekOffset, setWeekOffset] = useState(0);

    const weekStart = React.useMemo(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff + (weekOffset * 7));
        d.setHours(0, 0, 0, 0);
        return d;
    }, [weekOffset]);

    const { data, isLoading } = useQuery({
        queryKey: ['resource-capacity', weekStart.toISOString()],
        queryFn: async () => {
            const res = await api.get('/resource/capacity', { params: { weekStart: weekStart.toISOString() } });
            return res.data.capacities;
        },
    });

    const safeData = data?.capacities || data?.data?.capacities || data?.data || data || [];
    const capacities = Array.isArray(safeData) ? safeData : [];

    const formatWeek = () => {
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 4);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 italic tracking-tight">Resource capacity</h1>
                    <p className="text-sm text-slate-400 mt-1">Track team allocation and available hours</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm font-bold text-slate-700 min-w-[120px] text-center">{formatWeek()}</span>
                    <button onClick={() => setWeekOffset(o => o + 1)} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-64">Team Member</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Allocated</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Available</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {capacities.map((cap) => {
                                const isOverbooked = cap.utilization > 100;
                                const isUnderutilized = cap.utilization < 50;

                                let barColor = 'bg-green-500';
                                if (isOverbooked) barColor = 'bg-red-500';
                                else if (isUnderutilized) barColor = 'bg-amber-400';

                                return (
                                    <tr key={cap.userId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                    {cap.user.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{cap.user.name}</p>
                                                    <p className="text-xs text-slate-400">{cap.user.role || 'Member'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center gap-1 justify-center">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className={cn("text-sm font-bold", isOverbooked ? "text-red-600" : "text-slate-700")}>
                                                    {cap.allocatedHours}h
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-700">{cap.availableHours}h</span>
                                            <div className="text-[10px] text-slate-400">of {cap.maxHours}h max</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-500", barColor)}
                                                        style={{ width: `${Math.min(cap.utilization, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold w-12",
                                                    isOverbooked ? "text-red-600" : isUnderutilized ? "text-amber-600" : "text-slate-600"
                                                )}>
                                                    {cap.utilization}%
                                                </span>
                                                {isOverbooked && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 items-start">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-900 leading-none mb-1">How capacity is calculated</h4>
                    <p className="text-xs text-blue-700">
                        Allocated hours are automatically derived from the "estimatedHours" or "storyPoints" of tasks assigned to users that fall within this week's start and end dates. Overbooked users (&gt;100% utilization) will be flagged in red.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResourceDashboard;
