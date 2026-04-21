import React from 'react';
import { Search, Bell, ChevronDown, User, LogOut, Settings, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuth';
import NotificationDropdown from './NotificationDropdown';
import { useQuery } from '@tanstack/react-query';
import { notificationService, commonService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import PresenceAvatars from './common/PresenceAvatars';

const Topbar = () => {
    const { user, organization, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = React.useState(false);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [showSearch, setShowSearch] = React.useState(false);

    const { data: unreadData } = useQuery({
        queryKey: ['unread-count'],
        queryFn: notificationService.getUnreadCount,
        refetchInterval: 30000,
    });

    const unreadCount = unreadData?.data?.count ?? unreadData?.count ?? 0;

    const { data: searchResults } = useQuery({
        queryKey: ['search', search],
        queryFn: () => commonService.search(search),
        enabled: search.length > 1,
    });

    const results = searchResults?.data || { tasks: [], projects: [] };

    return (
        <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex-1 max-w-xl relative">
                <div className="relative group">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
                        onFocus={() => setShowSearch(true)}
                        placeholder="Search tasks, projects, or people..."
                        className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all italic font-medium"
                    />
                </div>

                {showSearch && search.length > 1 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="max-h-[400px] overflow-y-auto p-2 space-y-4">
                            {results.tasks.length > 0 && (
                                <div>
                                    <h4 className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks</h4>
                                    {results.tasks.map(t => (
                                        <button
                                            key={t._id}
                                            onClick={() => { navigate('/tasks'); setShowSearch(false); setSearch(''); }}
                                            className="w-full h-12 px-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{t.title}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.key || 'TASK'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {results.projects.length > 0 && (
                                <div>
                                    <h4 className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Projects</h4>
                                    {results.projects.map(p => (
                                        <button
                                            key={p._id}
                                            onClick={() => { navigate('/projects'); setShowSearch(false); setSearch(''); }}
                                            className="w-full h-12 px-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Layers className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{p.keyPrefix || 'PROJ'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {results.tasks.length === 0 && results.projects.length === 0 && (
                                <div className="p-8 text-center text-slate-400 italic text-sm">No results found.</div>
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 border-t flex justify-center">
                            <button onClick={() => setShowSearch(false)} className="text-[10px] font-black text-slate-400 uppercase hover:text-primary transition-colors tracking-widest">Close Results</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6">
                {organization && (
                    <div className="hidden lg:flex items-center gap-4">
                        <PresenceAvatars 
                            resourceType="GLOBAL" 
                            resourceId={user?.organizationId} 
                            maxAvatars={3}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{organization.name}</span>
                        </div>
                    </div>
                )}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-3 hover:bg-slate-50 rounded-2xl text-slate-500 hover:text-primary transition-all relative group"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce-short">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-50 rounded-2xl transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                            {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-bold text-slate-900 leading-tight italic">{user?.name || 'Guest User'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user?.role || 'Admin'}</p>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showProfile && "rotate-180")} />
                    </button>

                    {showProfile && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={() => { navigate('/settings'); setShowProfile(false); }}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary flex items-center gap-3 transition-colors"
                            >
                                <User className="w-4 h-4" /> Profile
                            </button>
                            <button
                                onClick={() => { navigate('/settings'); setShowProfile(false); }}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary flex items-center gap-3 transition-colors"
                            >
                                <Settings className="w-4 h-4" /> Settings
                            </button>
                            <div className="h-px bg-slate-100 my-2" />
                            <button
                                onClick={logout}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
