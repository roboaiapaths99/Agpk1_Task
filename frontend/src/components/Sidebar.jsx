import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    CheckSquare,
    Layers,
    UserCheck,
    Zap,
    BarChart3,
    Bell,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Building2,
    Download,
    GitMerge,
    GitBranch,
    BookOpen,
    Target,
    Table2,
    Users,
    Shield,
    Sparkles,
    Activity,
    ShieldCheck,
    Sun,
    Moon,
    Workflow,
    MessageSquare,
    DollarSign,
    PieChart,
    Circle
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import useUIStore from '../store/useUI';
import useAuthStore from '../store/useAuth';
import useSocket from '../hooks/useSocket';

const navItems = [
    { icon: Layers, label: 'Module Hub', path: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', tourId: 'dashboard' },
    { icon: CheckSquare, label: 'Kanban', path: '/tasks', tourId: 'tasks' },
    { icon: Table2, label: 'Table', path: '/table' },
    { icon: Layers, label: 'Backlog', path: '/backlog' },
    { icon: Zap, label: 'Sprints', path: '/sprints' },
    { icon: Layers, label: 'Projects', path: '/projects', tourId: 'projects' },
    { icon: BarChart3, label: 'Reports', path: '/reports', tourId: 'reports' },
    { icon: Users, label: 'Team Capacity', path: '/resources' },
    { icon: MessageSquare, label: 'Messenger', path: '/messaging' },
    { icon: Target, label: 'OKRs', path: '/okrs' },
    { icon: DollarSign, label: 'Finance Hub', path: '/finance', tourId: 'finance' },
    { icon: PieChart, label: 'Budgets', path: '/finance/budgets' },
    { icon: UserCheck, label: 'Payroll', path: '/finance/payroll' },
    { icon: Workflow, label: 'Workflows', path: '/workflows' },
    { icon: Activity, label: 'Team Pulse', path: '/team-pulse' },
    { icon: GitBranch, label: 'Work Graph', path: '/work-graph' },
    { icon: Zap, label: 'AI Insights', path: '/insights' },
    { icon: BookOpen, label: 'Docs', path: '/docs' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Building2, label: 'Organization', path: '/organization', adminOnly: true },
    { icon: GitMerge, label: 'Integrations', path: '/integrations', adminOnly: true },
    { icon: Activity, label: 'Activity Feed', path: '/audit', adminOnly: true },
    { icon: Shield, label: 'Roles & Permissions', path: '/rbac', adminOnly: true },
    { icon: ShieldCheck, label: 'SLA Policies', path: '/sla', adminOnly: true },
    { icon: Download, label: 'Export Center', path: '/export', adminOnly: true },
];

// Who's Online Indicator
const OnlineIndicator = ({ isOpen }) => {
    const { user } = useAuthStore();
    const { subscribeToEvent, unsubscribeFromEvent, emitEvent } = useSocket(user?.organizationId);
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const handlePresence = (data) => {
            if (data.resourceType === 'global') {
                setOnlineCount(data.users?.length || 0);
            }
        };

        subscribeToEvent('PRESENCE_UPDATE', handlePresence);
        emitEvent('JOIN_RESOURCE', {
            resourceType: 'global',
            resourceId: 'online',
            userInfo: { name: user.name, avatar: user.avatar }
        });

        return () => {
            unsubscribeFromEvent('PRESENCE_UPDATE', handlePresence);
            emitEvent('LEAVE_RESOURCE', { resourceType: 'global', resourceId: 'online' });
        };
    }, [user]); // eslint-disable-line

    if (onlineCount <= 0) return null;

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-2 mx-3 rounded-lg bg-emerald-500/10 text-emerald-400 transition-all",
            !isOpen && "justify-center mx-1 px-1"
        )}>
            <div className="relative flex-shrink-0">
                <Circle className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                <span className="absolute inset-0 animate-ping">
                    <Circle className="w-2.5 h-2.5 fill-emerald-400/30 text-emerald-400/30" />
                </span>
            </div>
            {isOpen && (
                <span className="text-[11px] font-semibold">
                    {onlineCount} online now
                </span>
            )}
        </div>
    );
};

export const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore();
    const { user, organization, logout } = useAuthStore();

    return (
        <div className={cn(
            "h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 fixed left-0 top-0 z-50",
            isSidebarOpen ? "w-64" : "w-20"
        )}>
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {organization?.name?.substring(0, 1).toUpperCase() || 'AG'}
                </div>
                {isSidebarOpen && <span className="ml-3 font-bold text-white tracking-tight truncate">{organization?.name || 'agpk1-task'}</span>}
            </div>

            {/* Online Indicator */}
            <div className="pt-3">
                <OnlineIndicator isOpen={isSidebarOpen} />
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems
                    .filter(item => !item.adminOnly || user?.role === 'admin')
                    .map((item) => (
                        <NavLink
                            key={item.path + item.label}
                            to={item.path}
                            end={item.path === '/'}
                            data-tour={item.tourId || undefined}
                            className={({ isActive }) => cn(
                                "flex items-center px-3 py-2.5 rounded-lg transition-colors group",
                                isActive ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                        </NavLink>
                    ))}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 space-y-1">
                <button onClick={toggleTheme} className="w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                    {theme === 'light' ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />}
                    {isSidebarOpen && <span className="ml-3 font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
                </button>
                <NavLink
                    to="/settings"
                    data-tour="settings"
                    className={({ isActive }) => cn(
                        "w-full flex items-center px-3 py-2.5 rounded-lg transition-colors",
                        isActive ? "bg-primary text-white" : "hover:bg-slate-800"
                    )}
                >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && <span className="ml-3 font-medium">Settings</span>}
                </NavLink>
                <button onClick={logout} className="w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
                </button>

                <button onClick={toggleSidebar} className="mt-4 w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-all">
                    {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};
