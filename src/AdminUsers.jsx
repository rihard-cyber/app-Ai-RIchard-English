import React, { useState, useMemo } from 'react';
import { Users, Crown, Activity, Search, Download, Loader2 } from 'lucide-react';

export default function AdminUsers({ users, isLoading, showToast }) {
    const [searchUserQuery, setSearchUserQuery] = useState('');
    const [filterSubscription, setFilterSubscription] = useState('all');

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const query = searchUserQuery.toLowerCase();
            const matchNameEmail = (u.name || 'User').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query);
            const matchSub = filterSubscription === 'all' ? true : filterSubscription === 'pro' ? u.is_pro : !u.is_pro;
            return matchNameEmail && matchSub;
        });
    }, [users, searchUserQuery, filterSubscription]);

    const handleExportUsers = () => {
        if (filteredUsers.length === 0) return showToast("Tidak ada data pengguna untuk diekspor.", "error");
        const headers = ["Nama", "Email", "Gender", "Level", "Status Pro", "Tanggal Gabung"];
        const csvRows = filteredUsers.map(u => [u.name || 'User', u.email || '-', u.gender || 'male', u.level || 'Beginner (A1)', u.is_pro ? 'PRO' : 'Free', new Date(u.created_at).toLocaleDateString('id-ID')]);
        const csvContent = [headers.join(","), ...csvRows.map(row => row.map(item => `"${item}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Data_Pengguna_RichardMeha_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={28} /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Murid</p><h4 className="text-2xl font-black text-slate-800">{users.length}</h4></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Crown size={28} /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Member PRO</p><h4 className="text-2xl font-black text-slate-800">{users.filter(u => u.is_pro).length}</h4></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><Activity size={28} /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</p><h4 className="text-2xl font-black text-slate-800">{users.length > 0 ? ((users.filter(u => u.is_pro).length / users.length) * 100).toFixed(1) : 0}%</h4></div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <h3 className="font-bold text-slate-800">Daftar Pengguna Aktif</h3>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select value={filterSubscription} onChange={(e) => setFilterSubscription(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 shadow-sm">
                            <option value="all">Semua Paket</option><option value="free">Gratis</option><option value="pro">Pro Member</option>
                        </select>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Cari nama atau email..." value={searchUserQuery} onChange={(e) => setSearchUserQuery(e.target.value)} className="pl-9 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-emerald-500" />
                        </div>
                        <button onClick={handleExportUsers} className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-bold"><Download size={16} /> Ekspor CSV</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                            <tr><th className="p-6">User Profile</th><th className="p-6">Language Level</th><th className="p-6">Subscription</th><th className="p-6">Join Date</th><th className="p-6">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">{u.name?.charAt(0).toUpperCase() || 'U'}</div><div><p className="font-bold text-slate-800">{u.name || 'User'}</p><p className="text-xs text-slate-400">{u.email || u.gender}</p></div></div></td>
                                    <td className="p-6"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">{u.level}</span></td>
                                    <td className="p-6">{u.is_pro ? <div className="flex items-center gap-1.5 text-amber-600 font-bold"><Crown size={14} /> PRO</div> : <span className="text-slate-400 font-medium">Free Tier</span>}</td>
                                    <td className="p-6 text-slate-500 font-medium">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                                    <td className="p-6"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-xs font-bold text-slate-600">Aktif</span></div></td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && <tr><td colSpan="5" className="p-20 text-center">Belum ada murid.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}