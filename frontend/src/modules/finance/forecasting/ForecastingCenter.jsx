import React from 'react';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Calendar, 
  ArrowRight,
  Info,
  Activity,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { forecastingService } from '../../../services/api/apiServices';
import { cn } from '../../../lib/utils';
import { formatCurrency, formatDate } from '../../../lib/formatters';

const ForecastingCenter = () => {
    const { data: forecastData, isLoading } = useQuery({
        queryKey: ['revenue-forecast'],
        queryFn: () => forecastingService.getRevenueForecast(),
    });

    const predictions = forecastData?.data?.data || [];
    const confidence = forecastData?.data?.confidence || 0;

    if (isLoading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse text-sm">Quantifying future revenue streams...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic">
                        REVENUE <span className="text-primary">FORECASTING</span>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">AI-driven predictive analytics based on historical ledger performance.</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary fill-primary animate-pulse" />
                    <div>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Model Confidence</p>
                        <p className="text-sm font-black text-slate-900">{confidence}% Precision Rate</p>
                    </div>
                </div>
            </div>

            {/* Main Forecast Chart */}
            <div className="glass-card p-8 border border-slate-100 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <TrendingUp className="w-40 h-40" />
                </div>
                
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">90-Day Revenue Projection</h2>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div> Projected</span>
                    </div>
                </div>

                <div className="h-[350px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={predictions}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                fontWeight={700}
                                tickFormatter={(str) => formatDate(str, 'compact')}
                                stroke="#94A3B8"
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis 
                                fontSize={10} 
                                fontWeight={700}
                                stroke="#94A3B8"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => `${formatCurrency(val, { maximumFractionDigits: 0, currency: 'INR' }).replace('₹', '₹')}`}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                    padding: '12px'
                                }}
                                formatter={(val) => [formatCurrency(val), 'Projected Revenue']}
                                labelFormatter={(label) => formatDate(label, 'medium')}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Forecast Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {predictions.map((p, idx) => (
                    <div key={idx} className="glass-card p-6 border border-slate-100 hover:shadow-xl transition-all group overflow-hidden relative">
                         <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Activity className="w-20 h-20" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/10 rounded-full uppercase tracking-widest">
                                M+{idx + 1} Target
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            {formatDate(p.date, 'medium')}
                        </p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1 italic tracking-tighter">
                            {formatCurrency(p.value)}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                            <TrendingUp className="w-3 h-3" />
                            <span>ESTIMATED GROWTH</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Strategic Insights */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Target className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-xl">
                            <Info className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black italic tracking-tighter uppercase">Strategic Outlook</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                Based on current transaction velocity and seasonal patterns, the model suggests a robust upward trend. 
                                <span className="block mt-2 text-white font-bold italic underline decoration-primary underline-offset-4 decoration-2">
                                    Q3 growth is projected at 12.4% above previous year benchmarks.
                                </span>
                            </p>
                            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors group">
                                Download Investment Thesis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Market Variance Risks</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-300">Data Density</span>
                                    <span className="text-xs font-black text-emerald-400 uppercase italic">Optimal</span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-400 h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs font-bold text-slate-300">Seasonal Volatility</span>
                                    <span className="text-xs font-black text-amber-400 uppercase italic">Medium</span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-amber-400 h-full w-[40%] rounded-full shadow-[0_0_10px_rgba(251,191,36,0.3)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForecastingCenter;
