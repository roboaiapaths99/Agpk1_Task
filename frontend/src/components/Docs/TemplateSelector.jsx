import React from 'react';
import { X, FileText, ClipboardList, Calendar, RotateCcw, Palette, Wrench, File } from 'lucide-react';
import { cn } from '../../lib/utils';

const TEMPLATES = [
    { key: 'blank', title: 'Blank Document', icon: '📄', description: 'Start from scratch', lucideIcon: File },
    { key: 'prd', title: 'Product Requirements', icon: '📋', description: 'Feature specs & requirements', lucideIcon: ClipboardList },
    { key: 'meeting', title: 'Meeting Notes', icon: '🗓️', description: 'Agendas, notes & action items', lucideIcon: Calendar },
    { key: 'retro', title: 'Sprint Retrospective', icon: '🔄', description: 'What went well / improve', lucideIcon: RotateCcw },
    { key: 'design', title: 'Design Specification', icon: '🎨', description: 'UI/UX specs & wireframes', lucideIcon: Palette },
    { key: 'runbook', title: 'Operations Runbook', icon: '🛠️', description: 'Deployment & incident guides', lucideIcon: Wrench },
];

const TemplateSelector = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 italic">New Document</h2>
                        <p className="text-xs text-slate-400 mt-1">Choose a template to get started</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Templates Grid */}
                <div className="p-6 grid grid-cols-2 gap-3">
                    {TEMPLATES.map((tmpl) => {
                        const Icon = tmpl.lucideIcon;
                        return (
                            <button
                                key={tmpl.key}
                                onClick={() => onSelect(tmpl.key)}
                                className="flex flex-col items-start p-4 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{tmpl.icon}</span>
                                    <Icon className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">{tmpl.title}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{tmpl.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TemplateSelector;
