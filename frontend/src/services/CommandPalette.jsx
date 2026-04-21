import React, { useState, useEffect, useRef } from 'react';
import * as ReactQuery from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Search, FileText, CheckSquare, Layers, User, Loader2,
    Command, CornerDownLeft, Shield, Sparkles, LayoutDashboard
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from './api/axios';

const useGlobalSearch = (query) => {
    return ReactQuery.useQuery({
        queryKey: ['global-search', query],
        queryFn: async () => {
            if (!query || query.trim().length === 0) return { tasks: [], projects: [], docs: [], users: [] };
            const res = await api.get('/search/global', { params: { q: query } });
            return res.data;
        },
        enabled: query.trim().length > 0,
        staleTime: 1000 * 60,
    });
};

const ICONS = {
    task: CheckSquare,
    project: Layers,
    doc: FileText,
    user: User,
    audit: Shield,
    ai: Sparkles,
    dashboard: LayoutDashboard
};

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const { data: results, isLoading } = useGlobalSearch(debouncedQuery);

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard shortcuts (Cmd/Ctrl + K)
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Flatten results for navigation
    const flatResults = React.useMemo(() => {
        if (!results) return [];
        return [
            ...(results.projects || []),
            ...(results.tasks || []),
            ...(results.docs || []),
            ...(results.users || []),
            { id: 'qa-audit', title: 'View Audit Logs', subtitle: 'Compliance & Activity History', type: 'audit', url: '/audit' },
            { id: 'qa-insights', title: 'AI Operational Insights', subtitle: 'Team Health & performance', type: 'ai', url: '/dashboard?tab=insights' },
        ];
    }, [results]);

    // Handle keyboard navigation inside palette
    useEffect(() => {
        if (!isOpen) return;
        const down = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) => (i + 1) % (flatResults.length || 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) => (i - 1 + (flatResults.length || 1)) % (flatResults.length || 1));
            }
            if (e.key === 'Enter' && flatResults.length > 0) {
                e.preventDefault();
                const selected = flatResults[selectedIndex];
                if (selected?.url) {
                    navigate(selected.url);
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, flatResults, selectedIndex, navigate]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [flatResults]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) setTimeout(() => inputRef.current.focus(), 50);
        if (!isOpen) { setQuery(''); setDebouncedQuery(''); }
    }, [isOpen]);

    if (!isOpen) return null;

    const renderGroup = (title, items, startIndex) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="mb-4">
                <h4 className="px-4 text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
                <div className="space-y-1 px-2">
                    {items.map((item, localIndex) => {
                        const globalIndex = startIndex + localIndex;
                        const isSelected = selectedIndex === globalIndex;
                        const Icon = ICONS[item.type] || Search;
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all",
                                    isSelected ? "bg-primary text-white" : "hover:bg-slate-100 text-slate-700"
                                )}
                                onClick={() => {
                                    if (item.url) { navigate(item.url); setIsOpen(false); }
                                }}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                            >
                                <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-slate-400")} />
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-semibold truncate", isSelected ? "text-white" : "text-slate-900")}>
                                        {item.title}
                                    </p>
                                    {item.subtitle && (
                                        <p className={cn("text-xs truncate", isSelected ? "text-primary-foreground/80" : "text-slate-400")}>
                                            {item.subtitle}
                                        </p>
                                    )}
                                </div>
                                {isSelected && <CornerDownLeft className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm px-4" onClick={() => setIsOpen(false)}>
            <div
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tasks, projects, docs, or people..."
                        className="flex-1 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-300 font-medium"
                    />
                    {isLoading && <Loader2 className="w-4 h-4 text-slate-300 animate-spin shrink-0" />}
                    <div className="flex items-center gap-1 shrink-0 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                        <Command className="w-3 h-3" /> ESC
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {query.trim().length === 0 ? (
                        <div className="py-2">
                            <div className="px-4 py-3 mb-2 bg-slate-50 border-y border-slate-100 flex items-center gap-3">
                                <Search className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type to search or select a Quick Action</span>
                            </div>

                            <h4 className="px-4 text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Quick Actions</h4>
                            <div className="space-y-1 px-2">
                                <div
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 text-slate-700"
                                    onClick={() => { navigate('/audit'); setIsOpen(false); }}
                                >
                                    <Shield className="w-4 h-4 text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">Security Audit Logs</p>
                                        <p className="text-xs text-slate-400">View compliance and system history</p>
                                    </div>
                                </div>
                                <div
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 text-slate-700"
                                    onClick={() => { navigate('/dashboard?tab=insights'); setIsOpen(false); }}
                                >
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">AI Insights Engine</p>
                                        <p className="text-xs text-slate-400">Strategic team health analysis</p>
                                    </div>
                                </div>
                                <div
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 text-slate-700"
                                    onClick={() => { navigate('/tasks'); setIsOpen(false); }}
                                >
                                    <CheckSquare className="w-4 h-4 text-green-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">My Active Tasks</p>
                                        <p className="text-xs text-slate-400">Quickly resume your work</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : flatResults.length === 0 && !isLoading ? (
                        <div className="px-6 py-8 text-center text-slate-400 text-sm">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <>
                            {renderGroup('Projects', results?.projects, 0)}
                            {renderGroup('Tasks', results?.tasks, (results?.projects?.length || 0))}
                            {renderGroup('Documents', results?.docs, (results?.projects?.length || 0) + (results?.tasks?.length || 0))}
                            {renderGroup('People', results?.users, (results?.projects?.length || 0) + (results?.tasks?.length || 0) + (results?.docs?.length || 0))}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm">↑↓</span> to navigate</span>
                        <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm"><CornerDownLeft className="w-2 h-2 inline" /></span> to select</span>
                    </div>
                    <div>Global Search</div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
