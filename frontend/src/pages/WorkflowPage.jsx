import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    GitMerge, Plus, Trash2, Save, MoveRight, Layers,
    Settings2, ChevronRight, CheckCircle2, Circle, AlertCircle, Loader2, X, Sparkles,
    ChevronDown, Mail, UserCheck, RefreshCw, MessageSquare, Send, Play, Clock,
    FileCheck, Paperclip, Globe, Cpu, RotateCcw, PlayCircle
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

// ─── Prototyper Automation Blocks ───────────────────────────
const ACTIONS_LIST = [
    { type: 'email', label: 'Send Email', icon: Mail, color: 'border-rose-500 text-rose-500 bg-rose-50/30', desc: 'Trigger email notification' },
    { type: 'assign', label: 'Assign Task', icon: UserCheck, color: 'border-blue-500 text-blue-500 bg-blue-50/30', desc: 'Assign task to a member' },
    { type: 'status', label: 'Update Status', icon: RefreshCw, color: 'border-emerald-500 text-emerald-500 bg-emerald-50/30', desc: 'Transition task status' },
    { type: 'comment', label: 'Add Comment', icon: MessageSquare, color: 'border-indigo-500 text-indigo-500 bg-indigo-50/30', desc: 'Post automated comment' },
    { type: 'slack', label: 'Slack Alert', icon: Send, color: 'border-teal-500 text-teal-500 bg-teal-50/30', desc: 'Send Slack channel notification' },
    { type: 'timer', label: 'Start Timer', icon: Play, color: 'border-amber-500 text-amber-500 bg-amber-50/30', desc: 'Start tracking logged hours' },
    { type: 'sla', label: 'Check SLA', icon: Clock, color: 'border-rose-600 text-rose-600 bg-rose-50/30', desc: 'Check deadline compliance' },
    { type: 'subtask', label: 'Create Sub-task', icon: Plus, color: 'border-violet-500 text-violet-500 bg-violet-50/30', desc: 'Spawn a child subtask' },
    { type: 'approval', label: 'Request Approval', icon: FileCheck, color: 'border-cyan-500 text-cyan-500 bg-cyan-50/30', desc: 'Block task until approved' },
    { type: 'attachment', label: 'Require File', icon: Paperclip, color: 'border-slate-500 text-slate-500 bg-slate-50/30', desc: 'Check for task attachment' },
    { type: 'webhook', label: 'API Webhook', icon: Globe, color: 'border-sky-500 text-sky-500 bg-sky-50/30', desc: 'Post generic web request' },
    { type: 'ai_risk', label: 'AI Risk Check', icon: Cpu, color: 'border-purple-500 text-purple-500 bg-purple-50/30', desc: 'Run delay risk evaluation' },
];

const CreateWorkflowModal = ({ isOpen, onClose, onSubmit, isPending }) => {
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
                                { type: 'active', name: 'IN_PROGRESS', color: '#3b82f6' },
                                { type: 'terminal', name: 'DONE', color: '#22c55e' }
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

const NODE_TYPES = {};
const EDGE_TYPES = {};

export default function WorkflowPage() {
    const queryClient = useQueryClient();
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // React Flow States
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Prototyper state variables
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [simulatingNodeId, setSimulatingNodeId] = useState(null);
    const [simulatingEdgeId, setSimulatingEdgeId] = useState(null);

    // Display / Memo Lists for Flow Simulation (Indigo Pulsing Glow)
    const displayNodes = useMemo(() => {
        return nodes.map(n => {
            if (n.id === simulatingNodeId) {
                return {
                    ...n,
                    style: {
                        ...n.style,
                        transform: 'scale(1.05)',
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)',
                        borderColor: '#6366f1',
                        backgroundColor: '#f5f3ff',
                        transition: 'all 0.2s ease-in-out',
                    }
                };
            }
            return n;
        });
    }, [nodes, simulatingNodeId]);

    const displayEdges = useMemo(() => {
        return edges.map(e => {
            if (e.id === simulatingEdgeId) {
                return {
                    ...e,
                    animated: true,
                    style: {
                        ...e.style,
                        stroke: '#6366f1',
                        strokeWidth: 4,
                        transition: 'all 0.2s ease-in-out',
                    }
                };
            }
            return e;
        });
    }, [edges, simulatingEdgeId]);

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

    // Drag and Drop Event Handlers
    const onDragStart = (event, nodeType, actionLabel, actionColor) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', actionLabel);
        event.dataTransfer.setData('application/reactflow-color', actionColor);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = React.useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = React.useCallback((event) => {
        event.preventDefault();
        if (!reactFlowInstance) return;

        const type = event.dataTransfer.getData('application/reactflow');
        const label = event.dataTransfer.getData('application/reactflow-label');
        const colorClass = event.dataTransfer.getData('application/reactflow-color');

        if (!type || !label) return;

        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const nodeId = `${type}_${Date.now()}`;

        // Get border color based on color class
        let borderColor = '#cbd5e1';
        if (colorClass.includes('border-rose-500')) borderColor = '#f43f5e';
        else if (colorClass.includes('border-blue-500')) borderColor = '#3b82f6';
        else if (colorClass.includes('border-emerald-500')) borderColor = '#10b981';
        else if (colorClass.includes('border-indigo-500')) borderColor = '#6366f1';
        else if (colorClass.includes('border-teal-500')) borderColor = '#14b8a6';
        else if (colorClass.includes('border-amber-500')) borderColor = '#f59e0b';
        else if (colorClass.includes('border-rose-600')) borderColor = '#e11d48';
        else if (colorClass.includes('border-violet-500')) borderColor = '#8b5cf6';
        else if (colorClass.includes('border-cyan-500')) borderColor = '#06b6d4';
        else if (colorClass.includes('border-slate-500')) borderColor = '#64748b';
        else if (colorClass.includes('border-sky-500')) borderColor = '#0ea5e9';
        else if (colorClass.includes('border-purple-500')) borderColor = '#a855f7';

        const newNode = {
            id: nodeId,
            type: 'default',
            position,
            data: { label: <span className="font-black text-xs uppercase tracking-tighter flex items-center gap-1.5 justify-center">{label}</span> },
            style: {
                borderRadius: '16px',
                border: `2px solid ${borderColor}`,
                background: '#fff',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                width: 150
            }
        };

        setNodes((nds) => nds.concat(newNode));
        toast.success(`Dropped block: ${label}`);
    }, [reactFlowInstance, setNodes]);

    // Flow Simulation Handler
    const handleSimulate = async () => {
        if (nodes.length === 0) {
            toast.error('Add at least one node to simulate.');
            return;
        }

        toast.info('Starting workflow automation simulation...', { duration: 2000 });
        
        const incomingCount = {};
        nodes.forEach(n => incomingCount[n.id] = 0);
        edges.forEach(e => {
            if (incomingCount[e.target] !== undefined) {
                incomingCount[e.target]++;
            }
        });

        const startNode = nodes.find(n => incomingCount[n.id] === 0) || nodes[0];
        if (!startNode) return;

        const queue = [startNode.id];
        const visited = new Set();
        const traversalOrder = [];
        const traversalEdges = [];

        while (queue.length > 0) {
            const currId = queue.shift();
            if (visited.has(currId)) continue;
            visited.add(currId);
            traversalOrder.push(currId);

            const outgoing = edges.filter(e => e.source === currId);
            outgoing.forEach(e => {
                traversalEdges.push(e.id);
                if (!visited.has(e.target)) {
                    queue.push(e.target);
                }
            });
        }

        for (let i = 0; i < traversalOrder.length; i++) {
            const nodeId = traversalOrder[i];
            setSimulatingNodeId(nodeId);
            
            const parentEdge = edges.find(e => e.target === nodeId && traversalOrder.includes(e.source));
            if (parentEdge) {
                setSimulatingEdgeId(parentEdge.id);
            } else {
                setSimulatingEdgeId(null);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setSimulatingNodeId(null);
        setSimulatingEdgeId(null);
        toast.success('Simulation completed successfully!');
    };

    const handleClearCanvas = () => {
        if (window.confirm('Are you sure you want to clear the canvas? This will delete all nodes and connections.')) {
            setNodes([]);
            setEdges([]);
            toast.success('Canvas cleared.');
        }
    };

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

            <div className="grid grid-cols-12 gap-6">
                {/* Sidebar: Workflow List */}
                <div className="col-span-2 space-y-3">
                    {workflows?.map(wf => (
                        <button
                            key={wf._id}
                            onClick={() => setSelectedWorkflow(wf)}
                            className={cn(
                                "w-full text-left p-3.5 rounded-2xl border-2 transition-all group",
                                activeWf?._id === wf._id
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-transparent bg-white hover:border-slate-200"
                            )}
                        >
                            <h3 className={cn(
                                "font-black text-xs uppercase tracking-wider",
                                activeWf?._id === wf._id ? "text-primary" : "text-slate-600"
                            )}>{wf.name}</h3>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{wf.description}</p>
                        </button>
                    ))}
                </div>

                {/* Main: Workflow Editor */}
                <div className="col-span-7 space-y-6">
                    {activeWf ? (
                        <>
                            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6 border-b pb-4 border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                                            <Settings2 className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">{activeWf.name}</h2>
                                            <p className="text-xs text-slate-400 font-bold italic truncate">{activeWf.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSimulate}
                                            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-2 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors"
                                        >
                                            <PlayCircle className="w-3.5 h-3.5" />
                                            Simulate
                                        </button>
                                        <button
                                            onClick={handleClearCanvas}
                                            className="flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-100 px-3 py-2 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Clear
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={updateWorkflow.isPending}
                                            className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-black transition-colors disabled:opacity-50"
                                        >
                                            {updateWorkflow.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            Save
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                        <Sparkles className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-black text-indigo-900 uppercase tracking-tight">AI Flow Generator</h3>
                                        <div className="flex gap-2 mt-1.5">
                                            <input
                                                type="text"
                                                value={aiPrompt}
                                                onChange={e => setAiPrompt(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
                                                placeholder="Describe steps (e.g. Backlog -> Dev -> QA -> Done)..."
                                                className="flex-1 px-3 py-1.5 text-xs rounded-lg border-none shadow-inner focus:ring-2 focus:ring-indigo-300 outline-none"
                                            />
                                            <button
                                                onClick={handleAIGenerate}
                                                disabled={isGenerating || !aiPrompt}
                                                className="bg-indigo-600 text-white px-3.5 rounded-lg font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Generate"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ReactFlow Visualization */}
                                <div className="h-[520px] w-full bg-slate-50 border-2 border-slate-100 rounded-3xl overflow-hidden mt-5 relative">
                                    <ReactFlow
                                        nodes={displayNodes}
                                        edges={displayEdges}
                                        onNodesChange={onNodesChange}
                                        onEdgesChange={onEdgesChange}
                                        onConnect={onConnect}
                                        onInit={setReactFlowInstance}
                                        onDragOver={onDragOver}
                                        onDrop={onDrop}
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
                            <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10 flex gap-3">
                                <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-primary uppercase tracking-tight">Pro Tip: Restricted Transitions</h4>
                                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                        Use "Allowed Roles" to restrict sensitive transitions (like moving to QA or Production) to managers only.
                                        Enable "Reason Required" to ensure every status change is documented in the task's activity log.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <Layers className="w-14 h-14 text-slate-100 mb-3" />
                            <h3 className="text-lg font-black text-slate-300 uppercase tracking-tight">No Workflows Found</h3>
                            <p className="text-xs text-slate-400 mt-1.5">Create your first workflow to start enforcing process rules.</p>
                            <button onClick={() => setIsCreateOpen(true)} className="btn-primary mt-5"><Plus className="w-3.5 h-3.5" /> New Workflow</button>
                        </div>
                    )}
                </div>

                {/* Sidebar: Action Toolbar */}
                <div className="col-span-3 bg-slate-50/50 rounded-3xl border-2 border-slate-100 p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            Action Toolbar
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold italic mt-0.5">Drag & drop action blocks onto the canvas to construct automation rules</p>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[640px] pr-1 custom-scrollbar">
                        {ACTIONS_LIST.map((action) => {
                            const IconComponent = action.icon;
                            return (
                                <div
                                    key={action.type}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, action.type, action.label, action.color)}
                                    className={cn(
                                        "flex flex-col p-3 rounded-xl border-2 bg-white cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
                                        action.color
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <IconComponent className="w-4 h-4 shrink-0" />
                                        <h4 className="font-black text-[11px] uppercase tracking-tighter text-slate-700 group-hover:text-slate-900 transition-colors">
                                            {action.label}
                                        </h4>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                                        {action.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
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
