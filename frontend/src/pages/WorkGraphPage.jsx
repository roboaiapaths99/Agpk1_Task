import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { workGraphService, projectService } from '../services/api/apiServices';
import { Shield, GitBranch, AlertCircle, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

const nodeTypes = {
    task: ({ data }) => (
        <div className={cn(
            "px-4 py-3 rounded-xl border-2 shadow-xl transition-all duration-300 w-64",
            data.status === 'completed' ? "bg-green-50/90 border-green-200" :
                data.status === 'blocked' ? "bg-rose-50/90 border-rose-200" :
                    "bg-white/90 border-slate-200"
        )}>
            <div className="flex items-center justify-between mb-2">
                <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                    data.status === 'completed' ? "bg-green-500 text-white" :
                        data.status === 'blocked' ? "bg-rose-500 text-white" :
                            "bg-slate-500 text-white"
                )}>
                    {data.status}
                </span>
                <GitBranch className="w-3 h-3 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{data.label}</h4>
            <div className="mt-2 flex items-center gap-2">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000",
                            data.status === 'completed' ? "w-full bg-green-500" :
                                data.status === 'in_progress' ? "w-1/2 bg-blue-500" :
                                    "w-0 bg-slate-300"
                        )}
                    />
                </div>
            </div>
        </div>
    )
};

const WorkGraphPage = () => {
    const [selectedProjectId, setSelectedProjectId] = React.useState('');

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll().then(res => {
            const d = res.data;
            if (Array.isArray(d)) return d;
            if (d?.projects && Array.isArray(d.projects)) return d.projects;
            if (d?.data && Array.isArray(d.data)) return d.data;
            return [];
        })
    });

    const { data: graphData, isLoading, refetch } = useQuery({
        queryKey: ['work-graph', selectedProjectId],
        queryFn: () => workGraphService.getGraph(selectedProjectId).then(res => res.data.data),
        enabled: !!selectedProjectId
    });

    const initialNodes = useMemo(() => {
        if (!graphData) return [];
        return graphData.nodes.map((node, index) => ({
            id: node.id,
            type: 'task',
            data: { label: node.label, status: node.status },
            position: { x: (index % 3) * 300, y: Math.floor(index / 3) * 150 },
        }));
    }, [graphData]);

    const initialEdges = useMemo(() => {
        if (!graphData) return [];
        return graphData.edges.map((edge, index) => ({
            id: `e-${index}`,
            source: edge.from,
            target: edge.to,
            label: edge.type,
            type: 'smoothstep',
            animated: edge.type === 'blocks',
            style: { strokeWidth: 2, stroke: '#cbd5e1' },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#cbd5e1',
            },
        }));
    }, [graphData]);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 italic">
                        <GitBranch className="w-8 h-8 text-primary" />
                        WORK GRAPH
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Visual dependency map and critical path analysis</p>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all min-w-[200px]"
                    >
                        <option value="">Select Project</option>
                        {projects?.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => refetch()}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
                    >
                        <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Graph Area */}
            <div className="flex-1 relative">
                {!selectedProjectId ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <div className="p-6 bg-white rounded-full shadow-2xl border border-slate-100">
                            <Shield className="w-12 h-12 text-slate-200" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-slate-600">No Project Selected</h3>
                            <p className="text-sm">Select a project above to visualize its dependency graph</p>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-slate-50/50"
                    >
                        <Background color="#cbd5e1" gap={20} />
                        <Controls className="bg-white border border-slate-200 shadow-xl rounded-xl" />
                        <MiniMap
                            className="bg-white border border-slate-200 shadow-xl rounded-xl"
                            maskColor="rgba(241, 245, 249, 0.5)"
                            nodeColor={n => n.data.status === 'completed' ? '#22c55e' : '#64748b'}
                        />
                        <Panel position="top-right" className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-xl flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-600 uppercase">Live Sync</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-[10px] font-black text-slate-600 uppercase">Blockers Detected</span>
                            </div>
                        </Panel>
                    </ReactFlow>
                )}
            </div>
        </div>
    );
};

export default WorkGraphPage;
