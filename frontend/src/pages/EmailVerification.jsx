import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api/axios';
import toast from 'react-hot-toast';

const EmailVerification = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const response = await api.get(`/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
                toast.success('Email verified! You can now log in.');
            } catch (err) {
                setStatus('error');
                setMessage(err.message || 'Verification failed. Token may be invalid or expired.');
                toast.error('Verification failed');
            }
        };

        if (token) {
            verify();
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="w-full max-w-[500px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 p-10 lg:p-16 text-center">

                {status === 'verifying' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 italic">Verifying Email...</h2>
                        <p className="text-slate-500">Please wait while we confirm your email address.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                            <ShieldCheck className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 italic">Verified!</h2>
                        <p className="text-slate-500">{message}</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 btn-primary py-4 px-8 text-lg font-bold group shadow-lg shadow-primary/20"
                        >
                            Continue to Login <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 italic">Verification Failed</h2>
                        <p className="text-slate-500">{message}</p>
                        <div className="flex flex-col gap-4">
                            <Link
                                to="/login"
                                className="text-slate-500 font-bold hover:text-primary transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default EmailVerification;
