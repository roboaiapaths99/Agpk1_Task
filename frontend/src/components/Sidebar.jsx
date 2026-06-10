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
    Circle,
    Package,
    Briefcase,
    Camera
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import useUIStore from '../store/useUI';
import useAuthStore from '../store/useAuth';
import useSocket from '../hooks/useSocket';
import { ChevronDown, Folder } from 'lucide-react';

const navGroups = [
    {
        id: 'core',
        title: 'Core Platform',
        items: [
            { icon: Layers, label: 'Module Hub', path: '/' },
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', tourId: 'dashboard' },
            { icon: MessageSquare, label: 'Messenger', path: '/messaging' },
            { icon: Activity, label: 'Team Pulse', path: '/team-pulse' },
            { icon: Zap, label: 'AI Insights', path: '/insights' },
            { icon: BookOpen, label: 'Docs', path: '/docs' },
            { icon: Bell, label: 'Notifications', path: '/notifications' },
        ]
    },
    {
        id: 'tasks',
        title: 'Tasks & Ops',
        collapsible: true,
        items: [
            { icon: CheckSquare, label: 'Kanban', path: '/tasks', tourId: 'tasks' },
            { icon: Table2, label: 'Table', path: '/table' },
            { icon: Layers, label: 'Backlog', path: '/backlog' },
            { icon: Zap, label: 'Sprints', path: '/sprints' },
            { icon: Layers, label: 'Projects', path: '/projects', tourId: 'projects' },
            { icon: Users, label: 'Team Capacity', path: '/resources' },
            { icon: Workflow, label: 'Workflows', path: '/workflows' },
            { icon: GitBranch, label: 'Work Graph', path: '/work-graph' },
            { icon: BarChart3, label: 'Reports', path: '/reports', tourId: 'reports' },
        ]
    },
    {
        id: 'finance',
        title: 'Finance & Goals',
        collapsible: true,
        items: [
            { icon: DollarSign, label: 'Finance Hub', path: '/finance', tourId: 'finance' },
            { icon: PieChart, label: 'Budgets', path: '/finance/budgets' },
            { icon: UserCheck, label: 'Payroll', path: '/finance/payroll' },
            { icon: Target, label: 'OKRs', path: '/okrs' },
        ]
    },
    {
        id: 'submodules',
        title: 'Submodules',
        collapsible: true,
        items: [
            { icon: Package, label: 'Inventory', externalUrl: 'https://inventory.agpkacademy.in/login' },
            { icon: Briefcase, label: 'CRM', externalUrl: 'https://crm.agpkacademy.in' },
            { icon: Camera, label: 'Attendance Pulse', externalUrl: 'https://attendence-inofice-admin-desk.vercel.app/' },
            { icon: Users, label: 'HRMS Portal', externalUrl: 'https://hrms.agpkacademy.in/' },
        ]
    },
    {
        id: 'admin',
        title: 'Administration',
        collapsible: true,
        adminOnly: true,
        items: [
            { icon: Building2, label: 'Organization', path: '/organization' },
            { icon: GitMerge, label: 'Integrations', path: '/integrations' },
            { icon: Activity, label: 'Activity Feed', path: '/audit' },
            { icon: Shield, label: 'Roles & Permissions', path: '/rbac' },
            { icon: ShieldCheck, label: 'SLA Policies', path: '/sla' },
            { icon: Download, label: 'Export Center', path: '/export' },
        ]
    }
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
    const location = useLocation();

    const [openGroups, setOpenGroups] = useState({
        tasks: false,
        finance: false,
        submodules: false,
        admin: false
    });

    useEffect(() => {
        const currentPath = location.pathname;
        navGroups.forEach(group => {
            if (group.collapsible) {
                const isActive = group.items.some(item => item.path === currentPath);
                if (isActive) {
                    setOpenGroups(prev => ({ ...prev, [group.id]: true }));
                }
            }
        });
    }, [location.pathname]);

    const toggleGroup = (groupId) => {
        if (!isSidebarOpen) {
            toggleSidebar();
        }
        setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const groupIcons = {
        tasks: CheckSquare,
        finance: DollarSign,
        submodules: Layers,
        admin: Shield
    };

    const renderItem = (item) => {
        if (item.externalUrl) {
            return (
                <a
                    key={item.label}
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 rounded-lg transition-colors group hover:bg-slate-800 hover:text-white text-slate-300 text-xs font-semibold"
                >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
                </a>
            );
        }
        return (
            <NavLink
                key={item.path + item.label}
                to={item.path}
                end={item.path === '/'}
                data-tour={item.tourId || undefined}
                className={({ isActive }) => cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors group text-xs font-semibold",
                    isActive ? "bg-primary text-white" : "hover:bg-slate-800 hover:text-white"
                )}
            >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
            </NavLink>
        );
    };

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
            <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar">
                {navGroups
                    .filter(group => !group.adminOnly || user?.role === 'admin')
                    .map((group) => {
                        const isGroupActive = group.items.some(item => item.path === location.pathname);

                        if (group.collapsible) {
                            const Icon = groupIcons[group.id] || Folder;
                            const isOpen = openGroups[group.id] && isSidebarOpen;

                            return (
                                <div key={group.id} className="space-y-1">
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left group/btn",
                                            isGroupActive ? "text-primary font-bold" : "text-slate-400 hover:text-white hover:bg-slate-850"
                                        )}
                                    >
                                        <div className="flex items-center min-w-0">
                                            <Icon className={cn("w-4 h-4 flex-shrink-0", isGroupActive ? "text-primary" : "text-slate-500 group-hover/btn:text-slate-300")} />
                                            {isSidebarOpen && (
                                                <span className="ml-3 text-[10px] font-black uppercase tracking-wider truncate">
                                                    {group.title}
                                                </span>
                                            )}
                                        </div>
                                        {isSidebarOpen && (
                                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
                                        )}
                                    </button>
                                    {isOpen && isSidebarOpen && (
                                        <div className="pl-3 mt-1 space-y-1 border-l border-slate-800 ml-4.5">
                                            {group.items.map(renderItem)}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div key={group.id} className="space-y-1">
                                {isSidebarOpen && (
                                    <span className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                                        {group.title}
                                    </span>
                                )}
                                {group.items.map(renderItem)}
                            </div>
                        );
                    })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 space-y-1">
                <button onClick={toggleTheme} className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-xs font-semibold">
                    {theme === 'light' ? <Moon className="w-4 h-4 flex-shrink-0" /> : <Sun className="w-4 h-4 flex-shrink-0" />}
                    {isSidebarOpen && <span className="ml-3 font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
                </button>
                <NavLink
                    to="/settings"
                    data-tour="settings"
                    className={({ isActive }) => cn(
                        "w-full flex items-center px-3 py-2 rounded-lg transition-colors text-xs font-semibold",
                        isActive ? "bg-primary text-white" : "hover:bg-slate-800"
                    )}
                >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    {isSidebarOpen && <span className="ml-3 font-medium">Settings</span>}
                </NavLink>
                <button onClick={logout} className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-semibold">
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
                </button>

                <button onClick={toggleSidebar} className="mt-4 w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-all">
                    {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};
