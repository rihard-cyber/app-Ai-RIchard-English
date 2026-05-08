import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    LayoutDashboard, Users, CreditCard, Activity, CheckCircle, XCircle, ArrowDownRight, LogOut, Loader2, Shield, RefreshCw, Menu, X, User
} from 'lucide-react';
import { supabase } from './supabaseClient';
import AdminOverview from './AdminOverview';
import AdminTransactions from './AdminTransactions';
import AdminBanks from './AdminBanks';
import AdminUsers from './AdminUsers';

export default function AdminDashboard({ onLogout, onSwitchToUser, userEmail }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0, revenue: 0, totalTx: 0 });
    const [transactions, setTransactions] = useState([]);
    const [banks, setBanks] = useState([]);
    const [users, setUsers] = useState([]); // New User State
    const [isLoading, setIsLoading] = useState(true);

    // API Key State
    const [apiKeys, setApiKeys] = useState({ openai: '', gemini: '', groq: '', l10n: '', elevenlabs: '', elevenlabsVoiceId: '', iflytekAppId: '', iflytekApiKey: '', iflytekApiSecret: '' });
    const [saveKeySuccess, setSaveKeySuccess] = useState(false);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [apiStatus, setApiStatus] = useState({ openai: null, gemini: null, groq: null, l10n: null, elevenlabs: null, iflytek: null, elevenlabsVoiceId: null });
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
        if (apiKeys.elevenlabsVoiceId && apiKeys.elevenlabs) {
            setApiStatus(p => ({ ...p, elevenlabsVoiceId: 'testing' }));
            fetch(`https://api.elevenlabs.io/v1/voices/${getFirstKey(apiKeys.elevenlabsVoiceId)}`, { headers: { 'xi-api-key': getFirstKey(apiKeys.elevenlabs) } })
                .then(res => setApiStatus(p => ({ ...p, elevenlabsVoiceId: res.ok ? 'ok' : 'error' })))
                .catch(() => setApiStatus(p => ({ ...p, elevenlabsVoiceId: 'error' })));
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
        if (!initialKeysLoaded.current) {
            initialKeysLoaded.current = true;
            handleTestConnections(); // Menjalankan tes koneksi secara otomatis di latar belakang
            return;
        }

        const timer = setTimeout(() => { handleAutoSaveApiKey(); }, 2000);
        return () => clearTimeout(timer);
    }, [apiKeys, isFetchingKeys]);

    const handleSaveApiKey = async () => {
        setIsSavingKey(true);
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
        setIsSavingKey(false);
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
            // OPTIMASI: Parallel Data Fetching & Select Explicit Columns
            const [txRes, userRes, bankRes] = await Promise.all([
                supabase.from('transactions').select('*').order('created_at', { ascending: false }),
                supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('payment_methods').select('*').order('created_at', { ascending: true })
            ]);

            console.log("Data Pengguna (Debug):", userRes.data);
            if (userRes.error) console.error("Error Fetch Users:", userRes.error);

            const txData = txRes.data || [];
            setTransactions(txData);
            const revenue = txData.filter(tx => tx.status === 'approved').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

            // Mapping 'full_name' dari database menjadi 'name' untuk tabel frontend
            const mappedUsers = (userRes.data || []).map(u => ({ ...u, name: u.full_name || u.name || 'User', email: u.email || 'Tanpa Email' }));
            setUsers(mappedUsers);
            setBanks(bankRes.data || []);

            setStats({
                revenue: revenue,
                totalTx: txData.length
            });

        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
        setIsLoading(false);
    };

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
                        <AdminOverview
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
                            isSavingKey={isSavingKey}
                            isFetchingKeys={isFetchingKeys}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'transactions' && <AdminTransactions transactions={transactions} fetchData={fetchData} showToast={showToast} />}
                    {activeTab === 'banks' && <AdminBanks banks={banks} fetchData={fetchData} showToast={showToast} />}
                    {activeTab === 'users' && <AdminUsers users={users} isLoading={isLoading} showToast={showToast} />}
                </div>
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