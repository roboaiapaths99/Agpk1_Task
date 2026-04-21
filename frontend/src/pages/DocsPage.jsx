import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as ReactQuery from '@tanstack/react-query';
import {
    BookOpen, Plus, Search, Clock, User, Tag, Link as LinkIcon,
    MoreHorizontal, Archive, Loader2, ChevronRight, ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { docService } from '../services/api/apiServices';
import DocEditor from '../components/Docs/DocEditor';
import DocSidebar from '../components/Docs/DocSidebar';
import TemplateSelector from '../components/Docs/TemplateSelector';

const DocsPage = () => {
    const { useQuery, useMutation, useQueryClient } = ReactQuery;
    const queryClient = useQueryClient();
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
    const autoSaveTimerRef = useRef(null);

    // Fetch doc tree
    const { data: treeData } = useQuery({
        queryKey: ['doc-tree'],
        queryFn: async () => {
            const res = await docService.getTree();
            const safeTree = res?.tree || res?.data?.tree || res?.data || res || [];
            return Array.isArray(safeTree) ? safeTree : [];
        },
    });

    // Fetch selected doc
    const { data: docData, isLoading: docLoading } = useQuery({
        queryKey: ['doc', selectedDocId],
        queryFn: async () => {
            const res = await docService.getById(selectedDocId);
            return res.document;
        },
        enabled: !!selectedDocId,
    });

    // Create doc mutation
    const createMutation = useMutation({
        mutationFn: (data) => docService.create(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['doc-tree'] });
            setSelectedDocId(res.document._id);
            setIsTemplateOpen(false);
        },
        onError: (err) => {
            console.error('Failed to create doc:', err);
            // Error toast handled globally via interceptor
        }
    });

    // Update doc mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => docService.update(id, data),
        onSuccess: () => {
            setAutoSaveStatus('saved');
            queryClient.invalidateQueries({ queryKey: ['doc-tree'] });
        },
    });

    // Archive mutation
    const archiveMutation = useMutation({
        mutationFn: (id) => docService.archive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-tree'] });
            setSelectedDocId(null);
        },
    });

    // Auto-save with debounce
    const handleContentUpdate = useCallback((content) => {
        if (!selectedDocId) return;
        setAutoSaveStatus('saving...');

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        autoSaveTimerRef.current = setTimeout(() => {
            updateMutation.mutate({ id: selectedDocId, data: { content } });
        }, 2000);
    }, [selectedDocId, updateMutation]);

    // Title update
    const handleTitleUpdate = useCallback((e) => {
        const newTitle = e.target.innerText;
        if (!selectedDocId || !newTitle.trim()) return;
        updateMutation.mutate({ id: selectedDocId, data: { title: newTitle.trim() } });
    }, [selectedDocId, updateMutation]);

    // Create from template
    const handleTemplateSelect = (templateType) => {
        createMutation.mutate({ templateType });
    };

    const selectedDoc = docData;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-50/50">
            {/* Sidebar */}
            <div className="w-64 shrink-0 hidden md:block">
                <DocSidebar
                    tree={treeData || []}
                    selectedId={selectedDocId}
                    onSelect={setSelectedDocId}
                    onCreateDoc={() => setIsTemplateOpen(true)}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {selectedDoc ? (
                    <div className="max-w-4xl mx-auto">
                        {/* Doc Header */}
                        <div className="p-6 md:p-10 pb-0">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Documents</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-slate-600 font-semibold">{selectedDoc.title}</span>
                            </div>

                            {/* Title */}
                            <div className="flex items-start gap-3 mb-4">
                                <span className="text-4xl mt-1">{selectedDoc.icon || '📄'}</span>
                                <h1
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={handleTitleUpdate}
                                    className="text-3xl md:text-4xl font-black text-slate-900 italic tracking-tight outline-none border-b-2 border-transparent focus:border-primary/30 transition-all flex-1 min-w-0"
                                >
                                    {selectedDoc.title}
                                </h1>
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pb-4 border-b border-slate-100">
                                <span className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    {selectedDoc.createdBy?.name || 'Unknown'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(selectedDoc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={cn(
                                    'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                    autoSaveStatus === 'saved' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'
                                )}>
                                    {autoSaveStatus === 'saved' ? '✓ Saved' : '⏳ Saving...'}
                                </span>
                                {selectedDoc.version > 1 && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                        v{selectedDoc.version}
                                    </span>
                                )}

                                <div className="flex-grow" />
                                <button
                                    onClick={() => archiveMutation.mutate(selectedDocId)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all"
                                    title="Archive document"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Linked Tasks */}
                            {selectedDoc.linkedTasks && selectedDoc.linkedTasks.length > 0 && (
                                <div className="mt-4 mb-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Linked Tasks</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDoc.linkedTasks.map((task) => (
                                            <span key={task._id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                                                <LinkIcon className="w-3 h-3" />
                                                {task.key || task.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Editor */}
                        <div className="p-6 md:px-10">
                            <div className="glass-card overflow-hidden">
                                <DocEditor
                                    content={selectedDoc.content}
                                    onUpdate={handleContentUpdate}
                                />
                            </div>
                        </div>
                    </div>
                ) : docLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-indigo-100 flex items-center justify-center mb-6">
                            <BookOpen className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 italic mb-2">Internal Wiki</h2>
                        <p className="text-sm text-slate-400 max-w-sm mb-6">
                            Your team's single source of truth. Create documents, link them to tasks, and collaborate in real time.
                        </p>
                        <button
                            onClick={() => setIsTemplateOpen(true)}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Create Document
                        </button>
                    </div>
                )}
            </div>

            {/* Template Selector Modal */}
            <TemplateSelector
                isOpen={isTemplateOpen}
                onClose={() => setIsTemplateOpen(false)}
                onSelect={handleTemplateSelect}
            />
        </div>
    );
};

export default DocsPage;
