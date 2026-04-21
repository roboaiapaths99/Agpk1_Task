import React from 'react';
import { FileText, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

const TreeNode = ({ doc, selectedId, onSelect, depth = 0 }) => {
    const [expanded, setExpanded] = React.useState(false);
    const hasChildren = doc.children && doc.children.length > 0;
    const isSelected = selectedId === doc._id;

    return (
        <div>
            <button
                onClick={() => {
                    onSelect(doc._id);
                    if (hasChildren) setExpanded(!expanded);
                }}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-150 group',
                    isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                )}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
                {hasChildren ? (
                    expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                    <span className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-base shrink-0">{doc.icon || '📄'}</span>
                <span className="text-sm truncate">{doc.title}</span>
            </button>
            {expanded && hasChildren && (
                <div>
                    {doc.children.map((child) => (
                        <TreeNode key={child._id} doc={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const DocSidebar = ({ tree, selectedId, onSelect, onCreateDoc }) => {
    return (
        <div className="h-full flex flex-col bg-white border-r border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Documents</h3>
                <button
                    onClick={onCreateDoc}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    title="New Document"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {tree && tree.length > 0 ? (
                    tree.map((doc) => (
                        <TreeNode key={doc._id} doc={doc} selectedId={selectedId} onSelect={onSelect} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="w-10 h-10 text-slate-200 mb-3" />
                        <p className="text-xs text-slate-400 font-medium">No documents yet</p>
                        <button onClick={onCreateDoc} className="mt-3 text-xs text-primary font-bold hover:underline">
                            Create your first doc
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocSidebar;
