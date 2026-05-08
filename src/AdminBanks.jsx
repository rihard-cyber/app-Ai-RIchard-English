import React, { useState } from 'react';
import { Plus, CreditCard, Trash2 } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function AdminBanks({ banks, fetchData, showToast }) {
    const [newBank, setNewBank] = useState({ provider: 'BCA', account_number: '', account_name: '' });

    const handleAddBank = async (e) => {
        e.preventDefault();
        if (!newBank.account_number || !newBank.account_name) return;
        try {
            const { error } = await supabase.from('payment_methods').insert([{ provider: newBank.provider, account_number: newBank.account_number, account_name: newBank.account_name, is_active: true }]);
            if (error) throw error;
            setNewBank({ provider: 'BCA', account_number: '', account_name: '' });
            showToast("Berhasil! Rekening tersimpan dan aktif.", "success");
            fetchData();
        } catch (error) {
            showToast("Gagal Simpan: Masalah koneksi database", "error");
        }
    };

    const handleDeleteBank = async (id) => {
        if (window.confirm('Hapus rekening ini?')) {
            try {
                await supabase.from('payment_methods').delete().eq('id', id);
                fetchData();
                showToast("Rekening berhasil dihapus.", "success");
            } catch (error) {
                console.error(error);
                showToast("Gagal menghapus rekening.", "error");
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-fit">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Plus className="text-emerald-500" /> Tambah Rekening</h3>
                    <form onSubmit={handleAddBank} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Provider</label>
                            <select value={newBank.provider} onChange={e => setNewBank({ ...newBank, provider: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 text-sm font-bold">
                                <option value="BCA">BCA</option><option value="BRI">BRI</option><option value="MANDIRI">Mandiri</option><option value="VA">Virtual Account</option><option value="QRIS">QRIS</option><option value="DANA">DANA</option><option value="GOPAY">GoPay</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nomor Akun / Rek</label>
                            <input type="text" value={newBank.account_number} onChange={e => setNewBank({ ...newBank, account_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 text-sm font-bold" placeholder="123456789" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Atas Nama</label>
                            <input type="text" value={newBank.account_name} onChange={e => setNewBank({ ...newBank, account_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 text-sm font-bold" placeholder="RICHARD MEHA" required />
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"><Plus size={18} /> Simpan</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard className="text-blue-500" /> Rekening Terdaftar</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-full border border-slate-200">{banks.length} Rekening</span>
                    </div>
                    <div className="overflow-x-auto transform-gpu overscroll-x-contain scroll-smooth pb-2">
                        <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                            <thead className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                <tr><th className="p-6">Provider</th><th className="p-6">Nomor Akun</th><th className="p-6">Atas Nama</th><th className="p-6 text-center">Aksi</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {banks.map(bank => (
                                    <tr key={bank.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest ${bank.provider === 'QRIS' ? 'bg-purple-100 text-purple-700' : bank.provider === 'VA' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{bank.provider}</span></td>
                                        <td className="p-6 font-black text-slate-800 text-lg tracking-wider">{bank.account_number}</td>
                                        <td className="p-6 text-slate-500 font-bold uppercase text-xs">{bank.account_name}</td>
                                        <td className="p-6 text-center"><button onClick={() => handleDeleteBank(bank.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 size={20} /></button></td>
                                    </tr>
                                ))}
                                {banks.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-slate-300">Belum ada rekening.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}