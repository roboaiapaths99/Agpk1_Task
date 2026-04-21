import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, 
    Trash2, 
    Save, 
    X, 
    AlertCircle, 
    CheckCircle2,
    ArrowLeft,
    Info,
    History
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { journalService, accountService, branchService } from '../../../services/api/apiServices';
import { format } from 'date-fns';

const JournalForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        branchId: '',
        isReversing: false,
        reversalDate: '',
        notes: '',
        entries: [
            { accountCode: '', debit: 0, credit: 0 },
            { accountCode: '', debit: 0, credit: 0 }
        ]
    });

    // Fetch Accounts for dropdown
    const { data: accountsData } = useQuery({
        queryKey: ['accounts'],
        queryFn: () => accountService.getAll()
    });
    const accounts = accountsData?.data?.accounts || [];

    // Fetch Branches for dropdown
    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getAll()
    });
    const branches = branchesData?.data?.branches || [];

    // Fetch Entry if in edit mode
    const { data: entryData, isLoading: isLoadingEntry } = useQuery({
        queryKey: ['journalEntry', id],
        queryFn: () => journalService.getById(id),
        enabled: isEditMode
    });

    useEffect(() => {
        if (entryData?.data?.entry) {
            const entry = entryData.data.entry;
            setFormData({
                description: entry.description,
                date: format(new Date(entry.date), 'yyyy-MM-dd'),
                branchId: entry.branchId || '',
                isReversing: false,
                reversalDate: '',
                notes: entry.notes || '',
                entries: entry.entries.map(e => ({
                    accountCode: e.accountId.code,
                    debit: e.debit,
                    credit: e.credit
                }))
            });
        }
    }, [entryData]);

    const mutation = useMutation({
        mutationFn: journalService.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['journalEntries']);
            toast.success('Journal entry posted successfully');
            navigate('/finance/journal');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to post entry');
        }
    });

    const addRow = () => {
        setFormData(prev => ({
            ...prev,
            entries: [...prev.entries, { accountCode: '', debit: 0, credit: 0 }]
        }));
    };

    const removeRow = (index) => {
        if (formData.entries.length <= 2) {
            toast.error('A journal entry must have at least 2 lines');
            return;
        }
        setFormData(prev => ({
            ...prev,
            entries: prev.entries.filter((_, i) => i !== index)
        }));
    };

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...formData.entries];
        
        if (field === 'debit' || field === 'credit') {
            const numValue = parseFloat(value) || 0;
            newEntries[index][field] = numValue;
            // If setting debit, set credit to 0 and vice versa (common UX, though not always desired)
            if (field === 'debit' && numValue > 0) newEntries[index].credit = 0;
            if (field === 'credit' && numValue > 0) newEntries[index].debit = 0;
        } else {
            newEntries[index][field] = value;
        }

        setFormData(prev => ({ ...prev, entries: newEntries }));
    };

    const totalDebits = formData.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredits = formData.entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const difference = Math.abs(totalDebits - totalCredits);
    const isBalanced = totalDebits === totalCredits && totalDebits > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isBalanced) {
            toast.error('Journal entry must be balanced (Debits = Credits)');
            return;
        }
        mutation.mutate(formData);
    };

    if (isLoadingEntry) return <div className="p-10 text-center">Loading journal entry...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <button 
                    onClick={() => navigate('/finance/journal')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Journal
                </button>

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditMode ? 'View Journal Entry' : 'New Journal Entry'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isEditMode ? `Details for entry ${id.substring(id.length - 8)}` : 'Record a double-entry transaction manually'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                            <input 
                                type="text"
                                required
                                disabled={isEditMode}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                                placeholder="e.g., Monthly depreciation for April 2026"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date*</label>
                            <input 
                                type="date"
                                required
                                disabled={isEditMode}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch (Optional)</label>
                            <select 
                                disabled={isEditMode}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                                value={formData.branchId}
                                onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        {!isEditMode && (
                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="checkbox"
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        checked={formData.isReversing}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isReversing: e.target.checked }))}
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Is Reversing?</span>
                                </label>
                                {formData.isReversing && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reversal Date:</label>
                                        <input 
                                            type="date"
                                            required={formData.isReversing}
                                            className="px-2 py-1 text-sm border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={formData.reversalDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reversalDate: e.target.value }))}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Entries Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">Account</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Debit (₹)</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Credit (₹)</th>
                                    {!isEditMode && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {formData.entries.map((entry, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <select 
                                                required
                                                disabled={isEditMode}
                                                className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm font-medium text-gray-900 disabled:opacity-80"
                                                value={entry.accountCode}
                                                onChange={(e) => handleEntryChange(index, 'accountCode', e.target.value)}
                                            >
                                                <option value="">Select Account...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc._id} value={acc.code}>
                                                        {acc.code} - {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-3">
                                            <input 
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                disabled={isEditMode}
                                                className="w-full bg-transparent border-none text-right focus:ring-0 outline-none text-sm font-semibold text-gray-900 placeholder-gray-300 disabled:opacity-80"
                                                placeholder="0.00"
                                                value={entry.debit || ''}
                                                onChange={(e) => handleEntryChange(index, 'debit', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input 
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                disabled={isEditMode}
                                                className="w-full bg-transparent border-none text-right focus:ring-0 outline-none text-sm font-semibold text-gray-900 placeholder-gray-300 disabled:opacity-80"
                                                placeholder="0.00"
                                                value={entry.credit || ''}
                                                onChange={(e) => handleEntryChange(index, 'credit', e.target.value)}
                                            />
                                        </td>
                                        {!isEditMode && (
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => removeRow(index)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50/50 border-t border-gray-200">
                                <tr className="font-bold text-sm">
                                    <td className="px-6 py-4">
                                        {!isEditMode && (
                                            <button 
                                                type="button"
                                                onClick={addRow}
                                                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors text-xs uppercase tracking-wider"
                                            >
                                                <Plus size={14} />
                                                Add Line Item
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-900">
                                        ₹{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-900">
                                        ₹{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    {!isEditMode && <td></td>}
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
                        <div className="flex items-center gap-3">
                            {isBalanced ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                    <CheckCircle2 size={18} />
                                    <span className="text-sm font-medium text-green-800">Balanced Entry</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-medium text-red-800">
                                        Unbalanced: Difference ₹{difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                <Info size={12} className="inline mr-1" />
                                Debits must equal credits
                            </div>
                        </div>

                        {!isEditMode && (
                            <div className="flex gap-3 w-full md:w-auto">
                                <button 
                                    type="button"
                                    onClick={() => navigate('/finance/journal')}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={!isBalanced || mutation.isPending}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md shadow-indigo-100"
                                >
                                    {mutation.isPending ? 'Posting...' : (
                                        <>
                                            <Save size={18} />
                                            Post Entry
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </form>

                {/* Additional Notes Card */}
                {!isEditMode && (
                    <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes / Reference</label>
                        <textarea 
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                            placeholder="Add any internal remarks or reference numbers..."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        ></textarea>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JournalForm;
