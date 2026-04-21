import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Shield,
    Plus,
    Trash2,
    Save,
    Info,
    CheckCircle2,
    XCircle,
    ChevronRight,
    ShieldCheck,
    ShieldAlert,
    Search,
    Lock,
    Eye,
    Edit3,
    Settings
} from 'lucide-react';
import { rolesService } from '../services/api/apiServices';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

const MODULES = [
    'Tasks', 'Projects', 'Sprints', 'Workflows', 'Automation',
    'Approvals', 'OKRs', 'Time Tracking', 'Docs', 'Audit Logs',
    'AI', 'Integrations', 'Reporting', 'Resource Mgmt', 'RBAC'
];

const ACCESS_LEVELS = [
    { value: 'NONE', label: 'No Access', color: 'text-slate-400', bg: 'bg-slate-100' },
    { value: 'READ', label: 'View Only', color: 'text-blue-500', bg: 'bg-blue-50' },
    { value: 'WRITE', label: 'Edit Access', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { value: 'ADMIN', label: 'Full Admin', color: 'text-purple-600', bg: 'bg-purple-50' }
];

const RBACPage = () => {
    const queryClient = useQueryClient();
    const [selectedRole, setSelectedRole] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const { data: rolesRaw, isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rolesService.getAll(),
        onSuccess: (data) => {
            const actualRoles = Array.isArray(data) ? data : (data?.data || []);
            if (actualRoles.length > 0 && !selectedRole) {
                setSelectedRole(actualRoles[0]);
            }
        }
    });

    const roles = Array.isArray(rolesRaw) ? rolesRaw : (rolesRaw?.data || []);

    const createMutation = useMutation({
        mutationFn: (data) => rolesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['roles']);
            setIsCreating(false);
            setNewRoleName('');
            toast.success('Role created successfully');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => rolesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['roles']);
            toast.success('Permissions updated');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => rolesService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['roles']);
            setSelectedRole(null);
            toast.success('Role deleted');
        }
    });

    const handlePermissionChange = (moduleName, access) => {
        if (!selectedRole || selectedRole.isSystem) return;

        const updatedPermissions = [...selectedRole.permissions];
        const index = updatedPermissions.findIndex(p => p.module === moduleName);

        if (index !== -1) {
            updatedPermissions[index] = { ...updatedPermissions[index], access };
        } else {
            updatedPermissions.push({ module: moduleName, access });
        }

        setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
    };

    const handleSave = () => {
        updateMutation.mutate({
            id: selectedRole._id,
            data: { permissions: selectedRole.permissions }
        });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center h-[80vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        Roles & Permissions
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage enterprise-grade access control and custom roles.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    Create New Role
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Role List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search roles..."
                                    className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {roles?.map((role) => (
                                <button
                                    key={role._id}
                                    onClick={() => setSelectedRole(role)}
                                    className={cn(
                                        "w-full p-4 text-left flex items-center justify-between group transition-all",
                                        selectedRole?._id === role._id ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-slate-50 border-l-4 border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                            role.isSystem ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                                        )}>
                                            {role.isSystem ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{role.name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{role.permissions.length} modules</p>
                                        </div>
                                    </div>
                                    <ChevronRight className={cn(
                                        "w-4 h-4 text-slate-300 transition-transform group-hover:translate-x-1",
                                        selectedRole?._id === role._id && "text-primary translate-x-1"
                                    )} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-start gap-3">
                        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            System roles (Admin, Manager, User) are protected and cannot be deleted or modified. Custom roles can be tailored to specific departments.
                        </p>
                    </div>
                </div>

                {/* Permission Matrix */}
                <div className="lg:col-span-3">
                    {selectedRole ? (
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedRole.name} Permissions</h2>
                                        <p className="text-sm text-slate-500 font-medium">Fine-tune module-level access for this role.</p>
                                    </div>
                                </div>
                                {!selectedRole.isSystem && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => deleteMutation.mutate(selectedRole._id)}
                                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Role"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={updateMutation.isLoading}
                                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-auto p-6 scrollbar-thin">
                                <table className="w-full border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-widest text-slate-400 font-black">
                                            <th className="px-4 py-2">Module Name</th>
                                            <th className="px-4 py-2">Current Access</th>
                                            <th className="px-4 py-2 text-right">Settings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MODULES.map((moduleName) => {
                                            const perm = selectedRole.permissions.find(p => p.module === moduleName);
                                            const currentAccess = perm ? perm.access : 'NONE';
                                            const level = ACCESS_LEVELS.find(l => l.value === currentAccess);

                                            return (
                                                <tr key={moduleName} className="group hover:bg-slate-50/50 transition-all rounded-xl">
                                                    <td className="px-4 py-4 bg-white border-y border-l first:rounded-l-xl border-slate-100 group-hover:border-slate-200 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                                {moduleName[0]}
                                                            </div>
                                                            <span className="font-bold text-slate-700">{moduleName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 bg-white border-y border-slate-100 group-hover:border-slate-200 transition-all">
                                                        <span className={cn(
                                                            "px-3 py-1.5 rounded-lg text-xs font-black tracking-wide flex items-center gap-1.5 w-fit",
                                                            level.bg, level.color
                                                        )}>
                                                            {currentAccess === 'NONE' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                            {level.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 bg-white border-y border-r last:rounded-r-xl border-slate-100 group-hover:border-slate-200 transition-all text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {ACCESS_LEVELS.map((level) => (
                                                                <button
                                                                    key={level.value}
                                                                    disabled={selectedRole.isSystem}
                                                                    onClick={() => handlePermissionChange(moduleName, level.value)}
                                                                    className={cn(
                                                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                                                        currentAccess === level.value
                                                                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                                            : "bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                                                                    )}
                                                                    title={level.label}
                                                                >
                                                                    {level.value[0]}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center h-[70vh] text-center p-8">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center mb-6">
                                <Lock className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Select a role to configure</h3>
                            <p className="text-slate-500 max-w-sm mt-2 font-medium">Choose a role from the left sidebar to start fine-tuning its access across the entire platform.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Custom Role</h2>
                        <p className="text-slate-500 mt-2 font-medium">Define a new department or team specific role.</p>

                        <div className="mt-8 space-y-6">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2 block">Role Name</label>
                                <input
                                    type="text"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="e.g. Senior QA Architect"
                                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold placeholder:font-medium placeholder:text-slate-400"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 px-5 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => createMutation.mutate({ name: newRoleName, permissions: MODULES.map(m => ({ module: m, access: 'READ' })) })}
                                    disabled={!newRoleName || createMutation.isLoading}
                                    className="flex-1 px-5 py-3 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    Create Role
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RBACPage;
