import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ChevronLeft, 
    Save, 
    Trash2, 
    Info, 
    ShieldAlert, 
    Network,
    Key,
    User,
    FileText,
    ArrowRight
} from 'lucide-react';
import { accountService } from '../../../services/api/apiServices';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

const AccountForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = Boolean(id && id !== 'new');

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            isActive: true,
            isSystem: false,
            type: 'asset',
            parentAccount: ''
        }
    });

    const selectedType = watch('type');

    // Fetch existing account for edit mode
    const { data: accountData, isLoading } = useQuery({
        queryKey: ['account', id],
        queryFn: () => accountService.getById(id),
        enabled: isEdit
    });

    // Fetch potential parent accounts (filtered by same type)
    const { data: accountsData } = useQuery({
        queryKey: ['accounts-selector', selectedType],
        queryFn: () => accountService.getAll({ type: selectedType }),
    });

    useEffect(() => {
        if (isEdit && accountData?.data?.account) {
            const acc = accountData.data.account;
            reset({
                ...acc,
                parentAccount: acc.parentAccount?._id || ''
            });
        }
    }, [isEdit, accountData, reset]);

    const mutation = useMutation({
        mutationFn: (data) => isEdit ? accountService.update(id, data) : accountService.create(data),
        onSuccess: () => {
            toast.success(`Account ${isEdit ? 'updated' : 'created'} successfully`);
            queryClient.invalidateQueries(['accounts']);
            queryClient.invalidateQueries(['accounts-tree']);
            navigate('/finance/accounts');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Operation failed')
    });

    const deleteMutation = useMutation({
        mutationFn: () => accountService.remove(id),
        onSuccess: () => {
            toast.success('Account deleted successfully');
            queryClient.invalidateQueries(['accounts']);
            queryClient.invalidateQueries(['accounts-tree']);
            navigate('/finance/accounts');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
    });

    const onSubmit = (data) => {
        // Remove empty strings for parentAccount to satisfy ObjectId validation
        if (!data.parentAccount) delete data.parentAccount;
        if (isEdit) {
             // System accounts have some read-only fields
             if (accountData?.data?.account?.isSystem) {
                 delete data.code;
                 delete data.type;
             }
        }
        mutation.mutate(data);
    };

    if (isEdit && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isSystem = accountData?.data?.account?.isSystem;

    return (
        <div className="p-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/finance/accounts')}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">
                            {isEdit ? 'Edit' : 'New'} <span className="text-primary not-italic">Account</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                            {isEdit ? `Account: ${accountData?.data?.account?.code}` : 'Chart of Accounts Establishment'}
                        </p>
                    </div>
                </div>

                {isEdit && !isSystem && (
                    <button 
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this account? This cannot be undone.')) {
                                deleteMutation.mutate();
                            }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isSystem && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-900">Protected System Account</p>
                        <p className="text-xs text-amber-700 leading-relaxed mt-1">
                            This account is used internally by the system. Code and Type modifications are restricted to maintain ledger integrity.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="glass-card p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Account Code */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center">
                                <Key className="w-3 h-3 mr-1.5 text-primary" />
                                Account Code
                            </label>
                            <input 
                                {...register('code', { required: 'Code is required', minLength: 4 })}
                                disabled={isSystem}
                                placeholder="e.g., 1010"
                                className={cn(
                                    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold mono outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                                    errors.code && "border-red-300 ring-red-50",
                                    isSystem && "opacity-60 cursor-not-allowed bg-slate-100"
                                )}
                            />
                            {errors.code && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.code.message}</p>}
                        </div>

                        {/* Account Type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center">
                                <Network className="w-3 h-3 mr-1.5 text-primary" />
                                Account Type
                            </label>
                            <select 
                                {...register('type', { required: 'Type is required' })}
                                disabled={isSystem}
                                className={cn(
                                    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer",
                                    isSystem && "opacity-60 cursor-not-allowed bg-slate-100"
                                )}
                            >
                                <option value="asset">Asset</option>
                                <option value="liability">Liability</option>
                                <option value="equity">Equity</option>
                                <option value="revenue">Revenue</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>

                        {/* Account Name */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center">
                                <User className="w-3 h-3 mr-1.5 text-primary" />
                                Account Name
                            </label>
                            <input 
                                {...register('name', { required: 'Name is required' })}
                                placeholder="e.g., Main Operating Bank Account"
                                className={cn(
                                    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                                    errors.name && "border-red-300 ring-red-50"
                                )}
                            />
                            {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.name.message}</p>}
                        </div>

                        {/* Parent Account */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center">
                                <Info className="w-3 h-3 mr-1.5 text-primary" />
                                Parent Account (Optional)
                            </label>
                            <select 
                                {...register('parentAccount')}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            >
                                <option value="">Root / No Parent</option>
                                {(accountsData?.data?.accounts || [])
                                    .filter(acc => acc._id !== id) // Prevent self-parenting
                                    .map(acc => (
                                        <option key={acc._id} value={acc._id}>
                                            [{acc.code}] {acc.name}
                                        </option>
                                    ))
                                }
                            </select>
                            <p className="text-[10px] text-slate-400 font-medium">Sub-accounts must be of the same type as their parent.</p>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center">
                                <FileText className="w-3 h-3 mr-1.5 text-primary" />
                                Description
                            </label>
                            <textarea 
                                {...register('description')}
                                rows={3}
                                placeholder="Specify the purpose of this account..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            />
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 md:col-span-2">
                             <div>
                                 <p className="text-xs font-black text-slate-900 uppercase">Active Status</p>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Allow new transactions to this account</p>
                             </div>
                             <button
                                type="button"
                                onClick={() => setValue('isActive', !watch('isActive'))}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ring-transparent",
                                    watch('isActive') ? "bg-primary" : "bg-slate-300"
                                )}
                             >
                                <span className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    watch('isActive') ? "translate-x-6" : "translate-x-1"
                                )} />
                             </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-8">
                    <button 
                        type="button"
                        onClick={() => navigate('/finance/accounts')}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex items-center px-8 py-3 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Account'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AccountForm;
