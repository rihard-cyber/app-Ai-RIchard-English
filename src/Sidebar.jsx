import React from 'react';
import {
    LayoutDashboard,
    Headphones,
    Mic,
    BookOpen,
    MessageSquare,
    Settings,
    Shield,
    LogOut,
    Sparkles,
    Trophy,
    BarChart2,
    GraduationCap,
    Zap,
    PenTool
} from 'lucide-react';

export default function Sidebar({
    currentRoute = 'home',
    onNavigate,
    isOpen = false,
    setIsOpen,
    userProfile,
    onLogout,
    onAdminClick
}) {
    const handleNav = (route) => {
        if (onNavigate) {
            onNavigate(route);
        }
        if (setIsOpen) {
            setIsOpen(false);
        }
    };

    return (
        <>
            <div
                className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-gradient-to-b from-[#0A0F1C] to-[#0D1321] text-white transform transition-transform duration-500 ease-in-out md:translate-x-0 flex flex-col shrink-0 overflow-y-auto custom-scrollbar border-r border-white/5 ${isOpen ? 'translate-x-0 shadow-2xl shadow-slate-900/50' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
                            <Sparkles className="text-white" size={16} />
                        </div>
                        RichardMeha <span className="text-blue-500">AI</span>
                    </h1>
                </div>

                <div className="px-5 pt-5 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/30 shrink-0">
                            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <p className="text-[14px] font-bold text-white leading-tight truncate">{userProfile?.name || 'Richard Meha'}</p>
                            <p className="text-[10px] text-blue-400 flex items-center gap-1 font-bold mt-0.5">
                                <Trophy size={10} /> {userProfile?.level || 'Beginner (A1)'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-4">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-2">Menu Utama</p>
                    <nav className="space-y-0.5">
                        <button onClick={() => handleNav('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'home' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <div className={`w-6 h-6 flex items-center justify-center ${currentRoute === 'home' ? '' : ''}`}><LayoutDashboard size={18} /></div> Dasbor Belajar
                        </button>
                        <button onClick={() => handleNav('progress')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'progress' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <div className={`w-6 h-6 flex items-center justify-center`}><BarChart2 size={18} /></div> Statistik Progres
                        </button>
                    </nav>
                </div>

                <div className="px-4 py-3">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-2">Modul Pembelajaran</p>
                    <nav className="space-y-0.5">
                        <button onClick={() => handleNav('assessment')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'assessment' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <GraduationCap size={18} /> Test CEFR
                        </button>
                        <button onClick={() => handleNav('vocabulary')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'vocabulary' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <BookOpen size={18} /> Vocabulary
                        </button>
                        <button onClick={() => handleNav('call_tutor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'call_tutor' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <Headphones size={18} /> Call Tutor
                        </button>
                        <button onClick={() => handleNav('conversation')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'conversation' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <MessageSquare size={18} /> Chat Tutor
                        </button>
                        <button onClick={() => handleNav('quiz')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'quiz' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <Zap size={18} /> Quiz & Challenge
                        </button>
                    </nav>
                </div>

                <div className="px-4 py-3">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-2">Praktek & Analisa</p>
                    <nav className="space-y-0.5">
                        <button onClick={() => handleNav('speaking')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'speaking' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <Mic size={18} /> Speaking Coach
                        </button>
                        <button onClick={() => handleNav('writing_analyzer')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'writing_analyzer' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <PenTool size={18} /> Writing Analyzer
                        </button>
                        <button onClick={() => handleNav('grammar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'grammar' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <GraduationCap size={18} /> Grammar
                        </button>
                    </nav>
                </div>

                <div className="mt-auto px-4 py-5 border-t border-white/5">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-2">Akun</p>
                    <nav className="space-y-0.5">
                        <button onClick={() => handleNav('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentRoute === 'settings' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <Settings size={18} /> Pengaturan
                        </button>
                        {userProfile?.is_admin && (
                            <button onClick={onAdminClick} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300">
                                <Shield size={18} /> Konfigurasi AI
                            </button>
                        )}
                        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-rose-400 hover:bg-rose-500/10 mt-1">
                            <LogOut size={18} /> Log Out
                        </button>
                    </nav>
                </div>
            </div>

            {/* Backdrop/Overlay untuk Mobile */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen && setIsOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
                />
            )}
        </>
    );
}