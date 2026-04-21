import React from 'react';
import { User, Lock, Bell, Shield, Save, CheckCircle2, Rocket } from 'lucide-react';
import useAuthStore from '../store/useAuth';
import { useMutation } from '@tanstack/react-query';
import { profileService } from '../services/api/apiServices';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const SettingsPage = () => {
    const { user, fetchMe } = useAuthStore();
    const [activeTab, setActiveTab] = React.useState('profile');
    const [profile, setProfile] = React.useState({
        name: user?.name || '',
        email: user?.email || '',
    });
    const [passwords, setPasswords] = React.useState({
        current: '',
        newPassword: '',
        confirm: '',
    });
    const [notifPrefs, setNotifPrefs] = React.useState({
        email: user?.notificationPreferences?.email ?? true,
        inApp: user?.notificationPreferences?.inApp ?? true,
        taskAssigned: user?.notificationPreferences?.taskAssigned ?? true,
        taskCompleted: user?.notificationPreferences?.taskCompleted ?? true,
        approvalRequired: user?.notificationPreferences?.approvalRequired ?? true,
        mentions: user?.notificationPreferences?.mentions ?? true,
    });

    React.useEffect(() => {
        if (user) {
            setProfile({ name: user.name || '', email: user.email || '' });
            if (user.notificationPreferences) {
                setNotifPrefs({
                    email: user.notificationPreferences.email ?? true,
                    inApp: user.notificationPreferences.inApp ?? true,
                    taskAssigned: user.notificationPreferences.taskAssigned ?? true,
                    taskCompleted: user.notificationPreferences.taskCompleted ?? true,
                    approvalRequired: user.notificationPreferences.approvalRequired ?? true,
                    mentions: user.notificationPreferences.mentions ?? true,
                });
            }
        }
    }, [user]);

    const updateProfile = useMutation({
        mutationFn: (data) => profileService.updateMe(data),
        onSuccess: () => {
            fetchMe();
            toast.success('Profile updated successfully!');
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to update profile');
        },
    });

    const updatePassword = useMutation({
        mutationFn: (data) => profileService.changePassword(data),
        onSuccess: () => {
            setPasswords({ current: '', newPassword: '', confirm: '' });
            toast.success('Password changed successfully! Use your new password next time you login.');
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to update password';
            toast.error(msg);
        },
    });

    const handleSaveProfile = (e) => {
        e.preventDefault();
        updateProfile.mutate({ name: profile.name });
    };

    const handleSaveNotifs = async (e) => {
        e.preventDefault();
        try {
            await profileService.updateNotificationPrefs(notifPrefs);
            await fetchMe(); // Refresh user data so prefs persist in the UI
            toast.success('Notification preferences saved!');
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to save preferences');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Settings</h1>
                <p className="text-slate-500 mt-1">Manage your account preferences and security.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                            activeTab === tab.id
                                ? "bg-white text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="glass-card p-8 space-y-8">
                    <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-primary/20">
                            {profile.name?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{profile.name}</h3>
                            <p className="text-sm text-slate-500">{profile.email}</p>
                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg">
                                {user?.role || 'Admin'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-400 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="btn-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="pt-8 mt-8 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Onboarding Experience</h3>
                        <p className="text-xs text-slate-500 mb-4">Want to see the platform tour again? Restart it to refresh your knowledge of the features.</p>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await profileService.updateMe({ hasCompletedOnboarding: false });
                                    await fetchMe();
                                    toast.success('Tour reset! It will appear next time you visit the dashboard.');
                                } catch (err) {
                                    toast.error('Failed to reset tour');
                                }
                            }}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <Rocket className="w-4 h-4 text-indigo-500" />
                            Restart Interactive Tour
                        </button>
                    </div>
                </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <form className="glass-card p-8 space-y-8" onSubmit={(e) => e.preventDefault()}>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-slate-900 italic">Change Password</h3>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Password</label>
                            <input
                                type="password"
                                value={passwords.current}
                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">New Password</label>
                            <input
                                type="password"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                if (!passwords.current) {
                                    toast.error("Please enter your current password");
                                    return;
                                }
                                if (passwords.newPassword.length < 6) {
                                    toast.error("New password must be at least 6 characters");
                                    return;
                                }
                                if (passwords.newPassword !== passwords.confirm) {
                                    toast.error("New passwords do not match!");
                                    return;
                                }
                                updatePassword.mutate({
                                    currentPassword: passwords.current,
                                    newPassword: passwords.newPassword
                                });
                            }}
                            disabled={updatePassword.isPending || !passwords.current || !passwords.newPassword}
                            className="btn-primary disabled:opacity-50"
                        >
                            <Lock className="w-4 h-4" />
                            {updatePassword.isPending ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            )}

            {/* Notification Preferences Tab */}
            {activeTab === 'notifications' && (
                <form onSubmit={handleSaveNotifs} className="glass-card p-8 space-y-8">
                    <h3 className="text-lg font-bold text-slate-900 italic">Notification Preferences</h3>

                    <div className="space-y-4">
                        {[
                            { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                            { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications in the bell icon' },
                            { key: 'taskAssigned', label: 'Task Assigned', desc: 'When a task is assigned to you' },
                            { key: 'taskCompleted', label: 'Task Completed', desc: 'When a task you watch is completed' },
                            { key: 'approvalRequired', label: 'Approval Required', desc: 'When your approval is needed' },
                            { key: 'mentions', label: 'Mentions', desc: 'When someone mentions you in a comment' },
                        ].map((pref) => (
                            <div key={pref.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{pref.label}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{pref.desc}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNotifPrefs({ ...notifPrefs, [pref.key]: !notifPrefs[pref.key] })}
                                    className={cn(
                                        "w-12 h-7 rounded-full transition-all duration-200 relative",
                                        notifPrefs[pref.key] ? "bg-primary" : "bg-slate-300"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200",
                                        notifPrefs[pref.key] ? "left-6" : "left-1"
                                    )} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary">
                            <Save className="w-4 h-4" />
                            Save Preferences
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SettingsPage;
