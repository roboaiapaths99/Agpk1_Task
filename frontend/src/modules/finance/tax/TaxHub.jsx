import React, { useState } from 'react';
import { 
  Percent, 
  ShieldCheck, 
  Plus, 
  Settings, 
  FileCheck,
  Globe,
  AlertTriangle,
  History,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxService } from '../../../services/api/apiServices';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

const TaxHub = () => {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        rate: 0,
        type: 'VAT',
        country: '',
        isActive: true
    });
    
    const { data: configsData, isLoading } = useQuery({
        queryKey: ['tax-configs'],
        queryFn: () => taxService.getConfigs(),
    });

    const configs = configsData?.data || [];

    const addTaxMutation = useMutation({
        mutationFn: (newTax) => taxService.createConfig(newTax),
        onSuccess: () => {
            queryClient.invalidateQueries(['tax-configs']);
            setIsAdding(false);
            setFormData({ name: '', rate: 0, type: 'VAT', country: '', isActive: true });
            toast.success('Tax configuration activated');
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Failed to create tax configuration');
        }
    });

    const updateTaxMutation = useMutation({
        mutationFn: ({ id, data }) => taxService.updateConfig(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['tax-configs']);
            setEditingConfig(null);
            toast.success('Nexus updated successfully');
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Update failed');
        }
    });

    const deleteTaxMutation = useMutation({
        mutationFn: (id) => taxService.deleteConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['tax-configs']);
            toast.success('Nexus deprecated');
        },
        onError: (error) => {
            toast.error('Deletion failed');
        }
    });

    const handleQuickAdd = () => {
        addTaxMutation.mutate({
            name: 'Standard GST',
            rate: 18,
            type: 'VAT',
            country: 'IN',
            isActive: true
        });
    };


    if (isLoading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-900 border-t-primary rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold italic tracking-tighter">Syncing compliance nexus...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-10">
            {/* Hero Header */}
            <div className="relative rounded-[40px] bg-slate-900 p-10 text-white overflow-hidden shadow-2xl shadow-slate-900/40">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 scale-150">
                    <Percent className="w-64 h-64" />
                </div>
                
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Compliance Verified</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter italic">
                        TAX <span className="text-primary">COMPLIANCE</span> HUB
                    </h1>
                    <p className="text-slate-400 mt-4 text-lg font-medium leading-relaxed">
                        Centrally managed tax orchestration for multi-regional enterprise operations. 
                        Configure GST, VAT, and Sales Tax overrides across all branches.
                    </p>
                    
                    <div className="flex items-center gap-4 mt-10">
                        <button 
                            onClick={() => {
                                setIsAdding(!isAdding);
                                setFormData({ name: '', rate: 0, type: 'VAT', country: '', isActive: true });
                            }}
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Plus className={cn("w-5 h-5 transition-transform", isAdding && "rotate-45")} />
                            {isAdding ? 'Close Registration' : 'Register New Nexus'}
                        </button>
                        <button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-2">
                            <FileCheck className="w-5 h-5" />
                            Annual Audit Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Add Form Section */}
            {isAdding && (
                <div className="glass-card p-10 border-2 border-primary/20 bg-slate-50/50 animate-in slide-in-from-top-10 duration-500">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-primary rounded-xl">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">NEW COMPLIANCE NEXUS</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Regional Registry</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nexus Name</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Standard GST"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Tax Type</label>
                            <select 
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer"
                            >
                                <option value="GST">GST</option>
                                <option value="VAT">VAT</option>
                                <option value="SALES TAX">Sales Tax</option>
                                <option value="WHT">WHT</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Rate (%)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={formData.rate}
                                    onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value)})}
                                    placeholder="18"
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                />
                                <Percent className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">ISO Country Code</label>
                            <input 
                                type="text" 
                                value={formData.country}
                                onChange={(e) => setFormData({...formData, country: e.target.value.toUpperCase()})}
                                placeholder="IN"
                                maxLength={2}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-4 mt-10 pt-8 border-t border-slate-200/50">
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => addTaxMutation.mutate(formData)}
                            disabled={addTaxMutation.isPending}
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-102 active:scale-98 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {addTaxMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Registration'}
                            <CheckCircle2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Config Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase flex items-center gap-3">
                        <Settings className="w-5 h-5 text-primary" />
                        Active Tax Configurations
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{configs.length} Configured Regions</span>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {configs.length === 0 ? (
                        <div className="col-span-full py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                            <div className="p-5 bg-white rounded-full shadow-inner mb-4">
                                <AlertTriangle className="w-10 h-10 text-amber-500 opacity-30" />
                            </div>
                            <h3 className="text-slate-900 font-black text-lg">No Active Compliance Rules</h3>
                            <p className="text-slate-500 text-sm max-w-xs mt-1">Start by registering your first tax jurisdiction for automated invoicing and payroll.</p>
                            <button 
                                onClick={handleQuickAdd}
                                className="mt-6 text-primary font-black text-xs uppercase tracking-widest hover:underline"
                            >
                                Default India GST (18%) Setup ->
                            </button>
                        </div>
                    ) : (
                        configs.map((config) => (
                            <div key={config._id} className={cn(
                                "glass-card group border border-slate-100 p-8 transition-all duration-500 relative overflow-hidden",
                                editingConfig?._id === config._id ? "ring-2 ring-primary shadow-2xl scale-[1.02]" : "hover:shadow-2xl"
                            )}>
                                {editingConfig?._id === config._id ? (
                                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Editing Nexus</span>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm('Are you sure you want to delete this nexus?')) {
                                                        deleteTaxMutation.mutate(config._id);
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <input 
                                                    type="text" 
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                    placeholder="Nexus Name"
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={formData.rate}
                                                        onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value)})}
                                                        placeholder="Rate"
                                                        className="w-full bg-slate-50 border-none rounded-xl pl-4 pr-8 py-2 text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold">%</span>
                                                </div>
                                                <select 
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                >
                                                    <option value="GST">GST</option>
                                                    <option value="VAT">VAT</option>
                                                    <option value="SALES TAX">Sales Tax</option>
                                                    <option value="WHT">WHT</option>
                                                </select>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={formData.country}
                                                onChange={(e) => setFormData({...formData, country: e.target.value.toUpperCase()})}
                                                placeholder="Country (ISO)"
                                                maxLength={2}
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button 
                                                onClick={() => updateTaxMutation.mutate({ id: config._id, data: formData })}
                                                disabled={updateTaxMutation.isPending}
                                                className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                {updateTaxMutation.isPending ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                                            </button>
                                            <button 
                                                onClick={() => setEditingConfig(null)}
                                                className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => deleteTaxMutation.mutate(config._id)}
                                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-slate-900 rounded-2xl group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <Globe className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tighter leading-none">{config.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{config.country}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{config.type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-black text-slate-900">{config.rate}</span>
                                                    <span className="text-xl font-bold text-primary">%</span>
                                                </div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Applied Rate</p>
                                            </div>

                                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full shadow-[0_0_8px]",
                                                        config.isActive ? "bg-emerald-500 shadow-emerald-500/50" : "bg-slate-300 shadow-slate-300/50"
                                                    )} />
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                        {config.isActive ? 'Live' : 'Standby'}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setEditingConfig(config);
                                                        setFormData({
                                                            name: config.name,
                                                            rate: config.rate,
                                                            type: config.type,
                                                            country: config.country,
                                                            isActive: config.isActive
                                                        });
                                                    }}
                                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
                                                >
                                                    <Edit2 className="w-3 h-3" /> Edit
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))

                    )}
                </div>
            </div>

            {/* Bottom Utility Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 border border-slate-100 flex items-start gap-6 bg-gradient-to-br from-white to-slate-50/50">
                    <div className="p-4 bg-amber-500/10 rounded-2xl">
                        <History className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-black text-slate-900 italic tracking-tighter">Compliance History</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            View archival changes to tax codes and jurisdictional overrides for historical audit periods.
                        </p>
                        <button className="text-[10px] font-black text-primary uppercase tracking-widest pt-2 hover:underline">
                            Access Archives ->
                        </button>
                    </div>
                </div>
                <div className="glass-card p-8 border border-slate-100 flex items-start gap-6 bg-gradient-to-br from-white to-slate-50/50">
                    <div className="p-4 bg-blue-500/10 rounded-2xl">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-black text-slate-900 italic tracking-tighter">Automatic Validation</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Ensures all outbound invoices match the regional nexus requirements and avoid penalties.
                        </p>
                        <button className="text-[10px] font-black text-primary uppercase tracking-widest pt-2 hover:underline">
                            Configure Rules ->
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxHub;
