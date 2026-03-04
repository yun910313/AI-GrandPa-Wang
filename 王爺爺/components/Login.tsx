
import React, { useState } from 'react';
import { motion } from 'motion/react';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
    speak: (text: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, speak }) => {
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account, password }),
            });

            const data = await response.json();

            if (data.success) {
                speak(`歡迎回來，${data.user.name}`);
                onLoginSuccess(data.user);
            } else {
                const msg = data.message || '登入失敗，請檢查帳號密碼';
                setError(msg);
                speak(msg);
            }
        } catch (err) {
            setError('連線伺服器失敗，請稍後再試');
            speak('連線伺服器失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-white/50 backdrop-blur-sm"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-3xl text-white mb-6 shadow-lg shadow-blue-200"
                    >
                        <i className="fas fa-heart-pulse text-5xl"></i>
                    </motion.div>
                    <h2 className="text-4xl font-black text-slate-800 mb-2">王爺爺</h2>
                    <p className="text-slate-500 font-medium tracking-wide">您的專屬智慧守護助手</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">帳號代碼</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                <i className="fas fa-user text-lg"></i>
                            </span>
                            <input
                                type="text"
                                value={account}
                                onChange={(e) => setAccount(e.target.value)}
                                placeholder="請輸入帳號"
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none transition-all text-xl font-medium shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">驗證碼</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                <i className="fas fa-lock text-lg"></i>
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="請輸入密碼"
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none transition-all text-xl font-medium shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-rose-50 text-rose-600 p-4 rounded-xl text-center font-bold text-sm"
                        >
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl text-white text-2xl font-black shadow-xl transition-all active:scale-95 ${loading
                            ? 'bg-slate-300 shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                            }`}
                    >
                        {loading ? (
                            <i className="fas fa-circle-notch fa-spin"></i>
                        ) : (
                            '立即登入'
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                        如果有任何問題，請聯絡家屬提供帳號
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
