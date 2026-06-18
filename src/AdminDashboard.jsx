import { useState, useEffect, useCallback } from 'react';
import { LogOut, Users, RefreshCw, UserCheck, LayoutDashboard, CreditCard, Activity, Shield } from 'lucide-react';
import { supabase } from './supabaseClient';
import AdminOverview from './AdminOverview';
import AdminTransactions from './AdminTransactions';
import AdminBanks from './AdminBanks';
import AdminUsers from './AdminUsers';
import { apiFetch } from './apiClient';
export default function AdminDashboard({ onLogout, onSwitchToUser, userEmail }) {
    const [users, setUsers] = useState([]);
    const [, setTotalMurid] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('overview');

    const [transactions, setTransactions] = useState([]);
    const [banks, setBanks] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, totalTx: 0 });
    const [chartData, setChartData] = useState([]);
    const [maxRevenue, setMaxRevenue] = useState(0);

    const [apiKeys, setApiKeys] = useState({
        openai: '', gemini: '', groq: '', l10n: '', elevenlabs: '', elevenlabsVoiceId: '', iflytekAppId: '', iflytekApiKey: '', iflytekApiSecret: ''
    });
    const [apiStatus, setApiStatus] = useState({
        openai: 'idle', gemini: 'idle', groq: 'idle', l10n: 'idle', elevenlabs: 'idle', elevenlabsVoiceId: 'idle', iflytek: 'idle'
    });
    const [apiMessages, setApiMessages] = useState({
        openai: '', gemini: '', groq: '', l10n: '', elevenlabs: ''
    });
    const [isFetchingKeys, setIsFetchingKeys] = useState(false);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [saveKeySuccess, setSaveKeySuccess] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Users
            const { data: usersData } = await supabase.from('user_profiles').select('*');
            if (usersData) {
                setUsers(usersData);
                setTotalMurid(usersData.length);
            }

            // Transactions
            const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
            if (txData) {
                setTransactions(txData);
                const approvedTx = txData.filter(tx => tx.status === 'approved');
                const revenue = approvedTx.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
                setStats({ revenue, totalTx: txData.length });

                const monthlyData = {};
                approvedTx.forEach(tx => {
                    const date = new Date(tx.created_at);
                    const monthYear = `${date.toLocaleString('id-ID', { month: 'short' })} ${date.getFullYear()}`;
                    monthlyData[monthYear] = (monthlyData[monthYear] || 0) + (Number(tx.amount) || 0);
                });
                const chartArr = Object.keys(monthlyData).map(k => ({
                    month: k.split(' ')[0],
                    year: k.split(' ')[1],
                    revenue: monthlyData[k]
                })).slice(0, 6).reverse();
                setChartData(chartArr);
                setMaxRevenue(Math.max(...chartArr.map(d => d.revenue), 1));
            }

            // Banks
            const { data: bankData } = await supabase.from('payment_methods').select('*');
            if (bankData) setBanks(bankData);

            setIsFetchingKeys(false);

        } catch (err) {
            console.error(err);
            showToast("Gagal mengambil data", "error");
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSaveApiKey = async () => {
        setIsSavingKey(true);
        try {
            setSaveKeySuccess(true);
            showToast("Kredensial sekarang dikelola dari environment backend (.env server).", "info");
            setTimeout(() => setSaveKeySuccess(false), 2000);
        } catch (e) {
            showToast("Gagal memproses konfigurasi.", "error");
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleTestConnections = async () => {
        const updateStatus = (key, status, msg = '') => {
            setApiStatus(prev => ({ ...prev, [key]: status }));
            setApiMessages(prev => ({ ...prev, [key]: msg }));
        };
        
        setApiStatus(prev => ({ ...prev, openai: 'testing', gemini: 'testing', groq: 'testing', l10n: 'testing', elevenlabs: 'testing' }));
        setApiMessages({ openai: '', gemini: '', groq: '', l10n: '', elevenlabs: '' });

        const testChat = async () => {
            try {
                await apiFetch('/api/chat', {
                    method: 'POST',
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: 'Reply with OK.' }] }],
                        generationConfig: { maxOutputTokens: 16 }
                    })
                });
                updateStatus('gemini', 'ok', 'Backend AI gateway terhubung.');
                updateStatus('groq', 'ok', 'Fallback provider dikelola server bila tersedia.');
                updateStatus('openai', 'ok', 'Fallback provider dikelola server bila tersedia.');
            } catch (e) {
                updateStatus('gemini', 'error', e.message);
                updateStatus('groq', 'idle', 'Tidak dites langsung dari browser.');
                updateStatus('openai', 'idle', 'Tidak dites langsung dari browser.');
            }
        };

        const testL10n = async () => {
            try {
                await apiFetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: 'Hello', targetLanguage: 'id' }) });
                updateStatus('l10n', 'ok', 'Backend translation gateway terhubung.');
            } catch (e) { updateStatus('l10n', 'error', e.message); }
        };

        const testElevenLabs = async () => {
            try {
                await apiFetch('/api/tts', { method: 'POST', body: JSON.stringify({ text: 'OK' }) });
                updateStatus('elevenlabs', 'ok', 'Backend TTS gateway terhubung.');
            } catch (e) { updateStatus('elevenlabs', 'error', e.message); }
        };

        await Promise.all([testChat(), testL10n(), testElevenLabs()]);
        showToast("Proses test koneksi selesai dijalankan.", "info");
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
            {/* Sidebar Admin Panel */}
            <aside className="w-[280px] bg-[#0A0F1C] flex flex-col shrink-0 overflow-y-auto custom-scrollbar border-r border-slate-800/50">
                <div className="p-6 mb-4">
                    <h1 className="text-xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-emerald-500" size={24} />
                        Admin Panel
                    </h1>
                </div>

                <div className="px-4 py-2 flex-1">
                    <nav className="space-y-1.5">
                        <button onClick={() => setActiveMenu('overview')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all ${activeMenu === 'overview' ? 'bg-[#059669] text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                            <LayoutDashboard size={20} /> <span className="text-[15px]">Overview</span>
                        </button>
                        <button onClick={() => setActiveMenu('transactions')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all ${activeMenu === 'transactions' ? 'bg-[#059669] text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                            <Activity size={20} /> <span className="text-[15px]">Transaksi Pro</span>
                        </button>
                        <button onClick={() => setActiveMenu('rekening')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all ${activeMenu === 'rekening' ? 'bg-[#059669] text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                            <CreditCard size={20} /> <span className="text-[15px]">Data Rekening</span>
                        </button>
                        <button onClick={() => setActiveMenu('users')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all ${activeMenu === 'users' ? 'bg-[#059669] text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                            <Users size={20} /> <span className="text-[15px]">Data Pengguna</span>
                        </button>
                    </nav>
                </div>

                <div className="mt-auto px-4 py-6 border-t border-slate-800/50 space-y-1.5">
                    <button onClick={onSwitchToUser} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all">
                        <UserCheck size={20} /> <span className="text-[15px]">Mode Pengguna</span>
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-rose-500 hover:bg-rose-500/10 transition-all">
                        <LogOut size={20} /> <span className="text-[15px]">Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main Layout */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F8FAFC]">
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar">
                    
                    {/* Header Layout Matches Old Design */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-[32px] font-black text-[#1E293B] tracking-tight leading-tight">
                                {activeMenu === 'overview' && 'Overview Dashboard'}
                                {activeMenu === 'transactions' && 'Transaksi Pro'}
                                {activeMenu === 'rekening' && 'Data Rekening'}
                                {activeMenu === 'users' && 'Data Pengguna'}
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">
                                {activeMenu === 'overview' && 'Selamat datang kembali di pusat kendali RichardMeha AI.'}
                                {activeMenu === 'transactions' && 'Kelola dan setujui semua pembayaran dari user.'}
                                {activeMenu === 'rekening' && 'Daftar rekening bank untuk menerima pembayaran.'}
                                {activeMenu === 'users' && 'Manajemen semua murid yang terdaftar di aplikasi.'}
                            </p>
                        </div>
                        <button onClick={fetchAllData} disabled={isLoading} className="bg-white border border-slate-200 text-slate-600 font-bold px-5 py-3 rounded-xl flex items-center gap-2.5 shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 shrink-0">
                            <RefreshCw size={14} className={isLoading ? "animate-spin text-slate-400" : "text-slate-400"} /> REFRESH DATA
                        </button>
                    </div>

                    {activeMenu === 'overview' && <AdminOverview usersData={users} stats={stats} chartData={chartData} maxRevenue={maxRevenue} monthlyRevenueArray={[]} userEmail={userEmail} apiKeys={apiKeys} setApiKeys={setApiKeys} apiStatus={apiStatus} apiMessages={apiMessages} handleTestConnections={handleTestConnections} handleSaveApiKey={handleSaveApiKey} saveKeySuccess={saveKeySuccess} isSavingKey={isSavingKey} isFetchingKeys={isFetchingKeys} showToast={showToast} />}
                    {activeMenu === 'transactions' && <AdminTransactions transactions={transactions} fetchData={fetchAllData} showToast={showToast} />}
                    {activeMenu === 'rekening' && <AdminBanks banks={banks} fetchData={fetchAllData} showToast={showToast} />}
                    {activeMenu === 'users' && <AdminUsers users={users} isLoading={isLoading} showToast={showToast} />}
                </div>

                {/* Toast Notification */}
                {toast.show && (
                    <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl text-white font-bold shadow-lg z-50 animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`}>
                        {toast.message}
                    </div>
                )}
            </main>
        </div>
    );
}
