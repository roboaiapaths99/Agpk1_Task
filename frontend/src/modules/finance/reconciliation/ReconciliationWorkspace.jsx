import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reconciliationService, paymentService } from '../../../services/api/apiServices';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { toast } from 'react-hot-toast';

const ReconciliationWorkspace = () => {
    const { id: statementId } = useParams();
    const navigate = useNavigate();
    const [statement, setStatement] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);

    useEffect(() => {
        fetchData();
    }, [statementId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statementRes, paymentsRes] = await Promise.all([
                reconciliationService.getStatements(), // Filter in JS for now or add getById to API
                paymentService.getAll({ reconciled: false, status: 'completed' })
            ]);
            
            const currentStatement = statementRes.data.data.statements.find(s => s._id === statementId);
            setStatement(currentStatement);
            setPayments(paymentsRes.data.data.payments);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load workspace data');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoMatch = async () => {
        try {
            const response = await reconciliationService.autoMatch(statementId);
            toast.success(`Auto-matched ${response.data.matchCount} entries`);
            fetchData();
        } catch (error) {
            toast.error('Auto-match failed');
        }
    };

    const handleManualMatch = async () => {
        if (!selectedEntry || !selectedPayment) return;
        
        try {
            await reconciliationService.matchPayment({
                statementId,
                entryId: selectedEntry._id,
                paymentId: selectedPayment._id
            });
            toast.success('Successfully matched');
            setSelectedEntry(null);
            setSelectedPayment(null);
            fetchData();
        } catch (error) {
            toast.error('Matching failed');
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Loading workspace...</div>;
    if (!statement) return <div className="p-8 text-red-400">Statement not found</div>;

    return (
        <div className="p-6 bg-[#0f172a] min-h-screen text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/finance/reconciliation')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{statement.bankName} - Reconciliation</h1>
                        <p className="text-sm text-slate-400">A/C: {statement.accountNumber} | {formatDate(statement.statementDate)}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleAutoMatch}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all"
                    >
                        Trigger Auto-Match
                    </button>
                    <button
                        onClick={handleManualMatch}
                        disabled={!selectedEntry || !selectedPayment}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    >
                        Confirm Manual Match
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
                {/* Bank Statement Entries */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 flex flex-col">
                    <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                        <h2 className="font-semibold text-white uppercase text-xs tracking-wider">Bank Statement Entries</h2>
                        <span className="text-xs text-slate-400">{statement.entries.filter(e => !e.matchedPaymentId).length} pending</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {statement.entries.map((entry) => (
                            <div
                                key={entry._id}
                                onClick={() => !entry.matchedPaymentId && setSelectedEntry(entry)}
                                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                    entry.matchedPaymentId 
                                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                                        : selectedEntry?._id === entry._id
                                            ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
                                    <span className={`font-bold ${entry.credit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {entry.credit > 0 ? '+' : ''}{formatCurrency(entry.credit || -entry.debit)}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-slate-200 truncate">{entry.description}</div>
                                {entry.matchedPaymentId && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Matched
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Payments */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 flex flex-col">
                    <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                        <h2 className="font-semibold text-white uppercase text-xs tracking-wider">System Payments</h2>
                        <span className="text-xs text-slate-400">{payments.length} available</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {payments.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm italic">No un-reconciled payments found</div>
                        ) : (
                            payments.map((payment) => (
                                <div
                                    key={payment._id}
                                    onClick={() => setSelectedPayment(payment)}
                                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                        selectedPayment?._id === payment._id
                                            ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-slate-400">{formatDate(payment.paymentDate)}</span>
                                        <span className="font-bold text-white">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-200">Ref: {payment.reference || 'N/A'}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">Method: {payment.method}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReconciliationWorkspace;
