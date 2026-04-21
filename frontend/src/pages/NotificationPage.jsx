import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Bell,
    CheckCircle2,
    Clock,
    MessageSquare,
    AlertTriangle,
    Search,
    Filter,
    MoreVertical,
    Check
} from 'lucide-react';
import { notificationService } from '../services/api/apiServices';
import { cn } from '../lib/utils';

const NotificationPage = () => {
    const queryClient = useQueryClient();
    const [filter, setFilter] = React.useState('all');

    const { data: notificationsRaw, isLoading } = useQuery({
        queryKey: ['notifications', filter],
        queryFn: () => notificationService.getAll({ filter }),
    });

    const markAllRead = useMutation({
        mutationFn: notificationService.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        },
    });

    const markOneRead = useMutation({
        mutationFn: (id) => notificationService.markRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        },
    });

    const notificationsData = notificationsRaw?.data || notificationsRaw || {};
    const notifications = Array.isArray(notificationsData?.notifications) ? notificationsData.notifications
        : Array.isArray(notificationsData) ? notificationsData : [];

    const getIcon = (type) => {
        switch (type) {
            case 'mention': return <MessageSquare className="w-5 h-5 text-blue-500" />;
            case 'assignment': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'sla_warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Notification Center</h1>
                    <p className="text-slate-500 mt-1">Stay updated with activity, mentions, and SLA alerts.</p>
                </div>

                <button
                    onClick={() => markAllRead.mutate()}
                    className="btn-primary"
                >
                    <Check className="w-4 h-4" />
                    Mark all as read
                </button>
            </div>

            {/* Filters */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                {['all', 'unread', 'mentions', 'alerts'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-bold transition-all capitalize",
                            filter === f ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center animate-pulse italic text-slate-400 font-bold">Connecting to event bus...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-32 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6 border border-slate-100">
                            <Bell className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Your inbox is clear</h3>
                        <p className="text-slate-500 mt-2">When something happens, you'll see it here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map(notif => (
                            <div
                                key={notif._id}
                                className={cn(
                                    "p-6 flex gap-6 hover:bg-slate-50/50 transition-all cursor-pointer group relative",
                                    !notif.isRead && "bg-blue-50/20"
                                )}
                            >
                                {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    {getIcon(notif.type)}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{notif.type}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}</span>
                                    </div>
                                    <h4 className={cn("text-slate-900 italic", notif.isRead ? "font-medium" : "font-bold text-lg")}>
                                        {notif.message}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                        {notif.description || 'Automatic system update regarding task lifecycle and governance rules.'}
                                    </p>
                                </div>

                                <div className="flex items-start gap-2">
                                    <button onClick={() => markOneRead.mutate(notif._id)} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all">
                                        <CheckCircle2 className="w-5 h-5 text-slate-300 hover:text-green-500" />
                                    </button>
                                    <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all">
                                        <MoreVertical className="w-5 h-5 text-slate-300" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPage;
