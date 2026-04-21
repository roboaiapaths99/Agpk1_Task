import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    GitMerge, Plus, Trash2, Save, MoveRight, Layers,
    Settings2, ChevronRight, CheckCircle2, Circle, AlertCircle, Loader2, X, Sparkles,
    ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

import { workflowService, aiService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import ReactFlow, {
    Controls,
    Background,
    MarkerType,
    useNodesState,
    useEdgesState,
    addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';

const CreateWorkflowModal = ({ isOpen, onClose, onSubmit, isPending }) => {
    // ... existing CreateWorkflowModal code stays the same (I will skip repeating it if possible, but replace_file_content needs contiguous block)
    // I will just replace from the imports down to the component logic.

    const [form, setForm] = useState({ name: '', description: '' });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 italic">New Workflow</h2>
                        <p className="text-xs text-slate-400 mt-1">Initialize a standard state machine</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Workflow Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Bug Tracking"
                            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Short summary..."
                            rows={2}
                            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-6 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                    <button
                        onClick={() => onSubmit({
                            ...form,
                            states: [
                                { name: 'TODO', type: 'initial', color: '#cbd5e1' },
                                { name: 'IN_PROGRESS', type: 'active', color: '#3b82f6' },
                                { name: 'DONE', type: 'terminal', color: '#22c55e' }
                            ],
                            defaultState: 'TODO',
                            transitions: []
                        })}

                        disabled={!form.name.trim() || isPending}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

// Define nodeTypes and edgeTypes outside for performance as per React Flow docs
const NODE_TYPES = {};
const EDGE_TYPES = {};

export default function WorkflowPage() {
    const queryClient = useQueryClient();
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const { data: workflows, isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: async () => {
            const res = await workflowService.getAll();
            const safeWf = res?.workflows || res?.data?.workflows || res?.data || res || [];
            return Array.isArray(safeWf) ? safeWf : [];
        }
    });

    const updateWorkflow = useMutation({
        mutationFn: (data) => workflowService.update(selectedWorkflow._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['workflows']);
        }
    });

    const createMutation = useMutation({
        mutationFn: (data) => workflowService.create(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['workflows']);
            setIsCreateOpen(false);
            const createdWf = res.workflow || res.data?.workflow;
            if (createdWf) {
                setSelectedWorkflow(createdWf);
            }
        },
        onError: (err) => {
            console.error(err);
        }
    });

    const handleAIGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            const res = await aiService.generateWorkflow(aiPrompt);
            const data = res.data;
            if (data) {
                // Update active workflow locally and in editor
                const newNodes = data.states.map((s, i) => ({
                    id: s.name,
                    data: { label: <span className="font-black text-xs uppercase tracking-tighter">{s.name}</span> },
                    position: { x: 100 + (i * 200), y: i % 2 === 0 ? 100 : 250 },
                    style: {
                        borderRadius: '16px',
                        border: `2px solid ${s.color || '#cbd5e1'}`,
                        background: '#fff',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        width: 150
                    }
                }));

                const newEdges = data.transitions.map((t, i) => ({
                    id: `e-${t.from}-${t.to}-${i}`,
                    source: t.from,
                    target: t.to,
                    animated: true,
                    style: { stroke: '#334155', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#334155' }
                }));

                setNodes(newNodes);
                setEdges(newEdges);

                // Automatically persist the AI-generated structure to the backend
                const states = data.states.map((s, i) => ({
                    name: s.name,
                    type: s.type || 'active',
                    color: s.color || '#cbd5e1',
                    position: { x: 100 + (i * 200), y: i % 2 === 0 ? 100 : 250 }
                }));

                const transitions = data.transitions.map(t => ({
                    from: t.from,
                    to: t.to,
                    requiresComment: !!t.requiresComment
                }));

                updateWorkflow.mutate({ states, transitions });

                toast.success('AI successfully architected and saved the workflow');
                setAiPrompt('');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to generate');
        } finally {
            setIsGenerating(false);
        }
    };


    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const activeWf = selectedWorkflow || workflows?.[0];

    React.useEffect(() => {
        if (activeWf) {
            const initialNodes = activeWf.states.map((s, i) => ({
                id: s.name,
                data: { label: <span className="font-black text-xs uppercase tracking-tighter">{s.name}</span> },
                position: s.position || { x: 100 + (i * 200), y: i % 2 === 0 ? 100 : 250 },
                style: {
                    borderRadius: '16px',
                    border: `2px solid ${s.color || '#cbd5e1'}`,
                    background: '#fff',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    width: 150
                }
            }));

            const initialEdges = activeWf.transitions.map((t, i) => ({
                id: `e-${t.from}-${t.to}-${i}`,
                source: t.from,
                target: t.to,
                animated: true,
                label: t.requiresComment ? '!' : '',
                style: { stroke: '#334155', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#334155' }
            }));

            setNodes(initialNodes);
            setEdges(initialEdges);
        }
    }, [activeWf, setNodes, setEdges]);

    const onConnect = React.useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#334155', strokeWidth: 2 } }, eds)), [setEdges]);

    const handleSave = () => {
        const states = nodes.map(n => ({
            name: n.id,
            type: activeWf.states.find(s => s.name === n.id)?.type || 'active',
            color: n.style?.border?.split(' ')[2] || '#cbd5e1',
            position: n.position
        }));

        const transitions = edges.map(e => ({
            from: e.source,
            to: e.target,
            requiresComment: e.label === '!'
        }));

        updateWorkflow.mutate({ states, transitions });
        toast.success('Workflow configuration saved locally');
    };

    if (isLoading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <GitMerge className="w-8 h-8 text-primary" />
                        Workflow Engine
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Design state machines and transition rules for your tasks.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Workflow
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar: Workflow List */}
                <div className="col-span-3 space-y-3">
                    {workflows?.map(wf => (
                        <button
                            key={wf._id}
                            onClick={() => setSelectedWorkflow(wf)}
                            className={cn(
                                "w-full text-left p-4 rounded-2xl border-2 transition-all group",
                                activeWf?._id === wf._id
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-transparent bg-white hover:border-slate-200"
                            )}
                        >
                            <h3 className={cn(
                                "font-black text-sm uppercase tracking-wider",
                                activeWf?._id === wf._id ? "text-primary" : "text-slate-600"
                            )}>{wf.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{wf.description}</p>
                        </button>
                    ))}
                </div>

                {/* Main: Workflow Editor */}
                <div className="col-span-9 space-y-6">
                    {activeWf ? (
                        <>
                            <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8 border-b pb-6 border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                            <Settings2 className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{activeWf.name}</h2>
                                            <p className="text-sm text-slate-400 font-bold italic">{activeWf.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={updateWorkflow.isPending}
                                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
                                    >
                                        {updateWorkflow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        <Sparkles className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-indigo-900 uppercase tracking-tight">AI Flow Generator</h3>
                                        <p className="text-xs text-indigo-600 mb-2">Describe your process and let AI build the state machine</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={aiPrompt}
                                                onChange={e => setAiPrompt(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
                                                placeholder="Describe steps (e.g. Backlog -> Dev -> QA -> Done)..."
                                                className="flex-1 px-4 py-2 text-sm rounded-xl border-none shadow-inner focus:ring-2 focus:ring-indigo-300 outline-none"
                                            />
                                            <button
                                                onClick={handleAIGenerate}
                                                disabled={isGenerating || !aiPrompt}
                                                className="bg-indigo-600 text-white px-4 rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ReactFlow Visualization */}
                                <div className="h-[500px] w-full bg-slate-50 border-2 border-slate-100 rounded-3xl overflow-hidden mt-6 relative">
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        onNodesChange={onNodesChange}
                                        onEdgesChange={onEdgesChange}
                                        onConnect={onConnect}
                                        nodeTypes={NODE_TYPES}
                                        edgeTypes={EDGE_TYPES}
                                        fitView
                                    >
                                        <Background color="#cbd5e1" gap={16} size={2} />
                                        <Controls className="bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden" />
                                    </ReactFlow>
                                </div>
                            </div>


                            {/* Help / Tip Card */}
                            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex gap-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-primary uppercase tracking-tight">Pro Tip: Restricted Transitions</h4>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        Use "Allowed Roles" to restrict sensitive transitions (like moving to QA or Production) to managers only.
                                        Enable "Reason Required" to ensure every status change is documented in the task's activity log.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <Layers className="w-16 h-16 text-slate-100 mb-4" />
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight">No Workflows Found</h3>
                            <p className="text-slate-400 mt-2">Create your first workflow to start enforcing process rules.</p>
                            <button onClick={() => setIsCreateOpen(true)} className="btn-primary mt-6"><Plus className="w-4 h-4" /> New Workflow</button>
                        </div>
                    )}
                </div>
            </div>

            <CreateWorkflowModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={(data) => createMutation.mutate(data)}
                isPending={createMutation.isPending}
            />
        </div>
    );
}
