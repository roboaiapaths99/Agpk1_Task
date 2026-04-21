import React from 'react';
import {
    Activity,
    TrendingUp,
    Target,
    BarChart,
    PieChart,
    LineChart,
    Calendar,
    Filter,
    Download,
    Info,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reportService, healthService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import {
    BarChart as ReBar,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePie,
    Pie,
    Cell,
    LineChart as ReLine,
    Line
} from 'recharts';

const COLORS = ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="glass-card p-6 border-slate-100 group hover:border-primary/20 transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:scale-110 transition-transform", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <span className={cn("text-xs font-black px-2 py-1 rounded-lg", change >= 0 ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500")}>
                {change > 0 ? '+' : ''}{change}%
            </span>
        </div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
        <p className="text-3xl font-black text-slate-900 tracking-tight italic">{value}</p>
    </div>
);

const ReportsPage = () => {
    const [period, setPeriod] = React.useState('30');
    const [isExporting, setIsExporting] = React.useState(false);

    const { data: workloadRaw } = useQuery({
        queryKey: ['report-workload', period],
        queryFn: () => reportService.getWorkload({ days: period })
    });
    const { data: slaRaw } = useQuery({
        queryKey: ['report-sla', period],
        queryFn: () => reportService.getSla({ days: period })
    });
    const { data: teamScoreRaw } = useQuery({
        queryKey: ['report-team'],
        queryFn: healthService.getTeamScore
    });

    const safeWd = workloadRaw?.report || workloadRaw?.data?.report || workloadRaw?.data || workloadRaw || [];
    const wd = Array.isArray(safeWd) ? safeWd : [];
    const safeSd = slaRaw?.report || slaRaw?.data?.report || slaRaw?.data || slaRaw || [];
    const sd = Array.isArray(safeSd) ? safeSd : [];
    const ts = teamScoreRaw?.score !== undefined ? teamScoreRaw : (teamScoreRaw?.data || {});

    const workloadData = Array.isArray(wd) ? wd.map(item => ({
        name: item.name,
        active: item.totalTasks - (item.completedTasks || 0),
        completed: item.completedTasks || 0
    })) : [];


    const slaProcessed = Array.isArray(sd) && sd.length > 0 ? [
        { name: 'Met', value: sd[0].totalOnTime || 0 },
        { name: 'Breached', value: sd[0].totalBreached || 0 },
    ] : [
        { name: 'Met', value: 0 },
        { name: 'Breached', value: 0 },
    ];

    const compliance = Array.isArray(sd) && sd.length > 0 ?
        Math.round((sd[0].totalOnTime / sd[0].total) * 100) : 100;

    const handleExport = () => {
        setIsExporting(true);
        try {
            const headers = ['Department', 'Active Tasks', 'Completed Tasks'];
            const rows = workloadData.map(d => [d.name, d.active, d.completed].join(','));
            const csvContent = [headers.join(','), ...rows].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Operation_Report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Report exported successfully');
        } catch (err) {
            toast.error('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Advanced Analytics</h1>
                    <p className="text-slate-500 mt-1">Real-time operational health and performance tracking.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="appearance-none bg-slate-100 border-none rounded-xl px-10 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                        </select>
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Tasks" value={workloadData.reduce((acc, curr) => acc + curr.active, 0)} change={0} icon={TrendingUp} color="bg-primary" />
                <StatCard title="SLA Compliance" value={`${compliance}%`} change={0} icon={Target} color="bg-indigo-500" />
                <StatCard title="Team Score" value={ts.score || 100} change={0} icon={Activity} color="bg-purple-500" />
                <StatCard title="Risk Score" value="Low" change={0} icon={Info} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Workload */}
                <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900 italic">Department Workload</h3>
                        <BarChart className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="h-[300px] min-h-[300px] w-full relative overflow-hidden">
                        <ResponsiveContainer width="99%" height="99%">
                            <ReBar data={workloadData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="active" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                            </ReBar>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SLA Pie */}
                <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900 italic">SLA Performance</h3>
                        <PieChart className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="h-[300px] min-h-[300px] w-full relative overflow-hidden">
                        <ResponsiveContainer width="99%" height="99%">
                            <RePie>
                                <Pie
                                    data={slaProcessed}
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {slaProcessed.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </RePie>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default ReportsPage;
