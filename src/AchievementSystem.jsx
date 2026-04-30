import React from 'react';
import { Award, Star, Zap, Flame, Trophy, Heart, Target, GraduationCap } from 'lucide-react';

const ALL_ACHIEVEMENTS = [
  { id: 1, title: 'Early Bird', icon: <GraduationCap size={20}/>, color: 'bg-blue-100 text-blue-600', earned: true, desc: 'Menyelesaikan tes penempatan awal.' },
  { id: 2, title: 'Speaking Pro', icon: <Zap size={20}/>, color: 'bg-rose-100 text-rose-600', earned: true, desc: 'Mendapat skor speaking di atas 90%.' },
  { id: 3, title: 'Vocabulary Master', icon: <Star size={20}/>, color: 'bg-amber-100 text-amber-600', earned: false, desc: 'Mempelajari 100 kosakata baru.' },
  { id: 4, title: 'Daily Streak 7', icon: <Flame size={20}/>, color: 'bg-orange-100 text-orange-600', earned: false, desc: 'Belajar 7 hari berturut-turut.' },
  { id: 5, title: 'Grammar Genius', icon: <Target size={20}/>, color: 'bg-emerald-100 text-emerald-600', earned: true, desc: 'Menyelesaikan 10 modul grammar.' },
  { id: 6, title: 'Polyglot', icon: <Heart size={20}/>, color: 'bg-purple-100 text-purple-600', earned: false, desc: 'Mencapai Level Mahir (C1-C2).' },
];

export default function AchievementSystem() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Award className="text-yellow-500" /> Pencapaian Saya
        </h3>
        <span className="text-xs font-bold text-slate-400">3/6 Terkumpul</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {ALL_ACHIEVEMENTS.map((ach) => (
          <div 
            key={ach.id} 
            className={`relative group p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center gap-3
              ${ach.earned 
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md cursor-default' 
                : 'bg-slate-50 border-slate-100 opacity-50 grayscale cursor-not-allowed'}
            `}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ach.earned ? ach.color : 'bg-slate-200 text-slate-400'}`}>
              {ach.icon}
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-tighter ${ach.earned ? 'text-slate-700' : 'text-slate-400'}`}>
              {ach.title}
            </p>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
               {ach.desc}
               <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
