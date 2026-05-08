import React, { useState, useMemo, useRef } from 'react';
import { Users, CheckCircle, ArrowDownRight, Activity, Zap, Eye, EyeOff, Loader2, Trash, Download, Upload, DatabaseBackup, RefreshCw } from 'lucide-react';
import { supabase } from './supabaseClient';
import { testIFlytekConnection } from './VoiceService';

export function StatusBadge({ status }) {
    if (status === 'testing') return <span className="ml-2 text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full animate-pulse border border-slate-200 font-bold">Memeriksa...</span>;
    if (status === 'ok') return <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">Terhubung ✅</span>;
    if (status === 'error') return <span className="ml-2 text-[9px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200 font-bold">Gagal ❌</span>;
    return null;
}

export function StatCard({ title, value, icon, color }) {
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

export function SubStatCard({ title, value, icon, color }) {
    return (
        <div className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden`}>
            <div className={`absolute right-4 top-4 opacity-20 ${color}`}>{icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className={`text-3xl font-black text-slate-800`}>{value}</h3>
        </div>
    );
}

export default function AdminOverview({ usersData, stats, chartData, maxRevenue, monthlyRevenueArray, userEmail, apiKeys, setApiKeys, apiStatus, handleTestConnections, handleSaveApiKey, saveKeySuccess, isSavingKey, isFetchingKeys, showToast, onRefresh }) {
    const levelCounts = useMemo(() => {
        const counts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
        usersData.forEach(u => {
            const lvl = u.level || '';
            if (lvl.includes('A1')) counts.A1++;
            else if (lvl.includes('A2')) counts.A2++;
            else if (lvl.includes('B1')) counts.B1++;
            else if (lvl.includes('B2')) counts.B2++;
            else if (lvl.includes('C1')) counts.C1++;
            else if (lvl.includes('C2')) counts.C2++;
            else counts.A1++;
        });
        return counts;
    }, [usersData]);

    const maxLevelCount = Math.max(...Object.values(levelCounts), 1);
    const levelColors = { A1: 'bg-emerald-400', A2: 'bg-emerald-500', B1: 'bg-blue-400', B2: 'bg-blue-500', C1: 'bg-purple-400', C2: 'bg-purple-500' };
    const [showKey, setShowKey] = useState({});
    const [isClearingLogs, setIsClearingLogs] = useState(false);
    const [iflytekTestStatus, setIflytekTestStatus] = useState('idle');
    const [iflytekTestMsg, setIflytekTestMsg] = useState('');
    const fileInputRef = useRef(null);

    const toggleKeyVisibility = (key) => setShowKey(p => ({ ...p, [key]: !p[key] }));

    const handleTestIFlytek = async () => {
        setIflytekTestStatus('testing');
        setIflytekTestMsg('');
        const res = await testIFlytekConnection(apiKeys.iflytekAppId, apiKeys.iflytekApiKey, apiKeys.iflytekApiSecret);
        if (res.success) {
            setIflytekTestStatus('success');
            setIflytekTestMsg('Koneksi iFLYTEK Valid ✅');
        } else {
            setIflytekTestStatus('error');
            setIflytekTestMsg(res.message);
        }
        setTimeout(() => setIflytekTestStatus('idle'), 5000);
    };

    const handleDownloadKeys = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(apiKeys, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "richardmeha_api_keys_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleRestoreKeys = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                setApiKeys(prev => ({ ...prev, ...parsed }));
                showToast("Berhasil memuat API Keys! Klik 'Simpan Semua Key' untuk menerapkan.", "success");
            } catch (err) {
                showToast("Format file JSON tidak valid.", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset input
    };

    const handleExportDB = () => {
        const exportData = {
            export_date: new Date().toISOString(),
            total_users: usersData.length,
            users: usersData,
            stats: stats
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `richardmeha_db_backup_${new Date().getTime()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast("Database Pengguna berhasil diekspor!", "success");
    };

    const handleClearLogs = async () => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus semua log aktivitas pengguna yang lebih lama dari 30 hari? Tindakan ini akan mengosongkan ruang database.')) return;
        setIsClearingLogs(true);
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { error } = await supabase.from('user_progress').delete().lt('created_at', thirtyDaysAgo.toISOString());
            if (error) throw error;
            showToast("Log aktivitas usang berhasil dibersihkan.", "success");
        } catch (error) {
            console.error("Clear logs error:", error);
            showToast("Gagal membersihkan log.", "error");
        } finally {
            setIsClearingLogs(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {onRefresh && (
                <div className="flex justify-end mb-[-1rem] relative z-10">
                    <button onClick={onRefresh} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm active:scale-95">
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Pengguna" value={usersData.length} icon={<Users />} color="bg-blue-500" />
                <SubStatCard title="Pengguna PRO" value={usersData.filter(u => u.is_pro).length} icon={<CheckCircle />} color="text-emerald-500" />
                <StatCard title="Dana Masuk (Rp)" value={stats.revenue.toLocaleString('id-ID')} icon={<ArrowDownRight />} color="bg-emerald-500" />
                <StatCard title="Total Transaksi" value={stats.totalTx} icon={<Activity />} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="text-emerald-500" /> Grafik Pendapatan Bulanan</h3>
                    <div className="h-64 flex items-end gap-2 md:gap-4 w-full border-b border-slate-100 pb-2">
                        {chartData.length > 0 ? chartData.map((item, i) => {
                            const heightPercent = Math.max((item.revenue / maxRevenue) * 100, 2);
                            return (
                                <div key={i} className="w-full bg-emerald-100 hover:bg-emerald-500 transition-colors rounded-t-md relative group flex flex-col justify-end" style={{ height: `${heightPercent}%` }}>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap">
                                        Rp {item.revenue.toLocaleString('id-ID')}
                                    </div>
                                </div>
                            );
                        }) : <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada data pendapatan.</div>}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
                        {chartData.map((item, i) => <span key={i} className="w-full text-center truncate">{item.month.substring(0, 3)} '{item.year.toString().substring(2)}</span>)}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start md:items-center mb-6 flex-col md:flex-row gap-3">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="text-blue-500" /> Distribusi Level Bahasa</h3>
                        <button onClick={handleExportDB} className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all border border-slate-200 active:scale-95"><DatabaseBackup size={14} /> EXPORT DATA PENGGUNA</button>
                    </div>
                    <div className="flex flex-col gap-4 w-full justify-center flex-1">
                        {Object.entries(levelCounts).map(([lvl, count]) => {
                            const pct = Math.max((count / maxLevelCount) * 100, 2);
                            return (
                                <div key={lvl} className="flex items-center gap-4 group">
                                    <div className="w-8 font-black text-slate-500 text-sm group-hover:text-blue-600 transition-colors">{lvl}</div>
                                    <div className="flex-1 h-6 bg-slate-100 rounded-r-xl rounded-l-sm overflow-hidden">
                                        <div className={`h-full ${levelColors[lvl]} hover:opacity-80 transition-all rounded-r-xl flex items-center px-3`} style={{ width: `${pct}%` }}>
                                            {count > 0 && <span className="text-[10px] font-bold text-white shadow-sm">{count} User</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {userEmail === 'richardpl.meha@gmail.com' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8 border-rose-200 shadow-rose-100 relative overflow-hidden">
                    {isFetchingKeys && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memuat Kredensial...</p>
                        </div>
                    )}
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Zap className="text-blue-500" /> Konfigurasi AI (API Key)</h3>
                    <p className="text-xs text-slate-500 mb-4">Masukkan kredensial API secara spesifik untuk setiap layanan.</p>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Core AI</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['openai', 'gemini', 'groq'].map(key => (
                                    <div key={key} className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-600 flex items-center capitalize">{key} API Key <StatusBadge status={apiStatus[key]} /></label>
                                        <div className="relative">
                                            <input type={showKey[key] ? "text" : "password"} value={apiKeys[key]} onChange={(e) => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                            <button type="button" onClick={() => toggleKeyVisibility(key)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showKey[key] ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Translation API</h4>
                            <div className="flex flex-col gap-2 max-w-sm">
                                <label className="text-xs font-bold text-slate-600 flex items-center">l10n.dev API Key <StatusBadge status={apiStatus.l10n} /></label>
                                <div className="relative">
                                    <input type={showKey.l10n ? "text" : "password"} value={apiKeys.l10n} onChange={(e) => setApiKeys(prev => ({ ...prev, l10n: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                    <button type="button" onClick={() => toggleKeyVisibility('l10n')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showKey.l10n ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 border-b pb-2 gap-2">
                                <h4 className="text-sm font-bold text-slate-700">Voice & Audio API</h4>
                                <button type="button" onClick={handleTestIFlytek} disabled={iflytekTestStatus === 'testing'} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-1 font-bold transition-colors disabled:opacity-50 w-full sm:w-auto">
                                    {iflytekTestStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                                    {iflytekTestStatus === 'testing' ? 'Mengetes...' : 'Test iFLYTEK'}
                                </button>
                            </div>
                            {iflytekTestStatus !== 'idle' && iflytekTestStatus !== 'testing' && (
                                <div className={`mb-4 text-xs font-bold px-3 py-2 rounded-lg ${iflytekTestStatus === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {iflytekTestMsg}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">iFLYTEK App ID</label>
                                    <div className="relative">
                                        <input type={showKey.iflytekAppId ? "text" : "password"} value={apiKeys.iflytekAppId || ''} onChange={(e) => setApiKeys(prev => ({ ...prev, iflytekAppId: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('iflytekAppId')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showKey.iflytekAppId ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">iFLYTEK API Key</label>
                                    <div className="relative">
                                        <input type={showKey.iflytekApiKey ? "text" : "password"} value={apiKeys.iflytekApiKey || ''} onChange={(e) => setApiKeys(prev => ({ ...prev, iflytekApiKey: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('iflytekApiKey')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showKey.iflytekApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">iFLYTEK API Secret</label>
                                    <div className="relative">
                                        <input type={showKey.iflytekApiSecret ? "text" : "password"} value={apiKeys.iflytekApiSecret || ''} onChange={(e) => setApiKeys(prev => ({ ...prev, iflytekApiSecret: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('iflytekApiSecret')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showKey.iflytekApiSecret ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">ElevenLabs API Key <StatusBadge status={apiStatus.elevenlabs} /></label>
                                    <div className="relative">
                                        <input type={showKey.elevenlabs ? "text" : "password"} value={apiKeys.elevenlabs || ''} onChange={(e) => setApiKeys(prev => ({ ...prev, elevenlabs: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('elevenlabs')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showKey.elevenlabs ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">ElevenLabs Voice ID</label>
                                    <input type="text" value={apiKeys.elevenlabsVoiceId || ''} onChange={(e) => setApiKeys(prev => ({ ...prev, elevenlabsVoiceId: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="21m00Tcm4TlvDq8ikWAM" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-100 pt-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={handleDownloadKeys} className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all flex-1 sm:flex-none flex justify-center items-center gap-2"><Download size={18} /> Backup</button>
                            <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestoreKeys} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all flex-1 sm:flex-none flex justify-center items-center gap-2"><Upload size={18} /> Restore</button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button onClick={handleTestConnections} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all w-full sm:w-auto flex justify-center items-center gap-2"><Activity size={18} /> Test Koneksi</button>
                            <button onClick={handleSaveApiKey} disabled={isSavingKey} className={`${saveKeySuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all w-full sm:w-auto flex justify-center items-center disabled:opacity-70 gap-2`}>
                                {isSavingKey ? <Loader2 size={16} className="animate-spin" /> : saveKeySuccess ? 'Tersimpan ✅' : 'Simpan Semua Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}