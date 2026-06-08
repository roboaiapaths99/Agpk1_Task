import React from 'react';
import {
    BrainCircuit,
    TrendingDown,
    UserPlus,
    Sparkles,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { cn } from '../../lib/utils';

const AIInsights = ({ taskId }) => {
    const { data: suggestionRaw, isLoading: isSugLoading, isError: isSugError } = useQuery({
        queryKey: ['ai-suggestion', taskId],
        queryFn: () => api.get(`/ai/suggest-assignee/${taskId}`),
        retry: false
    });

    const { data: riskRaw, isLoading: isRiskLoading, isError: isRiskError } = useQuery({
        queryKey: ['ai-risk', taskId],
        queryFn: () => api.get(`/ai/predict-risk/${taskId}`),
        retry: false
    });

    if (isSugLoading || isRiskLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analyzing task with AI...</p>
            </div>
        );
    }

    const suggestion = suggestionRaw?.data;
    const risk = riskRaw?.data;

    const riskScore = risk?.riskScore !== undefined ? `${risk.riskScore}%` : 'N/A';
    const riskLevel = risk?.riskLevel || (risk?.risk !== undefined ? risk.risk : 'Unknown');
    const riskColor = riskLevel === 'low' ? 'text-green-500 bg-green-50' : 
                      riskLevel === 'medium' ? 'text-orange-500 bg-orange-50' :
                      riskLevel === 'high' ? 'text-red-500 bg-red-50' : 'text-slate-500 bg-slate-50';
    const riskDesc = risk?.factors && risk.factors.length > 0 
        ? risk.factors.join(', ')
        : 'Predicted completion risk by target date.';

    const suggestedName = suggestion?.name || 'Unassigned / Suggestion';
    const suggestionReason = suggestion?.reason || 'Smart match based on workload peaks and expertise.';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-black text-slate-800 italic uppercase text-xs tracking-widest">Neural Insights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk Score */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="w-12 h-12 text-red-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Predictor</p>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900 italic">{riskScore}</span>
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase", riskColor)}>{riskLevel} Risk</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">{riskDesc}</p>
                </div>

                {/* Suggestion */}
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UserPlus className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Smart Match</p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900 italic">{suggestedName}</span>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">{suggestionReason}</p>
                </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4">
                <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                <p className="text-[11px] text-indigo-700 font-bold leading-relaxed italic">
                    AI recommendation: Maintain assignee workload and verify subtasks sequence to keep within SLA compliance.
                </p>
            </div>
        </div>
    );
};

export default AIInsights;
