import React, { useState } from 'react';
import { 
    Plus, Search, RefreshCw, Filter, TrendingUp, AlertTriangle, 
    MoreHorizontal, Edit2, Trash2, DollarSign, PieChart, ArrowUpRight,
    ArrowDownRight, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../../../services/api/apiServices';
import BudgetForm from './BudgetForm';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../../lib/formatters';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
    const utilization = (budget.spentAmount / budget.limitAmount) * 100;
    const isOverBudget = utilization >= 100;
    const isWarning = utilization >= 80 && utilization < 100;

    const progressColor = isOverBudget 
        ? 'bg-rose-500' 
        : isWarning 
            ? 'bg-amber-500' 
            : 'bg-emerald-500';

    const textColor = isOverBudget 
        ? 'text-rose-600' 
        : isWarning 
            ? 'text-amber-600' 
            : 'text-emerald-600';

    return (
        <div className="glass-card p-6 border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all group">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", isOverBudget ? 'bg-rose-50' : 'bg-slate-50')}>
                        <PieChart className={cn("w-5 h-5", isOverBudget ? 'text-rose-500' : 'text-slate-400')} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{budget.category}</h4>
                        <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">
                            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(budget)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(budget._id)} className="p-2 hover:bg-slate-50 text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Utilization</p>
                        <p className={cn("text-2xl font-black italic mt-1", textColor)}>
                            {utilization.toFixed(1)}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Remaining</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">
                            {formatCurrency(budget.limitAmount - budget.spentAmount)}
                        </p>
                    </div>
                </div>

                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className={cn("h-full transition-all duration-1000 ease-out relative", progressColor)}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                    >
                        {utilization > 100 && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Spend</span>
                        <span className="text-xs font-black text-slate-700 italic">{formatCurrency(budget.spentAmount)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Cap</span>
                        <span className="text-xs font-black text-slate-900">{formatCurrency(budget.limitAmount)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="glass-card p-6 border border-slate-100 relative overflow-hidden">
        <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-20", color)} />
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-2 italic">{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1 mt-2">
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3 text-rose-500" /> : <ArrowDownRight className="w-3 h-3 text-emerald-500" />}
                        <span className={cn("text-[10px] font-black uppercase tracking-tight", trend === 'up' ? 'text-rose-500' : 'text-emerald-500')}>
                            {trendValue} vs last month
                        </span>
                    </div>
                )}
            </div>
            <div className={cn("p-3 rounded-2xl shadow-xl", color)}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
    </div>
);

const BudgetDashboard = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => budgetService.getAll()
    });

    const createMutation = useMutation({
        mutationFn: (newData) => budgetService.create(newData),
        onSuccess: () => {
            queryClient.invalidateQueries(['budgets']);
            toast.success('Fiscal policy activated successfully');
            handleCloseForm();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create budget')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => budgetService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['budgets']);
            toast.success('Budget policy revised');
            handleCloseForm();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update budget')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => budgetService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['budgets']);
            toast.success('Budget removed from tracking');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove budget')
    });

    const syncMutation = useMutation({
        mutationFn: () => budgetService.sync(),
        onSuccess: () => {
            queryClient.invalidateQueries(['budgets']);
            toast.success('Capital utilization re-calculated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to sync budgets')
    });

    const handleOpenForm = (budget = null) => {
        setEditingBudget(budget);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingBudget(null);
        setIsFormOpen(false);
    };

    const handleFormSubmit = (formData) => {
        if (editingBudget) {
            updateMutation.mutate({ id: editingBudget._id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const budgets = data?.data?.budgets || [];
    const filteredBudgets = budgets.filter(b => 
        b.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totals = budgets.reduce((acc, b) => ({
        limit: acc.limit + b.limitAmount,
        spent: acc.spent + b.spentAmount
    }), { limit: 0, spent: 0 });

    const criticalCount = budgets.filter(b => (b.spentAmount / b.limitAmount) >= 0.9).length;

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic">
                        BUDGET <span className="text-primary">CONTROL</span>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Real-time expenditure tracking and fiscal guardrails.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                        className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                        title="Recalculate Spends"
                    >
                        <RefreshCw className={cn("w-5 h-5", syncMutation.isPending && "animate-spin")} />
                    </button>
                    <button 
                        onClick={() => handleOpenForm()}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4 text-primary" />
                        Create Budget
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                    title="Total Allocated" 
                    value={formatCurrency(totals.limit)}
                    icon={DollarSign}
                    color="bg-primary"
                />
                <SummaryCard 
                    title="Actual Spent" 
                    value={formatCurrency(totals.spent)}
                    icon={TrendingUp}
                    color="bg-rose-500"
                    trend="up"
                    trendValue="12%"
                />
                <SummaryCard 
                    title="Critical Thresholds" 
                    value={criticalCount}
                    icon={AlertTriangle}
                    color={criticalCount > 0 ? "bg-amber-500" : "bg-emerald-500"}
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Filter className="w-4 h-4" />
                    Viewing {filteredBudgets.length} Budget Lines
                </div>
            </div>

            {/* Grid */}
            {filteredBudgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredBudgets.map(budget => (
                        <BudgetCard 
                            key={budget._id} 
                            budget={budget} 
                            onEdit={handleOpenForm}
                            onDelete={(id) => {
                                if (window.confirm('Terminate this fiscal policy?')) {
                                    deleteMutation.mutate(id);
                                }
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass-card flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                        <PieChart className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">No budget policies detected</h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs font-medium leading-relaxed">
                        Start tracking your expenditure by defining your first fiscal guardrail.
                    </p>
                    <button 
                        onClick={() => handleOpenForm()}
                        className="mt-8 flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Define Initial Budget
                    </button>
                </div>
            )}

            {/* Informational Footer */}
            <div className="flex items-start gap-4 p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />
                <div className="p-3 bg-white/10 rounded-2xl relative z-10 shrink-0">
                    <Info className="w-6 h-6 text-primary" />
                </div>
                <div className="relative z-10 text-xs">
                    <h5 className="font-black italic uppercase tracking-widest mb-1">Intelligent Guardrails</h5>
                    <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
                        Budgets are synchronized in real-time across Invoices and Expenses. 
                        When an expense is recorded or an invoice is settled, the corresponding category's utilization index is updated instantly.
                        System administrators will receive push notifications when consumption exceeds 80% and 100% of the allocated capital.
                    </p>
                </div>
            </div>

            <BudgetForm 
                isOpen={isFormOpen} 
                onClose={handleCloseForm} 
                onSubmit={handleFormSubmit}
                initialData={editingBudget}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};

export default BudgetDashboard;
