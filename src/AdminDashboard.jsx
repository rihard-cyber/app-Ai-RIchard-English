import React, { useState, useEffect } from 'react';
import { LogOut, Users, RefreshCw, UserCheck, Crown, Activity, Menu, X } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function AdminDashboard({ onLogout, onSwitchToUser, userEmail }) {
    const [users, setUsers] = useState([]);
    const [totalMurid, setTotalMurid] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Dashboard */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <Users className="text-blue-600" /> Admin Panel
                        </h1>
                        <p className="text-slate-500 text-sm">Masuk sebagai: {userEmail}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchDataPengguna}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all active:scale-95"
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                        <button
                            onClick={onSwitchToUser}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-all active:scale-95"
                        >
                            <UserCheck size={16} /> Mode User
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all active:scale-95"
                        >
                            <LogOut size={16} /> Keluar
                        </button>
                    </div>
                </div>

                {/* Statistik */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-bold text-sm">Total Murid</p>
                            <h2 className="text-3xl font-black text-slate-800">{totalMurid}</h2>
                        </div>
                    </div>
                </div>

                {/* Tabel Data Pengguna */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-800">Daftar Pengguna</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider">
                                    <th className="p-4 border-b border-slate-100">Nama</th>
                                    <th className="p-4 border-b border-slate-100">Email</th>
                                    <th className="p-4 border-b border-slate-100">Level</th>
                                    <th className="p-4 border-b border-slate-100">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="p-10 text-center text-slate-500 font-medium animate-pulse">Memuat data pengguna...</td></tr>
                                ) : users.length > 0 ? (
                                    users.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                                            <td className="p-4 font-bold text-slate-800">{user.full_name || user.name || 'User'}</td>
                                            <td className="p-4 text-slate-500">{user.email || '-'}</td>
                                            <td className="p-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{user.level || 'Beginner'}</span></td>
                                            <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${user.is_pro ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>{user.is_pro ? 'PRO' : 'Free'}</span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="p-10 text-center text-slate-500">Belum ada data murid.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}