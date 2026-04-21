import React, { useState } from 'react';
import { reconciliationService } from '../../../../services/api/apiServices';
import { toast } from 'react-hot-toast';

const CSVImportModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountNumber: '',
        statementDate: new Date().toISOString().split('T')[0]
    });

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleInputChange = (e) => {
        setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a CSV file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('bankName', bankDetails.bankName);
        formData.append('accountNumber', bankDetails.accountNumber);
        formData.append('statementDate', bankDetails.statementDate);

        setLoading(true);
        try {
            await reconciliationService.uploadStatement(formData);
            toast.success('Statement uploaded and processed successfully');
            onUploadSuccess();
            onClose();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(error.response?.data?.message || 'Failed to upload statement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Import Bank Statement</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Bank Name</label>
                        <input
                            type="text"
                            name="bankName"
                            required
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. HDFC Bank, ICICI Bank"
                            value={bankDetails.bankName}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Account Number</label>
                        <input
                            type="text"
                            name="accountNumber"
                            required
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Last 4-6 digits or full number"
                            value={bankDetails.accountNumber}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Statement Date</label>
                        <input
                            type="date"
                            name="statementDate"
                            required
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={bankDetails.statementDate}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="pt-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Select CSV File</label>
                        <div className="relative border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-2">
                                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p className="text-slate-300">{file ? file.name : 'Click or drag bank statement CSV'}</p>
                                <p className="text-xs text-slate-500">CSV only, max 10MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Upload & Import'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CSVImportModal;
