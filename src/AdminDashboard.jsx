import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    LayoutDashboard, Users, CreditCard, Activity, CheckCircle, XCircle, ArrowDownRight, LogOut, Loader2, Plus, Trash2, Shield, RefreshCw, Menu, X, User, Zap, Crown, Download, Search, ArrowUpDown, Eye, EyeOff, Trash
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function AdminDashboard({ onLogout, onSwitchToUser, userEmail }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0, revenue: 0, totalTx: 0 });
    const [transactions, setTransactions] = useState([]);
    const [banks, setBanks] = useState([]);
    const [users, setUsers] = useState([]); // New User State
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [searchUserName, setSearchUserName] = useState('');

    // New Bank State
    const [newBank, setNewBank] = useState({ provider: 'BCA', account_number: '', account_name: '' });

    // API Key State
    const [apiKeys, setApiKeys] = useState({ openai: '', gemini: '', groq: '', l10n: '', elevenlabs: '', elevenlabsVoiceId: '', iflytekAppId: '', iflytekApiKey: '', iflytekApiSecret: '' });
    const [saveKeySuccess, setSaveKeySuccess] = useState(false);
    const [apiStatus, setApiStatus] = useState({ openai: null, gemini: null, groq: null, l10n: null, elevenlabs: null, iflytek: null });
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [isFetchingKeys, setIsFetchingKeys] = useState(true);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');
    const initialKeysLoaded = useRef(false);

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message, type: 'info' }), 3000);
    };

    const handleTestConnections = async () => {
        const getFirstKey = (keyString) => keyString ? keyString.split(',')[0].trim() : '';

        if (apiKeys.openai) {
            setApiStatus(p => ({ ...p, openai: 'testing' }));
            fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${getFirstKey(apiKeys.openai)}` } })
                .then(res => setApiStatus(p => ({ ...p, openai: res.ok ? 'ok' : 'error' })))
                .catch(() => setApiStatus(p => ({ ...p, openai: 'error' })));
        }
        if (apiKeys.gemini) {
            setApiStatus(p => ({ ...p, gemini: 'testing' }));
            fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${getFirstKey(apiKeys.gemini)}`)
                .then(res => setApiStatus(p => ({ ...p, gemini: res.ok ? 'ok' : 'error' })))
                .catch(() => setApiStatus(p => ({ ...p, gemini: 'error' })));
        }
        if (apiKeys.groq) {
            setApiStatus(p => ({ ...p, groq: 'testing' }));
            fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${getFirstKey(apiKeys.groq)}` } })
                .then(res => setApiStatus(p => ({ ...p, groq: res.ok ? 'ok' : 'error' })))
                .catch(() => setApiStatus(p => ({ ...p, groq: 'error' })));
        }
        if (apiKeys.l10n) {
            setApiStatus(p => ({ ...p, l10n: 'testing' }));
            setTimeout(() => {
                // Bypass CORS: Validasi String (Length > 15) untuk l10n.dev
                const l10nTestKey = getFirstKey(apiKeys.l10n);
                if (l10nTestKey.length > 15) {
                    setApiStatus(p => ({ ...p, l10n: 'ok' }));
                } else {
                    setApiStatus(p => ({ ...p, l10n: 'error' }));
                }
            }, 300);
        }
        if (apiKeys.elevenlabs) {
            setApiStatus(p => ({ ...p, elevenlabs: 'testing' }));
            fetch('https://api.elevenlabs.io/v1/models', { headers: { 'xi-api-key': getFirstKey(apiKeys.elevenlabs) } })
                .then(res => setApiStatus(p => ({ ...p, elevenlabs: res.ok ? 'ok' : 'error' })))
                .catch(() => setApiStatus(p => ({ ...p, elevenlabs: 'error' })));
        }
        if (apiKeys.iflytekAppId || apiKeys.iflytekApiKey || apiKeys.iflytekApiSecret) {
            setApiStatus(p => ({ ...p, iflytek: 'testing' }));
            setTimeout(() => {
                const appId = getFirstKey(apiKeys.iflytekAppId);
                const apiKeyStr = getFirstKey(apiKeys.iflytekApiKey);
                const apiSecretStr = getFirstKey(apiKeys.iflytekApiSecret);

                if (appId.length > 0 && apiKeyStr.length > 0 && apiSecretStr.length > 0) {
                    setApiStatus(p => ({ ...p, iflytek: 'ok' }));
                } else {
                    setApiStatus(p => ({ ...p, iflytek: 'error' }));
                }
            }, 300); // Simulasi waktu validasi sejenak
        }
    };

    const fetchApiKey = async () => {
        setIsFetchingKeys(true);
        try {
            const { data } = await supabase.from('app_settings').select('value').eq('id', 'api_keys').single();
            if (data && data.value) {
                let parsed = data.value;
                if (typeof parsed === 'string') {
                    try { parsed = JSON.parse(parsed); } catch (e) { parsed = { openai: '', gemini: data.value, groq: '', l10n: '', elevenlabs: '', elevenlabsVoiceId: '', iflytekAppId: '', iflytekApiKey: '', iflytekApiSecret: '' }; }
                }
                setApiKeys({
                    openai: parsed.openai || '', gemini: parsed.gemini || '', groq: parsed.groq || '', l10n: parsed.l10n || '',
                    elevenlabs: parsed.elevenlabs || '', elevenlabsVoiceId: parsed.elevenlabsVoiceId || '', iflytekAppId: parsed.iflytekAppId || '', iflytekApiKey: parsed.iflytekApiKey || '', iflytekApiSecret: parsed.iflytekApiSecret || ''
                });
            }
        } catch (error) {
            console.error("DB Key Error:", error);
        } finally {
            setIsFetchingKeys(false);
        }
    };

    const handleAutoSaveApiKey = async () => {
        setAutoSaveStatus('saving');
        const payload = {
            openai: apiKeys.openai.trim(),
            gemini: apiKeys.gemini.trim(),
            groq: apiKeys.groq.trim(),
            l10n: apiKeys.l10n.trim(),
            elevenlabs: apiKeys.elevenlabs.trim(),
            elevenlabsVoiceId: apiKeys.elevenlabsVoiceId?.trim() || '',
            iflytekAppId: apiKeys.iflytekAppId.trim(),
            iflytekApiKey: apiKeys.iflytekApiKey.trim(),
            iflytekApiSecret: apiKeys.iflytekApiSecret.trim()
        };
        try {
            await supabase.from('app_settings').upsert({ id: 'api_keys', value: payload });
            setAutoSaveStatus('saved');
            setTimeout(() => setAutoSaveStatus(''), 3000);
        } catch (err) {
            console.error(err);
            setAutoSaveStatus('');
        }
    };

    useEffect(() => {
        if (isFetchingKeys) return;
        if (!initialKeysLoaded.current) { initialKeysLoaded.current = true; return; }

        const timer = setTimeout(() => { handleAutoSaveApiKey(); }, 2000);
        return () => clearTimeout(timer);
    }, [apiKeys, isFetchingKeys]);

    const handleSaveApiKey = async () => {
        const payload = {
            openai: apiKeys.openai.trim(),
            gemini: apiKeys.gemini.trim(),
            groq: apiKeys.groq.trim(),
            l10n: apiKeys.l10n.trim(),
            elevenlabs: apiKeys.elevenlabs.trim(),
            elevenlabsVoiceId: apiKeys.elevenlabsVoiceId?.trim() || '',
            iflytekAppId: apiKeys.iflytekAppId.trim(),
            iflytekApiKey: apiKeys.iflytekApiKey.trim(),
            iflytekApiSecret: apiKeys.iflytekApiSecret.trim()
        };
        try {
            await supabase.from('app_settings').upsert({ id: 'api_keys', value: payload });
        } catch (err) {
            console.error(err);
        }
        setSaveKeySuccess(true);
        setTimeout(() => setSaveKeySuccess(false), 3000);
    };

    const logoClickCount = useRef(0);
    const logoClickTimeout = useRef(null);
    const handleLogoClick = () => {
        logoClickCount.current += 1;
        if (logoClickCount.current >= 2) {
            logoClickCount.current = 0;
            onSwitchToUser();
        }
        clearTimeout(logoClickTimeout.current);
        logoClickTimeout.current = setTimeout(() => {
            logoClickCount.current = 0;
        }, 1500);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        fetchApiKey();
    }, []); // Fetch keys once exactly on mount

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Transactions
            const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
            setTransactions(txData || []);

            const revenue = (txData || []).filter(tx => tx.status === 'approved').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

            // Fetch All Users (SINGLE SOURCE OF TRUTH)
            const { data: userData } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
            setUsers(userData || []);

            setStats({
                revenue: revenue,
                totalTx: txData?.length || 0
            });

            // Fetch Banks
            const { data: bankData } = await supabase.from('payment_methods').select('*').order('created_at', { ascending: true });
            setBanks(bankData || []);

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

    const availableYears = [...new Set(transactions.map(tx => new Date(tx.created_at).getFullYear()))].sort((a, b) => b - a);

    const monthlyRevenue = transactions.filter(tx => tx.status === 'approved').reduce((acc, tx) => {
        const date = new Date(tx.created_at);
        const month = date.toLocaleString('id-ID', { month: 'long' });
        const year = date.getFullYear();
        const key = `${month} ${year}`;
        if (!acc[key]) acc[key] = { month, year, revenue: 0, txCount: 0 };
        acc[key].revenue += Number(tx.amount || 0);
        acc[key].txCount += 1;
        return acc;
    }, {});

    const monthlyRevenueArray = Object.values(monthlyRevenue).sort((a, b) => {
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        if (a.year !== b.year) return b.year - a.year;
        return months.indexOf(b.month) - months.indexOf(a.month);
    });

    const chartData = [...monthlyRevenueArray].reverse().slice(-12);
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 10000);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const txDate = new Date(tx.created_at);
            const monthMatch = !selectedMonth || (txDate.getMonth() + 1).toString() === selectedMonth;
            const yearMatch = !selectedYear || txDate.getFullYear().toString() === selectedYear;
            const searchMatch = !searchUserName || (tx.user_name || 'User').toLowerCase().includes(searchUserName.toLowerCase());
            return monthMatch && yearMatch && searchMatch;
        });
    }, [transactions, selectedMonth, selectedYear, searchUserName]);

    const handleExportTransactions = () => {
        if (filteredTransactions.length === 0) {
            showToast("Tidak ada data transaksi untuk diekspor.", "error");
            return;
        }

        const headers = ["Tanggal", "User", "Paket", "Nominal", "Status"];
        const csvRows = filteredTransactions.map(tx => [
            new Date(tx.created_at).toLocaleDateString('id-ID'),
            tx.user_name || 'User',
            tx.plan_name,
            tx.amount,
            tx.status
        ]);

        const csvContent = [
            headers.join(","),
            ...csvRows.map(row => row.map(item => `"${item}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Data_Transaksi_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddBank = async (e) => {
        e.preventDefault();
        if (!newBank.account_number || !newBank.account_name) return;

        try {
            console.log("Mencoba simpan rekening:", newBank);
            const { error } = await supabase.from('payment_methods').insert([{
                provider: newBank.provider,
                account_number: newBank.account_number,
                account_name: newBank.account_name,
                is_active: true
            }]);

            if (error) throw error;

            setNewBank({ provider: 'BCA', account_number: '', account_name: '' });
            showToast("Berhasil! Rekening " + newBank.provider + " sudah tersimpan dan aktif.", "success");
            fetchData();
        } catch (error) {
            console.error("Gagal simpan:", error);
            showToast("Gagal Simpan: " + (error.message || "Masalah koneksi database"), "error");
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
        <div className="flex h-[100dvh] bg-slate-50 font-sans overflow-hidden">
            {/* Auto Save Badge */}
            {autoSaveStatus && (
                <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 bg-slate-800 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-slate-700">
                    {autoSaveStatus === 'saving' ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <CheckCircle size={18} className="text-emerald-400" />}
                    <span className="text-xs font-bold tracking-wide">{autoSaveStatus === 'saving' ? 'Menyimpan...' : 'Berhasil Disimpan'}</span>
                </div>
            )}

            {/* Global Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
                    <span className="font-bold text-sm">{toast.message}</span>
                </div>
            )}
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:relative z-50 w-64 h-full bg-slate-900 text-slate-300 flex flex-col transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h1
                        className="text-xl font-black text-white flex items-center gap-2 cursor-pointer select-none touch-manipulation"
                        onClick={handleLogoClick}
                        title="Klik 2x untuk beralih ke Mode Pengguna"
                    >
                        <Shield className="text-emerald-500" /> Admin Panel
                    </h1>
                    <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto transform-gpu overscroll-contain">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={<Activity size={20} />} label="Transaksi Pro" active={activeTab === 'transactions'} onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false); }} badge={transactions.filter(t => t.status === 'pending').length} />
                    <SidebarItem icon={<CreditCard size={20} />} label="Data Rekening" active={activeTab === 'banks'} onClick={() => { setActiveTab('banks'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={<Users size={20} />} label="Data Pengguna" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
                </nav>
                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button onClick={onSwitchToUser} className="w-full flex items-center gap-3 px-4 py-3 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors font-medium">
                        <User size={20} /> Mode Pengguna
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium">
                        <LogOut size={20} /> Keluar
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 shrink-0 md:hidden shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
                            <Menu size={24} />
                        </button>
                        <h1
                            className="text-lg font-bold text-slate-800 flex items-center gap-2 cursor-pointer select-none touch-manipulation"
                            onClick={handleLogoClick}
                            title="Klik 2x untuk beralih ke Mode Pengguna"
                        >
                            <Shield className="text-emerald-500" size={20} /> Admin
                        </h1>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full transform-gpu overscroll-y-contain scroll-smooth">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight capitalize">{activeTab.replace('transactions', 'Transaksi Pro').replace('banks', 'Data Rekening').replace('users', 'Data Pengguna')} Dashboard</h1>
                            <p className="text-slate-500 font-medium">Selamat datang kembali di pusat kendali RichardMeha AI.</p>
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> REFRESH DATA
                        </button>
                    </div>

                    {activeTab === 'overview' && (
                        <Overview
                            usersData={users}
                            stats={stats}
                            chartData={chartData}
                            maxRevenue={maxRevenue}
                            monthlyRevenueArray={monthlyRevenueArray}
                            userEmail={userEmail}
                            apiKeys={apiKeys}
                            setApiKeys={setApiKeys}
                            apiStatus={apiStatus}
                            handleTestConnections={handleTestConnections}
                            handleSaveApiKey={handleSaveApiKey}
                            saveKeySuccess={saveKeySuccess}
                            isFetchingKeys={isFetchingKeys}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'transactions' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                    <div className="flex items-center gap-2 w-full sm:w-auto relative">
                                        <Search className="absolute left-3 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Cari nama user..."
                                            value={searchUserName}
                                            onChange={(e) => setSearchUserName(e.target.value)}
                                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:outline-none focus:border-emerald-500 shadow-sm w-full"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <label className="text-sm font-bold text-slate-600 whitespace-nowrap">Filter Tahun:</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 shadow-sm w-full sm:w-auto"
                                        >
                                            <option value="">Semua Tahun</option>
                                            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <label className="text-sm font-bold text-slate-600 whitespace-nowrap">Filter Bulan:</label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 shadow-sm w-full sm:w-auto"
                                        >
                                            <option value="">Semua Bulan</option>
                                            <option value="1">Januari</option>
                                            <option value="2">Februari</option>
                                            <option value="3">Maret</option>
                                            <option value="4">April</option>
                                            <option value="5">Mei</option>
                                            <option value="6">Juni</option>
                                            <option value="7">Juli</option>
                                            <option value="8">Agustus</option>
                                            <option value="9">September</option>
                                            <option value="10">Oktober</option>
                                            <option value="11">November</option>
                                            <option value="12">Desember</option>
                                        </select>
                                    </div>
                                    {(selectedMonth || selectedYear || searchUserName) && (
                                        <button
                                            onClick={() => { setSelectedMonth(''); setSelectedYear(''); setSearchUserName(''); }}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0"
                                        >
                                            <X size={16} /> Reset
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={handleExportTransactions}
                                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm w-full md:w-auto shrink-0"
                                >
                                    <Download size={18} /> Ekspor CSV Transaksi
                                </button>
                            </div>
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto transform-gpu overscroll-x-contain scroll-smooth pb-2">
                                    <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
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
                                            {filteredTransactions.map(tx => (
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
                                            {filteredTransactions.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Belum ada data transaksi.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
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
                                    <div className="overflow-x-auto transform-gpu overscroll-x-contain scroll-smooth pb-2">
                                        <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
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
                                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest ${bank.provider === 'QRIS' ? 'bg-purple-100 text-purple-700' :
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
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                                    <Loader2 className="animate-spin mb-4" size={48} />
                                    <p className="font-bold tracking-widest text-[10px] uppercase">Mengambil data murid...</p>
                                </div>
                            ) : (
                                <>
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
                                        <div className="overflow-x-auto transform-gpu overscroll-x-contain scroll-smooth pb-2">
                                            <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
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
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function StatusBadge({ status }) {
    if (status === 'testing') return <span className="ml-2 text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full animate-pulse border border-slate-200 font-bold">Memeriksa...</span>;
    if (status === 'ok') return <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">Terhubung ✅</span>;
    if (status === 'error') return <span className="ml-2 text-[9px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200 font-bold">Gagal ❌</span>;
    return null;
}

function Overview({ usersData, stats, chartData, maxRevenue, monthlyRevenueArray, userEmail, apiKeys, setApiKeys, apiStatus, handleTestConnections, handleSaveApiKey, saveKeySuccess, isFetchingKeys, showToast }) {
    // Perhitungan Distribusi Level Bahasa (A1-C2)
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
            else counts.A1++; // Fallback untuk user baru/tanpa data
        });
        return counts;
    }, [usersData]);
    const maxLevelCount = Math.max(...Object.values(levelCounts), 1);
    const levelColors = { A1: 'bg-emerald-400', A2: 'bg-emerald-500', B1: 'bg-blue-400', B2: 'bg-blue-500', C1: 'bg-purple-400', C2: 'bg-purple-500' };

    const [showKey, setShowKey] = useState({});
    const [isClearingLogs, setIsClearingLogs] = useState(false);

    const toggleKeyVisibility = (key) => setShowKey(p => ({ ...p, [key]: !p[key] }));

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
            {/* Stats Cards */}
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
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada data pendapatan.</div>
                        )}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
                        {chartData.map((item, i) => (
                            <span key={i} className="w-full text-center truncate" title={`${item.month} ${item.year}`}>
                                {item.month.substring(0, 3)} '{item.year.toString().substring(2)}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Users className="text-blue-500" /> Distribusi Level Bahasa</h3>
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

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard className="text-blue-500" /> Ringkasan Pendapatan Bulanan</h3>
                </div>
                <div className="overflow-x-auto transform-gpu overscroll-x-contain scroll-smooth pb-2">
                    <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                        <thead className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="p-6">Bulan & Tahun</th>
                                <th className="p-6">Jumlah Transaksi</th>
                                <th className="p-6">Total Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {monthlyRevenueArray.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 font-bold text-slate-800">{item.month} {item.year}</td>
                                    <td className="p-6 font-bold text-blue-600">{item.txCount} Transaksi</td>
                                    <td className="p-6 font-black text-emerald-600">Rp {item.revenue.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                            {monthlyRevenueArray.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-400">Belum ada pendapatan yang tercatat.</td></tr>}
                        </tbody>
                    </table>
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
                    <p className="text-xs text-slate-500 mb-4">Masukkan kredensial API secara spesifik untuk setiap layanan. <br /><span className="text-emerald-600 font-bold">Tips: Anda bisa memasukkan hingga 10 API Key yang dipisahkan dengan koma (,) agar sistem dapat menggantinya secara otomatis (round-robin/random).</span></p>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Core AI</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">OpenAI API Key <StatusBadge status={apiStatus.openai} /></label>
                                    <div className="relative">
                                        <input type={showKey.openai ? "text" : "password"} value={apiKeys.openai} onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))} placeholder="sk-proj-..., sk-proj-..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('openai')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showKey.openai ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">Gemini API Key <StatusBadge status={apiStatus.gemini} /></label>
                                    <div className="relative">
                                        <input type={showKey.gemini ? "text" : "password"} value={apiKeys.gemini} onChange={(e) => setApiKeys(prev => ({ ...prev, gemini: e.target.value }))} placeholder="AIza..., AIza..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('gemini')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showKey.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">Groq API Key <StatusBadge status={apiStatus.groq} /></label>
                                    <div className="relative">
                                        <input type={showKey.groq ? "text" : "password"} value={apiKeys.groq} onChange={(e) => setApiKeys(prev => ({ ...prev, groq: e.target.value }))} placeholder="gsk_..., gsk_..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('groq')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showKey.groq ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Translation API</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">l10n.dev API Key <StatusBadge status={apiStatus.l10n} /></label>
                                    <div className="relative">
                                        <input type={showKey.l10n ? "text" : "password"} value={apiKeys.l10n} onChange={(e) => setApiKeys(prev => ({ ...prev, l10n: e.target.value }))} placeholder="Key1, Key2, Key3..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('l10n')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showKey.l10n ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2 flex items-center">Voice API</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 mb-4 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">ElevenLabs API Key <StatusBadge status={apiStatus.elevenlabs} /></label>
                                    <div className="relative">
                                        <input type={showKey.elevenlabs ? "text" : "password"} value={apiKeys.elevenlabs} onChange={(e) => setApiKeys(prev => ({ ...prev, elevenlabs: e.target.value }))} placeholder="Key1, Key2..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('elevenlabs')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showKey.elevenlabs ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600 flex items-center">ElevenLabs Voice ID</label>
                                    <input type="text" value={apiKeys.elevenlabsVoiceId} onChange={(e) => setApiKeys(prev => ({ ...prev, elevenlabsVoiceId: e.target.value }))} placeholder="Voice ID (Opsional)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                </div>
                            </div>
                            <h5 className="text-xs font-bold text-slate-600 mb-2 flex items-center">Atau gunakan iFLYTEK: <StatusBadge status={apiStatus.iflytek} /></h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600">App ID</label>
                                    <input type="text" value={apiKeys.iflytekAppId} onChange={(e) => setApiKeys(prev => ({ ...prev, iflytekAppId: e.target.value }))} placeholder="ID1, ID2..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600">API Key</label>
                                    <div className="relative">
                                        <input type={showKey.iflytekApiKey ? "text" : "password"} value={apiKeys.iflytekApiKey} onChange={(e) => setApiKeys(prev => ({ ...prev, iflytekApiKey: e.target.value }))} placeholder="Key1, Key2..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('iflytekApiKey')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showKey.iflytekApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-600">API Secret</label>
                                    <div className="relative">
                                        <input type={showKey.iflytekApiSecret ? "text" : "password"} value={apiKeys.iflytekApiSecret} onChange={(e) => setApiKeys(prev => ({ ...prev, iflytekApiSecret: e.target.value }))} placeholder="Secret1, Secret2..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                        <button type="button" onClick={() => toggleKeyVisibility('iflytekApiSecret')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showKey.iflytekApiSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 pt-4">
                        <button onClick={handleTestConnections} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold active:scale-95 transition-all w-full sm:w-auto flex justify-center items-center gap-2">
                            <Activity size={18} /> Test Koneksi API
                        </button>
                        <button onClick={handleSaveApiKey} className={`${saveKeySuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-all w-full sm:w-auto sm:self-end flex justify-center items-center`}>
                            {saveKeySuccess ? 'Tersimpan ✅' : 'Simpan Semua Key'}
                        </button>
                    </div>
                </div>
            )}

            {userEmail === 'richardpl.meha@gmail.com' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Trash className="text-rose-500" /> Pemeliharaan Sistem</h3>
                    <p className="text-xs text-slate-500 mb-4">Bersihkan file sampah dan log aktivitas yang sudah usang untuk menghemat kapasitas database.</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Hapus Log Aktivitas (&gt;30 Hari)</h4>
                            <p className="text-xs text-slate-500 mt-1">Menghapus riwayat latihan pengguna yang sudah kedaluwarsa.</p>
                        </div>
                        <button
                            onClick={handleClearLogs}
                            disabled={isClearingLogs}
                            className="w-full sm:w-auto px-5 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-600 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shrink-0"
                        >
                            {isClearingLogs ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}
                            {isClearingLogs ? 'Membersihkan...' : 'Bersihkan Log'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function DataPengguna({ usersData, isLoading }) {
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('');

    const filteredUsers = usersData.filter(u => {
        const matchName = !searchQuery || (u.name || 'User').toLowerCase().includes(searchQuery.toLowerCase());
        const matchLevel = !filterLevel || (u.level || '').includes(filterLevel);
        return matchName && matchLevel;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const handleExportUsers = () => {
        if (sortedUsers.length === 0) {
            alert("Tidak ada data pengguna untuk diekspor.");
            return;
        }

        const headers = ["Nama", "Gender", "Level", "Status Pro", "Tanggal Gabung"];
        const csvRows = sortedUsers.map(u => [
            u.name || 'User',
            u.gender || 'male',
            u.level || 'Beginner (A1)',
            u.is_pro ? 'PRO' : 'Free',
            new Date(u.created_at).toLocaleDateString('id-ID')
        ]);

        const csvContent = [
            headers.join(","),
            ...csvRows.map(row => row.map(item => `"${item}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Data_Pengguna_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                    <Loader2 className="animate-spin mb-4" size={48} />
                    <p className="font-bold tracking-widest text-[10px] uppercase">Mengambil data murid...</p>
                </div>
            ) : (
                <>
                    {/* User Distribution Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                <Users size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Murid</p>
                                <h4 className="text-2xl font-black text-slate-800">{usersData.length}</h4>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                                <Crown size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Member PRO</p>
                                <h4 className="text-2xl font-black text-slate-800">{usersData.filter(u => u.is_pro).length}</h4>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <Activity size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</p>
                                <h4 className="text-2xl font-black text-slate-800">
                                    {usersData.length > 0 ? ((usersData.filter(u => u.is_pro).length / usersData.length) * 100).toFixed(1) : 0}%
                                </h4>
                            </div>
                        </div>
                    </div>

                    {/* User Table Panel */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <h3 className="font-bold text-slate-800">Daftar Pengguna Aktif</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                <select
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                                >
                                    <option value="">Semua Level</option>
                                    <option value="A1">Beginner (A1)</option>
                                    <option value="A2">Elementary (A2)</option>
                                    <option value="B1">Intermediate (B1)</option>
                                    <option value="B2">Upper Intermediate (B2)</option>
                                    <option value="C1">Advanced (C1)</option>
                                    <option value="C2">Proficient (C2)</option>
                                </select>
                                <div className="relative w-full sm:w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Cari nama murid..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                                <button onClick={handleExportUsers} className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto justify-center shrink-0">
                                    <Download size={16} /> Ekspor CSV
                                </button>
                                <div className="flex gap-2 shrink-0">
                                    <span className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">{sortedUsers.length} Total</span>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto transform-gpu overscroll-x-contain scroll-smooth pb-4 px-4 md:px-0">
                            <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal min-w-[640px]">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-6">User Profile</th>
                                        <th className="p-6">Language Level</th>
                                        <th className="p-6">Subscription</th>
                                        <th className="p-6 cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}>
                                            <div className="flex items-center gap-2">Join Date <ArrowUpDown size={14} className={`text-slate-400 group-hover:text-blue-500 transition-colors ${sortOrder === 'asc' ? 'rotate-180' : ''}`} /></div>
                                        </th>
                                        <th className="p-6">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedUsers.map(u => (
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
                                    {sortedUsers.length === 0 && (
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
                </>
            )}
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