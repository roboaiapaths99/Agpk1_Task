import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Users, Mail, Shield, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

const UserNode = ({ data, selected }) => {
    const isRoot = !data.parentId;

    return (
        <div className={cn(
            "group relative px-6 py-4 rounded-[2rem] bg-white border-2 transition-all duration-300 min-w-[240px]",
            selected ? "border-primary shadow-2xl shadow-primary/20 scale-105" : "border-slate-100 shadow-xl shadow-slate-200/20 hover:border-slate-200 hover:scale-[1.02]",
            isRoot && "border-indigo-500 shadow-indigo-100"
        )}>
            {/* Connection Points */}
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-300 border-2 border-white" />
            
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner transition-transform duration-500 group-hover:rotate-6",
                    isRoot ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"
                )}>
                    {data.name?.substring(0, 2).toUpperCase() || '??'}
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                    <p className="font-black text-slate-800 italic uppercase truncate leading-none mb-1">
                        {data.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 italic truncate flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        {data.designation || 'Team Member'}
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold italic">
                    <Users className="w-3 h-3" />
                    {data.subordinatesCount || 0} Reports
                </div>
                {data.subordinatesCount > 0 && (
                    <div className="p-1 rounded-lg bg-slate-50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ChevronDown className="w-3 h-3" />
                    </div>
                )}
            </div>

            {/* Hover Tooltip/Detail */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-lg whitespace-nowrap shadow-xl">
                    {data.email}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-300 border-2 border-white" />
        </div>
    );
};

export default memo(UserNode);
