import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle,
    XCircle,
    Clock,
    User,
    ArrowRight,
    ShieldCheck,
    MessageSquare,
    ChevronRight,
    Search
} from 'lucide-react';
import { approvalService } from '../services/api/apiServices';
import { cn, formatDistanceToNow } from '../lib/utils';

const ApprovalCard = ({ approval, onAction }) => {
    const currentStepObj = approval.steps?.find(s => s.status === 'pending');
    const slaDeadline = currentStepObj?.slaHours
        ? new Date(new Date(approval.createdAt).getTime() + currentStepObj.slaHours * 60 * 60 * 1000)
        : null;
    const isOverdue = slaDeadline && slaDeadline < new Date();

    return (
        <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-primary/30 transition-all">
            <div className="flex items-center gap-6 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-slate-900 italic">{approval.taskId?.title || 'Approval Request'}</h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full">Step {approval.currentStep}</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Requested by <span className="font-bold text-slate-700">{approval.requestedBy?.name}</span></p>

                    <div className="flex items-center gap-4 mt-4 text-[11px] font-bold text-slate-400">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Requested {formatDistanceToNow(approval.createdAt)}</span>
                        </div>
                        {slaDeadline && (
                            <div className={cn("flex items-center gap-1", isOverdue ? "text-red-500" : "text-amber-500")}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>SLA: {isOverdue ? 'Overdue' : formatDistanceToNow(slaDeadline).replace(' ago', ' left')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => onAction(approval._id, 'reject')}
                    className="px-6 py-2.5 rounded-xl border-2 border-red-50 to-red-100 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                >
                    <XCircle className="w-4 h-4" />
                    Reject
                </button>
                <button
                    onClick={() => onAction(approval._id, 'approve')}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                </button>
            </div>
        </div>
    );
};

const ApprovalCenter = () => {
    const queryClient = useQueryClient();

    const { data: pendingRaw, isLoading: pLoading } = useQuery({
        queryKey: ['approvals'],
        queryFn: approvalService.getPending,
    });

    const { data: historyRaw, isLoading: hLoading } = useQuery({
        queryKey: ['approvals-history'],
        queryFn: () => approvalService.getHistory({ limit: 10 }),
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, action }) => action === 'approve'
            ? approvalService.approve(id, { comment: 'Approved via dashboard' })
            : approvalService.reject(id, { comment: 'Rejected via dashboard' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['approvals-history'] });
        },
    });

    const isLoading = pLoading || hLoading;
    if (isLoading) return <div className="p-8">Loading Approvals...</div>;

    const approvals = Array.isArray(pendingRaw?.approvals) ? pendingRaw.approvals
        : Array.isArray(pendingRaw?.data) ? pendingRaw.data
            : Array.isArray(pendingRaw) ? pendingRaw : [];
    const historyData = Array.isArray(historyRaw?.approvals) ? historyRaw.approvals
        : Array.isArray(historyRaw?.data) ? historyRaw.data
            : Array.isArray(historyRaw) ? historyRaw : [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Approval Center</h1>
                    <p className="text-slate-500 mt-1">Review and authorize mission-critical changes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {approvals.length === 0 ? (
                    <div className="glass-card py-24 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-500 mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Queue is empty!</h3>
                        <p className="text-slate-500 mt-2 max-w-xs">You've cleared all pending authorizations.</p>
                    </div>
                ) : (
                    approvals.map(appr => (
                        <ApprovalCard
                            key={appr._id}
                            approval={appr}
                            onAction={(id, action) => approveMutation.mutate({ id, action })}
                        />
                    ))
                )}
            </div>

            {/* History Preview */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg italic text-slate-700">Recent Decisions</h3>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {historyData.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic text-sm font-medium">No recent decisions found.</div>
                    ) : (
                        historyData.map(item => (
                            <div key={item._id} className="p-4 flex items-center justify-between border-b last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                        item.status === 'approved' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                    )}>
                                        {item.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 italic">{item.taskId?.title || 'Approval Request'}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        item.status === 'approved' ? "text-green-500" : "text-red-500"
                                    )}>{item.status}</span>
                                    <span className="text-xs text-slate-400 font-medium">{formatDistanceToNow(item.updatedAt)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApprovalCenter;
