import React, { useState } from 'react';
import { 
    LayoutGrid, 
    List, 
    Plus, 
    Search, 
    ChevronRight, 
    ChevronDown, 
    MoreVertical, 
    Shield, 
    Zap,
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    Wallet,
    Building2,
    Briefcase
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../../../services/api/apiServices';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

const AccountTypeBadge = ({ type }) => {
    const types = {
        asset: { label: 'Asset', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Wallet },
        liability: { label: 'Liability', color: 'bg-red-50 text-red-700 border-red-200', icon: Building2 },
        equity: { label: 'Equity', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: PieChart },
        revenue: { label: 'Revenue', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowUpRight },
        expense: { label: 'Expense', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: ArrowDownLeft }
    };

    const config = types[type] || types.asset;
    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            config.color
        )}>
            <Icon className="w-2.5 h-2.5 mr-1" />
            {config.label}
        </span>
    );
};

const TreeItem = ({ account, depth = 0, onEdit }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = account.children && account.children.length > 0;

    return (
        <div className="select-none">
            <div 
                className={cn(
                    "flex items-center py-3 px-4 hover:bg-slate-50 transition-colors group border-b border-slate-100",
                    depth > 0 && "ml-6 border-l border-slate-200"
                )}
            >
                <div className="flex items-center flex-1 min-w-0">
                    {hasChildren ? (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors mr-1"
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </button>
                    ) : (
                        <div className="w-6" />
                    )}
                    
                    <span className="text-[11px] font-bold text-slate-400 w-12 mono">{account.code}</span>
                    <span className="text-sm font-semibold text-slate-700 truncate ml-2">{account.name}</span>
                    <div className="ml-4">
                        <AccountTypeBadge type={account.type} />
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-900 mono">₹{account.balance?.toLocaleString() || '0'}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        {account.isSystem && (
                            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors cursor-help" title="System Property">
                                <Shield className="w-3.5 h-3.5" />
                            </div>
                        )}
                        <button 
                            onClick={() => onEdit(account._id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="transition-all">
                    {account.children.map(child => (
                        <TreeItem key={child._id} account={child} depth={depth + 1} onEdit={onEdit} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ChartOfAccounts = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'table'
    const [search, setSearch] = useState('');

    const { data: accountsData, isLoading } = useQuery({
        queryKey: ['accounts', search],
        queryFn: () => accountService.getAll({ search })
    });

    const { data: treeData, isLoading: isTreeLoading } = useQuery({
        queryKey: ['accounts-tree'],
        queryFn: () => accountService.getTree(),
        enabled: !search // Only show tree when not searching
    });

    const seedMutation = useMutation({
        mutationFn: () => accountService.seedDefaults(),
        onSuccess: () => {
            toast.success('Successfully seeded default accounts');
            queryClient.invalidateQueries(['accounts']);
            queryClient.invalidateQueries(['accounts-tree']);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to seed accounts')
    });

    const handleEdit = (id) => navigate(`/finance/accounts/${id}`);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic flex items-center">
                        Chart of <span className="text-primary ml-2 uppercase not-italic">Accounts</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Organize and manage your company's general ledger accounts.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => seedMutation.mutate()}
                        disabled={seedMutation.isPending}
                        className="flex items-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Zap className={cn("w-4 h-4 mr-2 text-amber-500", seedMutation.isPending && "animate-pulse")} />
                        Seed Defaults
                    </button>
                    <button 
                        onClick={() => navigate('/finance/accounts/new')}
                        className="flex items-center px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Account
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by code or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                    />
                </div>

                <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    <button 
                        onClick={() => setViewMode('tree')}
                        className={cn(
                            "flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all",
                            viewMode === 'tree' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                        Tree View
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={cn(
                            "flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all",
                            viewMode === 'table' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <List className="w-3.5 h-3.5 mr-2" />
                        Flat List
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="glass-card overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 min-h-[400px]">
                {isLoading || isTreeLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : search || viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Code</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Balance</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(accountsData?.data?.accounts || []).map(acc => (
                                    <tr key={acc._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-black text-slate-400 mono">{acc.code}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{acc.name}</td>
                                        <td className="px-6 py-4"><AccountTypeBadge type={acc.type} /></td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-slate-900 mono">
                                            ₹{acc.balance?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                acc.isActive ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"
                                            )}>
                                                {acc.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleEdit(acc._id)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        {(treeData?.data?.tree || []).length > 0 ? (
                            treeData.data.tree.map(acc => (
                                <TreeItem key={acc._id} account={acc} onEdit={handleEdit} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                                <div className="p-6 bg-slate-50 rounded-full mb-4">
                                    <Briefcase className="w-12 h-12 text-slate-200" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 uppercase">No Accounts Yet</h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-xs">
                                    Start by seeding industry-standard accounts or create your custom accounts manually.
                                </p>
                                <button 
                                    onClick={() => seedMutation.mutate()}
                                    className="mt-6 text-primary font-bold text-sm hover:underline"
                                >
                                    Seed Standard CoA Template
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            <div className="mt-6 flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest px-2">
                <div className="flex items-center gap-4">
                    <span>Total Accounts: {accountsData?.results || 0}</span>
                    <span className="flex items-center"><Shield className="w-3 h-3 mr-1" /> System Protected: {(accountsData?.data?.accounts || []).filter(a => a.isSystem).length}</span>
                </div>
                <span>Cur: INR (₹)</span>
            </div>
        </div>
    );
};

export default ChartOfAccounts;
