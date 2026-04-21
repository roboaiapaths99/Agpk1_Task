import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    Legend
} from 'recharts';
import {
    Calendar, Filter, Download, ArrowUpRight, ArrowDownRight,
    Users, Building2, AlertCircle, Clock, ChevronRight, ChevronDown,
    Mail, Phone, FileText
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/formatters';
import { financeReportService } from '../../../services/api/apiServices';

const AgingReport = ({ branchId }) => {
    const [reportType, setReportType] = useState('AR'); // AR or AP
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
    const [expandedRows, setExpandedRows] = useState({});

    const { data: agingData, isLoading } = useQuery({
        queryKey: ['aging-report', reportType, branchId, asOfDate],
        queryFn: () => {
            const params = { branchId, asOfDate };
            return reportType === 'AR' 
                ? financeReportService.getARAging(params)
                : financeReportService.getAPAging(params);
        }
    });

    const report = agingData?.data?.data || agingData?.data || agingData || {};
    const buckets = report.buckets || [];
    const summary = report.summary || {
        totalOutstanding: 0,
        totalOverdue: 0,
        criticalOverdue: 0 // > 90 days
    };



    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const bucketColors = {
        'Current': '#10b981', // emerald-500
        '1-30 Days': '#3b82f6', // blue-500
        '31-60 Days': '#f59e0b', // amber-500
        '61-90 Days': '#f97316', // orange-500
        '91-120 Days': '#ef4444', // red-500
        '120+ Days': '#7f1d1d'  // red-900
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Crunching Aging Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                        onClick={() => setReportType('AR')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-widest",
                            reportType === 'AR' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Accounts Receivable
                    </button>
                    <button
                        onClick={() => setReportType('AP')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-widest",
                            reportType === 'AP' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Accounts Payable
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                    title={`Total ${reportType}`} 
                    value={summary.totalOutstanding} 
                    icon={<FileText className="w-4 h-4" />}
                    color="text-slate-900"
                />
                <SummaryCard 
                    title="Total Overdue" 
                    value={summary.totalOverdue} 
                    icon={<Clock className="w-4 h-4" />}
                    color="text-rose-600"
                    subtitle={`${((summary.totalOverdue / summary.totalOutstanding) * 100).toFixed(1)}% of total`}
                />
                <SummaryCard 
                    title="Critical (>90 Days)" 
                    value={summary.criticalOverdue} 
                    icon={<AlertCircle className="w-4 h-4" />}
                    color="text-red-900"
                    subtitle="High collection risk"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Aging Distribution</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">Breakdown by days past due</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={buckets}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    tickFormatter={(val) => `₹${val/1000}k`}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 shadow-xl border border-slate-50 rounded-xl">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                    <p className="text-sm font-black text-primary">{formatCurrency(payload[0].value)}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-1">{payload[0].payload.count} items</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {buckets.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={bucketColors[entry.name] || '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6 overflow-hidden relative">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Risk Composition</h3>
                    <div className="space-y-6">
                        {buckets.map((bucket, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    <span>{bucket.name}</span>
                                    <span>{((bucket.value / summary.totalOutstanding) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ 
                                            width: `${(bucket.value / summary.totalOutstanding) * 100}%`,
                                            backgroundColor: bucketColors[bucket.name] || '#6366f1'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Detail by {reportType === 'AR' ? 'Customer' : 'Vendor'}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Expanded view shows individual invoices/expenses</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100">
                            <Filter className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Name</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Total</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Current</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">1-30</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">31-60</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">61-90</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">91+</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {report.details?.map((item, i) => (
                                <React.Fragment key={item.id}>
                                    <tr className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => toggleRow(item.id)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                    {item.name?.charAt(0) || '?'}
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{item.count} items</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900">{formatCurrency(item.total)}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-sm font-bold text-slate-700">{formatCurrency(item['Current'])}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-sm font-bold text-blue-600">{formatCurrency(item['1-30 Days'])}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-sm font-bold text-amber-600">{formatCurrency(item['31-60 Days'])}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-sm font-bold text-orange-600">{formatCurrency(item['61-90 Days'])}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-sm font-black text-rose-600">{formatCurrency((item['91-120 Days'] || 0) + (item['120+ Days'] || 0))}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {expandedRows[item.id] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                        </td>
                                    </tr>
                                    {expandedRows[item.id] && (
                                        <tr>
                                            <td colSpan="8" className="bg-slate-50/30 px-6 py-4">
                                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                    {item.items?.map((subItem, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subItem.reference}</div>
                                                                <div className="text-xs font-bold text-slate-700">{subItem.date}</div>
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Days Past Due</span>
                                                                    <span className={cn(
                                                                        "text-xs font-black",
                                                                        subItem.daysOverdue > 90 ? "text-rose-600" : subItem.daysOverdue > 30 ? "text-amber-600" : "text-emerald-600"
                                                                    )}>{subItem.daysOverdue} days</span>
                                                                </div>
                                                                <div className="text-sm font-black text-slate-900">{formatCurrency(subItem.amount)}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon, color, subtitle }) => {

    return (
        <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                    {icon}
                </div>
            </div>
            <div className="mt-4">
                <span className={cn("text-2xl font-black tracking-tighter", color)}>{formatCurrency(value)}</span>
                {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};

export default AgingReport;
