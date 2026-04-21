import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, ChevronRight, BrainCircuit, TrendingUp } from 'lucide-react';
import { aiService, reportService } from '../../services/api/apiServices';
import { cn } from '../../lib/utils';

const AIInsightsPanel = () => {
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState(null);
    const [error, setError] = useState(null);

    const generateInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            // Gather context for AI
            const summary = await reportService.getDashboardSummary();
            const workload = await reportService.getWorkload();

            const context = {
                summary: summary?.data || summary,
                workload: workload?.data || workload
            };

            const prompt = `Analyze this project workload data and provide 3-4 professional, actionable strategic insights. 
            Focus on team health, SLA risks, and throughput trends. 
            Format the response as clear, bulleted insights with a short summary heading.
            Keep it professional and data-driven.`;

            const response = await aiService.generateContent(prompt, context);
            setInsights(response?.data || response);
        } catch (err) {
            console.error('AI Insights Error:', err);
            setError('Failed to generate strategic insights. Please ensure OpenAI is configured.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card overflow-hidden flex flex-col h-full bg-slate-900 border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500 rounded-lg">
                            <BrainCircuit className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white italic">Strategic Intelligence</h3>
                    </div>
                    <div className="badge-premium bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                        Enterprise AI
                    </div>
                </div>
                <p className="text-slate-400 text-xs">AI-powered workload analysis and risk detection.</p>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 relative overflow-y-auto custom-scrollbar min-h-[300px]">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900/50 backdrop-blur-sm z-10 transition-opacity">
                        <div className="relative mb-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <Sparkles className="w-5 h-5 text-purple-400 absolute top-0 right-0 animate-pulse" />
                        </div>
                        <h4 className="text-white font-bold mb-2">Synthesizing Data...</h4>
                        <p className="text-slate-400 text-xs max-w-[200px]">
                            Analyzing team throughput, SLA compliance, and potential bottlenecks.
                        </p>
                    </div>
                ) : insights ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-2">
                            <TrendingUp className="w-4 h-4" />
                            Latest Analysis
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                            {typeof insights === 'string' ? (
                                <div className="whitespace-pre-line leading-relaxed">
                                    {insights}
                                </div>
                            ) : (
                                <pre className="text-[10px] opacity-50">{JSON.stringify(insights, null, 2)}</pre>
                            )}
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <AlertCircle className="w-10 h-10 text-red-500/50 mb-3" />
                        <p className="text-slate-400 text-sm italic">{error}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                            <Sparkles className="w-8 h-8 text-slate-600" />
                        </div>
                        <h4 className="text-slate-300 font-bold mb-1">No Active Analysis</h4>
                        <p className="text-slate-500 text-xs max-w-[180px]">
                            Generate a strategic breakdown of your current operations.
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                <button
                    onClick={generateInsights}
                    disabled={loading}
                    className={cn(
                        "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                        loading
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/20"
                    )}
                >
                    {loading ? 'Processing...' : 'Analyze Performance'}
                    {!loading && <ChevronRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export default AIInsightsPanel;
