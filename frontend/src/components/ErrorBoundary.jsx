import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * React Error Boundary — catches unhandled runtime exceptions in the
 * component tree and renders a premium fallback UI instead of crashing
 * the entire application.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-8">
                    <div className="max-w-md text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                An unexpected error occurred while rendering this page.
                                Please try again or navigate back to the dashboard.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="bg-slate-100 text-red-600 text-xs p-4 rounded-xl overflow-auto text-left max-h-40">
                                {this.state.error.toString()}
                            </pre>
                        )}

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
