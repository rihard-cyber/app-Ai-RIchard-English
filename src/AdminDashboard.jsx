import React, { useState, useEffect } from 'react';
import { LogOut, Users, RefreshCw, UserCheck, LayoutDashboard, CreditCard, Settings, Crown, Activity } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function AdminDashboard({ onLogout, onSwitchToUser, userEmail }) {
    const [users, setUsers] = useState([]);
    const [totalMurid, setTotalMurid] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('overview');

    const fetchDataPengguna = async () => {
        setIsLoading(true);
        try {
            // Instruksi Mutlak: Mengambil dari tabel 'user_profiles'
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*');

            // Instruksi Mutlak: Console.log untuk debugging
            console.log("Hasil Fetch Profil:", data, error);

            if (error) {
                throw error;
            }

            // Instruksi Mutlak: Update state array user dan state total
            if (data) {
                setUsers(data);
                setTotalMurid(data.length);
            } else {
                setUsers([]);
                setTotalMurid(0);
            }
        } catch (err) {
            console.error("Gagal mengambil data pengguna:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDataPengguna();
    }, []);

    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
            {/* Sidebar Dark Mode */}
            <aside className="w-64 bg-[#0b1121] border-r border-slate-800 flex flex-col shrink-0">
                <div className="h-20 flex items-center px-6 border-b border-slate-800">
                    <h1 className="text-xl font-black text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Crown size={18} className="text-white" />
                        </div>
                        Admin<span className="text-blue-500">Panel</span>
                    </h1>
                </div>

                <div className="p-6 border-b border-slate-800">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Logged in as</p>
                    <p className="text-sm font-bold text-white truncate">{userEmail || 'Administrator'}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-bold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onClick={() => setActiveMenu('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeMenu === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <LayoutDashboard size={20} /> Overview
                    </button>
                    <button onClick={() => setActiveMenu('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeMenu === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Users size={20} /> Data Pengguna
                    </button>
                    <button onClick={() => setActiveMenu('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeMenu === 'transactions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <CreditCard size={20} /> Transaksi Pro
                    </button>
                    <button onClick={() => setActiveMenu('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeMenu === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Settings size={20} /> Pengaturan
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button onClick={onSwitchToUser} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
                        <UserCheck size={20} className="text-emerald-400" /> Beralih ke User
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 transition-all">
                        <LogOut size={20} className="text-rose-400" /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Layout */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0f172a]">
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

                <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
                    {/* Header */}
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Dashboard Overview</h2>
                            <p className="text-slate-400 mt-2 font-medium">Pantau statistik pengguna secara real-time.</p>
                        </div>
                        <button
                            onClick={fetchDataPengguna}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} /> REFRESH DATA
                        </button>
                    </div>

                    {/* Statistik Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                                <Users size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400">Total Murid</p>
                                <h3 className="text-3xl font-black text-white">{totalMurid}</h3>
                            </div>
                        </div>
                        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-4">
                            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                                <Crown size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400">Pengguna PRO</p>
                                <h3 className="text-3xl font-black text-white">{users.filter(u => u.is_pro).length}</h3>
                            </div>
                        </div>
                        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                                <Activity size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400">Status Server</p>
                                <h3 className="text-2xl font-black text-emerald-400">Online</h3>
                            </div>
                        </div>
                    </div>

                    {/* Tabel Data Pengguna */}
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-700">
                            <h3 className="font-bold text-white text-lg">Direktori Pengguna Aktif</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#0f172a] text-slate-400 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="p-4 border-b border-slate-700">Nama Lengkap</th>
                                        <th className="p-4 border-b border-slate-700">Email</th>
                                        <th className="p-4 border-b border-slate-700">Level</th>
                                        <th className="p-4 border-b border-slate-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700 text-sm">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-slate-400">
                                                <RefreshCw className="animate-spin mx-auto mb-3 text-blue-500" size={28} />
                                                <p className="font-medium">Memuat data dari database...</p>
                                            </td>
                                        </tr>
                                    ) : users.length > 0 ? (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-200">{user.full_name || user.name || 'User'}</td>
                                                <td className="p-4 text-slate-400">{user.email || '-'}</td>
                                                <td className="p-4">
                                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold">
                                                        {user.level || 'Beginner'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {user.is_pro ? (
                                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
                                                            <Crown size={12} /> PRO
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs font-bold inline-block">Free</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-slate-400">Belum ada data pengguna.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}