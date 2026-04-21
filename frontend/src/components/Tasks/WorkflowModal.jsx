import React from 'react';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { workflowService } from '../../modules/governance/services/governanceService';

const WorkflowModal = ({ isOpen, onClose, task, targetStatus, onSuccess }) => {
    const [reason, setReason] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);

    if (!isOpen || !task) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return setError('Please provide a reason for this transition.');

        setIsSubmitting(true);
        setError(null);
        try {
            await workflowService.transition({
                itemId: task._id,
                targetStatus,
                reason
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Transition failed. Check workflow rules.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
                <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 italic flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Confirm Status Change
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transition Path</div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs text-slate-600 italic">
                            <span className="bg-white px-2 py-1 rounded border shadow-sm">{task.status}</span>
                            <span className="text-slate-300">→</span>
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 shadow-sm">{targetStatus}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reason / Justification</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why is this move happening? Mention blockers or completions..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-4 focus:ring-primary/10 min-h-[120px] transition-all resize-none italic"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-shake">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error.message || String(error)}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 px-4 rounded-2xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Move'}
                            {!isSubmitting && <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkflowModal;
