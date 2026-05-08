import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Loader2, Users, UserPlus, Share2, Medal } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function Leaderboard({ userProfile, onNavigate }) {
    const [leaders, setLeaders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('all-time'); // 'all-time' / 'weekly'
    const [selectedUser, setSelectedUser] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, [period]);

    // Deteksi jika user saat ini adalah Rank 1, lalu picu Confetti
    useEffect(() => {
        if (leaders.length > 0 && userProfile?.id && leaders[0].id === userProfile.id) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [leaders, userProfile]);

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            // Catatan: Jika ingin leaderboard mingguan murni, dibutuhkan tabel/kolom mingguan khusus. 
            // Untuk versi MVP ini, kita menggunakan total XP dari tabel user_profiles sebagai tolak ukur Global.
            const { data, error } = await supabase
                .from('user_profiles')
                .select('id, full_name, level, xp, gender')
                .order('xp', { ascending: false })
                .limit(10);

            if (error) throw error;
            setLeaders(data || []);
        } catch (err) {
            console.error("Gagal mengambil data leaderboard", err);
        } finally {
            setIsLoading(false);
        }
    };

    const top3 = leaders.slice(0, 3);
    const rest = leaders.slice(3);

    return (
        <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[calc(24px+env(safe-area-inset-bottom))] overflow-x-hidden">

            {/* Confetti Animation for Rank 1 */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
                    <style>
                        {`
                            @keyframes confettiFallLeaderboard {
                                0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                                100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                            }
                            .animate-confetti-lb { animation: confettiFallLeaderboard linear forwards; }
                        `}
                    </style>
                    {[...Array(80)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti-lb"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10%',
                                width: `${Math.random() * 10 + 6}px`,
                                height: `${Math.random() * 14 + 8}px`,
                                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#ffffff'][Math.floor(Math.random() * 7)],
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${Math.random() * 3 + 2}s`,
                                borderRadius: Math.random() > 0.5 ? '50%' : '4px',
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
                    <Trophy size={160} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Trophy className="text-yellow-500" size={36} /> Papan Peringkat
                    </h2>
                    <p className="text-slate-500 font-medium mt-2 md:text-lg">Bersaing dengan pelajar lain dan raih posisi teratas!</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl relative z-10 w-full md:w-auto shrink-0 overflow-x-auto">
                    <button
                        onClick={() => setPeriod('all-time')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${period === 'all-time' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Global
                    </button>
                    <button
                        onClick={() => setPeriod('weekly')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${period === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Minggu Ini
                    </button>
                    <button
                        onClick={() => setPeriod('friends')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${period === 'friends' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Teman
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 min-h-[400px] animate-in fade-in">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Menyusun Peringkat...</p>
                </div>
            ) : period === 'friends' ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-sm flex flex-col items-center animate-in fade-in">
                    <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
                        <UserPlus size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Kompetisi Antar Teman</h3>
                    <p className="text-slate-500 mb-8 max-w-md">Sistem pertemanan (Friends Leaderboard) sedang dalam tahap pengembangan! Yuk, undang teman-temanmu sekarang agar siap bersaing skor saat fiturnya rilis.</p>
                    <button
                        onClick={() => {
                            const text = `Hai! Yuk belajar bahasa Inggris bareng RichardMeha AI dan saingan skor XP sama aku. Aplikasinya keren banget lho!`;
                            const url = `https://play.google.com/store/apps/details?id=com.richardmeha.englishku`;
                            const waUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`;
                            window.open(waUrl, '_system');
                        }}
                        className="px-8 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Share2 size={18} /> Undang via WhatsApp
                    </button>
                </div>
            ) : leaders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-sm flex flex-col items-center">
                    <Users size={64} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Belum ada data</h3>
                    <p className="text-slate-500 mb-6">Jadilah yang pertama untuk meraih XP dan naik ke peringkat pertama!</p>
                    <button onClick={() => onNavigate('home')} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Mulai Belajar</button>
                </div>
            ) : (
                <>
                    {/* Podium Top 3 */}
                    <div className="flex items-end justify-center gap-2 md:gap-8 mb-12 mt-12 pt-8">
                        {/* Rank 2 */}
                        {top3[1] && <PodiumCard user={top3[1]} rank={2} isMe={top3[1].id === userProfile?.id} onClick={() => setSelectedUser(top3[1])} />}
                        {/* Rank 1 */}
                        {top3[0] && <PodiumCard user={top3[0]} rank={1} isMe={top3[0].id === userProfile?.id} onClick={() => setSelectedUser(top3[0])} />}
                        {/* Rank 3 */}
                        {top3[2] && <PodiumCard user={top3[2]} rank={3} isMe={top3[2].id === userProfile?.id} onClick={() => setSelectedUser(top3[2])} />}
                    </div>

                    {/* List Peringkat 4 - 10 */}
                    {rest.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="p-4 md:p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">Peringkat 4 - 10</h3>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-200/50 rounded-lg">Top 10 Global</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {rest.map((user, index) => {
                                    const rank = index + 4;
                                    const isMe = user.id === userProfile?.id;
                                    return (
                                        <div key={user.id} onClick={() => setSelectedUser(user)} className={`flex items-center gap-3 md:gap-6 p-4 md:p-6 transition-colors hover:bg-slate-50 cursor-pointer ${isMe ? 'bg-indigo-50/40' : ''}`}>
                                            <div className="w-8 text-center font-black text-slate-400 text-lg">{rank}</div>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${isMe ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-500'}`}>
                                                {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-bold truncate ${isMe ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                        {user.full_name || 'User'}
                                                    </p>
                                                    {isMe && <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Kamu</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{user.level || 'Pemula Dasar'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-black text-lg md:text-xl ${isMe ? 'text-indigo-600' : 'text-slate-700'}`}>{user.xp}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">XP</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* User Public Profile Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overscroll-none overflow-hidden" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="h-28 bg-gradient-to-r from-indigo-500 to-purple-600 w-full relative">
                            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md active:scale-95"><X size={20} /></button>
                        </div>
                        <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-500 -mt-12 mb-4 relative z-10 bg-gradient-to-tr from-slate-100 to-slate-200">
                                {selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-1">{selectedUser.full_name || 'User'}</h3>
                            <p className="text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full mb-6 mt-1">{selectedUser.level || 'Pemula Dasar'}</p>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex flex-col items-center">
                                    <Zap size={24} className="text-amber-500 mb-2" />
                                    <span className="text-2xl font-black text-amber-600">{selectedUser.xp || 0}</span>
                                    <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mt-1">Total XP</span>
                                </div>
                                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex flex-col items-center">
                                    <Flame size={24} className="text-orange-500 mb-2" />
                                    <span className="text-2xl font-black text-orange-600">{selectedUser.streak || 0}</span>
                                    <span className="text-[10px] font-bold text-orange-700/60 uppercase tracking-widest mt-1">Day Streak</span>
                                </div>
                            </div>
                            <div className="w-full mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                                <Calendar size={14} /> Bergabung {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Baru saja'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PodiumCard({ user, rank, isMe, onClick }) {
    const isFirst = rank === 1;
    const height = isFirst ? 'h-40 md:h-48' : rank === 2 ? 'h-32 md:h-36' : 'h-28 md:h-32';

    const getColors = () => {
        if (rank === 1) return 'from-yellow-400 to-amber-500 shadow-yellow-500/40 text-yellow-900';
        if (rank === 2) return 'from-slate-300 to-slate-400 shadow-slate-400/40 text-slate-800';
        return 'from-orange-400 to-rose-400 shadow-orange-500/40 text-orange-950';
    };

    const colors = getColors();

    return (
        <div className={`flex flex-col items-center animate-in slide-in-from-bottom-${8 - rank} duration-700 w-[30%] max-w-[140px]`}>
            <div className="relative mb-3 md:mb-5">
                {isFirst && (
                    <Medal className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse z-30" size={48} />
                )}

                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-2xl md:text-4xl font-black bg-gradient-to-tr ${colors} z-10 relative text-white`}>
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div className={`absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white flex items-center justify-center text-xs md:text-sm font-black text-white ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-slate-400' : 'bg-orange-500'} z-20 shadow-md`}>
                    {rank}
                </div>
            </div>

            <div className="text-center px-1 mb-3 h-10 flex flex-col justify-end">
                <p className="font-bold text-slate-800 text-xs md:text-sm truncate w-full">{user.full_name || 'User'}</p>
                {isMe && <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 block">Kamu</span>}
            </div>

            <div className={`w-full ${height} rounded-t-2xl md:rounded-t-[2rem] bg-gradient-to-b ${colors} flex flex-col items-center justify-start pt-4 shadow-lg border-t border-white/30`}>
                <span className="text-white font-black text-sm md:text-xl">{user.xp}</span>
                <span className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-widest">XP</span>
            </div>
        </div>
    );
}