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
            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-[#0A0F1C] text-white transform transition-transform duration-500 ease-in-out md:translate-x-0 flex flex-col shrink-0 overflow-y-auto custom-scrollbar ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                    }`}
            >
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-blue-500" size={24} />
                        RichardMeha <span className="text-blue-600">AI</span>
                    </h1>
                </div>

                <div className="px-6 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0">
                            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[15px] font-bold text-white leading-tight">{userProfile?.name || 'Richard Patung Landu Meha'}</p>
                            <p className="text-xs text-blue-500 flex items-center gap-1 font-bold mt-1">
                                <Trophy size={12} /> {userProfile?.level || 'Beginner (A1)'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Menu Utama</p>
                    <nav className="space-y-1">
                        <button onClick={() => handleNav('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'home' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <LayoutDashboard size={20} /> Dasbor Belajar
                        </button>
                        <button onClick={() => handleNav('progress')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'progress' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <BarChart2 size={20} /> Statistik Progres
                        </button>
                    </nav>
                </div>

                <div className="px-6 py-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Modul Pembelajaran</p>
                    <nav className="space-y-1">
                        <button onClick={() => handleNav('assessment')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'assessment' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <GraduationCap size={20} /> Test CEFR (Awal)
                        </button>
                        <button onClick={() => handleNav('vocabulary')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'vocabulary' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <BookOpen size={20} /> Belajar (Vocab)
                        </button>
                        <button onClick={() => handleNav('call_tutor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'call_tutor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <Headphones size={20} /> Call Tutor
                        </button>
                        <button onClick={() => handleNav('conversation')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'conversation' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <MessageSquare size={20} /> Chat Tutor
                        </button>
                        <button onClick={() => handleNav('quiz')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'quiz' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <Zap size={20} /> Quiz & Challenge
                        </button>
                    </nav>
                </div>

                <div className="px-6 py-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Praktek & Analisa</p>
                    <nav className="space-y-1">
                        <button onClick={() => handleNav('speaking')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'speaking' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <Mic size={20} /> Speaking Coach
                        </button>
                        <button onClick={() => handleNav('writing_analyzer')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'writing_analyzer' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <PenTool size={20} /> Writing Analyzer
                        </button>
                        <button onClick={() => handleNav('grammar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'grammar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <GraduationCap size={20} /> Grammar Speaking
                        </button>
                    </nav>
                </div>

                <div className="mt-auto px-6 py-6 pb-8 space-y-2 border-t border-slate-800">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Akun</p>
                    <nav className="space-y-1">
                        <button onClick={() => handleNav('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentRoute === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            <Settings size={20} /> Pengaturan
                        </button>
                        {userProfile?.is_admin && (
                            <button onClick={onAdminClick} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300">
                                <Shield size={20} /> Konfigurasi AI
                            </button>
                        )}
                        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-rose-400 hover:bg-rose-500/10">
                            <LogOut size={20} /> Log Out
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