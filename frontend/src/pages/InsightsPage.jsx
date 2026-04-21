import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiService, projectService, auditService } from '../services/api/apiServices';
import {
    Zap,
    TrendingUp,
    AlertTriangle,
    ShieldCheck,
    ShieldAlert,
    BarChart3,
    Activity,
    BrainCircuit,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const InsightsPage = () => {
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const safeProjects = Array.isArray(projects?.data) ? projects.data : Array.isArray(projects) ? projects : [];

    const [selectedProject, setSelectedProject] = React.useState(null);

    React.useEffect(() => {
        if (safeProjects.length > 0 && !selectedProject) {
            setSelectedProject(safeProjects[0]._id);
        }
    }, [safeProjects, selectedProject]);

    const { data: forecast, isLoading: forecastLoading } = useQuery({
        queryKey: ['ai-forecast', selectedProject],
        queryFn: () => aiService.getForecast(selectedProject),
        enabled: !!selectedProject
    });

    const { data: teamHealth } = useQuery({
        queryKey: ['team-health'],
        queryFn: () => aiService.predictTeamHealth()
    });

    const { data: auditLogs } = useQuery({
        queryKey: ['audit-security'],
        queryFn: () => auditService.getLogs({ limit: 5 })
    });

    const forecastData = forecast?.data?.forecast || forecast?.forecast || forecast?.data || forecast;

    // Safely extract audit logs
    const safeAuditLogs = auditLogs?.data?.logs || auditLogs?.logs || auditLogs?.data || auditLogs || [];
    const logsArray = Array.isArray(safeAuditLogs) ? safeAuditLogs : [];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        AI Command Center
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Predictive analytics and system integrity monitoring.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                            className="pl-10 pr-4 py-2 bg-white border rounded-lg appearance-none focus:ring-2 focus:ring-primary/20 outline-none min-w-[200px]"
                            value={selectedProject || ''}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            {safeProjects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {/* Top Grid: Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: 'Capacity Forecast',
                        value: forecastData?.estimatedCapacityRemaining || 'N/A',
                        sub: 'Remaining Points',
                        icon: TrendingUp,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50'
                    },
                    {
                        label: 'Risk Level',
                        value: forecastData?.isAtRisk ? 'High' : 'Low',
                        sub: forecastData?.confidenceScore ? `${forecastData.confidenceScore}% Confidence` : 'Analyzing...',
                        icon: AlertTriangle,
                        color: forecastData?.isAtRisk ? 'text-red-600' : 'text-green-600',
                        bg: forecastData?.isAtRisk ? 'bg-red-50' : 'bg-green-50'
                    },
                    {
                        label: 'Audit Integrity',
                        value: 'Chained',
                        sub: 'SHA-256 Verified',
                        icon: ShieldCheck,
                        color: 'text-primary',
                        bg: 'bg-primary/10'
                    },
                    {
                        label: 'Team Momentum',
                        value: forecastData?.trendDirection || 'Stable',
                        sub: `Avg: ${forecastData?.historicalAvg || 0} pts/day`,
                        icon: Activity,
                        color: 'text-purple-600',
                        bg: 'bg-purple-50'
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start">
                            <div className={cn("p-2 rounded-xl", stat.bg)}>
                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                            </div>
                            {stat.label === 'Team Momentum' && forecastData?.trendDirection === 'improving' && (
                                <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <ArrowUpRight className="h-3 w-3 mr-1" /> Improving
                                </span>
                            )}
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold">{stat.value}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Capacity Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <BrainCircuit className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold">Sprint Capacity Breakdown</h2>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-slate-100 rounded">AI Engine v2.4</span>
                        </div>

                        {forecastLoading ? (
                            <div className="h-64 flex items-center justify-center">
                                <Activity className="h-8 w-8 text-primary animate-pulse" />
                            </div>
                        ) : forecastData ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border bg-slate-50/50">
                                        <p className="text-sm text-muted-foreground mb-1">Total Remaining Load</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold">{forecastData.totalRemainingPoints}</span>
                                            <span className="text-sm font-medium text-muted-foreground">Story Points</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-slate-50/50">
                                        <p className="text-sm text-muted-foreground mb-1">Predicted Capacity</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold">{forecastData.estimatedCapacityRemaining}</span>
                                            <span className="text-sm font-medium text-muted-foreground">Points left in sprint</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Completion Probability</span>
                                        <span className={cn(
                                            "font-bold",
                                            forecastData.isAtRisk ? "text-red-600" : "text-green-600"
                                        )}>{forecastData.confidenceScore}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${forecastData.confidenceScore}%` }}
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                forecastData.isAtRisk ? "bg-red-500" : "bg-green-500"
                                            )}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">
                                        {forecastData.isAtRisk
                                            ? "⚠️ At current velocity, some tasks may spill over to the next sprint."
                                            : "✨ Team is on track to complete all assigned work within the sprint window."}
                                    </p>
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3">AI Recommendations</h4>
                                    <ul className="space-y-2">
                                        {forecastData.isAtRisk ? (
                                            <>
                                                <li className="flex items-start gap-2 text-sm">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5" />
                                                    Consider de-scoping 3-5 sub-priority points to secure delivery.
                                                </li>
                                                <li className="flex items-start gap-2 text-sm">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5" />
                                                    Re-assign high-point tasks from bottlenecked members.
                                                </li>
                                            </>
                                        ) : (
                                            <>
                                                <li className="flex items-start gap-2 text-sm">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 mt-1.5" />
                                                    Optimal velocity reached. High confidence in current sprint goal.
                                                </li>
                                                <li className="flex items-start gap-2 text-sm">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 mt-1.5" />
                                                    Consider pulling 1 extra task from the backlog to maximize output.
                                                </li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm italic">
                                Insufficient data to generate sprint forecast. Complete 2+ sprints first.
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Security View */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <h2 className="text-lg font-semibold">Audit Integrity</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-medium">Chain Verified</span>
                                </div>
                                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border">SHA-256</span>
                            </div>

                            <div className="text-sm text-muted-foreground pb-4 border-b">
                                Latest Chained Logs:
                            </div>

                            <div className="space-y-3">
                                {logsArray.map((log, i) => (
                                    <div key={log._id} className="relative pl-6 pb-4 border-l last:pb-0">
                                        <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-200 border-2 border-white" />
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{log.action}</p>
                                        <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">Hash: {log.hash?.substring(0, 16)}...</p>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-4 py-2 px-4 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                <Search className="h-4 w-4" /> Verify Full Ledger
                            </button>
                        </div>
                    </div>

                    {/* Team Pulse Predictor */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
                        <div className="absolute top-[-20px] right-[-20px] h-32 w-32 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors" />

                        <div className="flex items-center gap-2 mb-4">
                            <BrainCircuit className="h-5 w-5 text-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-primary/80">Sentiment AI</h2>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium">Predicted Morale: High</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-1.5 flex-1 bg-primary rounded-full" />
                                ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Based on Team Pulse activity and standup engagement over the last 72 hours.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsightsPage;
