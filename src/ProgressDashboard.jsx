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
  ArrowUpRight
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

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    // 1. Fetch Skill Averages
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('skill_type, score')
      .eq('user_id', user.id);

    if (progressData) {
      const skills = ['speaking', 'writing', 'grammar', 'vocabulary'];
      const newStats = { ...stats };

      skills.forEach(skill => {
        const skillScores = progressData.filter(p => p.skill_type === skill);
        if (skillScores.length > 0) {
          const avg = skillScores.reduce((acc, curr) => acc + curr.score, 0) / skillScores.length;
          newStats[skill] = Math.round(avg);
        }
      });
      setStats(newStats);
    }

    // 2. Fetch Recent Activity
    const { data: activityData } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activityData) {
      setRecentActivity(activityData.map(act => ({
        id: act.id,
        type: act.skill_type.charAt(0).toUpperCase() + act.skill_type.slice(1),
        score: act.score,
        date: formatDate(act.created_at),
        level: userProfile.level.split(' ')[0]
      })));
    }
    setIsLoading(false);
  };

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

  // Generate mock heatmap data (28 days) - keep this for visual flavor or implement real logic
  const heatmapData = Array.from({ length: 28 }, (_, i) => ({
    day: i,
    value: Math.floor(Math.random() * 5)
  }));

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Memuat data progres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">

      {/* HEADER STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Zap size={20} />} label="Total XP" value={userProfile.xp} color="text-yellow-500" bg="bg-yellow-50" />
        <StatCard icon={<TrendingUp size={20} />} label="Current Level" value={userProfile.level.split(' ')[0]} color="text-blue-500" bg="bg-blue-50" />
        <StatCard icon={<Calendar size={20} />} label="Day Streak" value={`${userProfile.streak} Days`} color="text-orange-500" bg="bg-orange-50" />
        <StatCard icon={<Target size={20} />} label="Daily Goal" value="85%" color="text-emerald-500" bg="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* SKILL PROGRESS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="text-blue-600" /> Skill Analysis
              </h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                Real-time Stats
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <SkillBar label="Speaking" value={stats.speaking} icon={<Mic size={18} />} color="bg-rose-500" />
              <SkillBar label="Writing" value={stats.writing} icon={<PenTool size={18} />} color="bg-indigo-500" />
              <SkillBar label="Grammar" value={stats.grammar} icon={<BookOpen size={18} />} color="bg-emerald-500" />
              <SkillBar label="Vocabulary" value={stats.vocabulary} icon={<Zap size={18} />} color="bg-amber-500" />
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Calendar size={16} /> Learning Activity (Last 4 Weeks)
              </h4>
              <div className="flex flex-wrap gap-2">
                {heatmapData.map((d) => (
                  <div
                    key={d.day}
                    className={`w-4 h-4 md:w-6 md:h-6 rounded-md transition-all hover:scale-110 cursor-pointer shadow-sm
                        ${d.value === 0 ? 'bg-slate-100' :
                        d.value === 1 ? 'bg-blue-200' :
                          d.value === 2 ? 'bg-blue-400' :
                            d.value === 3 ? 'bg-blue-600' : 'bg-blue-800'}
                      `}
                    title={`Intensity: ${d.value}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-medium">
                <span>Less</span>
                <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-800 rounded-sm"></div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT SESSIONS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Award className="text-yellow-500" /> Recent Success
            </h3>
            <div className="space-y-4">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${act.type === 'Speaking' ? 'bg-rose-100 text-rose-600' :
                    act.type === 'Vocabulary' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                    {act.type === 'Speaking' ? <Mic size={18} /> : <Zap size={18} />}
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
              ))}
            </div>
            <button onClick={() => onNavigate && onNavigate('home')} className="w-full mt-6 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
              Kembali ke Beranda Belajar <ArrowUpRight size={16} />
            </button>
          </div>

          {/* AI RECOMMENDATION MINI */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200/50">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">AI Recommendation</p>
            <h4 className="text-lg font-bold mb-4 leading-tight">Fokus ke "Past Tense" untuk menaikkan skor Writing!</h4>
            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl flex items-center gap-3 border border-white/10">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><BookOpen size={16} /></div>
                <p className="text-xs font-medium">Daily Grammar #12</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
      <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg md:text-xl font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

function SkillBar({ label, value, icon, color }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${color} bg-opacity-10 ${color.replace('bg-', 'text-')} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>
        <span className="text-sm font-extrabold text-slate-800">{value}%</span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-100 shadow-inner">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden`}
          style={{ width: `${value}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
        </div>
      </div>
    </div>
  );
}
