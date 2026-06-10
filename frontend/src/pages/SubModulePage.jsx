import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';

const SubModulePage = ({ title, url, icon: Icon, description }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [iframeKey, setIframeKey] = useState(0);
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        let timer;
        if (isLoading) {
            // If the iframe hasn't finished loading in 4 seconds, show the fallback prompt
            timer = setTimeout(() => {
                setShowFallback(true);
            }, 4000);
        } else {
            setShowFallback(false);
        }
        return () => clearTimeout(timer);
    }, [isLoading, iframeKey]);

    const handleRefresh = () => {
        setIsLoading(true);
        setShowFallback(false);
        setIframeKey(prev => prev + 1);
    };

    const handleOpenNewTab = () => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };


    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] space-y-6 pb-6">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">{title}</h1>
                        <p className="text-slate-500 text-sm mt-0.5 font-medium">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading && !showFallback ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleOpenNewTab}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                    </button>
                </div>
            </div>

            {/* IFrame Container */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col">
                {isLoading && !showFallback && (
                    <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm font-bold text-slate-500">Loading submodule securely...</p>
                    </div>
                )}

                {showFallback && (
                    <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 text-amber-500 mb-4 animate-bounce">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">IFrame Loading Blocked</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-md leading-relaxed">
                            For security reasons, some applications prevent themselves from being embedded inside other websites (due to strict browser policies like <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-500 text-xs font-mono">X-Frame-Options</code>).
                        </p>
                        <p className="text-slate-400 text-xs mt-1 max-w-sm">
                            You can easily access this submodule using the redirection options below:
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-3 mt-6">
                            <button
                                onClick={handleOpenNewTab}
                                className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in New Tab
                            </button>
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Connection
                            </button>
                        </div>
                    </div>
                )}
                
                <iframe
                    key={iframeKey}
                    src={url}
                    title={title}
                    onLoad={() => setIsLoading(false)}
                    className="w-full h-full border-none flex-1"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    onError={() => setIsLoading(false)}
                />
            </div>
        </div>
    );
};

export default SubModulePage;
