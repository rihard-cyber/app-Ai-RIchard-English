import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Award,
  Clock,
  BarChart2,
  Calendar,
  Mic,
  PenTool,
  BookOpen,
  Zap,
  ArrowUpRight,
  Sparkles,
  Filter
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function ProgressDashboard({ userProfile, onNavigate }) {
  const [stats, setStats] = useState({
    speaking: 0,
    writing: 0,
    grammar: 0,
    vocabulary: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [heatmapData, setHeatmapData] = useState([]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  useEffect(() => {
    fetchProgress();
  }, [filterPeriod, filterCategory]);

  const fetchProgress = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    // 1. Fetch Skill Averages
    let progressQuery = supabase
      .from('user_progress')
      .select('skill_type, score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filterCategory !== 'all') {
      progressQuery = progressQuery.eq('skill_type', filterCategory);
    }

    if (filterPeriod !== 'all') {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - parseInt(filterPeriod));
      progressQuery = progressQuery.gte('created_at', dateLimit.toISOString());
    }

    const { data: progressData } = await progressQuery.limit(50);

    if (progressData) {
      const skills = ['speaking', 'writing', 'grammar', 'vocabulary'];
      const newStats = { speaking: 0, writing: 0, grammar: 0, vocabulary: 0 };

      skills.forEach(skill => {
        const skillScores = progressData.filter(p => p.skill_type === skill);
        if (skillScores.length > 0) {
          const avg = skillScores.reduce((acc, curr) => acc + curr.score, 0) / skillScores.length;
          newStats[skill] = Math.round(avg);
        }
      });
      setStats(newStats);
    } else {
      setStats({ speaking: 0, writing: 0, grammar: 0, vocabulary: 0 });
    }

    // 2. Fetch Recent Activity
    let activityQuery = supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filterCategory !== 'all') {
      activityQuery = activityQuery.eq('skill_type', filterCategory);
    }

    if (filterPeriod !== 'all') {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - parseInt(filterPeriod));
      activityQuery = activityQuery.gte('created_at', dateLimit.toISOString());
    }

    const { data: activityData } = await activityQuery.limit(5);

    if (activityData) {
      setRecentActivity(activityData.map(act => ({
        id: act.id,
        type: act.skill_type.charAt(0).toUpperCase() + act.skill_type.slice(1),
        score: act.score,
        date: formatDate(act.created_at),
        level: userProfile.level.split(' ')[0]
      })));
    } else {
      setRecentActivity([]);
    }

    // 3. Fetch Heatmap Data (Last 28 Days)
    const today = new Date();
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(today.getDate() - 27);
    twentyEightDaysAgo.setHours(0, 0, 0, 0);

    const { data: rawHeatData } = await supabase
      .from('user_progress')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', twentyEightDaysAgo.toISOString());

    const activityMap = {};
    if (rawHeatData) {
      rawHeatData.forEach(item => {
        const d = new Date(item.created_at);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      });
    }

    const generatedHeatmap = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = activityMap[dateStr] || 0;

      let value = 0;
      if (count > 0 && count <= 2) value = 1;
      else if (count > 2 && count <= 5) value = 2;
      else if (count > 5 && count <= 8) value = 3;
      else if (count > 8) value = 4;

      const displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      generatedHeatmap.push({ day: 27 - i, date: displayDate, value, count });
    }
    setHeatmapData(generatedHeatmap);

    setIsLoading(false);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-[calc(96px+env(safe-area-inset-bottom))] overflow-x-hidden">

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full bg-white p-5 md:p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2"><Filter size={24} className="text-indigo-600" /> Filter Progres</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">Pilih periode dan kategori untuk melihat detail data</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm w-full sm:w-48 appearance-none cursor-pointer"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
          >
            <option value="all">Semua Waktu</option>
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm w-full sm:w-48 appearance-none cursor-pointer"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
          >
            <option value="all">Semua Kategori</option>
            <option value="speaking">Speaking</option>
            <option value="writing">Writing</option>
            <option value="grammar">Grammar</option>
            <option value="vocabulary">Vocabulary</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* SKELETON HEADER STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-start h-[140px]">
                <div className="w-10 h-10 bg-slate-100 rounded-xl mb-4 animate-pulse"></div>
                <div className="w-20 h-3 bg-slate-100 rounded-full mb-3 animate-pulse"></div>
                <div className="w-16 h-6 bg-slate-200/60 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            {/* SKELETON SKILL PROGRESS */}
            <div className="lg:col-span-2 space-y-6 w-full">
              <div className="bg-white w-full p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-40 h-6 bg-slate-200/60 rounded-full animate-pulse"></div>
                  <div className="w-24 h-6 bg-slate-100 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                          <div className="w-20 h-4 bg-slate-200/60 rounded-full animate-pulse"></div>
                        </div>
                        <div className="w-10 h-4 bg-slate-200/60 rounded-full animate-pulse"></div>
                      </div>
                      <div className="h-3.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className={`h-full bg-slate-100 rounded-full animate-pulse w-${['1/2', '3/4', '2/3', 'full'][i - 1]}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-12 pt-8 border-t border-slate-50">
                  <div className="w-48 h-4 bg-slate-200/60 rounded-full mb-6 animate-pulse"></div>
                  <div className="flex flex-wrap gap-2">
                    {[...Array(28)].map((_, i) => (
                      <div key={i} className="w-4 h-4 md:w-6 md:h-6 rounded-md bg-slate-100 animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SKELETON RECENT SESSIONS */}
            <div className="space-y-6 w-full">
              <div className="bg-white w-full p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="w-32 h-6 bg-slate-200/60 rounded-full mb-8 animate-pulse"></div>
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl shrink-0 animate-pulse"></div>
                      <div className="flex-1 space-y-2.5">
                        <div className="w-24 h-4 bg-slate-200/60 rounded-full animate-pulse"></div>
                        <div className="w-16 h-3 bg-slate-100 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex flex-col items-end space-y-2.5">
                        <div className="w-12 h-4 bg-slate-200/60 rounded-full animate-pulse"></div>
                        <div className="w-8 h-3 bg-slate-100 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-full mt-8 h-12 bg-slate-50 rounded-2xl animate-pulse"></div>
              </div>
              <div className="w-full h-32 bg-slate-100 rounded-3xl animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* HEADER STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <StatCard icon={<Zap size={20} />} label="Total XP" value={userProfile.xp} color="text-amber-500" bg="bg-amber-50" />
            <StatCard icon={<TrendingUp size={20} />} label="Current Level" value={userProfile.level.split(' ')[0]} color="text-indigo-500" bg="bg-indigo-50" />
            <StatCard icon={<Calendar size={20} />} label="Day Streak" value={`${userProfile.streak} Days`} color="text-orange-500" bg="bg-orange-50" />
            <StatCard icon={<Target size={20} />} label="Daily Goal" value="85%" color="text-emerald-500" bg="bg-emerald-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">

            {/* SKILL PROGRESS */}
            <div className="lg:col-span-2 space-y-6 w-full">
              <div className="bg-white w-full max-w-full p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="text-indigo-600" /> Skill Analysis
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    Real-time Stats
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <SkillBar label="Speaking" value={stats.speaking} icon={<Mic size={18} />} color="bg-violet-500" />
                  <SkillBar label="Writing" value={stats.writing} icon={<PenTool size={18} />} color="bg-indigo-500" />
                  <SkillBar label="Grammar" value={stats.grammar} icon={<BookOpen size={18} />} color="bg-emerald-500" />
                  <SkillBar label="Vocabulary" value={stats.vocabulary} icon={<Zap size={18} />} color="bg-amber-500" />
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 mt-4">
                    <Calendar size={16} /> Learning Activity (Last 4 Weeks)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {heatmapData.map((d) => (
                      <div
                        key={d.day}
                        className={`w-4 h-4 md:w-6 md:h-6 rounded-md transition-all hover:scale-110 cursor-pointer shadow-sm
                            ${d.value === 0 ? 'bg-slate-50 border border-slate-100' :
                            d.value === 1 ? 'bg-indigo-100 border border-indigo-200' :
                              d.value === 2 ? 'bg-indigo-300' :
                                d.value === 3 ? 'bg-indigo-500' : 'bg-indigo-700'}
                          `}
                        title={`${d.date}: ${d.count} Latihan`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>Less</span>
                    <div className="w-3 h-3 bg-slate-50 border border-slate-100 rounded-sm"></div>
                    <div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded-sm"></div>
                    <div className="w-3 h-3 bg-indigo-300 rounded-sm"></div>
                    <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                    <div className="w-3 h-3 bg-indigo-700 rounded-sm"></div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT SESSIONS */}
            <div className="space-y-6 w-full">
              <div className="bg-white w-full max-w-full p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Award className="text-amber-500" /> Recent Success
                </h3>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? recentActivity.map((act) => (
                    <div key={act.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100/60 group">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${act.type === 'Speaking' ? 'bg-violet-50 text-violet-600' :
                        act.type === 'Writing' ? 'bg-indigo-50 text-indigo-600' :
                          act.type === 'Vocabulary' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        {act.type === 'Speaking' ? <Mic size={20} /> :
                          act.type === 'Writing' ? <PenTool size={20} /> :
                            act.type === 'Vocabulary' ? <Zap size={20} /> : <BookOpen size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{act.type} Practice</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock size={10} /> {act.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">+{act.score}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{act.level}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-slate-500 font-medium">Belum ada aktivitas di periode ini.</p>
                    </div>
                  )}
                </div>
                <button onClick={() => onNavigate && onNavigate('home')} className="w-full mt-6 py-3.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
                  Kembali ke Beranda Belajar <ArrowUpRight size={16} />
                </button>
              </div>

              {/* AI RECOMMENDATION MINI */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 w-full max-w-full p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <Zap size={100} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles size={14} /> AI Recommendation</p>
                  <h4 className="text-lg md:text-xl font-bold mb-6 leading-relaxed text-slate-100">Fokus ke "Past Tense" untuk menaikkan skor Writing!</h4>
                  <div className="space-y-3">
                    <div className="bg-white/5 hover:bg-white/10 transition-colors cursor-pointer backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4 border border-white/10 w-full overflow-hidden group">
                      <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><BookOpen size={18} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">Daily Grammar #12</p>
                        <p className="text-xs text-slate-400 truncate">Latihan Past Tense Dasar</p>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-start text-left transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] hover:border-indigo-200">
      <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl md:text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function SkillBar({ label, value, icon, color }) {
  return (
    <div className="space-y-3 group">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${color.replace('bg-', 'bg-').replace('500', '50')} ${color.replace('bg-', 'text-').replace('500', '600')} flex items-center justify-center transition-transform group-hover:scale-110`}>
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>
        <span className="text-sm font-black text-slate-800">{value}%</span>
      </div>
      <div className="h-3.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 shadow-inner">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{ width: `${value}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
        </div>
      </div>
    </div>
  );
}
