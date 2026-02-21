import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        try {
            const response = await axios.post('/auth/login/', {
                email,
                password
            });
            
            if (response.data.status === 'success') {
                login(response.data.user);
            } else {
                setError(response.data.message || 'Authentication failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Connection error. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-sans">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm bg-white border border-slate-200 p-12"
            >
                <div className="text-center mb-12">
                    <div className="w-12 h-12 bg-primary-900 flex items-center justify-center text-white mx-auto mb-6">
                        <LogIn size={24} />
                    </div>
                    <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tighter uppercase">Access Portal</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">Advanced Weather Interface</p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-50 text-red-600 p-4 border-l-4 border-red-500 flex items-center gap-3 mb-8 text-[11px] font-bold uppercase"
                    >
                        <AlertCircle size={14} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-500 pl-12 pr-6 py-4 text-sm text-slate-900 transition-all outline-none"
                                placeholder="E-MAIL ADDRESS"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credentials</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-500 pl-12 pr-6 py-4 text-sm text-slate-900 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-primary-900 hover:bg-primary-600 text-white font-bold py-4 uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] mt-4"
                    >
                        Authenticate
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-slate-300 text-[9px] font-bold uppercase tracking-[0.3em]">
                        System v2.0.4 // secure-link
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
