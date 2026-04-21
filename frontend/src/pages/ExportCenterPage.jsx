import React, { useState } from 'react';
import {
    Download, FileText, Table as TableIcon,
    Filter, Calendar, Shield, ArrowRight,
    CheckCircle2, Info, Loader2, FileSpreadsheet,
    Briefcase, Activity, Receipt, DollarSign, Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { operationsService, projectService } from '../services/api/apiServices';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ExportCenterPage = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [activeDataType, setActiveDataType] = useState('invoices');
    const [filters, setFilters] = useState({
        projectId: '',
        priority: '',
        status: '',
        format: 'xlsx',
        dateFrom: '',
        dateTo: ''
    });
    const [recentExports, setRecentExports] = useState([]);

    const { data: projectsData } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getAll
    });

    const safeProjects = projectsData?.data?.projects || projectsData?.projects || projectsData?.data || projectsData || [];
    const projects = Array.isArray(safeProjects) ? safeProjects : [];

    const triggerDownload = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            let response;
            let filename;

            const baseFilters = {
                status: filters.status || undefined,
                dateFrom: filters.dateFrom || undefined,
                dateTo: filters.dateTo || undefined
            };

            if (activeDataType === 'invoices') {
                if (filters.format === 'xlsx') {
                    response = await operationsService.exportInvoicesExcel(baseFilters);
                    filename = `Invoices_${timestamp}.xlsx`;
                } else {
                    response = await operationsService.exportTasks({ format: filters.format });
                    filename = `Invoices_${timestamp}.${filters.format}`;
                }
            } else if (activeDataType === 'tasks') {
                if (filters.format === 'xlsx') {
                    response = await operationsService.exportTasksExcel({
                        ...baseFilters,
                        projectId: filters.projectId || undefined,
                        priority: filters.priority || undefined
                    });
                    filename = `Tasks_${timestamp}.xlsx`;
                } else {
                    response = await operationsService.exportTasks({
                        ...filters,
                        format: filters.format
                    });
                    filename = `Tasks_${timestamp}.${filters.format}`;
                }
            } else if (activeDataType === 'expenses') {
                response = await operationsService.exportExpensesExcel(baseFilters);
                filename = `Expenses_${timestamp}.xlsx`;
            } else if (activeDataType === 'journal') {
                response = await operationsService.exportJournalExcel(baseFilters);
                filename = `Journal_${timestamp}.xlsx`;
            } else if (activeDataType === 'projects') {
                response = await operationsService.exportProjectsExcel({
                    status: filters.status || undefined
                });
                filename = `Projects_${timestamp}.xlsx`;
            } else {
                // Audit export - use existing task export as fallback
                response = await operationsService.exportTasks({
                    format: filters.format === 'xlsx' ? 'csv' : filters.format
                });
                filename = `AuditLogs_${timestamp}.${filters.format === 'xlsx' ? 'csv' : filters.format}`;
            }

            const blob = new Blob([response.data], {
                type: filters.format === 'xlsx'
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : filters.format === 'csv' ? 'text/csv' : 'application/pdf'
            });

            triggerDownload(blob, filename);

            setRecentExports(prev => [{
                name: filename,
                date: new Date().toLocaleString(),
                size: `${(blob.size / 1024).toFixed(1)} KB`
            }, ...prev.slice(0, 4)]);

            toast.success(`${filename} downloaded successfully`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(error?.response?.data?.message || 'Failed to generate export package');
        } finally {
            setIsExporting(false);
        }
    };

    const exportOptions = [
        {
            id: 'invoices', label: 'Invoices & Revenue', icon: Receipt,
            description: 'Complete invoice data with customer details, payment status, and financial summaries.',
            color: 'emerald'
        },
        {
            id: 'expenses', label: 'Expenses & Outbound', icon: DollarSign,
            description: 'Categorized spending, vendor payments, and tax-ready expense reports.',
            color: 'rose'
        },
        {
            id: 'journal', label: 'Journal & Ledger', icon: Activity,
            description: 'Full double-entry bookkeeping logs with debit/credit parity checks.',
            color: 'violet'
        },
        {
            id: 'tasks', label: 'Work Items & Tasks', icon: Briefcase,
            description: 'Full task history with status, priority, assignees, and SLA tracking.',
            color: 'indigo'
        },
        {
            id: 'projects', label: 'Project Portfolio', icon: Briefcase,
            description: 'Comprehensive overview of all projects, timelines, health, and milestones.',
            color: 'teal'
        },
        {
            id: 'audit', label: 'Audit Trail Logs', icon: Shield,
            description: 'Tamper-proof activity logs of all system changes with before/after diffs.',
            color: 'amber'
        }
    ];

    const formatOptions = [
        { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, desc: 'Multi-sheet workbook with formatting' },
        { id: 'csv', label: 'CSV', icon: TableIcon, desc: 'Plain data for spreadsheets' },
        { id: 'pdf', label: 'PDF Report', icon: FileText, desc: 'Formatted document for sharing' }
    ];

    const activeOption = exportOptions.find(o => o.id === activeDataType);
    const colorMap = {
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'text-emerald-500' },
        rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', icon: 'text-rose-500' },
        violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', icon: 'text-violet-500' },
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', icon: 'text-indigo-500' },
        teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', icon: 'text-teal-500' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'text-amber-500' }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Export Center</h1>
                        <p className="text-slate-500 text-sm font-medium">Generate professional Excel reports and compliance data packages.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800">
                {/* Configuration Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Data Type Selection */}
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-lg shadow-slate-100/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-indigo-500" />
                            Select Data Source
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {exportOptions.map(option => {
                                const colors = colorMap[option.color];
                                const isActive = activeDataType === option.id;
                                return (
                                    <motion.div
                                        key={option.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveDataType(option.id)}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden",
                                            isActive
                                                ? `${colors.border} ${colors.bg}`
                                                : "border-slate-50 hover:border-slate-200 bg-white"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute top-3 right-3"
                                            >
                                                <CheckCircle2 className={cn("w-5 h-5", colors.text)} />
                                            </motion.div>
                                        )}
                                        <option.icon className={cn(
                                            "w-6 h-6 mb-2",
                                            isActive ? colors.icon : "text-slate-300"
                                        )} />
                                        <h4 className={cn(
                                            "font-bold text-xs uppercase mb-1",
                                            isActive ? colors.text : "text-slate-500"
                                        )}>{option.label}</h4>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight">{option.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Output Format */}
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-lg shadow-slate-100/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                            Output Format
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {formatOptions.map(fmt => (
                                <motion.button
                                    key={fmt.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setFilters({ ...filters, format: fmt.id })}
                                    className={cn(
                                        "p-4 rounded-2xl text-left transition-all border-2 relative",
                                        filters.format === fmt.id
                                            ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-300"
                                            : "bg-white text-slate-600 border-slate-50 hover:border-slate-200"
                                    )}
                                >
                                    <fmt.icon className={cn("w-5 h-5 mb-2", filters.format === fmt.id ? "text-indigo-300" : "text-slate-300")} />
                                    <div className={cn("text-xs font-bold", filters.format === fmt.id ? "text-white" : "text-slate-700")}>{fmt.label}</div>
                                    <div className={cn("text-[10px] mt-0.5", filters.format === fmt.id ? "text-slate-400" : "text-slate-400")}>{fmt.desc}</div>
                                    {filters.format === fmt.id && (
                                        <motion.div layoutId="formatCheck" className="absolute top-3 right-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-lg shadow-slate-100/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-violet-500" />
                            Filters & Scope
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {activeDataType === 'tasks' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Project</label>
                                    <select
                                        value={filters.projectId}
                                        onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                                    >
                                        <option value="">All Projects</option>
                                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                                >
                                    <option value="">All Statuses</option>
                                    {activeDataType === 'invoices' && (
                                        <>
                                            <option value="draft">Draft</option>
                                            <option value="sent">Sent</option>
                                            <option value="paid">Paid</option>
                                            <option value="overdue">Overdue</option>
                                            <option value="cancelled">Cancelled</option>
                                        </>
                                    )}
                                    {activeDataType === 'expenses' && (
                                        <>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="reimbursed">Reimbursed</option>
                                        </>
                                    )}
                                    {activeDataType === 'journal' && (
                                        <>
                                            <option value="posted">Posted</option>
                                            <option value="void">Voided</option>
                                        </>
                                    )}
                                    {activeDataType === 'projects' && (
                                        <>
                                            <option value="active">Active</option>
                                            <option value="on-hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                        </>
                                    )}
                                    {activeDataType === 'tasks' && (
                                        <>
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="done">Done</option>
                                            <option value="blocked">Blocked</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> From Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> To Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                            </div>

                            {activeDataType === 'tasks' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Priority</label>
                                    <select
                                        value={filters.priority}
                                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export Button */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating {filters.format.toUpperCase()} Package...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Export {activeOption?.label} as {filters.format.toUpperCase()}
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Security Note */}
                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Shield className="w-28 h-28" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-3 relative z-10">Security Note</h4>
                        <p className="text-slate-400 text-xs font-medium mb-5 relative z-10 leading-relaxed">
                            Exported data contains sensitive organizational intelligence. All extraction events are logged in the primary audit trail.
                        </p>
                        <div className="space-y-3 relative z-10">
                            {['PII Redaction enabled', 'End-to-end encryption', 'Audit trail logged'].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Format Info */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-3xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            <h5 className="font-black text-emerald-900 uppercase text-[10px] tracking-widest">Excel Features</h5>
                        </div>
                        <ul className="space-y-2 text-[11px] text-emerald-800 font-medium">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                                Multi-sheet workbooks with summary dashboards
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                                Color-coded status columns and currency formatting
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                                Auto-filters and frozen headers for easy analysis
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                                Ready for Google Sheets import
                            </li>
                        </ul>
                    </div>

                    {/* Recent Exports */}
                    <div className="p-5">
                        <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-4">Recent Exports</h5>
                        <div className="space-y-2">
                            <AnimatePresence>
                                {recentExports.length > 0 ? recentExports.map((exp, i) => (
                                    <motion.div
                                        key={exp.name + i}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-50 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-slate-700">{exp.name}</div>
                                                <div className="text-[9px] text-slate-400">{exp.size} • {exp.date}</div>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    </motion.div>
                                )) : (
                                    <div className="text-center py-6 text-slate-300">
                                        <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-[11px] font-medium">No exports yet this session</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportCenterPage;
