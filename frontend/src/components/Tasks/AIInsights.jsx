import React from 'react';
import {
    BrainCircuit,
    TrendingDown,
    UserPlus,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { cn } from '../../lib/utils';

const AIInsights = ({ taskId }) => {
    const { data: suggestion } = useQuery({
        queryKey: ['ai-suggestion', taskId],
        queryFn: () => api.get(`/ai/suggest-assignee/${taskId}`),
    });

    const { data: risk } = useQuery({
        queryKey: ['ai-risk', taskId],
        queryFn: () => api.get(`/ai/predict-risk/${taskId}`),
    });

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
                        <span className="text-2xl font-black text-slate-900 italic">24%</span>
                        <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded">Low Risk</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">Predicted completion by target date is highly probable.</p>
                </div>

                {/* Suggestion */}
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UserPlus className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Smart Match</p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900 italic">Amit Mishra</span>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">92% match based on recent Node.js workload peaks.</p>
                </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4">
                <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                <p className="text-[11px] text-indigo-700 font-bold leading-relaxed italic">
                    AI detects a potential bottleneck in next week's review stage. Consider pre-assigning a second reviewer to maintain SLA compliance.
                </p>
            </div>
        </div>
    );
};

export default AIInsights;
