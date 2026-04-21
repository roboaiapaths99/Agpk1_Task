import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { standupService } from '../services/api/apiServices';
import { Zap, Send, MessageSquare, AlertCircle, CheckCircle2, Calendar, Smile, Meh, Frown, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

const moodIcons = {
    happy: { icon: Smile, color: 'text-green-500', bg: 'bg-green-50' },
    neutral: { icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50' },
    stressed: { icon: Frown, color: 'text-rose-500', bg: 'bg-rose-50' },
    overloaded: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
};

const TeamPulsePage = () => {
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [formData, setFormData] = React.useState({
        whatIDid: '',
        whatIWillDo: '',
        blockers: 'None',
        mood: 'neutral'
    });

    const { data: teamStandupsRaw, isLoading } = useQuery({
        queryKey: ['standups', 'team', format(selectedDate, 'yyyy-MM-dd')],
        queryFn: () => standupService.getTeam(format(selectedDate, 'yyyy-MM-dd'))
    });

    const teamStandups = Array.isArray(teamStandupsRaw)
        ? teamStandupsRaw
        : (Array.isArray(teamStandupsRaw?.data?.data) ? teamStandupsRaw.data.data : (teamStandupsRaw?.data || []));

    const submitMutation = useMutation({
        mutationFn: standupService.submit,
        onSuccess: () => {
            toast.success('Standup submitted successfully!');
            queryClient.invalidateQueries(['standups']);
            setFormData({ whatIDid: '', whatIWillDo: '', blockers: 'None', mood: 'neutral' });
        },
        onError: () => toast.error('Failed to submit standup')
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        submitMutation.mutate(formData);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50 p-6 md:p-10 gap-10 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 italic">
                        <Zap className="w-10 h-10 text-primary fill-primary/20" />
                        TEAM PULSE
                    </h1>
                    <p className="text-slate-500 font-medium">Async standups for modern high-performance teams</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <Calendar className="w-5 h-5 text-slate-400 ml-2" />
                    <input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none pr-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Submit Section */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-8 sticky top-0 border-2 border-primary/10 shadow-2xl shadow-primary/5">
                        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Send className="w-5 h-5 text-primary" />
                            MY UPDATE
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">What I did yesterday</label>
                                <textarea
                                    value={formData.whatIDid}
                                    onChange={(e) => setFormData({ ...formData, whatIDid: e.target.value })}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none transition-all"
                                    placeholder="Key accomplishments..."
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">What I'm doing today</label>
                                <textarea
                                    value={formData.whatIWillDo}
                                    onChange={(e) => setFormData({ ...formData, whatIWillDo: e.target.value })}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none transition-all"
                                    placeholder="Focus areas..."
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Any Blockers?</label>
                                <input
                                    type="text"
                                    value={formData.blockers}
                                    onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block text-center">Current Mood / Capacity</label>
                                <div className="flex justify-between gap-2">
                                    {Object.entries(moodIcons).map(([key, { icon: Icon, color, bg }]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, mood: key })}
                                            className={cn(
                                                "flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2",
                                                formData.mood === key ? `${bg} border-primary` : "bg-white border-transparent hover:bg-slate-50"
                                            )}
                                        >
                                            <Icon className={cn("w-6 h-6", color)} />
                                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">{key}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitMutation.isPending}
                                className="w-full bg-slate-900 text-white rounded-xl py-4 font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitMutation.isPending ? 'Syncing...' : 'Sync with Team'}
                                <Zap className="w-4 h-4 fill-white animate-pulse" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Team Feed */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            TEAM HUB
                        </h2>
                        <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-black text-slate-500">
                            {teamStandups?.length || 0} UPDATES
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : teamStandups?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-bold">No updates yet for {format(selectedDate, 'MMM dd, yyyy')}</p>
                            <p className="text-xs">Be the first to update your team!</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {teamStandups.map((s) => {
                                const Mood = moodIcons[s.mood]?.icon || Meh;
                                return (
                                    <div key={s._id} className="group glass-card overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all duration-500">
                                        <div className="flex items-start p-6 gap-6">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg border-2 border-white shadow-lg overflow-hidden shrink-0">
                                                    {s.user?.avatar ? <img src={s.user.avatar} alt={s.user.name} /> : s.user?.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className={cn(
                                                    "absolute -bottom-2 -right-2 p-1.5 rounded-lg shadow-lg border border-white",
                                                    moodIcons[s.mood]?.bg
                                                )}>
                                                    <Mood className={cn("w-4 h-4", moodIcons[s.mood]?.color)} />
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h4 className="font-black text-slate-800 leading-tight">{s.user?.name}</h4>
                                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{format(new Date(s.createdAt), 'hh:mm a')}</p>
                                                    </div>
                                                    <div className="hidden md:flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Synced
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="p-4 bg-slate-50/50 rounded-2xl">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 block">Daughter of Action</span>
                                                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{s.whatIDid}</p>
                                                    </div>
                                                    <div className="p-4 bg-primary/5 rounded-2xl">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 block">Nexus of Focus</span>
                                                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{s.whatIWillDo}</p>
                                                    </div>
                                                </div>

                                                {s.blockers !== 'None' && (
                                                    <div className="mt-4 flex items-start gap-2 text-rose-600 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase tracking-widest block mb-1">Blocker Detected</span>
                                                            <p className="text-sm font-bold">{s.blockers}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamPulsePage;
