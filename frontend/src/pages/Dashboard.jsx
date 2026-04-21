import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle2, Clock, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Activity, Check, Edit2, Layout, LayoutGrid
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { useQuery, useMutation } from '@tanstack/react-query';
import { reportService, healthService, taskService, auditService, profileService } from '../services/api/apiServices';
import useAuthStore from '../store/useAuth';
import { cn } from '../lib/utils';
import TeamHealthCard from '../components/Dashboard/TeamHealthCard';
import AIInsightsPanel from '../components/Dashboard/AIInsightsPanel';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableWidget } from '../components/Dashboard/SortableWidget';
import toast from 'react-hot-toast';

const COLORS = ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];

const DEFAULT_LAYOUT = [
    { id: 'kpi-active', type: 'kpi', visible: true },
    { id: 'kpi-hours', type: 'kpi', visible: true },
    { id: 'kpi-compliance', type: 'kpi', visible: true },
    { id: 'kpi-score', type: 'kpi', visible: true },
    { id: 'chart-throughput', type: 'chart', visible: true },
    { id: 'chart-sla', type: 'chart', visible: true },
    { id: 'activity-recent', type: 'activity', visible: true },
    { id: 'team-health', type: 'vital', visible: true },
    { id: 'ai-insights', type: 'vital', visible: true }
];

const WIDGET_TITLES = {
    'kpi-active': 'Active Tasks',
    'kpi-hours': 'Total Hours',
    'kpi-compliance': 'SLA Compliance',
    'kpi-score': 'Team Score',
    'chart-throughput': 'Throughput Trend',
    'chart-sla': 'SLA Performance',
    'activity-recent': 'Recent Activity',
    'team-health': 'Team Health',
    'ai-insights': 'AI Insights'
};

// ─── Skeleton ───────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="glass-card p-6 animate-pulse h-full">
        <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
        <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
        <div className="h-2 w-32 bg-slate-100 rounded" />
    </div>
);

// ─── KPI Card ───────────────────────────────────────────────
const KPI = ({ title, value, icon: Icon, color, trend, trendDown }) => (
    <div className="glass-card p-6 flex items-start justify-between group hover:shadow-lg transition-all h-full">
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 italic">{value}</h3>
            {trend !== undefined && (
                <div className={cn("flex items-center gap-1 mt-2 text-xs font-bold", trendDown ? "text-red-500" : "text-green-500")}>
                    {trendDown ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    <span>{trendDown ? '' : '+'}{trend}% from last period</span>
                </div>
            )}
        </div>
        <div className={cn("p-3 rounded-xl group-hover:scale-110 transition-transform", color)}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

// ─── Dashboard ──────────────────────────────────────────────
const Dashboard = () => {
    const { user, setUser } = useAuthStore();
    const [selectedTask, setSelectedTask] = React.useState(null);
    const [isEditMode, setIsEditMode] = React.useState(false);

    // Initialize layout from user profile or use default
    const [layout, setLayout] = React.useState([]);

    useEffect(() => {
        if (user) {
            if (user.dashboardLayout && user.dashboardLayout.length > 0) {
                // Merge with default to handle newly added widget types since last save
                const userLayoutIds = user.dashboardLayout.map(w => w.id);
                const missingWidgets = DEFAULT_LAYOUT.filter(w => !userLayoutIds.includes(w.id)).map(w => ({ ...w, visible: false }));
                setLayout([...user.dashboardLayout, ...missingWidgets]);
            } else {
                setLayout(DEFAULT_LAYOUT);
            }
        }
    }, [user]);

    const { data: workloadRaw, isLoading: wLoading, refetch: refetchW } = useQuery({
        queryKey: ['report-workload'],
        queryFn: reportService.getWorkload,
    });

    const { data: summaryRaw, isLoading: sLoading, refetch: refetchS } = useQuery({
        queryKey: ['dashboard-summary'],
        queryFn: reportService.getDashboardSummary,
    });

    const { data: teamRaw, isLoading: tLoading, refetch: refetchT } = useQuery({
        queryKey: ['report-team'],
        queryFn: healthService.getTeamScore,
    });

    const { data: recentLogs, isLoading: rLoading } = useQuery({
        queryKey: ['audit-logs-recent'],
        queryFn: () => auditService.getLogs({ limit: 6 }),
    });

    const saveLayoutMutation = useMutation({
        mutationFn: profileService.updateDashboardLayout,
        onSuccess: (updatedLayout) => {
            toast.success('Dashboard layout saved!');
            setUser({ ...user, dashboardLayout: updatedLayout });
            setIsEditMode(false);
        },
        onError: () => toast.error('Failed to save layout')
    });

    const isLoading = wLoading || sLoading || tLoading;

    // Safe data extraction
    const summary = summaryRaw?.report || summaryRaw?.data?.report || summaryRaw || {};
    const team = teamRaw?.score !== undefined ? teamRaw : (teamRaw?.data || {});
    const safeLogs = recentLogs?.data?.logs || recentLogs?.logs || recentLogs?.data || recentLogs || [];
    const recentActivity = Array.isArray(safeLogs) ? safeLogs : [];

    const weeklyData = Array.isArray(summary?.weeklyTrend) ? summary.weeklyTrend : [
        { name: 'Mon', tasks: 0 }, { name: 'Tue', tasks: 0 }, { name: 'Wed', tasks: 0 },
        { name: 'Thu', tasks: 0 }, { name: 'Fri', tasks: 0 }, { name: 'Sat', tasks: 0 }, { name: 'Sun', tasks: 0 },
    ];

    const slaData = [
        { name: 'Met', value: summary.completedTasks || 0 },
        { name: 'Remaining', value: summary.totalActive || 0 },
    ];

    const handleRefresh = () => {
        refetchW(); refetchS(); refetchT();
    };

    // Dnd-kit setup
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setLayout((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const toggleWidgetVisibility = (id) => {
        setLayout(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
    };

    const handleSaveLayout = () => {
        saveLayoutMutation.mutate(layout);
    };

    // Render Widget Function
    const renderWidgetContent = (widgetId) => {
        if (isLoading && widgetId !== 'activity-recent' && widgetId !== 'team-health' && widgetId !== 'ai-insights') {
            return <SkeletonCard />;
        }

        switch (widgetId) {
            case 'kpi-active':
                return <KPI title="Active Tasks" value={summary.totalActive ?? 0} icon={CheckCircle2} color="bg-blue-500" trend={0} />;
            case 'kpi-hours':
                return <KPI title="Total Hours" value={summary.totalHours ?? '0.0'} icon={Clock} color="bg-purple-500" trend={0} />;
            case 'kpi-compliance':
                return <KPI title="SLA Compliance" value={`${summary.compliance ?? 100}%`} icon={TrendingUp} color="bg-green-500" trend={0} />;
            case 'kpi-score':
                return <KPI title="Team Score" value={team.score ?? '100'} icon={AlertTriangle} color="bg-orange-500" trend={0} />;
            
            case 'chart-throughput':
                return (
                    <div className="glass-card p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-6 italic">Throughput Trend</h3>
                        <div className="flex-1 min-h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyData}>
                                    <defs>
                                        <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip cursor={{ stroke: '#2563EB', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="tasks" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'chart-sla':
                return (
                    <div className="glass-card p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-6 italic">SLA Performance</h3>
                        <div className="flex-1 min-h-[240px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={slaData} innerRadius={60} outerRadius={90} paddingAngle={6} dataKey="value" cx="50%" cy="50%">
                                        {slaData.map((_, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'activity-recent':
                return (
                    <div className="glass-card p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-6 italic flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Recent Activity
                        </h3>
                        {rLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse flex items-center gap-4 p-3"><div className="w-8 h-8 bg-slate-200 rounded-lg" /><div className="flex-1"><div className="h-3 w-48 bg-slate-200 rounded mb-2" /><div className="h-2 w-32 bg-slate-100 rounded" /></div></div>
                                ))}
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <p className="text-slate-400 text-sm italic text-center py-8">No recent activity yet. Create your first task!</p>
                        ) : (
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                                {recentActivity.map((log) => (
                                    <div key={log._id} className="flex items-start gap-4 p-3 hover:bg-slate-50/50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm", log.action.includes('CREATE') ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : log.action.includes('UPDATE') ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : log.action.includes('DELETE') ? 'bg-gradient-to-br from-rose-400 to-rose-600' : 'bg-gradient-to-br from-slate-400 to-slate-600')}>
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-bold text-slate-800 truncate">{log.userId?.name || 'System'}</p>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                                <span className="font-semibold text-slate-700">{log.action.replace(/_/g, ' ')}</span>
                                                {log.entityType && ` on ${log.entityType}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'team-health': return <TeamHealthCard />;
            case 'ai-insights': return <AIInsightsPanel />;
            default: return null;
        }
    };

    const getWidgetSpan = (id) => {
        if (id.startsWith('kpi')) return 'col-span-1 md:col-span-1 lg:col-span-1';
        if (id.startsWith('chart')) return 'col-span-1 md:col-span-2 lg:col-span-2';
        if (id === 'activity-recent') return 'col-span-1 md:col-span-2 lg:col-span-2';
        return 'col-span-1 md:col-span-2 lg:col-span-2'; // Vitals
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic flex items-center gap-3">
                        <LayoutGrid className="w-8 h-8 text-primary" />
                        Command Center
                    </h1>
                    <p className="text-slate-500 mt-1">Here is a snapshot of your operational health.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isEditMode ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditMode(false);
                                    setLayout(user?.dashboardLayout || DEFAULT_LAYOUT);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLayout}
                                disabled={saveLayoutMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                            >
                                {saveLayoutMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Save Layout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/80 backdrop-blur text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                            >
                                <Layout className="w-4 h-4" />
                                Edit Dashboard
                            </button>
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                                Refresh
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Mode Panel */}
            {isEditMode && (
                <div className="glass-card p-6 bg-blue-50/50 border border-blue-100 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-primary" />
                        Customize Widgets
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {layout.map(widget => (
                            <button
                                key={`toggle-${widget.id}`}
                                onClick={() => toggleWidgetVisibility(widget.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                    widget.visible
                                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {WIDGET_TITLES[widget.id] || widget.id}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4 italic">Drag the grip handle on any widget to reorder. Changes apply after you save.</p>
                </div>
            )}

            {/* Dynamic Grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={layout.filter(w => w.visible).map(w => w.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-max">
                        {layout.filter(w => w.visible).map((widget) => (
                            <div key={widget.id} className={cn(getWidgetSpan(widget.id), "min-h-[160px]")}>
                                <SortableWidget id={widget.id} isEditMode={isEditMode}>
                                    {renderWidgetContent(widget.id)}
                                </SortableWidget>
                            </div>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={() => {
                        handleRefresh();
                        setSelectedTask(null);
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
