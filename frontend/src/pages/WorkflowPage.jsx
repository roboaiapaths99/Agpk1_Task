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
    addEdge,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// ─── Prototyper Status States ───────────────────────────────
const STATES_LIST = [
    { type: 'state_todo', label: 'Todo State', icon: Circle, color: 'border-slate-400 text-slate-500 bg-slate-50', desc: 'Initial workflow status' },
    { type: 'state_progress', label: 'In Progress State', icon: PlayCircle, color: 'border-blue-500 text-blue-500 bg-blue-50/30', desc: 'Active work status' },
    { type: 'state_review', label: 'Review State', icon: Clock, color: 'border-amber-500 text-amber-500 bg-amber-50/30', desc: 'Quality verification status' },
    { type: 'state_done', label: 'Done State', icon: CheckCircle2, color: 'border-emerald-500 text-emerald-500 bg-emerald-50/30', desc: 'Completed terminal status' }
];

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

const getNodeDetails = (type) => {
    switch (type) {
        case 'state_todo': return { icon: Circle, color: '#64748b', title: 'Todo State', desc: 'Initial status', isState: true };
        case 'state_progress': return { icon: PlayCircle, color: '#3b82f6', title: 'In Progress State', desc: 'Active status', isState: true };
        case 'state_review': return { icon: Clock, color: '#f59e0b', title: 'Review State', desc: 'QA/Verification status', isState: true };
        case 'state_done': return { icon: CheckCircle2, color: '#10b981', title: 'Done State', desc: 'Terminal status', isState: true };
        
        case 'email': return { icon: Mail, color: '#f43f5e', title: 'Send Email', desc: 'Trigger email notification' };
        case 'assign': return { icon: UserCheck, color: '#3b82f6', title: 'Assign Task', desc: 'Assign task to a member' };
        case 'status': return { icon: RefreshCw, color: '#10b981', title: 'Update Status', desc: 'Transition task status' };
        case 'comment': return { icon: MessageSquare, color: '#6366f1', title: 'Add Comment', desc: 'Post automated comment' };
        case 'slack': return { icon: Send, color: '#14b8a6', title: 'Slack Alert', desc: 'Send Slack channel notification' };
        case 'timer': return { icon: Play, color: '#f59e0b', title: 'Start Timer', desc: 'Start tracking logged hours' };
        case 'sla': return { icon: Clock, color: '#e11d48', title: 'Check SLA', desc: 'Check deadline compliance' };
        case 'subtask': return { icon: Plus, color: '#8b5cf6', title: 'Create Sub-task', desc: 'Spawn a child subtask' };
        case 'approval': return { icon: FileCheck, color: '#06b6d4', title: 'Request Approval', desc: 'Block task until approved' };
        case 'attachment': return { icon: Paperclip, color: '#64748b', title: 'Require File', desc: 'Check for task attachment' };
        case 'webhook': return { icon: Globe, color: '#0ea5e9', title: 'API Webhook', desc: 'Post generic web request' };
        case 'ai_risk': return { icon: Cpu, color: '#a855f7', title: 'AI Risk Check', desc: 'Run delay risk evaluation' };
        
        default: return { icon: Settings2, color: '#cbd5e1', title: 'Action Node', desc: 'Custom transition rule' };
    }
};

const CustomWorkflowNode = ({ id, data, selected }) => {
    const details = getNodeDetails(data.type);
    const IconComponent = details.icon;
    const config = data.config || {};

    const handleInputChange = (field, value) => {
        if (data.onChange) {
            data.onChange(id, { ...config, [field]: value });
        }
    };

    const handleDelete = () => {
        if (data.onDelete) {
            data.onDelete(id);
        }
    };

    return (
        <div className={cn(
            "rounded-2xl border-2 bg-white shadow-lg text-left transition-all relative group min-w-[200px] max-w-[260px]",
            selected ? "ring-2 ring-primary/20 border-primary" : "border-slate-100"
        )}>
            {/* Input Port (Left handle) */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: details.color, width: '10px', height: '10px', borderRadius: '50%' }}
            />

            {/* Header */}
            <div className="flex items-start justify-between p-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg text-white shrink-0" style={{ backgroundColor: details.color }}>
                        <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-black text-[10px] uppercase tracking-tighter text-slate-800 leading-none truncate">
                            {details.title}
                        </h4>
                        <span className="text-[8px] text-slate-400 font-medium block mt-0.5 truncate">
                            {details.desc}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50/50 transition-colors shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Body (Fields) */}
            <div className="p-3 space-y-2 bg-slate-50/50 rounded-b-2xl">
                {data.type === 'email' && (
                    <>
                        <input
                            type="text"
                            value={config.recipient || ''}
                            onChange={(e) => handleInputChange('recipient', e.target.value)}
                            placeholder="recipient@example.com"
                            className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <textarea
                            value={config.message || ''}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            placeholder="Email body template..."
                            rows={2}
                            className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none resize-none focus:ring-1 focus:ring-rose-500"
                        />
                    </>
                )}

                {data.type === 'assign' && (
                    <input
                        type="text"
                        value={config.assignee || ''}
                        onChange={(e) => handleInputChange('assignee', e.target.value)}
                        placeholder="Assignee username/ID"
                        className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    />
                )}

                {data.type === 'status' && (
                    <select
                        value={config.status || 'TODO'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="REVIEW">IN REVIEW</option>
                        <option value="DONE">DONE</option>
                    </select>
                )}

                {data.type === 'comment' && (
                    <textarea
                        value={config.comment || ''}
                        onChange={(e) => handleInputChange('comment', e.target.value)}
                        placeholder="Automated comment text..."
                        rows={2}
                        className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none resize-none focus:ring-1 focus:ring-indigo-500"
                    />
                )}

                {data.type === 'slack' && (
                    <>
                        <input
                            type="text"
                            value={config.channel || ''}
                            onChange={(e) => handleInputChange('channel', e.target.value)}
                            placeholder="#general"
                            className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <textarea
                            value={config.message || ''}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            placeholder="Slack message..."
                            rows={2}
                            className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none resize-none focus:ring-1 focus:ring-teal-500"
                        />
                    </>
                )}

                {data.type === 'timer' && (
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                        <span>Pause after:</span>
                        <input
                            type="number"
                            value={config.pauseLimit || 8}
                            onChange={(e) => handleInputChange('pauseLimit', e.target.value)}
                            className="w-10 px-1 py-0.5 bg-white border border-slate-200 rounded-lg outline-none text-center"
                        />
                        <span>hrs</span>
                    </div>
                )}

                {data.type === 'sla' && (
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                        <span>Limit:</span>
                        <input
                            type="number"
                            value={config.limit || 24}
                            onChange={(e) => handleInputChange('limit', e.target.value)}
                            className="w-10 px-1 py-0.5 bg-white border border-slate-200 rounded-lg outline-none text-center"
                        />
                        <span>hrs</span>
                    </div>
                )}

                {data.type === 'subtask' && (
                    <input
                        type="text"
                        value={config.subtaskTitle || ''}
                        onChange={(e) => handleInputChange('subtaskTitle', e.target.value)}
                        placeholder="e.g. Code Review"
                        className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-violet-500"
                    />
                )}

                {data.type === 'approval' && (
                    <input
                        type="text"
                        value={config.approver || ''}
                        onChange={(e) => handleInputChange('approver', e.target.value)}
                        placeholder="Approver role (e.g. Lead)"
                        className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                )}

                {data.type === 'attachment' && (
                    <input
                        type="text"
                        value={config.extension || ''}
                        onChange={(e) => handleInputChange('extension', e.target.value)}
                        placeholder="Extension (e.g. .pdf)"
                        className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-500"
                    />
                )}

                {data.type === 'webhook' && (
                    <>
                        <select
                            value={config.method || 'POST'}
                            onChange={(e) => handleInputChange('method', e.target.value)}
                            className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-sky-500 animate-none"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                        <input
                            type="text"
                            value={config.url || ''}
                            onChange={(e) => handleInputChange('url', e.target.value)}
                            placeholder="https://api.example.com/webhook"
                            className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-sky-500"
                        />
                    </>
                )}

                {data.type === 'ai_risk' && (
                    <div className="text-[8px] text-indigo-500 font-bold bg-indigo-50/50 p-1.5 rounded-lg text-center border border-indigo-100 leading-normal">
                        AI will auto-predict delay risks on state transition.
                    </div>
                )}

                {details.isState && (
                    <>
                        <input
                            type="text"
                            value={config.allowedRoles || ''}
                            onChange={(e) => handleInputChange('allowedRoles', e.target.value)}
                            placeholder="Allowed Roles (comma separated)"
                            className="w-full px-2 py-1 text-[9px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-400"
                        />
                        <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-bold">
                            <input
                                type="checkbox"
                                checked={config.reasonRequired || false}
                                onChange={(e) => handleInputChange('reasonRequired', e.target.checked)}
                                className="rounded text-slate-600 focus:ring-slate-400 w-3 h-3"
                            />
                            <span>Require transition comment</span>
                        </div>
                    </>
                )}
            </div>

            {/* Output Port (Right handle) */}
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: details.color, width: '10px', height: '10px', borderRadius: '50%' }}
            />
        </div>
    );
};

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

const NODE_TYPES = {
    customWorkflow: CustomWorkflowNode
};
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
            const isCustom = n.type === 'customWorkflow';
            const extraData = isCustom ? {
                onChange: (nodeId, updatedConfig) => {
                    setNodes(nds => nds.map(node => node.id === nodeId ? { ...node, data: { ...node.data, config: updatedConfig } } : node));
                },
                onDelete: (nodeId) => {
                    setNodes(nds => nds.filter(node => node.id !== nodeId));
                    setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
                }
            } : {};

            if (n.id === simulatingNodeId) {
                return {
                    ...n,
                    data: { ...n.data, ...extraData },
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
            return {
                ...n,
                data: { ...n.data, ...extraData }
            };
        });
    }, [nodes, simulatingNodeId, setNodes, setEdges]);

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
        // Capture context for optimistic updates or queries
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

        const newNode = {
            id: nodeId,
            type: 'customWorkflow',
            position,
            data: { 
                type, 
                label, 
                colorClass,
                config: {}
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
            if (activeWf) {
                localStorage.removeItem(`wf_nodes_${activeWf._id}`);
                localStorage.removeItem(`wf_edges_${activeWf._id}`);
            }
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
                const newNodes = data.states.map((s, i) => {
                    let type = 'state_progress';
                    if (s.type === 'initial' || s.name === 'TODO') type = 'state_todo';
                    else if (s.type === 'terminal' || s.name === 'DONE') type = 'state_done';
                    
                    return {
                        id: s.name,
                        type: 'customWorkflow',
                        position: { x: 100 + (i * 200), y: i % 2 === 0 ? 100 : 250 },
                        data: {
                            type,
                            label: s.name,
                            colorClass: s.color || '#cbd5e1',
                            config: {}
                        }
                    };
                });

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
            const savedNodes = localStorage.getItem(`wf_nodes_${activeWf._id}`);
            const savedEdges = localStorage.getItem(`wf_edges_${activeWf._id}`);

            if (savedNodes && savedEdges) {
                try {
                    setNodes(JSON.parse(savedNodes));
                    setEdges(JSON.parse(savedEdges));
                    return;
                } catch (e) {
                    console.error("Failed to parse saved layout from localStorage", e);
                }
            }

            const initialNodes = activeWf.states.map((s, i) => {
                let type = 'state_progress';
                if (s.type === 'initial' || s.name === 'TODO') type = 'state_todo';
                else if (s.type === 'terminal' || s.name === 'DONE') type = 'state_done';
                else if (s.name === 'REVIEW' || s.name === 'IN_REVIEW') type = 'state_review';

                return {
                    id: s.name,
                    type: 'customWorkflow',
                    data: {
                        type,
                        label: s.name,
                        colorClass: s.color || '#cbd5e1',
                        config: {
                            allowedRoles: s.allowedRoles || '',
                            reasonRequired: !!s.reasonRequired
                        }
                    },
                    position: s.position || { x: 100 + (i * 200), y: i % 2 === 0 ? 100 : 250 }
                };
            });

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
        if (!activeWf) return;

        // Save full configuration visually in localStorage
        localStorage.setItem(`wf_nodes_${activeWf._id}`, JSON.stringify(nodes));
        localStorage.setItem(`wf_edges_${activeWf._id}`, JSON.stringify(edges));

        const states = nodes.map(n => {
            const details = getNodeDetails(n.data?.type);
            let stateType = 'active';
            if (n.data?.type === 'state_todo') stateType = 'initial';
            else if (n.data?.type === 'state_done') stateType = 'terminal';

            return {
                name: n.id,
                type: stateType,
                color: details.color,
                position: n.position
            };
        });

        const transitions = edges.map(e => {
            const sourceNode = nodes.find(n => n.id === e.source);
            const requiresComment = sourceNode?.data?.config?.reasonRequired || false;
            const allowedRolesStr = sourceNode?.data?.config?.allowedRoles || '';
            const allowedRoles = allowedRolesStr ? allowedRolesStr.split(',').map(r => r.trim()).filter(Boolean) : [];

            return {
                from: e.source,
                to: e.target,
                requiresComment,
                allowedRoles: allowedRoles.filter(r => ['admin', 'manager', 'user'].includes(r))
            };
        });

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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        <GitMerge className="w-8 h-8 text-primary" />
                        Workflow Engine
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Design state machines and transition rules for your tasks.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 shadow-lg shadow-primary/20"
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
                                <div className="h-[520px] w-full bg-slate-50 border-2 border-slate-100 rounded-3xl overflow-hidden mt-5 relative shadow-inner">
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
                                        Use "Allowed Roles" inside the State cards to restrict transitions to specific roles.
                                        Check "Require transition comment" to ensure users explain why they changed the state.
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
                <div className="col-span-3 bg-slate-50/50 rounded-3xl border-2 border-slate-100 p-5 space-y-5">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            Action Toolbar
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold italic mt-0.5">Drag & drop items onto the canvas to construct your workflow</p>
                    </div>

                    <div className="space-y-4 overflow-y-auto max-h-[640px] pr-1 custom-scrollbar">
                        {/* Section 1: States */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Workflow States</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {STATES_LIST.map((state) => {
                                    const IconComponent = state.icon;
                                    return (
                                        <div
                                            key={state.type}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, state.type, state.label, state.color)}
                                            className={cn(
                                                "flex flex-col p-2.5 rounded-xl border-2 bg-white cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
                                                state.color
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <IconComponent className="w-4 h-4 shrink-0" />
                                                <h5 className="font-black text-[10px] uppercase tracking-tighter text-slate-700 group-hover:text-slate-900 transition-colors">
                                                    {state.label}
                                                </h5>
                                            </div>
                                            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                                                {state.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 2: Automation Actions */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Automation Actions</h4>
                            <div className="space-y-2">
                                {ACTIONS_LIST.map((action) => {
                                    const IconComponent = action.icon;
                                    return (
                                        <div
                                            key={action.type}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, action.type, action.label, action.color)}
                                            className={cn(
                                                "flex flex-col p-2.5 rounded-xl border-2 bg-white cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
                                                action.color
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <IconComponent className="w-4 h-4 shrink-0" />
                                                <h5 className="font-black text-[10px] uppercase tracking-tighter text-slate-700 group-hover:text-slate-900 transition-colors">
                                                    {action.label}
                                                </h5>
                                            </div>
                                            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                                                {action.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
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
