import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, 
    Search, 
    Filter, 
    MoreVertical, 
    Eye, 
    RotateCcw, 
    Ban, 
    Calendar,
    ArrowRightLeft,
    CheckCircle2,
    XCircle,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { journalService } from '../../../services/api/apiServices';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const JournalList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const { data, isLoading } = useQuery({
        queryKey: ['journalEntries', searchTerm, dateRange],
        queryFn: () => journalService.getAll({ 
            search: searchTerm, 
            startDate: dateRange.start, 
            endDate: dateRange.end 
        })
    });

    const voidMutation = useMutation({
        mutationFn: journalService.void,
        onSuccess: () => {
            queryClient.invalidateQueries(['journalEntries']);
            toast.success('Journal entry voided successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to void entry');
        }
    });

    const reverseMutation = useMutation({
        mutationFn: journalService.reverse,
        onSuccess: () => {
            queryClient.invalidateQueries(['journalEntries']);
            toast.success('Journal entry reversed successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reverse entry');
        }
    });

    const entries = data?.data?.entries || [];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage manual ledger postings and adjustments</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium">
                        <Download size={18} />
                        Export
                    </button>
                    <button 
                        onClick={() => navigate('/finance/journal/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm shadow-indigo-200"
                    >
                        <Plus size={18} />
                        New Entry
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by description..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="date" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="date" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Debit</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading entries...</td>
                            </tr>
                        ) : entries.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No journal entries found</td>
                            </tr>
                        ) : entries.map((entry) => {
                            const totalDebit = entry.entries.reduce((sum, e) => sum + e.debit, 0);
                            return (
                                <tr key={entry._id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {format(new Date(entry.date), 'dd MMM yyyy')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {format(new Date(entry.createdAt), 'hh:mm a')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium truncate max-w-xs">{entry.description}</div>
                                        {entry.sourceId && (
                                            <div className="text-xs text-indigo-500 flex items-center gap-1 mt-1">
                                                <ArrowRightLeft size={10} />
                                                Related to entry ...{entry.sourceId.substring(entry.sourceId.length - 6)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900">₹{totalDebit.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {entry.isPosted ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                <CheckCircle2 size={12} />
                                                Posted
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                <XCircle size={12} />
                                                Voided
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">{entry.createdBy?.firstName || 'System'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => navigate(`/finance/journal/${entry._id}`)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                                title="View Detail"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {entry.isPosted && (
                                                <>
                                                    <button 
                                                        onClick={() => {
                                                            if(window.confirm('Are you sure you want to reverse this entry?')) {
                                                                reverseMutation.mutate(entry._id);
                                                            }
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                                                        title="Reverse Entry"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if(window.confirm('Are you sure you want to void this entry?')) {
                                                                voidMutation.mutate(entry._id);
                                                            }
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                        title="Void Entry"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default JournalList;
