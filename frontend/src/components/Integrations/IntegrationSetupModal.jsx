import React, { useState } from 'react';
import { X, Link, Shield, Globe, Copy, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

const IntegrationSetupModal = ({ isOpen, onClose, integration, onConnect }) => {
    const [step, setStep] = useState('config'); // config, success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectData, setConnectData] = useState(null);

    const [formData, setFormData] = useState({
        accessToken: '',
        repoOwner: '',
        repoName: '',
        webhookUrl: '',
        signingSecret: '',
        fileKey: '',
        apiToken: ''
    });

    if (!isOpen || !integration) return null;

    const handleConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await onConnect(integration.id, formData);
            if (result.success) {
                setConnectData(result);
                setStep('success');
            } else {
                setError(result.message || 'Failed to connect');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Show a brief toast or change icon if needed
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-primary">
                            {integration.icon && <integration.icon className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight italic">Configure {integration.name}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Sync Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {step === 'config' ? (
                        <form onSubmit={handleConnect} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in shake duration-300">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {integration.id === 'github' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Personal Access Token</label>
                                        <input
                                            required
                                            type="password"
                                            placeholder="ghp_xxxxxxxxxxxx"
                                            value={formData.accessToken}
                                            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Repo Owner</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. acme-corp"
                                                value={formData.repoOwner}
                                                onChange={(e) => setFormData({ ...formData, repoOwner: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Repo Name</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. platform-core"
                                                value={formData.repoName}
                                                onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {integration.id === 'slack' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Webhook URL</label>
                                        <input
                                            required
                                            type="url"
                                            placeholder="https://hooks.slack.com/services/..."
                                            value={formData.webhookUrl}
                                            onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Signing Secret</label>
                                        <input
                                            required
                                            type="password"
                                            placeholder="Standard Slack Signing Secret"
                                            value={formData.signingSecret}
                                            onChange={(e) => setFormData({ ...formData, signingSecret: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </>
                            )}

                            {integration.id === 'figma' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Personal Access Token</label>
                                        <input
                                            required
                                            type="password"
                                            placeholder="figd_xxxxxxxxxxxx"
                                            value={formData.apiToken}
                                            onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Figma File Key</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Extract from URL: figma.com/file/FILE_KEY/..."
                                            value={formData.fileKey}
                                            onChange={(e) => setFormData({ ...formData, fileKey: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-tight flex gap-3">
                                <Info className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                    <p className="mb-1">Requires write access for full feature set.</p>
                                    <a href={integration.docUrl || '#'} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        View Setup Guide <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-primary transition-all disabled:opacity-50"
                            >
                                {loading ? 'Initializing Connection...' : `Activate ${integration.name} Integration`}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 shadow-sm shadow-green-500/10">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 italic tracking-tight mb-2">Connection Active</h3>
                                <p className="text-slate-500 text-sm font-medium">Your enterprise pipeline is now synchronized.</p>
                            </div>

                            <div className="space-y-4 text-left">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Webhook Endpoint</label>
                                    <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-3 overflow-hidden">
                                        <code className="text-xs font-bold text-slate-600 truncate flex-1">{window.location.origin}{connectData.webhookUrl}</code>
                                        <button onClick={() => copyToClipboard(window.location.origin + connectData.webhookUrl)} className="ml-2 text-primary hover:text-primary-dark">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {connectData.webhookSecret && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Verification Secret</label>
                                        <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-3 overflow-hidden">
                                            <code className="text-xs font-bold text-slate-600 truncate flex-1">{connectData.webhookSecret}</code>
                                            <button onClick={() => copyToClipboard(connectData.webhookSecret)} className="ml-2 text-primary hover:text-primary-dark">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-primary transition-all"
                            >
                                Finish Setup
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntegrationSetupModal;
