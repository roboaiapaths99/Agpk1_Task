import React, { useState } from 'react';
import * as ReactQuery from '@tanstack/react-query';
import {
    Globe,
    CheckCircle2,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    Settings,
    Code,
    GitBranch,
    MessageSquare,
    Trash2,
    ChevronRight
} from 'lucide-react';
import { projectService, integrationConfigService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import IntegrationSetupModal from '../components/Integrations/IntegrationSetupModal';

const IntegrationCard = ({ id, name, icon: Icon, description, connected, onConnect, onDisconnect, docUrl }) => (
    <div className={cn(
        "bg-white p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col group h-full",
        connected ? "border-green-200 shadow-xl shadow-green-500/5 bg-green-50/10" : "border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
    )}>
        <div className="flex items-start justify-between mb-8">
            <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                connected ? "bg-green-100 text-green-600 rotate-6" : "bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:rotate-3"
            )}>
                <Icon className="w-8 h-8" />
            </div>
            {connected ? (
                <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-100/50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-200/50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                    <button
                        onClick={() => onDisconnect(id)}
                        className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" /> Disconnect
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => onConnect(id)}
                    className="text-[10px] font-black text-primary hover:text-white transition-all uppercase tracking-widest bg-primary/5 px-6 py-3 rounded-xl hover:bg-primary shadow-sm hover:shadow-primary/20"
                >
                    Connect
                </button>
            )}
        </div>

        <h3 className="font-black text-slate-900 text-2xl mb-3 italic tracking-tight">{name}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 font-medium">{description}</p>

        <div className="flex items-center gap-4 pt-6 border-t border-slate-50 mt-auto">
            <a
                href={docUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 hover:text-primary transition-all uppercase tracking-widest group/link"
            >
                <ExternalLink className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                System Docs
            </a>
        </div>
    </div>
);

const WebhookSection = () => {
    const webhookUrl = `http://localhost:5000/api/integrations/github/webhook`;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-card p-12 border-slate-100 rounded-[3.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] -mr-80 -mt-80 transition-transform duration-1000 group-hover:scale-110" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <Globe className="w-6 h-6 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">Global Webhook Engine</h2>
                    </div>
                    <p className="text-slate-500 text-xl mb-10 max-w-2xl font-medium leading-relaxed">
                        Connect any external CI/CD tool, CRM, or custom application using our high-performance event pipeline. Real-time sync for enterprise scale.
                    </p>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Universal Endpoint</label>
                        <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden max-w-3xl">
                            <code className="flex-1 px-5 text-sm font-mono text-primary font-bold truncate">
                                {webhookUrl}
                            </code>
                            <button
                                onClick={handleCopy}
                                className={cn(
                                    "px-10 py-4 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest transition-all shrink-0",
                                    copied ? "bg-green-500 text-white" : "bg-white/10 text-white hover:bg-white text-slate-900 shadow-xl"
                                )}
                            >
                                {copied ? 'Copied!' : 'Copy Endpoint'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50 backdrop-blur-sm group/tip">
                        <div className="flex items-center gap-2 mb-4 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                            <ShieldCheck className="w-5 h-5" /> Enterprise Security
                        </div>
                        <p className="text-sm text-blue-800 leading-relaxed font-bold italic opacity-80">
                            Always configure a **Webhook Secret** in your Git provider settings. We verify all incoming requests using HMAC-SHA256 signatures.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IntegrationsPage = () => {
    const { useQuery, useQueryClient } = ReactQuery;
    const queryClient = useQueryClient();

    const [selectedIntegration, setSelectedIntegration] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: statusData, isLoading: isStatusLoading } = useQuery({
        queryKey: ['integrations-status'],
        queryFn: () => integrationConfigService.getStatus(),
    });

    const { data: projectsRaw } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll(),
    });

    const status = statusData?.integrations || {};
    const safeProjects = projectsRaw?.projects || projectsRaw?.data?.projects || projectsRaw?.data || projectsRaw || [];
    const projects = Array.isArray(safeProjects) ? safeProjects : [];

    const handleDisconnect = async (id) => {
        if (!window.confirm(`Are you sure you want to disconnect ${id}?`)) return;
        try {
            if (id === 'github') await integrationConfigService.githubDisconnect();
            else if (id === 'slack') await integrationConfigService.slackDisconnect();
            queryClient.invalidateQueries({ queryKey: ['integrations-status'] });
        } catch (err) {
            console.error('Failed to disconnect', err);
        }
    };

    const handleConnectClick = (id) => {
        const item = PROVIDERS.find(p => p.id === id);
        setSelectedIntegration(item);
        setIsModalOpen(true);
    };

    const PROVIDERS = [
        {
            id: 'github',
            name: 'GitHub',
            icon: GitBranch,
            description: 'Sync commits, pull requests, and deployment status directly to your tasks.',
            docUrl: 'https://docs.github.com/en/webhooks'
        },
        {
            id: 'gitlab',
            name: 'GitLab',
            icon: Code,
            description: 'Bi-directional sync for GitLab issues and merge requests with automated time tracking.',
            docUrl: 'https://docs.gitlab.com/ee/user/project/integrations/webhooks.html'
        },
        {
            id: 'slack',
            name: 'Slack',
            icon: MessageSquare,
            description: 'Get real-time task updates and AI-summarized daily standups in your Slack channels.',
            docUrl: 'https://api.slack.com/messaging/webhooks'
        },
        {
            id: 'figma',
            name: 'Figma',
            icon: Globe,
            description: 'Embed real-time design files and sync version history directly within documentation.',
            docUrl: 'https://www.figma.com/developers/api'
        }
    ];

    if (isStatusLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] animate-pulse">
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-20 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                        <div className="w-8 h-[2px] bg-primary" /> Connected Ecosystem
                    </div>
                    <h1 className="text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                        Enterprise <span className="text-primary tracking-normal not-italic">Sync</span>
                    </h1>
                    <p className="text-slate-500 text-2xl font-medium max-w-2xl">Automated state machines for high-velocity engineering teams.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 px-8">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Channels</p>
                            <p className="text-2xl font-black text-slate-900 italic">{Object.keys(status).length}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                            <p className="text-2xl font-black text-slate-900 italic">{PROVIDERS.length}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-4">
                <WebhookSection />
            </div>

            <section className="space-y-12 px-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black text-slate-900 italic tracking-tight">System Providers</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Scroll to explore <ChevronRight className="w-4 h-4" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {PROVIDERS.map(p => (
                        <IntegrationCard
                            key={p.id}
                            {...p}
                            connected={status[p.id]?.connected}
                            onConnect={handleConnectClick}
                            onDisconnect={handleDisconnect}
                        />
                    ))}
                </div>
            </section>

            {projects.length > 0 && (
                <section className="space-y-12 px-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-4xl font-black text-slate-900 italic tracking-tight">Active Project Nodes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {projects.map((project) => (
                            <div key={project._id} className="group flex items-center justify-between p-8 bg-white border border-slate-100 hover:border-primary/20 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-50 group-hover:bg-primary/5 rounded-[1.25rem] shadow-inner border border-slate-100 flex items-center justify-center text-primary font-black text-2xl italic transition-colors">
                                        {project.name?.[0].toUpperCase() || 'P'}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-xl tracking-tight italic">{project.name}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Node Prefix: <span className="text-primary">{project.keyPrefix || project.key}</span></p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sync Status</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">Operational</span>
                                        </div>
                                    </div>
                                    <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center border border-slate-100 hover:border-primary shadow-sm">
                                        <Settings className="w-5 h-5 transition-transform group-hover:rotate-90 duration-700" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <IntegrationSetupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                integration={selectedIntegration}
                onConnect={async (id, data) => {
                    let res;
                    if (id === 'github') res = await integrationConfigService.githubConnect(data);
                    else if (id === 'slack') res = await integrationConfigService.slackConnect(data);
                    else if (id === 'figma') res = await integrationConfigService.figmaConnect(data);
                    queryClient.invalidateQueries({ queryKey: ['integrations-status'] });
                    return res;
                }}
            />
        </div>
    );
};

export default IntegrationsPage;
