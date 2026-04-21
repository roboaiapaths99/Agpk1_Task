import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

const TourStep = ({ 
    rect, 
    step, 
    currentStep, 
    totalSteps, 
    onNext, 
    onPrev, 
    onSkip 
}) => {
    if (!rect) return null;

    const padding = 12;
    const cutout = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: 12
    };

    // Calculate tooltip position
    const getTooltipStyles = () => {
        const margin = 20;
        const tooltipWidth = 320;
        const tooltipHeight = 250; // Approximated
        
        const positions = [
            { 
                name: 'right',
                left: cutout.left + cutout.width + margin,
                top: cutout.top + (cutout.height / 2) - (tooltipHeight / 2)
            },
            {
                name: 'left',
                left: cutout.left - tooltipWidth - margin,
                top: cutout.top + (cutout.height / 2) - (tooltipHeight / 2)
            },
            {
                name: 'bottom',
                left: cutout.left + (cutout.width / 2) - (tooltipWidth / 2),
                top: cutout.top + cutout.height + margin
            },
            {
                name: 'top',
                left: cutout.left + (cutout.width / 2) - (tooltipWidth / 2),
                top: cutout.top - tooltipHeight - margin
            }
        ];

        // Find the first position that fits
        let bestPos = positions[0];
        for (const pos of positions) {
            const fitsX = pos.left >= 10 && (pos.left + tooltipWidth) <= window.innerWidth - 10;
            const fitsY = pos.top >= 10 && (pos.top + tooltipHeight) <= window.innerHeight - 10;
            if (fitsX && fitsY) {
                bestPos = pos;
                break;
            }
        }

        // Final constraints to ensure it's always visible
        const finalLeft = Math.max(10, Math.min(bestPos.left, window.innerWidth - tooltipWidth - 10));
        const finalTop = Math.max(10, Math.min(bestPos.top, window.innerHeight - tooltipHeight - 10));

        return { top: finalTop, left: finalLeft };
    };

    const tooltipPos = getTooltipStyles();

    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* SVG Mask for the highlighting effect */}
            <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                <defs>
                    <mask id="tour-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect 
                            x={cutout.left} 
                            y={cutout.top} 
                            width={cutout.width} 
                            height={cutout.height} 
                            rx={cutout.borderRadius} 
                            fill="black" 
                        />
                    </mask>
                </defs>
                <rect 
                    width="100%" height="100%" 
                    fill="rgba(0, 0, 0, 0.7)" 
                    mask="url(#tour-mask)" 
                    className="backdrop-blur-[2px]"
                />
            </svg>

            {/* Pulsing Highlight Border */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    position: 'absolute',
                    top: cutout.top,
                    left: cutout.left,
                    width: cutout.width,
                    height: cutout.height,
                    borderRadius: cutout.borderRadius,
                    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)',
                    pointerEvents: 'none'
                }}
            >
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        position: 'absolute',
                        inset: -8,
                        border: '2px solid rgba(99, 102, 241, 0.5)',
                        borderRadius: cutout.borderRadius + 8
                    }}
                />
            </motion.div>

            {/* Tooltip Content */}
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                    position: 'absolute',
                    top: tooltipPos.top,
                    left: tooltipPos.left,
                    width: 320,
                    pointerEvents: 'auto'
                }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
                {/* Decorative background flare */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{step.emoji}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
                                Step {currentStep + 1} of {totalSteps}
                            </span>
                        </div>
                        <button 
                            onClick={onSkip}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                        {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                        {step.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button
                            onClick={onSkip}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                            Skip Tour
                        </button>

                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={onPrev}
                                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
                                </button>
                            )}
                            <button
                                onClick={onNext}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 group"
                            >
                                <span>{currentStep === totalSteps - 1 ? 'Finish' : 'Next'}</span>
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress bar at the bottom */}
                <div className="absolute bottom-0 left-0 h-1 bg-slate-100 dark:bg-slate-700 w-full">
                    <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default TourStep;
