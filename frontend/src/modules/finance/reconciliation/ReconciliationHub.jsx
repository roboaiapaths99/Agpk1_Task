import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reconciliationService } from '../../../services/api/apiServices';
import CSVImportModal from './components/CSVImportModal';
import { toast } from 'react-hot-toast';

const ReconciliationHub = () => {
    const navigate = useNavigate();
    const [statements, setStatements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        fetchStatements();
    }, []);

    const fetchStatements = async () => {
        setLoading(true);
        try {
            const response = await reconciliationService.getStatements();
            setStatements(response.data.data.statements);
        } catch (error) {
            console.error('Failed to fetch statements:', error);
            toast.error('Failed to load reconciliation history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'reconciled': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'partially_reconciled': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="p-8 bg-[#0f172a] min-h-screen text-slate-200">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Bank Reconciliation</h1>
                        <p className="text-slate-400">Match your bank statements with internal payment records.</p>
                    </div>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Import Statement
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-[#1e293b] border border-slate-700/50 p-6 rounded-2xl shadow-sm">
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Statements</p>
                        <p className="text-3xl font-bold text-white">{statements.length}</p>
                    </div>
                    <div className="bg-[#1e293b] border border-slate-700/50 p-6 rounded-2xl shadow-sm border-l-4 border-l-emerald-500">
                        <p className="text-slate-400 text-sm font-medium mb-1">Fully Reconciled</p>
                        <p className="text-3xl font-bold text-white">
                            {statements.filter(s => s.status === 'reconciled').length}
                        </p>
                    </div>
                    <div className="bg-[#1e293b] border border-slate-700/50 p-6 rounded-2xl shadow-sm border-l-4 border-l-amber-500">
                        <p className="text-slate-400 text-sm font-medium mb-1">Pending Action</p>
                        <p className="text-3xl font-bold text-white">
                            {statements.filter(s => s.status !== 'reconciled').length}
                        </p>
                    </div>
                </div>

                {/* Statements Table */}
                <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statement Details</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Entries</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Uploaded Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-slate-500">Loading statements...</td>
                                    </tr>
                                ) : statements.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-slate-500">No statements found. Import one to get started.</td>
                                    </tr>
                                ) : (
                                    statements.map((statement) => (
                                        <tr key={statement._id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{statement.bankName}</div>
                                                <div className="text-slate-500 text-sm">A/C: {statement.accountNumber}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-300 font-medium">{statement.entries.length} items</span>
                                                    <span className="text-xs text-slate-500">
                                                        {statement.entries.filter(e => e.matchedPaymentId).length} matched
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(statement.status)}`}>
                                                    {statement.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {new Date(statement.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/finance/reconciliation/workspace/${statement._id}`)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Open Workspace
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CSVImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onUploadSuccess={fetchStatements}
            />
        </div>
    );
};

export default ReconciliationHub;
