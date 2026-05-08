import React, { useState, useMemo } from 'react';
import { Search, X, Download, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function AdminTransactions({ transactions, fetchData, showToast }) {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [searchUserName, setSearchUserName] = useState('');

    const availableYears = [...new Set(transactions.map(tx => new Date(tx.created_at).getFullYear()))].sort((a, b) => b - a);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const txDate = new Date(tx.created_at);
            const monthMatch = !selectedMonth || (txDate.getMonth() + 1).toString() === selectedMonth;
            const yearMatch = !selectedYear || txDate.getFullYear().toString() === selectedYear;
            const searchMatch = !searchUserName || (tx.user_name || 'User').toLowerCase().includes(searchUserName.toLowerCase());
            return monthMatch && yearMatch && searchMatch;
        });
    }, [transactions, selectedMonth, selectedYear, searchUserName]);

    const handleAccPayment = async (txId, userId) => {
        try {
            await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId);
            await supabase.from('user_profiles').update({ is_pro: true }).eq('id', userId);
            showToast("Pembayaran Berhasil di ACC! User sekarang adalah PRO.", "success");
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Gagal menyetujui pembayaran.", "error");
        }
    };

    const handleRejectPayment = async (txId) => {
        try {
            await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txId);
            showToast("Pembayaran Ditolak.", "success");
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Gagal menolak pembayaran.", "error");
        }
    };

    const handleExportTransactions = () => {
        if (filteredTransactions.length === 0) return showToast("Tidak ada data transaksi untuk diekspor.", "error");
        const headers = ["Tanggal", "User", "Paket", "Nominal", "Status"];
        const csvRows = filteredTransactions.map(tx => [new Date(tx.created_at).toLocaleDateString('id-ID'), tx.user_name || 'User', tx.plan_name, tx.amount, tx.status]);
        const csvContent = [headers.join(","), ...csvRows.map(row => row.map(item => `"${item}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Data_Transaksi_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto relative">
                        <Search className="absolute left-3 text-slate-400" size={16} />
                        <input type="text" placeholder="Cari nama user..." value={searchUserName} onChange={(e) => setSearchUserName(e.target.value)} className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:outline-none focus:border-emerald-500 shadow-sm w-full" />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 shadow-sm w-full">
                            <option value="">Semua Tahun</option>
                            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 shadow-sm w-full">
                            <option value="">Semua Bulan</option>
                            {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>))}
                        </select>
                    </div>
                    {(selectedMonth || selectedYear || searchUserName) && (
                        <button onClick={() => { setSelectedMonth(''); setSelectedYear(''); setSearchUserName(''); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0"><X size={16} /> Reset</button>
                    )}
                </div>
                <button onClick={handleExportTransactions} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm w-full md:w-auto shrink-0"><Download size={18} /> Ekspor CSV Transaksi</button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto transform-gpu overscroll-x-contain scroll-smooth pb-2">
                    <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                            <tr><th className="p-4">Tanggal</th><th className="p-4">User</th><th className="p-4">Paket</th><th className="p-4">Nominal</th><th className="p-4">Status</th><th className="p-4 text-center">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 text-slate-600">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                                    <td className="p-4 font-bold text-slate-800">{tx.user_name || 'User'}</td>
                                    <td className="p-4 text-blue-600 font-medium">{tx.plan_name}</td>
                                    <td className="p-4 font-bold text-emerald-600">Rp {Number(tx.amount).toLocaleString('id-ID')}</td>
                                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{tx.status}</span></td>
                                    <td className="p-4 flex justify-center gap-2">
                                        {tx.status === 'pending' ? (
                                            <><button onClick={() => handleAccPayment(tx.id, tx.user_id)} className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors" title="ACC Pembayaran"><CheckCircle size={18} /></button><button onClick={() => handleRejectPayment(tx.id)} className="p-2 bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors" title="Tolak"><XCircle size={18} /></button></>
                                        ) : <span className="text-xs text-slate-400 italic">Selesai</span>}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Belum ada data transaksi.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}