import React, { useState } from 'react';
import {
    ShieldAlert, Lock, Unlock, ShieldCheck,
    RefreshCcw, AlertCircle, History, FileText, Download
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceService, auditService } from '../../../services/api/apiServices';
import { toast } from 'react-hot-toast';
import { cn } from '../../../lib/utils';

const ComplianceCenter = () => {
    const queryClient = useQueryClient();
    const [verifying, setVerifying] = useState(false);

    const { data: config, isLoading } = useQuery({
        queryKey: ['compliance-config'],
        queryFn: complianceService.getSettings
    });

    // Fetch real audit logs for compliance actions
    const { data: auditData } = useQuery({
        queryKey: ['compliance-audit-logs'],
        queryFn: () => auditService.getLogs({ entityType: 'ComplianceSetting', limit: 10 })
    });

    const settingsData = config?.data?.data || config?.data || {};
    const isLocked = settingsData.lockDate ? new Date(settingsData.lockDate) > new Date('2020-01-01') : false;

    const auditLogs = auditData?.data?.data?.logs || auditData?.data?.logs || [];

    const lockMutation = useMutation({
        mutationFn: complianceService.lockPeriod,
        onSuccess: () => {
            queryClient.invalidateQueries(['compliance-config']);
            queryClient.invalidateQueries(['compliance-audit-logs']);
            toast.success("Fiscal period locked successfully");
        },
        onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to lock period")
    });

    const verifyAuditMutation = useMutation({
        mutationFn: complianceService.verifyAudit,
        onSuccess: (res) => {
            setVerifying(false);
            const data = res.data?.data || res.data || {};
            if (data.invalidCount === 0) {
                toast.success(`Audit logs verified! ${data.totalChecked || 0} entries checked. Cryptographic integrity confirmed.`);
            } else {
                toast.error(`Integrity Alert! ${data.invalidCount} discrepancies found in audit logs!`);
            }
        },
        onError: (err) => {
            setVerifying(false);
            toast.error(err?.response?.data?.message || err?.message || "Failed to run audit verification");
        }
    });

    const runVerification = () => {
        setVerifying(true);
        verifyAuditMutation.mutate();
    };

    const handleExportCompliance = async () => {
        const t = toast.loading('Generating compliance report...');
        try {
            // Use the audit export endpoint
            const res = await auditService.getLogs({ entityType: 'ComplianceSetting', limit: 100 });
            const logs = res?.data?.data?.logs || res?.data?.logs || [];
            
            // Generate a downloadable CSV
            const headers = ['Date', 'Action', 'User', 'Details'];
            const rows = logs.map(log => [
                new Date(log.timestamp || log.createdAt).toLocaleString(),
                log.action || 'N/A',
                log.userId?.name || 'System',
                log.changes?.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('; ') || 'No changes'
            ]);
            
            const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compliance_report_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            toast.success('Compliance report exported', { id: t });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export compliance report', { id: t });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-md">
                    <ShieldCheck className="w-8 h-8 text-primary shadow-glow" />
                </div>
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">FINANCIAL COMPLIANCE HUB</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Enterprise Guardrails & Integrity Verification</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Period Locking Card */}
                <div className="glass-card p-6 border border-slate-100 shadow-xl group hover:border-primary/20 transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <Lock className="w-5 h-5 text-slate-500 group-hover:text-primary" />
                            </div>
                            <h3 className="font-black text-slate-900 italic uppercase underline decoration-primary/20">Fiscal Control</h3>
                        </div>
                        <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            isLocked ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                            {isLocked ? "LOCKED" : "OPEN"}
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                        Prevent backtracking or modifications to financial data. Once a period is locked, all transactions become immutable and audit-only.
                    </p>

                    {settingsData.lockDate && (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Current Lock Date</p>
                            <p className="text-sm font-bold text-slate-900 mt-1">{new Date(settingsData.lockDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Lock Threshold Date</label>
                            <input
                                id="lock-date-input"
                                type="date"
                                className="w-full bg-transparent text-sm font-bold outline-none"
                                defaultValue={settingsData.lockDate ? new Date(settingsData.lockDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <button
                            onClick={() => {
                                const dateInput = document.getElementById('lock-date-input').value;
                                if (!dateInput) {
                                    toast.error('Please select a lock date');
                                    return;
                                }
                                lockMutation.mutate({ lockDate: new Date(dateInput) });
                            }}
                            disabled={lockMutation.isPending}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black italic text-sm hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {lockMutation.isPending ? (
                                <><RefreshCcw className="w-4 h-4 animate-spin" /> Processing...</>
                            ) : (
                                <><ShieldAlert className="w-4 h-4 group-hover:animate-bounce" /> EXECUTE PERIOD LOCK</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Audit Integrity Card */}
                <div className="glass-card p-6 border border-slate-100 shadow-xl group hover:border-emerald-200 transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                <History className="w-5 h-5 text-slate-500 group-hover:text-emerald-600" />
                            </div>
                            <h3 className="font-black text-slate-900 italic uppercase underline decoration-emerald-200">Audit Sentinel</h3>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                        Verify the cryptographic integrity of all ledger entries. Our hashing algorithm ensures no data has been modified directly in the database.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Status</p>
                                <p className="text-xs font-bold text-slate-700">{verifyAuditMutation.isSuccess ? 'Verified just now' : 'Ready to verify'}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        <button
                            onClick={runVerification}
                            disabled={verifying}
                            className={cn(
                                "w-full py-4 rounded-2xl font-black italic text-sm transition-all shadow-lg flex items-center justify-center gap-2 group border-2",
                                verifying ? "bg-slate-100 text-slate-400 border-slate-100" : "bg-white text-emerald-600 border-emerald-500 hover:bg-emerald-50"
                            )}
                        >
                            <RefreshCcw className={cn("w-4 h-4", verifying && "animate-spin")} />
                            {verifying ? "VERIFYING CRYPTO-STREAM..." : "RUN FULL INTEGRITY AUDIT"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Compliance Logs - Now with real data */}
            <div className="glass-card border border-slate-100 shadow-xl overflow-hidden">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Policy Actions</h3>
                    <button 
                        onClick={handleExportCompliance}
                        className="text-[10px] font-black text-primary hover:underline uppercase flex items-center gap-1.5"
                    >
                        <Download className="w-3 h-3" /> Export Report
                    </button>
                </div>
                <div className="divide-y divide-slate-50">
                    {auditLogs.length > 0 ? auditLogs.slice(0, 5).map((log) => (
                        <div key={log._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-2 rounded-lg", 
                                    log.action === 'CREATE' ? 'bg-emerald-50' : 
                                    log.action === 'UPDATE' ? 'bg-blue-50' : 'bg-orange-50'
                                )}>
                                    <FileText className={cn("w-4 h-4", 
                                        log.action === 'CREATE' ? 'text-emerald-400' : 
                                        log.action === 'UPDATE' ? 'text-blue-400' : 'text-orange-400'
                                    )} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{log.action || 'System Action'} — {log.entityType || 'Policy'}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {log.userId?.name || 'System'} • {log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                                <Lock className="w-3 h-3" /> {log.action === 'CREATE' ? 'INIT' : 'MODIFY'}
                            </div>
                        </div>
                    )) : (
                        <div className="px-6 py-10 text-center">
                            <p className="text-xs text-slate-400 font-medium">No compliance actions recorded yet. Lock a period or run an audit to see history here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComplianceCenter;
