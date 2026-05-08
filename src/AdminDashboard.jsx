import React, { useState, useEffect } from 'react';
import { LogOut, Users, RefreshCw, UserCheck, LayoutDashboard, CreditCard, Settings, Crown, Activity, Sparkles, ChevronRight, Search, Filter } from 'lucide-react';
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
        <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
            {/* Sidebar Dark Premium (Meniru Gaya Gambar) */}
            <aside className="w-[280px] bg-[#0F172A] flex flex-col shrink-0 overflow-y-auto">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-blue-500" size={24} />
                        RichardMeha <span className="text-blue-500">AI</span>
                    </h1>
                </div>

                <div className="px-6 pb-6">
                    <div className="bg-[#1E293B] rounded-2xl p-4 flex items-center gap-3 border border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                            {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{userEmail || 'Administrator'}</p>
                            <p className="text-xs text-blue-400 flex items-center gap-1 font-medium mt-0.5">
                                <Crown size={12} /> Super Admin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Menu Utama</p>
                    <nav className="space-y-1">
                        <button onClick={() => setActiveMenu('overview')} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold transition-all ${activeMenu === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                            <div className="flex items-center gap-3">
                                <LayoutDashboard size={20} /> Dasbor Admin
                            </div>
                        </button>
                    </nav>
                </div>

                <div className="px-6 py-4 mt-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Manajemen Data</p>
                    <nav className="space-y-1">
                        <button onClick={() => setActiveMenu('users')} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold transition-all ${activeMenu === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                            <div className="flex items-center gap-3">
                                <Users size={20} /> Data Pengguna
                            </div>
                        </button>
                        <button onClick={() => setActiveMenu('transactions')} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold transition-all ${activeMenu === 'transactions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                            <div className="flex items-center gap-3">
                                <CreditCard size={20} /> Transaksi
                            </div>
                        </button>
                    </nav>
                </div>

                <div className="mt-auto px-6 py-6 border-t border-slate-800 space-y-2">
                    <button onClick={onSwitchToUser} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-slate-400 hover:bg-[#1E293B] hover:text-white transition-all">
                        <UserCheck size={20} /> Mode User
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-rose-400 hover:bg-rose-500/10 transition-all">
                        <LogOut size={20} /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Layout */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar">
                    
                    {/* Header Top */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Control Panel</h2>
                            <p className="text-slate-500 mt-1 font-medium">Kelola data murid, transaksi, dan performa aplikasi.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchDataPengguna}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm disabled:opacity-50"
                            >
                                <RefreshCw size={18} className={isLoading ? "animate-spin text-blue-600" : "text-blue-600"} /> Refresh Data
                            </button>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                        {/* Big Card - Total Murid (Meniru gaya "Lanjut Belajar" di Gambar) */}
                        <div className="xl:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#4F46E5] via-[#3B82F6] to-[#2563EB] rounded-[32px] p-8 md:p-10 shadow-xl shadow-blue-500/20 text-white flex flex-col justify-between min-h-[320px]">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="absolute bottom-0 right-10 w-48 h-48 bg-blue-300/20 rounded-full blur-2xl mb-10"></div>
                            <Users className="absolute bottom-[-30px] right-[-20px] text-white/10" size={280} strokeWidth={1} />

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs font-bold tracking-wide uppercase mb-6">
                                    <Activity size={14} /> Status Aktif
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black leading-tight mb-3">
                                    Total Murid Terdaftar
                                </h2>
                                <p className="text-blue-100 font-medium max-w-md text-lg">
                                    Ringkasan pengguna yang aktif belajar di RichardMeha AI hari ini.
                                </p>
                            </div>

                            <div className="relative z-10 mt-10 flex items-center gap-4 flex-wrap">
                                <div className="bg-white text-blue-600 px-8 py-5 rounded-2xl flex items-center gap-5 shadow-xl shadow-black/5">
                                    <div className="p-3 bg-blue-50 rounded-xl">
                                        <Users size={32} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Total Users</p>
                                        <p className="text-4xl font-black leading-none">{totalMurid}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-5 rounded-2xl flex items-center gap-5">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <Crown size={32} className="text-amber-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-extrabold text-blue-200 uppercase tracking-wider mb-1">Pro Users</p>
                                        <p className="text-4xl font-black leading-none">{users.filter(u => u.is_pro).length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Side Cards (Meniru sidebar kanan putih di Gambar) */}
                        <div className="xl:col-span-1 flex flex-col gap-6">
                            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex-1 flex flex-col justify-center relative overflow-hidden">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-slate-800 text-lg">Server Status</h3>
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-5 mb-2">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                                        <Activity size={32} />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-slate-900">Online</p>
                                        <p className="text-sm font-medium text-slate-500 mt-1">Semua sistem normal</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0F172A] rounded-[32px] p-8 shadow-xl shadow-slate-900/10 text-white flex-1 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
                                <h3 className="font-bold text-slate-300 text-lg mb-6 relative z-10">Rasio Pengguna</h3>
                                <div className="relative z-10">
                                    <div className="flex justify-between text-sm mb-3 font-bold">
                                        <span className="text-amber-400 flex items-center gap-1.5"><Crown size={14}/> PRO ({users.filter(u => u.is_pro).length})</span>
                                        <span className="text-slate-400">FREE ({totalMurid - users.filter(u => u.is_pro).length})</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-4 p-0.5">
                                        <div 
                                            className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-1000" 
                                            style={{ width: `${totalMurid > 0 ? (users.filter(u => u.is_pro).length / totalMurid) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabel Data Pengguna - Modern Style */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div>
                                <h3 className="font-black text-slate-900 text-xl">Direktori Pengguna Aktif</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">Daftar semua pengguna yang terdaftar di database.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" placeholder="Cari murid..." className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72 transition-all" />
                                </div>
                                <button className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                                    <Filter size={18} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto p-4">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">
                                        <th className="px-6 py-4">Nama Lengkap</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Level</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-medium text-slate-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="5" className="py-16 text-center text-slate-500">
                                                <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
                                                <p className="font-bold text-lg">Memuat data pengguna...</p>
                                            </td>
                                        </tr>
                                    ) : users.length > 0 ? (
                                        users.map((user) => (
                                            <tr key={user.id} className="bg-slate-50/50 hover:bg-blue-50/80 transition-all rounded-2xl group cursor-pointer">
                                                <td className="px-6 py-4 rounded-l-2xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-base shadow-sm">
                                                            {(user.full_name || user.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-slate-900 text-base">{user.full_name || user.name || 'User'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-medium">{user.email || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold inline-block border border-slate-200">
                                                        {user.level || 'Beginner'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {user.is_pro ? (
                                                        <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 border border-amber-200 w-24 shadow-sm">
                                                            <Crown size={14} /> PRO
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold inline-flex items-center justify-center border border-slate-200 w-24">
                                                            Free
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 rounded-r-2xl text-center">
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-lg border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-16 text-center text-slate-500">
                                                <p className="font-bold text-lg">Belum ada data pengguna terdaftar.</p>
                                            </td>
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