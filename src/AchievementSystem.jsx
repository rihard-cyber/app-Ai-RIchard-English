import React from 'react';
import { Award, Star, Zap, Flame, Trophy, Heart, Target, GraduationCap, Lock } from 'lucide-react';

export default function AchievementSystem({ userProfile = {} }) {
  const xp = userProfile.xp || 0;
  const streak = userProfile.streak || 0;
  const isPro = userProfile.is_pro || false;

  const ALL_ACHIEVEMENTS = [
    { id: 1, title: 'First Step', icon: <GraduationCap size={20}/>, color: 'bg-blue-100 text-blue-600', earned: xp > 0, desc: 'Completed your first lesson.' },
    { id: 2, title: 'Speaking Pro', icon: <Zap size={20}/>, color: 'bg-rose-100 text-rose-600', earned: xp > 50, desc: 'Earned more than 50 XP in speaking.' },
    { id: 3, title: 'Streak King', icon: <Flame size={20}/>, color: 'bg-orange-100 text-orange-600', earned: streak >= 3, desc: 'Maintain a 3-day learning streak.' },
    { id: 4, title: 'XP Hunter', icon: <Star size={20}/>, color: 'bg-amber-100 text-amber-600', earned: xp >= 200, desc: 'Reach 200 total XP.' },
    { id: 5, title: 'Pro Member', icon: <Trophy size={20}/>, color: 'bg-purple-100 text-purple-600', earned: isPro, desc: 'Unlocked the Ultimate Pro features.' },
    { id: 6, title: 'Polyglot', icon: <Heart size={20}/>, color: 'bg-emerald-100 text-emerald-600', earned: xp >= 500, desc: 'Reach 500 total XP.' },
  ];

  const earnedCount = ALL_ACHIEVEMENTS.filter(a => a.earned).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
           <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Award className="text-yellow-500" /> My Achievements
           </h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Unlock badges as you learn</p>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-xs font-black text-slate-800">{earnedCount} / {ALL_ACHIEVEMENTS.length}</span>
           <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(earnedCount/ALL_ACHIEVEMENTS.length)*100}%` }}></div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {ALL_ACHIEVEMENTS.map((ach) => (
          <div 
            key={ach.id} 
            className={`relative group p-5 rounded-[2rem] border transition-all duration-500 flex flex-col items-center text-center gap-3
              ${ach.earned 
                ? 'bg-white border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 cursor-default' 
                : 'bg-slate-50/50 border-slate-100 opacity-40 grayscale scale-95'}
            `}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${ach.earned ? ach.color : 'bg-slate-200 text-slate-400'}`}>
              {ach.earned ? ach.icon : <Lock size={18}/>}
            </div>
            <p className={`text-[10px] font-black uppercase tracking-tighter ${ach.earned ? 'text-slate-800' : 'text-slate-400'}`}>
              {ach.title}
            </p>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-40 p-3 bg-slate-900 text-white text-[10px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl scale-90 group-hover:scale-100">
               <p className="font-bold mb-1 text-blue-400">{ach.title}</p>
               <p className="opacity-70 leading-relaxed">{ach.desc}</p>
               <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
