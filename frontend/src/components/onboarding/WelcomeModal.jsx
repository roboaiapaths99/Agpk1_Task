import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, X } from 'lucide-react';

const WelcomeModal = ({ onStart, onSkip }) => {
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onSkip}
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
                {/* Visual Header */}
                <div className="h-48 bg-gradient-to-br from-indigo-600 to-violet-700 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent_50%)]" />
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-10 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.3)_10%,transparent_20%)]" 
                        />
                    </div>
                    
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 flex flex-col items-center"
                    >
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
                            <Rocket className="text-white w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to Enterprise OS</h2>
                    </motion.div>

                    <button 
                        onClick={onSkip}
                        className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                        Ready to supercharge your workflow? We've prepared a quick 2-minute tour to show you how to get the most out of your new workspace.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onStart}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 group"
                        >
                            <Sparkles size={20} className="group-hover:animate-pulse" />
                            <span>Start Interactive Tour</span>
                        </button>
                        
                        <button
                            onClick={onSkip}
                            className="w-full py-4 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-2xl font-semibold transition-all"
                        >
                            I'll explore on my own
                        </button>
                    </div>

                    <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                        Don't worry, you can always restart the tour from your profile settings.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default WelcomeModal;
