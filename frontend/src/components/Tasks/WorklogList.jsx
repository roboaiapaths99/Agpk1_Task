import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { timeService } from '../../services/api/apiServices';
import { Clock, User, Calendar, History, Loader2, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const WorklogList = ({ taskId }) => {
    const queryClient = useQueryClient();
    const [isLogging, setIsLogging] = React.useState(false);
    const [manualMinutes, setManualMinutes] = React.useState('');
    const [manualDate, setManualDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));

    const { data: logsRaw, isLoading } = useQuery({
        queryKey: ['worklogs', taskId],
        queryFn: () => timeService.taskLogs(taskId),
        enabled: !!taskId
    });

    const logs = Array.isArray(logsRaw?.logs) ? logsRaw.logs
        : Array.isArray(logsRaw?.data?.logs) ? logsRaw.data.logs
            : Array.isArray(logsRaw?.data) ? logsRaw.data
                : Array.isArray(logsRaw) ? logsRaw : [];

    const handleManualLog = async (e) => {
        e.preventDefault();
        const mins = parseInt(manualMinutes);
        if (isNaN(mins) || mins <= 0) return;

        setIsLogging(true);
        try {
            await timeService.manual({
                taskId,
                durationMinutes: mins,
                date: manualDate
            });
            queryClient.invalidateQueries({ queryKey: ['worklogs', taskId] });
            queryClient.invalidateQueries({ queryKey: ['kanban'] });
            setManualMinutes('');
            toast.success('Worklog recorded successfully');
        } catch (err) {
            toast.error('Failed to log time');
        } finally {
            setIsLogging(false);
        }
    };

    const formatDuration = (ms) => {
        if (!ms) return 'Running...';
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (isLoading) {
        return (
            <div className="py-20 text-center animate-pulse italic text-slate-400 font-bold">
                Retrieving time records...
            </div>
        );
    }

    const totalMs = logs.reduce((acc, log) => acc + (log.duration || 0), 0);

    return (
        <div className="space-y-8">
            {/* Summary Card */}
            <div className="glass-card bg-slate-900 p-6 flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Time Invested</p>
                    <h3 className="text-3xl font-black text-white italic tracking-tight">{formatDuration(totalMs)}</h3>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl">
                    <Clock className="w-6 h-6 text-primary" />
                </div>
            </div>

            {/* Manual Entry Form */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Manual Entry</h4>
                <form onSubmit={handleManualLog} className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[120px]">
                        <input
                            type="number"
                            value={manualMinutes}
                            onChange={(e) => setManualMinutes(e.target.value)}
                            placeholder="Minutes (e.g. 45)"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <input
                            type="date"
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLogging || !manualMinutes}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-primary transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLogging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Record
                    </button>
                </form>
            </div>

            {logs.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <History className="w-8 h-8 text-slate-200" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-bold italic">No time has been logged yet.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 px-1 border-l-2 border-primary">Itemized Worklogs</h4>
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div key={log._id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 transition-all group shadow-sm">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 italic">{log.user?.name || log.userName || 'Team Member'}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(log.startTime || log.date), 'MMM dd, yyyy')}
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            {log.startTime ? format(new Date(log.startTime), 'HH:mm') : ''} {log.endTime ? `- ${format(new Date(log.endTime), 'HH:mm')}` : (log.startTime ? 'Active' : '')}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900 italic">{formatDuration(log.duration || (log.durationMinutes * 60 * 1000))}</p>
                                    <p className={cn(
                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1",
                                        (log.endTime || log.durationMinutes) ? "bg-green-50 text-green-500" : "bg-blue-50 text-blue-500 animate-pulse"
                                    )}>
                                        {(log.endTime || log.durationMinutes) ? 'Logged' : 'In Session'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


export default WorklogList;
