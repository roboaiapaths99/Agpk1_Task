import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    MiniMap, 
    useNodesState, 
    useEdgesState, 
    addEdge,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Users, Search, Download, Settings2, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { profileService } from '../../services/api/apiServices';
import UserNode from './components/UserNode';
import { toast } from 'react-hot-toast';

const nodeTypes = {
    userNode: UserNode,
};

const OrgChartPage = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    const transformHierarchy = useCallback((data) => {
        const nodes = [];
        const edges = [];
        
        const processNode = (user, x = 0, y = 0, level = 0, index = 0) => {
            const nodeId = user._id;
            
            // Add Node
            nodes.push({
                id: nodeId,
                type: 'userNode',
                data: { 
                    ...user,
                    subordinatesCount: user.subordinates?.length || 0
                },
                position: { x, y },
            });

            // Add Edges & Process Children
            if (user.subordinates && user.subordinates.length > 0) {
                const childY = y + 250;
                const totalWidth = user.subordinates.length * 300;
                const startX = x - totalWidth / 2 + 150;

                user.subordinates.forEach((child, i) => {
                    const childX = startX + i * 300;
                    
                    edges.push({
                        id: `e-${nodeId}-${child._id}`,
                        source: nodeId,
                        target: child._id,
                        type: 'smoothstep',
                        animated: true,
                        style: { strokeWidth: 2, stroke: '#6366f1' },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#6366f1',
                        },
                    });

                    processNode(child, childX, childY, level + 1, i);
                });
            }
        };

        if (Array.isArray(data)) {
            data.forEach((root, i) => processNode(root, i * 600, 0));
        } else if (data) {
            processNode(data, 0, 0);
        }

        return { nodes, edges };
    }, []);

    const fetchHierarchy = async () => {
        try {
            setLoading(true);
            const res = await profileService.getHierarchy();
            const hierarchyData = res.data?.data || res.data;
            const { nodes: newNodes, edges: newEdges } = transformHierarchy(hierarchyData);
            setNodes(newNodes);
            setEdges(newEdges);
        } catch (error) {
            console.error('Failed to fetch hierarchy:', error);
            toast.error('Failed to load organization chart');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase flex items-center gap-4">
                        <Users className="w-10 h-10 text-primary" />
                        Org Hierarchy
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Visualize reporting lines and team structure in real-time.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find member..."
                            className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold italic focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        />
                    </div>
                    <button 
                        onClick={fetchHierarchy}
                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200">
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 bg-slate-50 rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden relative">
                {loading ? (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="font-black text-slate-800 italic uppercase text-sm tracking-widest">Constructing Tree...</p>
                        </div>
                    </div>
                ) : null}

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-dot-pattern"
                >
                    <Background color="#cbd5e1" gap={20} />
                    <Controls className="bg-white border-2 border-slate-100 rounded-2xl shadow-xl overflow-hidden" />
                    <MiniMap 
                        className="bg-white border-2 border-slate-100 rounded-2xl shadow-xl"
                        nodeStrokeColor={(n) => n.type === 'userNode' ? '#6366f1' : '#cbd5e1'}
                        nodeColor={(n) => n.type === 'userNode' ? '#e0e7ff' : '#f8fafc'}
                    />
                </ReactFlow>

                {/* Floating Controls Overlay */}
                <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                    <div className="p-2 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow-2xl flex flex-col gap-1 items-center">
                        <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ZoomIn className="w-4 h-4 text-slate-600" /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ZoomOut className="w-4 h-4 text-slate-600" /></button>
                        <div className="w-full h-px bg-slate-200 my-1" />
                        <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><Maximize2 className="w-4 h-4 text-slate-600" /></button>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .bg-dot-pattern {
                    background-image: radial-gradient(#e2e8f0 0.5px, transparent 0.5px);
                    background-size: 20px 20px;
                }
            `}</style>
        </div>
    );
};

export default OrgChartPage;
