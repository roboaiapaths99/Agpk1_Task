import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, User, Activity, Eye,
    ArrowLeft, ChevronLeft, ChevronRight, Download,
    ShieldCheck, Hash, Globe, MousePointer2, GitMerge,
    Plus, Edit3, Trash2, Key, Clock
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auditService } from '../services/api/apiServices';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { cn } from '../lib/utils';
import { useSocket } from '../hooks/useSocket';
import useAuthStore from '../store/useAuth';

const ActivityFeedPage = () => {
    const queryClient = useQueryClient();
    const { organization } = useAuthStore();
    const { subscribeToEvent } = useSocket(organization?._id);

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const limit = 20;

    // Real-time listener
    useEffect(() => {
        if (!subscribeToEvent) return;

        // Listen for new audit logs
        subscribeToEvent('audit:new', (newLog) => {
            // If we are on the first page and no specific filters are active that might exclude this log
            // we can invalidate to get the fresh list. 
            // Alternatively, just always invalidate audit-logs to keep it simple and correct.
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['audit-filters'] });
        });
    }, [subscribeToEvent, queryClient]);

    const { data: filtersData } = useQuery({
        queryKey: ['audit-filters'],
        queryFn: () => auditService.getFilters(),
    });

    const { data: logsData, isLoading } = useQuery({
        queryKey: ['audit-logs', page, search, selectedUser, selectedModule, selectedAction],
        queryFn: () => auditService.getLogs({
            limit,
            skip: (page - 1) * limit,
            action: selectedAction || undefined,
            module: selectedModule || undefined,
            userId: selectedUser || undefined,
            q: search // Placeholder for global search if needed
        }),
    });

    const filters = filtersData?.data?.filters || filtersData?.filters || filtersData?.data || filtersData || { modules: [], actions: [], users: [] };

    const safeLogs = logsData?.data?.logs || logsData?.logs || logsData?.data || logsData || [];
    const logs = Array.isArray(safeLogs) ? safeLogs : [];
    const totalCount = logsData?.data?.count || logsData?.count || logs.length || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Group logs by date
    const groupedLogs = logs.reduce((groups, log) => {
        const date = startOfDay(new Date(log.timestamp)).toISOString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(log);
        return groups;
    }, {});

    const getDateLabel = (dateStr) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM dd, yyyy');
    };

    const getEventConfig = (action) => {
        if (action.includes('CREATE')) return { icon: Plus, color: 'bg-emerald-500', label: 'Created' };
        if (action.includes('UPDATE')) return { icon: Edit3, color: 'bg-indigo-500', label: 'Updated' };
        if (action.includes('DELETE')) return { icon: Trash2, color: 'bg-rose-500', label: 'Deleted' };
        if (action.includes('LOGIN')) return { icon: Key, color: 'bg-purple-500', label: 'Login' };
        return { icon: Activity, color: 'bg-slate-500', label: 'Action' };
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await auditService.getLogs({ limit: 1000, skip: 0 });
            const exportSafe = response?.data?.logs || response?.logs || response?.data || response || [];
            const exportData = Array.isArray(exportSafe) ? exportSafe : [];
            const csv = [
                ['Timestamp', 'Actor', 'Action', 'Entity', 'Status'].join(','),
                ...exportData.map(l => [
                    format(new Date(l.timestamp), 'yyyy-MM-dd HH:mm:ss'),
                    l.userId?.name || 'System',
                    l.action,
                    l.entityType || 'N/A',
                    l.status
                ].map(v => `"${v}"`).join(','))
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity_feed_${format(new Date(), 'yyyyMMdd')}.csv`;
            a.click();
        } catch (e) {
            console.error('Export failed', e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 italic tracking-tight uppercase">System Activity Feed</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">Comprehensive immutable ledger of all organizational motions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Download className={cn("w-4 h-4", isExporting && "animate-bounce")} />
                        {isExporting ? 'Preparing...' : 'Export Archive'}
                    </button>
                    <button className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:brightness-125 transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Advanced Discovery Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm ring-1 ring-slate-100">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search mutations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    />
                </div>

                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="">All Actors</option>
                        {Array.isArray(filters.users) && filters.users.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="">All Realms</option>
                        {Array.isArray(filters.modules) && filters.modules.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="">All Actions</option>
                        {Array.isArray(filters.actions) && filters.actions.map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Timeline Feed */}
            <div className="space-y-12 relative">
                {/* Vertical Line */}
                <div className="absolute left-[23px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent hidden md:block" />

                {isLoading ? (
                    <div className="space-y-8 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-6">
                                <div className="w-12 h-12 bg-slate-100 rounded-full" />
                                <div className="flex-1 space-y-3 pt-2">
                                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                                    <div className="h-20 bg-slate-50 rounded-2xl w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-20 text-center glass-card">
                        <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 italic">Static Silence</h3>
                        <p className="text-slate-400 text-sm">No recorded events match your filters.</p>
                    </div>
                ) : (
                    Object.entries(groupedLogs).map(([date, dayLogs]) => (
                        <div key={date} className="space-y-6">
                            <h3 className="sticky top-0 z-10 py-2 bg-slate-50/80 backdrop-blur-sm text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-14">
                                {getDateLabel(date)}
                            </h3>

                            <div className="space-y-8">
                                {dayLogs.map((log) => {
                                    const config = getEventConfig(log.action);
                                    const Icon = config.icon;
                                    return (
                                        <div key={log._id} className="group relative flex items-start gap-6 ml-2 md:ml-0">
                                            {/* Icon Pin */}
                                            <div className={cn(
                                                "relative z-20 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 shrink-0",
                                                config.color,
                                                "border-4 border-white"
                                            )}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>

                                            {/* Event Card */}
                                            <div
                                                onClick={() => setSelectedLog(log)}
                                                className="flex-1 glass-card p-5 hover:shadow-xl transition-all cursor-pointer border-l-0 hover:border-l-4 hover:border-l-indigo-500"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[8px] font-black text-white">
                                                            {log.userId?.name?.[0] || 'S'}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight">
                                                            {log.userId?.name || 'System Agent'}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded-lg">
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(log.timestamp), 'HH:mm')}
                                                    </div>
                                                </div>

                                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                    Performed <span className="text-indigo-600 font-bold">{log.action.replace(/_/g, ' ')}</span>
                                                    {log.entityType && (
                                                        <> on <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-900 font-bold text-[10px] uppercase tracking-wider">{log.entityType}</span></>
                                                    )}
                                                </p>

                                                {/* Meta Row */}
                                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        {log.ipAddress || 'Internal'}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <ShieldCheck className={cn("w-3 h-3", log.status === 'success' ? 'text-emerald-500' : 'text-rose-500')} />
                                                        {log.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-12">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="p-4 bg-white border border-slate-200 rounded-2xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="px-6 py-3 bg-slate-900 text-indigo-400 rounded-2xl text-xs font-black italic shadow-xl">
                        PAGE {page} OF {totalPages}
                    </div>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="p-4 bg-white border border-slate-200 rounded-2xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            )}

            {/* Detail Sheet Overlay */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar">
                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
                                >
                                    <ArrowLeft className="w-6 h-6 text-slate-400" />
                                </button>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</div>
                                    <div className="text-xs font-mono font-bold text-slate-900">{selectedLog._id}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic">Entry Breakdown</h2>
                                <p className="text-slate-500">Deep inspection of the mutation payload and state changes.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Actor</div>
                                    <div className="font-bold text-slate-900">{selectedLog.userId?.name || 'System'}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Impact</div>
                                    <div className="font-bold text-indigo-600">{selectedLog.entityType || 'CORE'}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase">
                                    <GitMerge className="w-4 h-4 text-indigo-500" /> Mutation State
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Pre-Mutation</p>
                                        <pre className="p-5 bg-slate-900 text-slate-300 rounded-3xl text-[11px] font-mono overflow-auto max-h-60 border-t-4 border-slate-700 shadow-inner">
                                            {selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : '// No preceding state recorded'}
                                        </pre>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase ml-1">Post-Mutation</p>
                                        <pre className="p-5 bg-indigo-900/10 text-indigo-900 rounded-3xl text-[11px] font-mono overflow-auto max-h-60 border-t-4 border-indigo-500/30">
                                            {selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : '// No delta data found'}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityFeedPage;
