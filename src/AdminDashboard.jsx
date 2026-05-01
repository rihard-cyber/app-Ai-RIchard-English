import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CreditCard, Activity, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, LogOut, Loader2, Plus, Trash2, Shield } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function AdminDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0, revenue: 0, totalTx: 0 });
    const [transactions, setTransactions] = useState([]);
    const [banks, setBanks] = useState([]);
    const [users, setUsers] = useState([]); // New User State
    const [isLoading, setIsLoading] = useState(true);

    // New Bank State
    const [newBank, setNewBank] = useState({ provider: 'BCA', account_number: '', account_name: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch stats
            const { count: totalUsers } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
            const { count: proUsers } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true);

            // Fetch Transactions
            const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
            setTransactions(txData || []);

            const revenue = (txData || []).filter(tx => tx.status === 'approved').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

            setStats({
                totalUsers: totalUsers || 0,
                proUsers: proUsers || 0,
                revenue: revenue,
                totalTx: txData?.length || 0
            });

            // Fetch Banks
            const { data: bankData } = await supabase.from('payment_methods').select('*').order('created_at', { ascending: true });
            setBanks(bankData || []);

            // Fetch All Users
            const { data: userData } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
            setUsers(userData || []);

        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
        setIsLoading(false);
    };

    const handleAccPayment = async (txId, userId) => {
        try {
            // Update transaction status
            await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId);
            // Upgrade User to PRO
            await supabase.from('user_profiles').update({ is_pro: true }).eq('id', userId);
            alert("Pembayaran Berhasil di ACC! User sekarang adalah PRO.");
            fetchData();
        } catch (error) {
            alert("Gagal menyetujui pembayaran.");
        }
    };

    const handleRejectPayment = async (txId) => {
        try {
            await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txId);
            alert("Pembayaran Ditolak.");
            fetchData();
        } catch (error) {
            alert("Gagal menolak pembayaran.");
        }
    };

    const handleAddBank = async (e) => {
        e.preventDefault();
        if (!newBank.account_number || !newBank.account_name) return;
        
        try {
            // Kita paksa is_active: true supaya langsung muncul di user
            await supabase.from('payment_methods').insert([{ ...newBank, is_active: true }]);
            setNewBank({ provider: 'BCA', account_number: '', account_name: '' });
            alert("Rekening berhasil disimpan!");
            fetchData();
        } catch (error) {
            alert("Gagal menyimpan rekening: " + error.message);
        }
    };

    const handleDeleteBank = async (id) => {
        if (window.confirm('Hapus rekening ini?')) {
            await supabase.from('payment_methods').delete().eq('id', id);
            fetchData();
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <Shield className="text-emerald-500" /> Admin Panel
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <SidebarItem icon={<Activity size={20} />} label="Transaksi Pro" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} badge={transactions.filter(t => t.status === 'pending').length} />
                    <SidebarItem icon={<CreditCard size={20} />} label="Data Rekening" active={activeTab === 'banks'} onClick={() => setActiveTab('banks')} />
                    <SidebarItem icon={<Users size={20} />} label="Data Pengguna" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium">
                        <LogOut size={20} /> Keluar
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <h2 className="text-3xl font-black text-slate-800 mb-8 capitalize">{activeTab} Dashboard</h2>

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard title="Total Pengguna" value={stats.totalUsers} icon={<Users />} color="bg-blue-500" />
                            <SubStatCard title="Pengguna PRO" value={stats.proUsers} icon={<CheckCircle />} color="text-emerald-500" />
                            <StatCard title="Dana Masuk (Rp)" value={stats.revenue.toLocaleString('id-ID')} icon={<ArrowDownRight />} color="bg-emerald-500" />
                            <StatCard title="Total Transaksi" value={stats.totalTx} icon={<Activity />} color="bg-purple-500" />
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Grafik Pertumbuhan (Simulasi)</h3>
                            <div className="h-64 flex items-end gap-2 md:gap-4 w-full border-b border-slate-100 pb-2">
                                {[40, 70, 45, 90, 65, 120, 100].map((val, i) => (
                                    <div key={i} className="w-full bg-blue-100 hover:bg-blue-500 transition-colors rounded-t-md relative group flex flex-col justify-end" style={{ height: `${(val / 120) * 100}%` }}>
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">{val} Users</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 mt-2 font-bold uppercase"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Tanggal</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Paket</th>
                                    <th className="p-4">Nominal</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-slate-600">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                                        <td className="p-4 font-bold text-slate-800">{tx.user_name || 'User'}</td>
                                        <td className="p-4 text-blue-600 font-medium">{tx.plan_name}</td>
                                        <td className="p-4 font-bold text-emerald-600">Rp {Number(tx.amount).toLocaleString('id-ID')}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{tx.status}</span>
                                        </td>
                                        <td className="p-4 flex justify-center gap-2">
                                            {tx.status === 'pending' ? (
                                                <>
                                                    <button onClick={() => handleAccPayment(tx.id, tx.user_id)} className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors" title="ACC Pembayaran"><CheckCircle size={18} /></button>
                                                    <button onClick={() => handleRejectPayment(tx.id)} className="p-2 bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors" title="Tolak"><XCircle size={18} /></button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Selesai</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Belum ada data transaksi.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'banks' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Form Tambah */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-fit">
                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <Plus className="text-emerald-500" /> Tambah Rekening
                                </h3>
                                <form onSubmit={handleAddBank} className="space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Provider Pembayaran</label>
                                        <select value={newBank.provider} onChange={e => setNewBank({ ...newBank, provider: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 text-sm font-bold">
                                            <option value="BCA">BCA (Bank Central Asia)</option>
                                            <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                                            <option value="MANDIRI">Mandiri (Bank Mandiri)</option>
                                            <option value="VA">Virtual Account (VA)</option>
                                            <option value="QRIS">QRIS / Barcode</option>
                                            <option value="DANA">DANA (E-Wallet)</option>
                                            <option value="GOPAY">GoPay (E-Wallet)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nomor Rekening / HP / VA</label>
                                        <input type="text" value={newBank.account_number} onChange={e => setNewBank({ ...newBank, account_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 text-sm font-bold" placeholder="Contoh: 123456789" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Atas Nama (A.N)</label>
                                        <input type="text" value={newBank.account_name} onChange={e => setNewBank({ ...newBank, account_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 text-sm font-bold" placeholder="Contoh: RICHARD MEHA" required />
                                    </div>
                                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2">
                                        <Plus size={18} /> Simpan Rekening Baru
                                    </button>
                                </form>
                            </div>

                            {/* Tabel Daftar Rekening */}
                            <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <CreditCard className="text-blue-500" /> Rekening Terdaftar
                                    </h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-full border border-slate-200">{banks.length} Rekening</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                            <tr>
                                                <th className="p-6">Provider</th>
                                                <th className="p-6">Nomor Akun</th>
                                                <th className="p-6">Atas Nama</th>
                                                <th className="p-6 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {banks.map(bank => (
                                                <tr key={bank.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-6">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest ${
                                                            bank.provider === 'QRIS' ? 'bg-purple-100 text-purple-700' : 
                                                            bank.provider === 'VA' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {bank.provider}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 font-black text-slate-800 text-lg tracking-wider">{bank.account_number}</td>
                                                    <td className="p-6 text-slate-500 font-bold uppercase text-xs">{bank.account_name}</td>
                                                    <td className="p-6">
                                                        <div className="flex justify-center">
                                                            <button onClick={() => handleDeleteBank(bank.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="Hapus">
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {banks.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="p-20 text-center text-slate-300">
                                                        <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                                                        <p className="font-bold">Belum ada rekening terdaftar.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'users' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* User Distribution Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Users size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Murid</p>
                                    <h4 className="text-2xl font-black text-slate-800">{users.length}</h4>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                                    <Crown size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Member PRO</p>
                                    <h4 className="text-2xl font-black text-slate-800">{users.filter(u => u.is_pro).length}</h4>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <Activity size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</p>
                                    <h4 className="text-2xl font-black text-slate-800">
                                        {users.length > 0 ? ((users.filter(u => u.is_pro).length / users.length) * 100).toFixed(1) : 0}%
                                    </h4>
                                </div>
                            </div>
                        </div>

                        {/* User Table Panel */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">Daftar Pengguna Aktif</h3>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">{users.length} Total</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-6">User Profile</th>
                                            <th className="p-6">Language Level</th>
                                            <th className="p-6">Subscription</th>
                                            <th className="p-6">Join Date</th>
                                            <th className="p-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                            {u.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{u.name}</p>
                                                            <p className="text-xs text-slate-400 capitalize">{u.gender}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black tracking-tight">
                                                        {u.level}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    {u.is_pro ? (
                                                        <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                                                            <Crown size={14} /> PRO MEMBER
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium">Free Tier</span>
                                                    )}
                                                </td>
                                                <td className="p-6 text-slate-500 font-medium">
                                                    {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <span className="text-xs font-bold text-slate-600">Aktif</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                                        <Users size={48} />
                                                        <p className="text-lg font-medium">Belum ada data murid.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick, badge }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${active ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <div className="flex items-center gap-3">{icon} <span className="text-sm">{label}</span></div>
            {badge > 0 && <div className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{badge}</div>}
        </button>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className={`${color} text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group`}>
            <div className="absolute -right-4 -top-4 opacity-20 scale-150 group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-black">{value}</h3>
        </div>
    );
}

function SubStatCard({ title, value, icon, color }) {
    return (
        <div className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden`}>
            <div className={`absolute right-4 top-4 opacity-20 ${color}`}>{icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className={`text-3xl font-black text-slate-800`}>{value}</h3>
        </div>
    );
}