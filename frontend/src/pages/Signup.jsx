import React, { useState } from 'react';
import { LayoutDashboard, UserPlus, Mail, Lock, ArrowRight, ArrowLeft, Building2, User, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuth';
import api from '../services/api/axios';

const Signup = () => {
    const navigate = useNavigate();
    const { fetchMe } = useAuthStore();
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/auth/register', { name, email, password });
            setIsSuccess(true);
            toast.success(response.data.message || 'Account created! Please verify your email.');
        } catch (err) {
            setLoading(false);
            const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
                {/* Left Side - Visual */}
                <div className="hidden lg:flex bg-gradient-to-br from-purple-600 to-indigo-700 p-12 flex-col justify-between text-white relative overflow-hidden">
                    <div className="z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center font-bold text-white mb-8 border border-white/20">AG</div>
                        <h1 className="text-4xl font-bold leading-tight">Join the next <br />generation of <br />enterprise ops.</h1>
                        <p className="mt-4 text-white/80 max-w-xs">Submit your request to join the private alpha of agpk1-task.</p>
                    </div>

                    <div className="z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold">Access Request</p>
                                <p className="text-xs text-white/60">New workstation provisioning... active.</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Orbs */}
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
                </div>

                {/* Right Side - Form */}
                <div className="p-10 lg:p-16 flex flex-col justify-center">
                    <div className="mb-10">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 text-slate-500 hover:text-primary mb-6 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Sign In
                        </button>
                        <h2 className="text-3xl font-bold text-slate-900 italic">{isSuccess ? 'Check Your Inbox' : 'Request Access'}</h2>
                        <p className="text-slate-500 mt-2">
                            {isSuccess
                                ? "We've sent a verification link to your email address. Please click it to activate your account."
                                : "Fill out the details below to request a workspace."}
                        </p>
                    </div>

                    {isSuccess ? (
                        <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl text-center space-y-6">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900">Verification Required</h3>
                                <p className="text-slate-500 text-sm">
                                    A verification link has been sent to <strong>{email}</strong>.
                                    (Check the server console in development mode).
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full btn-primary py-4 text-lg font-bold"
                            >
                                Continue to Sign In
                            </button>
                            <p className="text-xs text-slate-400">
                                Didn't get the email? <button onClick={() => setIsSuccess(false)} className="text-primary hover:underline font-bold">Try again</button>
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Full Name</label>
                                <div className="relative">
                                    <UserPlus className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Work Email</label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Desired Password</label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-4 text-lg font-bold group shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                            >
                                {loading ? 'Submitting...' : (
                                    <>
                                        Submit Request <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <p className="mt-10 text-center text-slate-500 text-sm italic">
                        AGPK1 Enterprise Operations Platform &copy; 2026
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
