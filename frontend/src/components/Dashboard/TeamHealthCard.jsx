import React from 'react';
import {
    Heart,
    Zap,
    AlertTriangle,
    TrendingUp,
    ShieldCheck,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { aiService } from '../../services/api/apiServices';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';

const TeamHealthCard = () => {
    const { data: healthData, isLoading, refetch } = useQuery({
        queryKey: ['team-health'],
        queryFn: () => aiService.predictTeamHealth(),
    });

    if (isLoading) {
        return (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Analyzing Team Vitals...</p>
            </div>
        );
    }

    const health = healthData?.data || {};
    const isHealthy = health.overallHealth === 'Healthy';

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isHealthy ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                        <Heart className={cn("w-5 h-5", isHealthy && "animate-pulse")} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Team Vitals</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">AI-Driven Insight</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                        isHealthy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {health.overallHealth}
                    </span>
                </div>
            </div>

            <div className="p-8 flex-1 flex flex-col justify-center">
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-6xl font-black text-slate-900 tracking-tighter">
                        {health.moraleScore || 0}%
                    </span>
                    <TrendingUp className="w-6 h-6 text-green-500 mb-2 shrink-0" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Morale & Capacity Score</p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Velocity</span>
                        </div>
                        <p className="text-xl font-black text-slate-900">{health.velocity || 0.8}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Tasks / Day</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className={cn("w-3 h-3", health.burnoutRisk === 'High' ? 'text-red-500' : 'text-orange-500')} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Burnout Risk</span>
                        </div>
                        <p className="text-xl font-black text-slate-900 capitalize">{health.burnoutRisk || 'Low'}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Organization-wide</p>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-slate-50 mt-auto border-t border-slate-100 italic">
                <div className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        "{health.recommendation}"
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="w-full mt-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2"
                >
                    Recalculate Vitals
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

export default TeamHealthCard;
