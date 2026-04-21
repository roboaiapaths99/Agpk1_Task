import React from 'react';
import {
    Users,
    Wallet,
    Package,
    Briefcase,
    CheckSquare,
    Camera,
    Cpu,
    Zap,
    ArrowRight,
    Lock,
    X,
    MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const modules = [
    {
        id: 'tasks',
        name: 'Kanban & Ops',
        description: 'Agile task management, Sprints, and operational workflows.',
        icon: CheckSquare,
        color: 'bg-blue-500',
        link: '/tasks',
        status: 'Active',
        stats: '24 Active'
    },
    {
        id: 'messaging',
        name: 'Collaboration',
        description: 'Real-time messaging, channels, and team synchronization.',
        icon: MessageSquare,
        color: 'bg-emerald-500',
        link: '/messaging',
        status: 'Active',
        stats: 'Active Now'
    },
    {
        id: 'hr',
        name: 'Human Capital',
        description: 'Employee directory, attendance, and resource capacity.',
        icon: Users,
        color: 'bg-purple-500',
        link: '/resources',
        status: 'Active',
        stats: '86 Members'
    },
    {
        id: 'ai',
        name: 'AI Intelligence',
        description: 'Predictive analytics, automated reporting, and NLP.',
        icon: Cpu,
        color: 'bg-indigo-500',
        link: '/insights',
        status: 'Active',
        stats: '98% Accuracy'
    },
    {
        id: 'automation',
        name: 'Workflows',
        description: 'Low-code automation, triggers, and scheduled tasks.',
        icon: Zap,
        color: 'bg-amber-500',
        link: '/automation',
        status: 'Active',
        stats: '12 Rules'
    },
    {
        id: 'finance',
        name: 'Finance Hub',
        description: 'Multi-branch accounting, ledger audit, and fiscal compliance.',
        icon: Wallet,
        color: 'bg-slate-900',
        link: '/finance',
        status: 'Active',
        stats: 'Audit: Secured'
    }
];

const ModuleCard = ({ module, onPlaceholderClick }) => {
    const Icon = module.icon;

    const content = (
        <>
            {/* Background Glow */}
            <div className={cn(
                "absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700",
                module.color
            )} />

            <div className="flex justify-between items-start mb-8">
                <div className={cn(
                    "p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-500",
                    module.color
                )}>
                    <Icon className="w-8 h-8" />
                </div>
                <div className="text-right">
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                        module.status === 'Active' ? 'bg-green-50 text-green-600' :
                            module.status === 'Beta' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    )}>
                        {module.status}
                    </span>
                    <p className="text-xs font-bold text-slate-400 mt-2">{module.stats}</p>
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 italic tracking-tight group-hover:text-primary transition-colors">
                    {module.name}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {module.description}
                </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
                {module.locked ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <Lock className="w-3.5 h-3.5" />
                        Explore Spec
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        Launch Module
                        <ArrowRight className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Premium Corner Decor */}
            <div className="absolute bottom-0 right-0 p-4 opacity-10">
                <Icon className="w-20 h-20 rotate-12" />
            </div>
        </>
    );

    if (module.locked) {
        return (
            <button
                onClick={() => onPlaceholderClick(module)}
                className="glass-card p-8 group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-slate-100 text-left w-full"
            >
                {content}
            </button>
        );
    }

    return (
        <Link
            to={module.link}
            className="glass-card p-8 group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-slate-100"
        >
            {content}
        </Link>
    );
};

const ModulePlaceholderModal = ({ isOpen, onClose, module }) => {
    if (!isOpen || !module) return null;
    const Icon = module.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                <div className={cn("p-12 text-center relative overflow-hidden", module.color)}>
                    {/* Background Decor */}
                    <Icon className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 rotate-12" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/30 shadow-xl">
                            <Icon className="w-12 h-12 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 mb-3 block">Module Under Encryption</span>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4">{module.name}</h2>
                        <div className="flex items-center justify-center gap-3">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/30">Version 0.8.4-beta</span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/30 italic">Priority: HIGH</span>
                        </div>
                    </div>
                </div>

                <div className="p-12 space-y-8 bg-white">
                    <div>
                        <h4 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-4">Functional Capability</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            The {module.name} module is currently undergoing high-fidelity architecture alignment. This module will provide:
                        </p>
                        <ul className="mt-6 space-y-4">
                            {[
                                "Real-time data synchronization with core ERP systems",
                                "AI-augmented decision support and risk mitigation",
                                "Autonomous compliance auditing and reporting"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-4 text-sm font-bold text-slate-700">
                                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                                        <Zap className="w-3 h-3 fill-current" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Expected Release</span>
                            <span className="text-lg font-black text-slate-900 italic">Q3 2026</span>
                        </div>
                        <button onClick={onClose} className="btn-primary px-12 py-4 shadow-xl shadow-primary/20">
                            Close Access
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RoadmapModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-primary/5">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Strategic Vision</span>
                        <h2 className="text-3xl font-black text-slate-900 italic tracking-tight underline decoration-primary/30 decoration-4 underline-offset-8">Platform Roadmap</h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl shadow-sm text-slate-400 hover:text-slate-600 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-10 space-y-8 h-[500px] overflow-y-auto custom-scrollbar">
                    {[
                        { quarter: 'Q2 2026', title: 'HR & Benefits Hub', status: 'In Development', desc: 'Full lifecycle employee management with automated payroll and tax compliance.' },
                        { quarter: 'Q3 2026', title: 'Predictive Resource AI', status: 'Research', desc: 'AI-driven forecasting for workload bottlenecks and automated sprint optimization.' },
                        { quarter: 'Q4 2026', title: 'Native IoT Integration', status: 'Planning', desc: 'Direct connection to site cameras and sensors with autonomous safety auditing.' },
                        { quarter: 'v2.0', title: 'Enterprise Federation', status: 'Architecting', desc: 'Cross-organizational task sharing and shared supply chain visibility.' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex gap-6 relative group">
                            <div className="flex flex-col items-center">
                                <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/40 mt-1.5" />
                                <div className="w-0.5 h-full bg-slate-100 group-last:hidden" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">{item.quarter}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black rounded-full uppercase">{item.status}</span>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-8 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="btn-primary px-10">Understood</button>
                </div>
            </div>
        </div>
    );
};

const ModuleHub = () => {
    const [roadmapOpen, setRoadmapOpen] = React.useState(false);
    const [placeholderModule, setPlaceholderModule] = React.useState(null);

    return (
        <div className="space-y-12 pb-24">
            <div className="max-w-3xl">
                <h1 className="text-5xl font-black tracking-tight text-slate-900 italic mb-4">
                    Enterprise <span className="text-primary text-glow">OS</span>
                </h1>
                <p className="text-xl text-slate-500 leading-relaxed font-medium">
                    Welcome to your command center. Seamlessly navigate across all 8 core modules of the Enterprise Operations platform.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {modules.map((module) => (
                    <ModuleCard
                        key={module.id}
                        module={module}
                        onPlaceholderClick={setPlaceholderModule}
                    />
                ))}
            </div>

            {/* Featured Section Placeholder */}
            <div className="glass-card p-12 bg-slate-900 border-none overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <Cpu className="w-64 h-64 text-primary" />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <span className="text-primary font-black uppercase tracking-[0.2em] text-xs">Innovation Alert</span>
                    <h2 className="text-4xl font-black text-white mt-4 mb-6 italic leading-tight">
                        Next-Gen Predictive <br /> Workforce Analytics
                    </h2>
                    <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                        We are training our core AI models to predict capacity bottlenecks and operational risks in real-time. Full integration coming in v2.4.
                    </p>
                    <button
                        onClick={() => setRoadmapOpen(true)}
                        className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all text-sm shadow-xl shadow-primary/20"
                    >
                        View System Roadmap
                    </button>
                </div>
            </div>

            <RoadmapModal isOpen={roadmapOpen} onClose={() => setRoadmapOpen(false)} />
            <ModulePlaceholderModal
                isOpen={!!placeholderModule}
                onClose={() => setPlaceholderModule(null)}
                module={placeholderModule}
            />
        </div>
    );
};

export default ModuleHub;
