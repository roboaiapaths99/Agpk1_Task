import React, { useState } from 'react';
import { 
    Users, Plus, Trash2, Edit3, Save, X, 
    Briefcase, IdCard, IndianRupee, Search,
    CheckCircle2, AlertCircle, TrendingUp
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api/axios';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/formatters';

const EmployeeProfiles = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(null); // ID of profile being edited
    const [isCreating, setIsCreating] = useState(false); // Modal for new profile
    const [editData, setEditData] = useState({});

    // Fetch Employee Profiles
    const { data: profilesData, isLoading } = useQuery({
        queryKey: ['employee-profiles'],
        queryFn: async () => {
            const res = await api.get('/finance/payroll/profiles');
            return res.data;
        }
    });

    // Fetch Users to link to profiles
    const { data: usersData } = useQuery({
        queryKey: ['all-users'],
        queryFn: async () => {
            const res = await api.get('/auth/users');
            return res.data;
        }
    });

    const profiles = profilesData?.data || [];
    const users = usersData?.data || [];
    
    // Filter out users who already have profiles
    const availableUsers = users.filter(u => !profiles.some(p => p.userId?._id === u._id));

    // Mutation for upserting profile
    const upsertMutation = useMutation({
        mutationFn: async (data) => {
            return await api.post('/finance/payroll/profiles', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['employee-profiles']);
            setIsEditing(null);
            setIsCreating(false);
            setEditData({});
            toast.success('Staff configuration saved');
        },
        onError: () => {
            toast.error('Failed to save configuration');
        }
    });

    const handleEdit = (profile) => {
        setIsEditing(profile._id);
        setEditData({
            userId: profile.userId._id,
            designation: profile.designation,
            department: profile.department,
            hourlyRate: profile.hourlyRate,
            bankDetails: profile.bankDetails || {}
        });
    };

    const handleSave = () => {
        if (!editData.userId || !editData.hourlyRate) {
            toast.error('User and Hourly Rate are required');
            return;
        }
        upsertMutation.mutate(editData);
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">
                        STAFF <span className="text-primary">PROFILES</span>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium text-sm">Configure hourly rates and payroll metadata for all employees.</p>
                </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {profiles.map((profile) => (
                    <div key={profile._id} className="glass-card border border-slate-100 overflow-hidden group hover:border-primary/20 transition-all duration-300">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/10 flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black italic shadow-xl shadow-slate-900/10">
                                    {profile.userId?.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">{profile.userId?.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile.designation}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleEdit(profile)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-primary transition-all active:scale-90"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <IndianRupee className="w-3 h-3" /> Hourly Rate
                                </span>
                                <span className="text-sm font-black text-slate-900 italic">{formatCurrency(profile.hourlyRate)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Briefcase className="w-3 h-3" /> Department
                                </span>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{profile.department}</span>
                            </div>
                        </div>

                        {/* Edit Overlay */}
                        {isEditing === profile._id && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 p-6 flex flex-col justify-between animate-in fade-in duration-200">
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Edit3 className="w-3 h-3" /> Update Profile
                                    </h5>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Hourly Rate</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={editData.hourlyRate}
                                            onChange={(e) => setEditData({...editData, hourlyRate: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Designation</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={editData.designation}
                                            onChange={(e) => setEditData({...editData, designation: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleSave}
                                        disabled={upsertMutation.isPending}
                                        className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        {upsertMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(null)}
                                        className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Create New Profile Button */}
                <button 
                   onClick={() => setIsCreating(true)}
                   className="glass-card border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center group hover:border-primary/40 hover:bg-slate-50/50 transition-all min-h-[200px]"
                >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/5 transition-colors">
                        <Plus className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Configure Staff</p>
                </button>
            </div>

            {/* Creation Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="glass-card bg-white w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">CONFIGURE <span className="text-primary">STAFF</span></h3>
                            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Select User</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                    onChange={(e) => setEditData({...editData, userId: e.target.value})}
                                    value={editData.userId || ""}
                                >
                                    <option value="">Select an existing user...</option>
                                    {availableUsers.map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Hourly Rate (₹)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="500"
                                        onChange={(e) => setEditData({...editData, hourlyRate: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Department</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Engineering"
                                        onChange={(e) => setEditData({...editData, department: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Designation</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Lead Developer"
                                    onChange={(e) => setEditData({...editData, designation: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={upsertMutation.isPending}
                                className="w-full bg-slate-900 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                            >
                                {upsertMutation.isPending ? 'Processing...' : 'Link User to Payroll'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeProfiles;
