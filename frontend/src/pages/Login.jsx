import React from 'react';
import { LayoutDashboard, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuth';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuthStore();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login({ email, password });
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
                {/* Left Side - Visual */}
                <div className="hidden lg:flex bg-gradient-to-br from-primary to-purple-700 p-12 flex-col justify-between text-white relative overflow-hidden">
                    <div className="z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center font-bold text-white mb-8 border border-white/20">AG</div>
                        <h1 className="text-4xl font-bold leading-tight">Master your <br />enterprise <br />operations.</h1>
                        <p className="mt-4 text-white/80 max-w-xs">A unified command center for tasks, workflows, and AI insights.</p>
                    </div>

                    <div className="z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold">Operational High</p>
                                <p className="text-xs text-white/60">Efficiency increased by 24% this week.</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Orbs */}
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
                </div>

                {/* Right Side - Form */}
                <div className="p-10 lg:p-16 flex flex-col justify-center">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 italic">Sign In</h2>
                        <p className="text-slate-500 mt-2">Enter your credentials to access the platform.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Email Address</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-sm font-bold text-primary hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-4 text-lg font-bold group shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Authenticating...' : (
                                <>
                                    Connect <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-10 text-center text-slate-500 text-sm">
                        Not registered? <button onClick={() => navigate('/signup')} className="text-primary font-bold hover:underline">Request Access</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
