import React, { useState } from 'react';
import { APP_CATEGORIES } from '../aiPrompt.js'; // Sesuaikan path ini dengan lokasi file aiPrompt.js Anda
import {
    LayoutDashboard,
    Headphones,
    Mic,
    BookOpen,
    BookA,
    MessageSquare,
    Menu,
    X
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

export default function Sidebar({ currentRoute = '/home', onNavigate }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleNav = (route) => {
        if (onNavigate) {
            onNavigate(route);
        }
        setIsOpen(false); // Tutup sidebar di versi mobile setelah navigasi
    };

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 text-slate-700 active:scale-95 transition-all"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0f172a] text-white transform transition-transform duration-500 ease-in-out md:translate-x-0 flex flex-col border-r border-slate-800 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 md:pt-8 flex-1">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-10 tracking-tight">
                        Englishku AI
                    </h2>

                    <nav className="space-y-2.5">
                        {APP_CATEGORIES.map((category) => {
                            const Icon = IconMap[category.icon];
                            const isActive = currentRoute === category.route;

                            return (
                                <button
                                    key={category.id}
                                    onClick={() => handleNav(category.route)}
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
                </div>
            </div>

            {/* Backdrop/Overlay untuk Mobile */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
                />
            )}
        </>
    );
}