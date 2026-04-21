import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Premium 404 — Not Found page with animated visuals.
 */
const NotFoundPage = () => {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-8">
            <motion.div
                className="max-w-lg text-center space-y-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Animated Icon */}
                <motion.div
                    className="mx-auto w-24 h-24 bg-gradient-to-br from-primary/10 to-violet-100 rounded-3xl flex items-center justify-center"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Ghost className="w-12 h-12 text-primary" />
                </motion.div>

                {/* 404 Text */}
                <div>
                    <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600 mb-2">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                        Page Not Found
                    </h2>
                    <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                        Let's get you back on track.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                        <Home className="w-4 h-4" />
                        Module Hub
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
