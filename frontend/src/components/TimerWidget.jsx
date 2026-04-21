import React from 'react';
import {
    Play,
    Pause,
    Square,
    ChevronUp,
    Clock,
    Zap,
    ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { timeService } from '../services/api/apiServices';

const TimerWidget = () => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isRunning, setIsRunning] = React.useState(false);
    const [seconds, setSeconds] = React.useState(0);
    const [activeTask, setActiveTask] = React.useState(null);
    const [startTime, setStartTime] = React.useState(null);

    // Sync with backend on mount
    React.useEffect(() => {
        const fetchActive = async () => {
            try {
                const res = await timeService.getActive();
                const log = res?.data?.log || res?.log;
                if (log) {
                    setActiveTask(log.taskId);
                    setStartTime(new Date(log.startTime));
                    setIsRunning(true);
                    setIsExpanded(true);

                    // Calculate initial seconds
                    const diff = Math.floor((new Date() - new Date(log.startTime)) / 1000);
                    setSeconds(diff);
                }
            } catch (err) {
                console.error('Failed to fetch active timer', err);
            }
        };
        fetchActive();
    }, []);

    // Listen for custom event to start tracking a task
    React.useEffect(() => {
        const handleTrackTask = (e) => {
            const task = e.detail;
            setActiveTask(task);
            setIsExpanded(true);
            // If another timer was running, the backend will throw error, 
            // but we'll try to start this one.
            handleStart(task._id);
        };
        window.addEventListener('TRACK_TASK', handleTrackTask);
        return () => window.removeEventListener('TRACK_TASK', handleTrackTask);
    }, []);

    React.useEffect(() => {
        let interval;
        if (isRunning && startTime) {
            interval = setInterval(() => {
                const diff = Math.floor((new Date() - startTime) / 1000);
                setSeconds(diff);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, startTime]);

    const formatTime = (s) => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = async (taskId) => {
        const tId = taskId || activeTask?._id;
        if (!tId) return;
        try {
            const res = await timeService.start(tId);
            const log = res.log;
            setStartTime(new Date(log.startTime));
            setIsRunning(true);
            setSeconds(0);
            if (taskId && typeof taskId === 'object') {
                setActiveTask(taskId);
            }
        } catch (err) {
            console.error('Failed to start timer', err);
        }
    };

    const handleStop = async () => {
        try {
            await timeService.stop();
            setIsRunning(false);
            setSeconds(0);
            setStartTime(null);
            // We keep the activeTask so the user can "Resume" it easily
        } catch (err) {
            console.error('Failed to stop timer', err);
        }
    };

    const handleToggle = () => {
        if (isRunning) {
            handleStop();
        } else {
            handleStart();
        }
    };

    return (
        <div className={cn(
            "fixed bottom-8 right-8 z-[300] transition-all duration-500",
            isExpanded ? "w-80" : "w-16 h-16"
        )}>
            <div className={cn(
                "bg-slate-900 shadow-2xl overflow-hidden shadow-primary/20 border border-white/10 flex flex-col transition-all duration-500",
                isExpanded ? "rounded-[2rem] p-6" : "rounded-full h-16 w-16 p-0 items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
            )}
                onClick={() => !isExpanded && setIsExpanded(true)}
            >
                {!isExpanded ? (
                    <div className="relative">
                        <Clock className="w-6 h-6 text-white" />
                        {isRunning && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Tracker</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-4xl font-black text-white italic tracking-tighter tabular-nums mb-1">
                                {formatTime(seconds)}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                {activeTask ? activeTask.title : 'No Task Selected'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleToggle}
                                className={cn(
                                    "flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all",
                                    isRunning ? "bg-white/10 text-white hover:bg-white/20" : "bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105"
                                )}
                            >
                                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isRunning ? 'Pause' : 'Resume'}
                            </button>
                            <button
                                onClick={async () => {
                                    await handleStop();
                                    setActiveTask(null);
                                }}
                                className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all font-bold"
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </button>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold mb-2">
                                <span className="text-slate-400 uppercase tracking-widest">Weekly Goal</span>
                                <span className="text-white">12 / 40h</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[30%]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimerWidget;
