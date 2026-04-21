import React from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, Clock,
    AlertCircle, ShieldCheck, Activity, Download,
    PlusCircle, Eye, FileSearch, Settings2, FileText, Wallet, Building2, PieChart,
    Plus, UserCheck
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { financeReportService } from '../../../services/api/apiServices';
import { cn } from '../../../lib/utils';
import { formatCurrency, formatDate } from '../../../lib/formatters';

const StatCard = ({ title, value, detail, icon: Icon, color, onClick }) => (
    <div
        onClick={onClick}
        className={cn(
            "glass-card p-6 flex items-start justify-between group transition-all border border-slate-100",
            onClick ? "cursor-pointer hover:shadow-lg hover:border-primary/20" : ""
        )}
    >
        <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 italic">{value}</h3>
            <p className="text-xs text-slate-400 mt-1">{detail}</p>
        </div>
        <div className={cn("p-3 rounded-xl shadow-inner transition-transform group-hover:scale-110", color)}>
            <Icon className="w-5 h-5 text-white" />
        </div>
    </div>
);

const ModuleCard = ({ title, desc, icon: Icon, link, color }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(link)}
            className="glass-card p-6 border border-slate-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl hover:border-primary/20 transition-all duration-300"
        >
            <div className={cn("p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform", color)}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );
};

const FinanceDashboard = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery({
        queryKey: ['finance-dashboard'],
        queryFn: () => financeReportService.getDashboard(),
    });

    const metrics = data?.data?.metrics || data?.metrics || {};
    const forecast = data?.data?.forecast || data?.forecast || [];

    return (
        <div className="space-y-8 p-6 md:p-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic">
                        FINANCIAL <span className="text-primary">HEALTH</span>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Enterprise fiscal monitoring and real-time audit trails.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/finance/ledger')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                        <FileSearch className="w-4 h-4" />
                        Audit Ledger
                    </button>
                    <button
                        onClick={() => navigate('/finance/compliance')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Compliance Hub
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Liquid Cash"
                    value={formatCurrency(metrics.liquidCash || 0)}
                    detail="Available across all accounts"
                    icon={DollarSign}
                    color="bg-emerald-500"
                    onClick={() => navigate('/finance/ledger')}
                />
                <StatCard
                    title="Burn Rate"
                    value={formatCurrency(metrics.monthlyBurn || 0)}
                    detail="Projected monthly spend"
                    icon={Activity}
                    color="bg-rose-500"
                    onClick={() => navigate('/finance/expenses')}
                />
                <StatCard
                    title="Receivables"
                    value={formatCurrency(metrics.receivables || 0)}
                    detail="Outstanding client payments"
                    icon={FileText}
                    color="bg-blue-500"
                    onClick={() => navigate('/finance/invoices')}
                />
                <StatCard
                    title="Payroll Commit"
                    value={formatCurrency(metrics.totalPayroll || 0)}
                    detail="Next cycle projection"
                    icon={UserCheck}
                    color="bg-indigo-500"
                    onClick={() => navigate('/finance/payroll')}
                />
            </div>

            {/* Core Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <ModuleCard
                    title="Ledger"
                    desc="Double-entry books with audit verification."
                    icon={FileSearch}
                    link="/finance/ledger"
                    color="bg-slate-900"
                />
                <ModuleCard
                    title="Invoices"
                    desc="Client billing & payment tracking."
                    icon={Wallet}
                    link="/finance/invoices"
                    color="bg-blue-600"
                />
                <ModuleCard
                    title="Expenses"
                    desc="Operational spend & receipts."
                    icon={TrendingUp}
                    link="/finance/expenses"
                    color="bg-rose-600"
                />
                <ModuleCard
                    title="Reports"
                    desc="P&L and Balance Sheet insights."
                    icon={Settings2}
                    link="/finance/reports"
                    color="bg-emerald-600"
                />
                <ModuleCard
                    title="Branches"
                    desc="Manage multi-location business units."
                    icon={Building2}
                    link="/finance/branches"
                    color="bg-indigo-600"
                />
                <ModuleCard
                    title="Budgets"
                    desc="Capital guardrails & spending limits."
                    icon={PieChart}
                    link="/finance/budgets"
                    color="bg-amber-600"
                />
                <ModuleCard
                    title="Payroll"
                    desc="Dynamic salary & payslip management."
                    icon={UserCheck}
                    link="/finance/payroll"
                    color="bg-violet-600"
                />
                <ModuleCard
                    title="Forecasting"
                    desc="AI-driven revenue projections."
                    icon={TrendingUp}
                    link="/finance/forecasting"
                    color="bg-blue-600"
                />
                <ModuleCard
                    title="Taxation"
                    desc="GST & VAT compliance management."
                    icon={PlusCircle}
                    link="/finance/tax"
                    color="bg-rose-600"
                />
            </div>

            {/* Main Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-6 border border-slate-100 divide-y divide-slate-50">
                    <div className="flex items-center justify-between pb-6">
                        <h3 className="text-lg font-black italic flex items-center gap-2 text-slate-900 uppercase tracking-tighter">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Revenue Projection
                        </h3>
                        <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            <button className="px-4 py-1.5 bg-white rounded-lg shadow-sm">6 Months</button>
                            <button className="px-4 py-1.5 text-slate-400 hover:text-slate-600 transition-colors">1 Year</button>
                        </div>
                    </div>
                    <div className="pt-8 h-80 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecast}>
                                <defs>
                                    <linearGradient id="financeColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px' }}
                                    formatter={(val) => [formatCurrency(val), 'Projected']}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#financeColor)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-1 border-l border-slate-100 pl-0 lg:pl-8 space-y-6">
                    <div className="glass-card p-6 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/30 transition-all duration-700" />
                        <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10">
                            <AlertCircle className="w-4 h-4 text-amber-400 shadow-glow" />
                            AI Audit Anomalies
                        </h4>
                        <div className="space-y-4 relative z-10">
                            {metrics.anomalies?.length > 0 ? (
                                metrics.anomalies.map((a, i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                                        <p className="text-xs text-white font-bold italic">{a.title}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{a.description}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center opacity-40">
                                    <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">No anomalies detected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-6 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center text-center py-10 hover:border-primary/40 transition-all group">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/5 transition-colors">
                            <Clock className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 italic uppercase tracking-tighter">Period Locking</h4>
                        <p className="text-[10px] text-slate-400 mt-2 max-w-[180px] font-medium leading-relaxed">Secure your fiscal truth. All entries become immutable upon locking.</p>
                        <button
                            onClick={() => navigate('/finance/compliance')}
                            className="mt-6 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Configure Guardrails
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="glass-card p-4 bg-slate-50/50 border border-slate-100 flex flex-wrap items-center justify-center gap-4">
                <button onClick={() => navigate('/finance/invoices/new')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-primary hover:shadow-md transition-all active:scale-95">
                    <PlusCircle className="w-4 h-4" /> New Invoice
                </button>
                <button onClick={() => navigate('/finance/expenses/new')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-rose-500 hover:shadow-md transition-all active:scale-95">
                    <PlusCircle className="w-4 h-4" /> Log Expense
                </button>
                <button onClick={() => navigate('/finance/reports')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-500 hover:shadow-md transition-all active:scale-95">
                    <Download className="w-4 h-4" /> Financial Statements
                </button>
                <button onClick={() => navigate('/finance/compliance')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-amber-500 hover:shadow-md transition-all active:scale-95">
                    <Settings2 className="w-4 h-4" /> Settings
                </button>
                <button onClick={() => navigate('/finance/budgets')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-primary hover:shadow-md transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> New Budget
                </button>
            </div>
        </div>
    );
};

export default FinanceDashboard;
