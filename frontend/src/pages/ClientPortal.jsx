import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Layout,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    ShieldCheck,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { guestService } from '../services/api/apiServices';
import { cn } from '../lib/utils';

const ClientPortal = () => {
    const { token } = useParams();

    const { data: projectData, isLoading, error } = useQuery({
        queryKey: ['guest-project', token],
        queryFn: () => guestService.getProject(token),
        retry: false
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest italic">Authenticating Secure Link...</h2>
                <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-tighter">Powered by agpk1-task Enterprise</p>
            </div>
        );
    }

    if (error || !projectData?.data) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest italic">Access Denied</h2>
                <p className="text-slate-500 mt-2 font-bold uppercase text-xs">This guest link is invalid, expired, or deactivated by the project owner.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-8 px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-primary transition-all"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    const { project, tasks } = projectData.data;

    return (
        <div className="min-h-screen bg-white">
            {/* Guest Header */}
            <header className="bg-slate-900 text-white p-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Layout className="w-6 h-6 text-white" />
                            </div>
                            <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Secure Guest Access</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase">{project.name}</h1>
                        <p className="text-slate-400 max-w-2xl font-medium leading-relaxed">{project.description || 'Live project roadmap and status dashboard.'}</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Impact</p>
                            <p className="text-2xl font-black italic">{tasks.length} Active Items</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="max-w-6xl mx-auto p-8 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Roadmap Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    Active Roadmap
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {tasks.map(task => (
                                    <div key={task._id} className="p-6 flex items-center gap-6 group hover:bg-slate-50/50 transition-colors">
                                        <div className={cn(
                                            "w-2 h-10 rounded-full shrink-0",
                                            task.status === 'completed' ? 'bg-green-500' :
                                                task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-200'
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {project.key}-{task._id?.slice(-3)}
                                                </span>
                                                <h4 className="font-bold text-slate-800 truncate">{task.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'}
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                                                    task.priority === 'critical' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                                                )}>
                                                    {task.priority || 'Medium'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full",
                                                task.status === 'completed' ? 'bg-green-50 text-green-700' :
                                                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                                            )}>
                                                {task.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Vitals Column */}
                    <div className="space-y-8">
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 italic">
                            <h3 className="text-slate-900 font-black uppercase text-xs tracking-widest mb-4">Project Integrity</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Completion Rate</p>
                                        <p className="text-xl font-black text-slate-800 italic">
                                            {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) || 0}%
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                        "This is a live reflection of our engineering velocity. Data points are synchronized in real-time with our core operational infrastructure."
                                    </p>
                                </div>

                                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                                    Contact Project Owner
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto p-8 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    agpk1-task Enterprise Operations &copy; 2026 • Secure Read-Only Access
                </p>
            </footer>
        </div>
    );
};

export default ClientPortal;
