import React from 'react';
import {
    Bell,
    CheckCircle2,
    Clock,
    MessageSquare,
    AlertTriangle,
    ExternalLink,
    MoreHorizontal
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: notificationsRaw, isLoading } = useQuery({
        queryKey: ['notifications-dropdown'],
        queryFn: () => notificationService.getAll({ limit: 5 }),
        enabled: isOpen
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationService.markAllRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }
    });

    const markReadMutation = useMutation({
        mutationFn: (id) => notificationService.markRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }
    });

    if (!isOpen) return null;

    const nd = notificationsRaw?.data || notificationsRaw || {};
    const notifications = Array.isArray(nd?.notifications) ? nd.notifications
        : Array.isArray(nd) ? nd : [];

    const getIcon = (type) => {
        switch (type) {
            case 'mention': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'assignment': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'sla_warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="absolute top-full right-0 mt-4 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900 italic tracking-tight">Notifications</h3>
                <button 
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {markAllReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse italic">Scanning frequency...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                            <Bell className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">All clear!</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif._id}
                            className={cn(
                                "p-4 border-b last:border-0 hover:bg-slate-50 transition-colors flex gap-4 cursor-pointer group",
                                !notif.read && "bg-blue-50/30"
                            )}
                            onClick={() => {
                                markReadMutation.mutate(notif._id);
                                if (notif.link) navigate(notif.link);
                                onClose();
                            }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className={cn("text-xs leading-snug", notif.read ? "text-slate-500" : "text-slate-900 font-bold italic")}>
                                    {notif.message}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 bg-slate-50 border-t">
                <button
                    onClick={() => { navigate('/notifications'); onClose(); }}
                    className="w-full py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2"
                >
                    View all notifications
                    <ExternalLink className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
