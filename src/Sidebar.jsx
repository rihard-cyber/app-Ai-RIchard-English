import React from 'react';
import { APP_CATEGORIES } from '../aiPrompt.js'; // Sesuaikan path ini dengan lokasi file aiPrompt.js Anda
import {
    LayoutDashboard,
    Headphones,
    Mic,
    BookOpen,
    BookA,
    MessageSquare,
    Settings,
    Shield,
    LogOut
} from 'lucide-react';

// Mapping string icon dari konfigurasi ke komponen Lucide
const IconMap = {
    LayoutDashboard,
    Headphones,
    Mic,
    BookOpen,
    BookA,
    MessageSquare
};

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
            // Hapus slash '/' bawaan dari konfigurasi CSV agar routing cocok
            onNavigate(route.replace('/', ''));
        }
        if (setIsOpen) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0f172a] text-white transform transition-transform duration-500 ease-in-out md:translate-x-0 flex flex-col border-r border-slate-800 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 md:pt-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-10 tracking-tight">
                        Englishku AI
                    </h2>

                    <div className="flex-1 flex flex-col gap-6">
                        <nav className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-3">Menu Utama</p>
                            {APP_CATEGORIES.map((category) => {
                                const Icon = IconMap[category.icon];
                                const rawRoute = category.route.replace('/', '');
                                const isActive = currentRoute === rawRoute;

                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => handleNav(rawRoute)}
                                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                            }`}
                                    >
                                        {Icon && <Icon size={20} className={isActive ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'} />}
                                        <span className="font-bold tracking-wide text-sm">{category.title}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        <nav className="space-y-2 border-t border-slate-800 pt-6">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-3">Sistem & Akun</p>
                            <button
                                onClick={() => handleNav('settings')}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${currentRoute === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                            >
                                <Settings size={20} className={currentRoute === 'settings' ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'} />
                                <span className="font-bold tracking-wide text-sm">Pengaturan</span>
                            </button>
                            {userProfile?.is_admin && (
                                <button onClick={onAdminClick} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300">
                                    <Shield size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-bold tracking-wide text-sm">Konfigurasi AI</span>
                                </button>
                            )}
                            <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-rose-400 hover:bg-rose-900/20 hover:text-rose-300">
                                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold tracking-wide text-sm">Keluar (Log Out)</span>
                            </button>
                        </nav>
                    </div>
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