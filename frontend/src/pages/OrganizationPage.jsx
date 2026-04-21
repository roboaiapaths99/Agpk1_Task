import React from 'react';
import { Building2, Globe, Users, Shield, Save, CheckCircle2, ChevronRight, Mail, ExternalLink, Lock } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { organizationService, profileService } from '../services/api/apiServices';
import useAuthStore from '../store/useAuth';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const OrganizationPage = () => {
    const { user, organization: currentOrg, fetchMe } = useAuthStore();
    const navigate = useNavigate();
    const [saved, setSaved] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        slug: '',
        description: '',
    });

    const { data: orgData, isLoading } = useQuery({
        queryKey: ['organization'],
        queryFn: async () => {
            const res = await organizationService.get();
            return res.data?.data?.organization || res.data?.organization || res.data || null;
        },
    });

    const { data: members } = useQuery({
        queryKey: ['org-members'],
        queryFn: async () => {
            const res = await profileService.getAllUsers();
            const data = res.data?.data || res.data;
            return data || { users: [] };
        },
    });

    React.useEffect(() => {
        if (orgData) {
            setFormData({
                name: orgData.name || '',
                slug: orgData.slug || '',
                description: orgData.description || '',
            });
        }
    }, [orgData]);

    const updateOrg = useMutation({
        mutationFn: (data) => organizationService.update(data),
        onSuccess: () => {
            fetchMe();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        updateOrg.mutate(formData);
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    const isAdmin = user?.role === 'admin';

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase">Organization</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Manage your workspace identity, domain, and team members.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/organization/hierarchy')}
                        className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visualizer</p>
                            <p className="text-sm font-bold text-slate-700 italic">Org Hierarchy</p>
                        </div>
                    </button>
                    
                    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {orgData?.membersCount || members?.users?.length || 0}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Members</p>
                            <p className="text-sm font-bold text-slate-700 italic">Active Seats</p>
                        </div>
                    </div>
                </div>
            </div>

            {saved && (
                <div className="flex items-center gap-3 px-6 py-4 bg-green-50 border border-green-200 rounded-3xl text-green-700 text-sm font-bold animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="w-5 h-5" />
                    Organization settings updated successfully!
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/20 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-primary rounded-3xl shadow-lg shadow-primary/20">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 italic uppercase">General Identity</h3>
                                    <p className="text-sm font-medium text-slate-400 italic">Core branding and public workspace URL.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Organization Name</label>
                                    <input
                                        type="text"
                                        disabled={!isAdmin}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Subdomain / Slug</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            disabled={!isAdmin}
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all disabled:opacity-50 pr-24"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">.agpk1.io</span>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Logo URL</label>
                                    <input
                                        type="text"
                                        disabled={!isAdmin}
                                        value={formData.logo || ''}
                                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Workspace Description</label>
                                    <textarea
                                        disabled={!isAdmin}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold italic focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[120px] resize-none disabled:opacity-50"
                                        placeholder="Describe your organization's mission..."
                                    />
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="flex justify-end pt-4 border-t border-slate-50">
                                <button
                                    type="submit"
                                    disabled={updateOrg.isPending}
                                    className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {updateOrg.isPending ? 'Syncing...' : 'Save Settings'}
                                </button>
                            </div>
                        )}
                    </form>

                    {/* Team Preview */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full -mr-48 -mb-48" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                                        <Users className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase">Team Members</h3>
                                        <p className="text-sm font-medium text-slate-400 italic">Current users with access to this org.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                                >
                                    Manage All
                                </button>
                            </div>

                            <div className="space-y-4">
                                {members?.users?.slice(0, 5).map((m) => (
                                    <div key={m._id} className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xs shadow-lg">
                                                {m.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm italic">{m.name}</p>
                                                <p className="text-[10px] font-medium text-slate-500">{m.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                m.role === 'admin' ? "bg-primary/20 text-primary border border-primary/30" : "bg-slate-800 text-slate-400 border border-slate-700"
                                            )}>
                                                {m.role}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-lg shadow-slate-200/10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-indigo-500" />
                            <h4 className="font-black text-slate-800 italic uppercase tracking-wider">Infrastructure</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-primary" /> Verified Domain
                                </p>
                                <p className="text-sm font-bold text-slate-700 italic flex items-center gap-2">
                                    {orgData?.domain}
                                    <ExternalLink className="w-3 h-3 text-slate-300" />
                                </p>
                            </div>

                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-indigo-500" /> Corporate Policy
                                </p>
                                <p className="text-[11px] font-medium text-slate-500 italic leading-relaxed">
                                    Only users with <span className="text-slate-800 font-bold">@{orgData?.domain}</span> can auto-join this workspace.
                                </p>
                            </div>

                            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Lock className="w-4 h-4 text-white" />
                                    </div>
                                    <h5 className="text-xs font-black text-indigo-900 uppercase">Enterprise Lock</h5>
                                </div>
                                <p className="text-[10px] font-bold text-indigo-500 italic leading-snug">
                                    Workspace isolation is enforced at the database layer. No sharing with unauthorized domains.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="text-lg font-black italic uppercase mb-4 mb-2">Billing & Plan</h4>
                        <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm border border-white/10">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Current Tier</p>
                            <p className="text-xl font-black italic">PRO ENTERPRISE</p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium italic mb-6">Next renewal: May 20, 2026</p>
                        <button
                            onClick={() => toast('Billing portal coming soon!', { icon: '🧾' })}
                            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                        >
                            View Invoices
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationPage;
