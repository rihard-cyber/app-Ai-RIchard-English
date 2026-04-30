import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare,
  Headphones,
  BookA,
  Mic,
  MicOff,
  Volume2,
  Menu,
  X,
  Send,
  Loader2,
  GraduationCap,
  Sparkles,
  User,
  Bot,
  Flame,
  Trophy,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  BarChart2,
  Calendar,
  Zap,
  ArrowUpRight,
  PenTool,
  Crown,
  Languages
} from 'lucide-react';
import { LoginPage, SubscriptionPage } from './Auth';
import LevelTest from './LevelTest';
import ProgressDashboard from './ProgressDashboard';
import WritingAnalyzer from './WritingAnalyzer';
import PronunciationCoach from './PronunciationCoach';
import AchievementSystem from './AchievementSystem';
import PaymentModal from './PaymentModal';
import { supabase } from './supabaseClient';
import { CURRICULUM } from './data/curriculum';

// --- KONFIGURASI API GEMINI ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 

// --- DATA PROFIL DEFAULT ---
const DEFAULT_PROFILE = {
  name: "User",
  gender: "male",
  level: "Pemula (A1-A2)",
  xp: 0,
  streak: 0,
  has_completed_initial_test: false,
  is_pro: false,
  subscription_plan: 'Free'
};

// --- DATA PROMPT DARI SPREADSHEET (LENGKAP - RichardMeha AI Persona) ---
const getPrompts = (userProfile) => {
  return {
  assessment: `Kamu adalah RichardMeha AI dari Kampung Inggris. Tugas kamu adalah melakukan Placement Test CEFR (A1-C2).
  🎙️ - Sapa dengan gaya santai dan seru 😎. Sebut dirimu "RichardMeha AI dari Kampung Inggris".
  🛡️ Struktur ini asli RichardMeha AI. Dilarang duplikasi tanpa izin ❌.
  📋 Struktur tes: 1) Speaking 🗣️, 2) Grammar & Vocabulary 📘, 3) Reading 📖, 4) Writing ✍️.
  ⚠️ Jangan langsung tentukan level. Mulai dari Speaking, lalu adaptif:
  - Bagus di grammar? Kasih vocab lebih sulit. 
  - Bagus di vocab? Kasih reading kompleks.
  🚀 Mulai dari Speaking Test: Minta perkenalkan diri (Nama, Asal, Pekerjaan, Hobi).
  🎤 Ingatkan murid pakai microphone.
  📊 Tulis koreksi dalam tabel. Di akhir, berikan skor CEFR rata-rata dan rekomendasi:
  - Basic -> Vocabulary Warrior 📗
  - B1 -> Idea Shaper 💡
  - B2 -> Fluent Thinker 🧠
  - C1+ -> Fluent Thinker 🎓`,

  vocabulary: `Sapa: 'Hallo aku RichardMeha AI dari kampung Inggris, ini Box of words kamu hari ini'.
  🎓 Tugas: Bimbing belajar vocab di Level ${userProfile.level}.
  ✨ Tampilkan phonetic symbol (Cara Baca) / / UK. 
  ✨ Box of Words tabel 2 kolom saja: [1. Vocab /Phonetic/] | [Arti].
  📝 Berikan 2 opsi Writing Challenge: 
  - Opsi 1: Tulis cerita judul [Topik] pakai 3-5 BOW. 
  - Opsi 2: Bikin 1 kalimat untuk masing-masing 3-5 BOW.
  🔍 SETELAH JAWAB, WAJIB JALANKAN 7 LANGKAH KOREKSI:
  1. Tabel: Kalimat Asli | Penjelasan Grammar | Kalimat Benar.
  2. Analisa BOW (apakah tepat?).
  3. Analisa Kosakata (Daftar vocab, CEFR, saran upgrade, contoh kalimat).
  4. Analisa CEFR Tulisan & Tips naik level.
  5. Sistem 5W+1H: Tabel comparison & list (What, Why, Where, When, Who, How). Lalu tulis paragraph utuh versi 5W+1H.
  6. Analisa Transition Words: saran 1-3 kata + contoh + arti (italic).
  7. Speaking Challenge: 1-3 pertanyaan satu-satu (Inggris + Italic Indo).`,

  speaking: `Kamu adalah RichardMeha AI dari Kampung Inggris.
  📚 Bagian A — Penjelasan Materi: Detail sesuai level ${userProfile.level} + 3-5 frasa contoh + contoh dialog 1-2 kalimat.
  🎤 Bagian B — Speaking Challenge: Setelah saya bilang "I'm ready to practice", beri pertanyaan satu-satu.
  - Pertanyaan: English + Terjemahan (Italic).
  - Koreksi: Tabel perbandingan kalimatku vs Native Speaker (2 kolom).`,

  grammar: `Kamu adalah RichardMeha AI dari Kampung Inggris. 
  🔧 ATURAN KERAS: Jangan sebut nama tenses. Jelaskan pola kalimat saja.
  💡 Contoh: 'I buy a drink yesterday' → salah ❌. Harusnya 'I bought a drink yesterday', karena masa lalu → pakai verb ke-2 ✅.
  📄 Beri 5 contoh kalimat natural + terjemahan (italic).
  💪 Beri 3 pertanyaan speaking yang memaksaku memakai Grammar ini.
  📊 Koreksi: Tabel perbandingan kalimatku vs Native Speaker.`,

  listening: `Kamu adalah RichardMeha AI dari Kampung Inggris.
  🎧 Bagian A — Listening Practice: Langsung berikan 1 monolog/cerita pendek. 
  - Durasi: 4-8 kalimat (A1-B1), 8-15 kalimat (B2-C2). 
  - Lampirkan tabel vocabulary penting di bawah cerita.
  🎤 Bagian B — Speaking Challenge: Setelah saya bilang "I'm ready to practice", beri pertanyaan comprehension satu-satu.
  - Jika salah, koreksi sesuai teks lalu berikan pertanyaan yang sama lagi sampai benar.`,

  conversation: `Kamu adalah RichardMeha AI dari Kampung Inggris.
  - Sapa: 'Hallo aku RichardMeha AI dari kampung Inggris'.
  - Format: Tabel 3 kolom (Speaker, English Dialogue, Terjemahan).
  - Tokoh: Tirukan kepribadian tokoh terkenal (Naruto, Soekarno, dll) sesuai pilihan user.
  - Highlight: Tabel kosakata, idiom, phrasal verb, expression + arti & konteks.
  - Voice Mode: Tanya "Mau baca teks dulu atau improvisasi?".
  - Baca: AI baca bagiannya, saya baca bagian saya. AI tidak boleh memuji atau memberi arahan.
  - Improvisasi: FULL ENGLISH. AI mulai dengan pertanyaan sesuai topik.`
  };
};

export default function App() {
  const [authState, setAuthState] = useState('login'); // 'login', 'subscription', 'assessment', 'app'
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: '', price: 0 });
  const [userStats, setUserStats] = useState({ speaking: 0, writing: 0, grammar: 0, vocabulary: 0 });
  const [recommendation, setRecommendation] = useState('vocabulary');
  const [isInitializing, setIsInitializing] = useState(true);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (authState === 'app') {
      fetchStats();
    }
  }, [authState]);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_progress')
      .select('skill_type, score')
      .eq('user_id', user.id);

    if (data && data.length > 0) {
      const stats = { speaking: 0, writing: 0, grammar: 0, vocabulary: 0 };
      const counts = { speaking: 0, writing: 0, grammar: 0, vocabulary: 0 };

      data.forEach(p => {
        if (stats[p.skill_type] !== undefined) {
          stats[p.skill_type] += p.score;
          counts[p.skill_type]++;
        }
      });

      const averages = {};
      let lowestSkill = 'vocabulary';
      let lowestScore = 101;

      Object.keys(stats).forEach(skill => {
        const avg = counts[skill] > 0 ? Math.round(stats[skill] / counts[skill]) : 0;
        averages[skill] = avg;
        if (avg < lowestScore) {
          lowestScore = avg;
          lowestSkill = skill;
        }
      });

      setUserStats(averages);
      setRecommendation(lowestSkill);
    }
  };

  const checkUser = async () => {
    setIsInitializing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchProfile(user.id);
      setAuthState('app');
    } else {
      setAuthState('login');
    }
    setIsInitializing(false);
  };

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUserProfile({
        name: data.full_name || "User",
        gender: data.gender || "male",
        level: data.level || "Pemula Dasar (A1)",
        xp: data.xp || 0,
        streak: data.streak || 0,
        has_completed_initial_test: data.has_completed_initial_test || false,
        is_pro: data.is_pro || false,
        subscription_plan: data.subscription_plan || 'Free'
      });

      if (!data.has_completed_initial_test) {
        setAuthState('assessment');
      } else {
        setAuthState('app');
      }
    } else {
      // Create profile if not exists (failsafe)
      setAuthState('app');
    }
  };

  const handleLogin = () => {
    checkUser();
  };

  const handleSelectPlan = (plan) => {
    if (plan === 'free') {
      setAuthState('app');
    } else {
      const planDetails = plan === 'monthly' 
        ? { name: 'Pro Monthly', price: '49.000' }
        : { name: 'Pro Yearly', price: '399.000' };
      setSelectedPlan(planDetails);
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ is_pro: true, subscription_plan: selectedPlan.name })
        .eq('id', user.id);
      
      // Refresh profile
      await fetchProfile(user.id);
    }
    setAuthState('app');
  };

  const handleAssessmentComplete = async (level) => {
    // Update local state first for immediate UI response
    setUserProfile(prev => ({ ...prev, level, has_completed_initial_test: true }));
    setActiveTab('home');
    setAuthState('app');
    
    // Then refresh profile from DB to be safe
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState('login');
    setUserProfile(DEFAULT_PROFILE);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const saveProgress = async (skill, score, details = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_progress').insert({
        user_id: user.id,
        skill_type: skill,
        score: score,
        details: details
      });
      
      // Update XP in profile
      await supabase.rpc('increment_xp', { user_id: user.id, amount: 10 });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile after clicking
  };

  const renderContent = () => {
    const prompts = getPrompts(userProfile);
    switch (activeTab) {
      case 'home':
        return <HomeDashboard onNavigate={handleTabChange} userProfile={userProfile} recommendation={recommendation} />;
      case 'progress':
        return <ProgressDashboard userProfile={userProfile} />;
      case 'assessment':
        return <LevelTest onComplete={handleAssessmentComplete} />;
      case 'vocabulary':
        return <SetupModule module="Vocabulary" basePrompt={prompts.vocabulary} inputLabel="Topik Vocabulary" placeholder="Misal: Daily Routines, Food & Drinks" icon={<BookA size={24}/>} color="text-indigo-600" bg="bg-indigo-100" onComplete={(score) => saveProgress('vocabulary', score)} isPro={userProfile.is_pro} />;
      case 'speaking':
        return <PronunciationCoach userProfile={userProfile} onComplete={(score) => saveProgress('speaking', score)} isPro={userProfile.is_pro} />;
      case 'grammar':
        return <SetupModule module="Grammar for Speaking" basePrompt={prompts.grammar} inputLabel="Materi Grammar" placeholder="Misal: Perbedaan Do/Does, Verb 2" icon={<LayoutDashboard size={24}/>} color="text-emerald-600" bg="bg-emerald-100" onComplete={(score) => saveProgress('grammar', score)} isPro={userProfile.is_pro} />;
      case 'listening':
        return <SetupModule module="Listening & Talking" basePrompt={prompts.listening} inputLabel="Tema Cerita / Monolog" placeholder="Misal: Liburan ke Bali..." icon={<Headphones size={24}/>} color="text-amber-600" bg="bg-amber-100" onComplete={(score) => saveProgress('listening', score)} isPro={userProfile.is_pro} />;
      case 'writing_analyzer':
        return <WritingAnalyzer isPro={userProfile.is_pro} />;
      case 'conversation':
        return <ConversationModule basePrompt={prompts.conversation} isPro={userProfile.is_pro} />;
      case 'settings':
        return (
          <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <SettingsIcon className="text-blue-600" /> Pengaturan Akun
            </h2>
            
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Tema Aplikasi</h4>
                  <p className="text-xs text-slate-500">Pilih tampilan yang nyaman di mata.</p>
                </div>
                <button onClick={toggleTheme} className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-all active:scale-95">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              </div>
              
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Status Akun</h4>
                  <p className="text-xs text-slate-500">Paket langganan aktif Anda.</p>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${userProfile.is_pro ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                  {userProfile.is_pro ? '👑 Pro' : 'Free'}
                </span>
              </div>

              <div className="p-6">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all active:scale-95"
                >
                  <LogOut size={18} /> Keluar dari Akun
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><User size={18}/> Profil RichardMeha AI</h4>
              <p className="text-sm text-blue-600 leading-relaxed">
                Data Anda tersimpan dengan aman di server cloud RichardMeha AI. Semua progres belajar disinkronkan secara real-time.
              </p>
            </div>
          </div>
        );
      default:
        return <HomeDashboard onNavigate={handleTabChange} userProfile={userProfile} recommendation={recommendation} />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 font-bold animate-pulse">Menyiapkan RichardMeha AI...</p>
      </div>
    );
  }

  if (authState === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (authState === 'assessment') {
    return <LevelTest onComplete={handleAssessmentComplete} />;
  }

  if (authState === 'subscription') {
    return <SubscriptionPage onSelectPlan={handleSelectPlan} />;
  }

  return (
    <div className={`flex h-[100dvh] font-sans overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b1121] text-slate-200 dark-mode' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 
        w-72 md:w-64 bg-[#0f172a] text-slate-300 shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 bg-[#0b1121]">
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2 text-white">
            <Sparkles className="text-blue-500" /> RichardMeha<span className="text-blue-500"> AI</span>
          </h1>
          <button className="md:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 border-b border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
              {userProfile.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-white">{userProfile.name}</span>
              <span className="text-xs text-blue-400 flex items-center gap-1"><Trophy size={12}/> {userProfile.level}</span>
            </div>
        </div>

        <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3 mt-2">Menu Utama</p>
          <NavItem icon={<LayoutDashboard />} label="Dasbor Belajar" isActive={activeTab === 'home'} onClick={() => handleTabChange('home')} />
          <NavItem icon={<BarChart2 />} label="Statistik Progres" isActive={activeTab === 'progress'} onClick={() => handleTabChange('progress')} />
          
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3 mt-6">Modul Pembelajaran</p>
          <NavItem icon={<GraduationCap />} label="Test CEFR (Awal)" isActive={activeTab === 'assessment'} onClick={() => handleTabChange('assessment')} />
          <NavItem icon={<BookA />} label="Vocabulary" isActive={activeTab === 'vocabulary'} onClick={() => handleTabChange('vocabulary')} />
          <NavItem icon={<Mic />} label="Speaking Coach" isActive={activeTab === 'speaking'} onClick={() => handleTabChange('speaking')} />
          <NavItem icon={<PenTool />} label="Writing Analyzer" isActive={activeTab === 'writing_analyzer'} onClick={() => handleTabChange('writing_analyzer')} />
          <NavItem icon={<LayoutDashboard />} label="Grammar for Speaking" isActive={activeTab === 'grammar'} onClick={() => handleTabChange('grammar')} />
          <NavItem icon={<Headphones />} label="Listening & Talk" isActive={activeTab === 'listening'} onClick={() => handleTabChange('listening')} />
          <NavItem icon={<MessageSquare />} label="Conversation" isActive={activeTab === 'conversation'} onClick={() => handleTabChange('conversation')} />
          
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3 mt-6">Akun</p>
          <NavItem icon={<SettingsIcon />} label="Pengaturan" isActive={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-all"
          >
            <LogOut size={18} /> <span className="text-sm">Log Out</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 shrink-0 md:hidden shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              RichardMeha<span className="text-blue-600"> AI</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              <Flame size={16} className="fill-orange-500" /> {userProfile.streak}
            </div>
          </div>
        </header>

        {/* Dynamic Area */}
        <div className="flex-1 overflow-y-auto w-full relative bg-slate-50/50">
          {renderContent()}
        </div>
      </main>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        planName={selectedPlan.name}
        price={selectedPlan.price}
      />
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 font-medium' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <span className={`${isActive ? 'text-white' : ''}`}>{icon}</span>
      <span className="text-sm whitespace-nowrap">{label}</span>
    </button>
  );
}

// ==========================================
// HOME DASHBOARD (Gamification)
// ==========================================
function HomeDashboard({ onNavigate, userProfile, recommendation }) {
  const levelData = CURRICULUM[userProfile.level] || CURRICULUM['Pemula Dasar (A1)'];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Learning Path Banner (Versa/Stimuler Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <GraduationCap size={240} />
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/30">
              <Sparkles size={16} className="text-yellow-300" />
              <span className="text-xs font-black uppercase tracking-widest">Level: {userProfile.level}</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">Lanjut Belajar,<br/>{userProfile.name}!</h2>
            <p className="text-blue-100 mb-8 md:text-lg max-w-md opacity-90 leading-relaxed">
               Target kamu hari ini: **{levelData.goals[0]}**. RichardMeha AI sudah siapkan materinya!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onNavigate(recommendation)}
                className="bg-white text-blue-700 font-black px-8 py-4 rounded-2xl shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                <Zap size={20} className="fill-blue-700 group-hover:scale-125 transition-transform" /> 
                Mulai {recommendation.toUpperCase()}
              </button>
              
              <div className="flex gap-4 items-center">
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                   <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20"><Flame size={18} className="text-white fill-white"/></div>
                   <div>
                     <p className="text-[10px] text-blue-200 font-bold uppercase tracking-tighter">Streak</p>
                     <p className="text-lg font-black leading-none">{userProfile.streak} Hari</p>
                   </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                   <div className="bg-yellow-400 p-2 rounded-xl shadow-lg shadow-yellow-400/20"><Trophy size={18} className="text-yellow-900 fill-yellow-900"/></div>
                   <div>
                     <p className="text-[10px] text-blue-200 font-bold uppercase tracking-tighter">Total XP</p>
                     <p className="text-lg font-black leading-none">{userProfile.xp}</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Level Goals Card */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl flex flex-col">
           <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Trophy size={24} className="text-yellow-500" /> Goals Level {userProfile.level.split(' ')[0]}
           </h3>
           <div className="space-y-4 flex-1">
              {levelData.goals.map((goal, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{goal}</p>
                </div>
              ))}
           </div>
           <button 
             onClick={() => onNavigate('assessment')}
             className="mt-8 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 mx-auto"
           >
             Cek level lagi? Ulangi Tes <ArrowUpRight size={14} />
           </button>
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-800 mt-12 mb-6 px-2">Modul Belajar Pintar</h3>
      
      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <DashboardCard 
          title="Vocabulary" desc="Perkaya kosa kata dengan Box of Words." 
          icon={<BookA size={24}/>} color="bg-indigo-50 text-indigo-600" hover="hover:border-indigo-300 hover:shadow-indigo-200"
          onClick={() => onNavigate('vocabulary')}
        />
        <DashboardCard 
          title="Speaking" desc="Latih pelafalan dan keberanian bicara." 
          icon={<Mic size={24}/>} color="bg-rose-50 text-rose-600" hover="hover:border-rose-300 hover:shadow-rose-200"
          onClick={() => onNavigate('speaking')}
        />
        <DashboardCard 
          title="Grammar" desc="Pahami struktur kalimat untuk speaking." 
          icon={<LayoutDashboard size={24}/>} color="bg-emerald-50 text-emerald-600" hover="hover:border-emerald-300 hover:shadow-emerald-200"
          onClick={() => onNavigate('grammar')}
        />
        <DashboardCard 
          title="Listening" desc="Latih telinga mendengar monolog Inggris." 
          icon={<Headphones size={24}/>} color="bg-amber-50 text-amber-600" hover="hover:border-amber-300 hover:shadow-amber-200"
          onClick={() => onNavigate('listening')}
        />
        <DashboardCard 
          title="Writing Analyzer" desc="Koreksi tulisanmu secara detail." 
          icon={<PenTool size={24}/>} color="bg-blue-50 text-blue-600" hover="hover:border-blue-300 hover:shadow-blue-200"
          onClick={() => onNavigate('writing_analyzer')}
        />
        <DashboardCard 
          title="Conversation" desc="Simulasi ngobrol bareng tokoh idola." 
          icon={<MessageSquare size={24}/>} color="bg-purple-50 text-purple-600" hover="hover:border-purple-300 hover:shadow-purple-200"
          onClick={() => onNavigate('conversation')}
        />
      </div>

      {/* Achievement System */}
      <div className="mt-12">
          <AchievementSystem />
      </div>
    </div>
  );
}

function DashboardCard({ title, desc, icon, color, hover, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer transition-all duration-300 ${hover} group hover:-translate-y-1`}
    >
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
        {icon}
      </div>
      <h4 className="text-lg font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 mb-4">{desc}</p>
      <div className="flex items-center text-sm font-semibold text-blue-600 gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
        Mulai Belajar <ChevronRight size={16} />
      </div>
    </div>
  );
}

// ==========================================
// MODUL SETUP WRAPPERS
// ==========================================
function SetupModule({ module, basePrompt, inputLabel, placeholder, icon, color, bg, onComplete, isPro }) {
  const [isStarted, setIsStarted] = useState(false);
  const [topic, setTopic] = useState('');

  if (!isPro && !isStarted) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg text-center animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/20">
             <Crown size={48} />
           </div>
           <h2 className="text-3xl font-black text-slate-800 mb-4">Fitur Khusus PRO 👑</h2>
           <p className="text-slate-500 mb-10 text-lg leading-relaxed">
             Modul <strong>{module}</strong> adalah fitur eksklusif. Upgrade akunmu untuk membuka akses tanpa batas ke seluruh materi cerdas RichardMeha AI.
           </p>
           <button 
             onClick={() => window.location.reload()}
             className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-lg"
           >
             Upgrade Sekarang
           </button>
           <p className="mt-6 text-sm text-slate-400 font-medium">Banyak fitur seru lainnya menunggu kamu!</p>
        </div>
      </div>
    );
  }

  if (isStarted) {
    const dynamicPrompt = `${basePrompt}\n\nTopik yang ingin dipelajari murid hari ini adalah: ${topic}`;
    return <ChatModule module={module} basePrompt={dynamicPrompt} topic={topic} onComplete={onComplete} />;
  }

  return (
    <div className="h-full flex items-center justify-center p-4 md:p-6 animate-in zoom-in-95 duration-300">
      <div className="bg-white max-w-md w-full p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner`}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Modul {module}</h2>
        <p className="text-sm text-slate-500 mb-8 text-center px-4">Pilih materi atau topik yang ingin kamu kuasai bersama RichardMeha AI hari ini.</p>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{inputLabel}</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={placeholder}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-base"
              onKeyDown={(e) => e.key === 'Enter' && topic.trim() && setIsStarted(true)}
            />
          </div>
          <button 
            onClick={() => setIsStarted(true)}
            disabled={!topic.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            Mulai Belajar <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ConversationModule({ basePrompt }) {
  const [isStarted, setIsStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [character, setCharacter] = useState('');

  if (isStarted) {
    const dynamicPrompt = `${basePrompt}\n\nTokoh yang mau saya ajak ngobrol adalah: ${character}\nTopik obrolannya adalah: ${topic}`;
    return <ChatModule module="Conversation" basePrompt={dynamicPrompt} topic={`${character} - ${topic}`} startMessage={`Tolong beri contoh dialog antara aku dan ${character} tentang ${topic}`} hideInputAtStart={false} />;
  }

  return (
    <div className="h-full flex items-center justify-center p-4 md:p-6 animate-in zoom-in-95 duration-300">
      <div className="bg-white max-w-md w-full p-6 md:p-8 rounded-3xl shadow-xl shadow-purple-200/50 border border-purple-100">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner">
          <MessageSquare size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Roleplay Percakapan</h2>
        <p className="text-sm text-slate-500 mb-8 text-center">Pilih tokoh favoritmu dan topik obrolan untuk berlatih improvisasi speaking.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Tokoh Simulasi</label>
            <input 
              type="text" 
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              placeholder="Misal: Elon Musk, Taylor Swift..."
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Topik Obrolan</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Misal: Cita-cita, Liburan ke Mars..."
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => setIsStarted(true)}
            disabled={!topic.trim() || !character.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-purple-600/30"
          >
            Siapkan Skenario
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CORE CHAT ENGINE (With STT & TTS)
// ==========================================
function ChatModule({ module, basePrompt, topic = '', startMessage = 'Mulai pelajaran hari ini RichardMeha AI!', hideInputAtStart = false, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length === 0 && hideInputAtStart) {
      sendMessage(startMessage, true);
    } else if (messages.length === 0 && topic) {
      sendMessage(`Topik pilihan saya: ${topic}. Ayo kita mulai sesuai prosedurmu RichardMeha AI!`, true);
    }
  }, []);

  // --- TEXT TO SPEECH (TTS) ---
  const handleTTS = (text) => {
    if ('speechSynthesis' in window) {
      // Clean markdown tags for better reading
      const cleanText = text.replace(/[*_#|]/g, '').replace(/`/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Try to find a good English voice for English parts, but AI mixes ID and EN.
      // We will default to a standard voice.
      utterance.rate = 0.9; 
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.cancel(); // Stop any ongoing speech
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Browser Anda tidak mendukung fitur suara.");
    }
  };

  // --- SPEECH TO TEXT (STT) ---
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Set to english for pronunciation practice

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInputValue(prev => prev + transcript + ' ');
          } else {
            currentTranscript += transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert("Izin Microphone ditolak. Silakan aktifkan izin microphone di pengaturan browser Anda.");
        } else if (event.error === 'no-speech') {
          // Silent error, just stop recording
        } else {
          alert(`Kesalahan Microphone: ${event.error}. Pastikan Anda menggunakan Chrome.`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      alert("Browser Anda tidak mendukung fitur input suara (Microphone). Coba gunakan Chrome.");
    }
  };


  const translateMessage = async (index, text) => {
    // Use the existing message state
    const currentMessages = [...messages];
    if (currentMessages[index].translation) {
      currentMessages[index].showTranslation = !currentMessages[index].showTranslation;
      setMessages(currentMessages);
      return;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Tolong terjemahkan teks Bahasa Inggris berikut ke Bahasa Indonesia yang natural dan santai:\n\n${text}` }] }]
        })
      });
      const data = await res.json();
      const translation = data.candidates[0].content.parts[0].text;
      
      const updatedMessages = [...messages];
      updatedMessages[index].translation = translation;
      updatedMessages[index].showTranslation = true;
      setMessages(updatedMessages);
    } catch (err) {
      console.error("Translation error:", err);
    }
  };

  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        if (res.status === 429 || res.status >= 500) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else {
          throw new Error(`API Error: ${res.status}`);
        }
      } catch (err) {
        if (retries === maxRetries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        retries++;
      }
    }
  };

  const sendMessage = async (text, isSystemInitiated = false) => {
    if (!text.trim()) return;

    if (!apiKey) {
       setMessages(prev => [...prev, { 
        role: 'system', 
        content: '⚠️ API Key Gemini belum diatur. Silakan isi VITE_GEMINI_API_KEY di file .env.' 
      }]);
      return;
    }

    // Stop recording if active
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const newUserMsg = { role: 'user', content: text, isHidden: isSystemInitiated && hideInputAtStart };
    const updatedMessages = [...messages, newUserMsg];
    
    if (!isSystemInitiated) {
      setMessages(updatedMessages);
      setInputValue('');
    } else if (!hideInputAtStart) {
      setMessages(updatedMessages);
    }
    
    setIsLoading(true);

    try {
      const contents = updatedMessages.filter(msg => !msg.isHidden).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: startMessage }] });
      }

      const payload = {
        contents: contents,
        systemInstruction: { parts: [{ text: basePrompt }] },
        generationConfig: { temperature: 0.7 }
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const aiText = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
        // Optional: auto speak AI response
        // handleTTS(aiText); 
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: '⚠️ Gagal terhubung ke AI Tutor. Periksa koneksi internet atau ketersediaan API Key.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Parser Text & Table
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    let inTable = false;
    let tableRows = [];
    const elements = [];

    const flushTable = (keyIndex) => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${keyIndex}`} className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm w-full">
            <table className="min-w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
              <tbody>
                {tableRows.map((row, idx) => {
                  const cols = row.split('|').map(c => c.trim()).filter(c => c);
                  if (row.includes('---')) return null;
                  
                  return (
                    <tr key={idx} className={`${idx === 0 ? 'bg-indigo-50 font-bold text-indigo-900 border-b-2 border-indigo-100' : 'border-t border-slate-100 bg-white'}`}>
                      {cols.map((col, cidx) => (
                        <td key={cidx} className="px-4 py-3 border-r last:border-r-0 border-slate-100 align-top" dangerouslySetInnerHTML={{__html: parseInline(col)}} />
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const parseInline = (str) => {
      return str
        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
        .replace(/\`(.*?)\`/g, '<code class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-xs font-mono font-bold">$1</code>');
    };

    lines.forEach((line, i) => {
      if (line.trim().startsWith('|') || (line.includes('|') && line.length > 10)) {
        inTable = true;
        tableRows.push(line);
      } else {
        flushTable(i);
        if (line.trim() === '') {
           elements.push(<div key={`br-${i}`} className="h-2"></div>);
        } else {
           elements.push(<div key={`text-${i}`} className="mb-1.5 leading-relaxed" dangerouslySetInnerHTML={{__html: parseInline(line)}} />);
        }
      }
    });
    flushTable('end');

    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative">
      {/* Top Banner */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 px-4 md:px-6 flex justify-between items-center absolute top-0 w-full z-10 shadow-sm">
        <div className="flex-1 truncate pr-4">
          <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">{module}</h3>
          {topic && <p className="text-xs text-slate-500 truncate">Topik: <span className="font-medium text-blue-600">{topic}</span></p>}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 md:py-1.5 rounded-full border border-emerald-100 shrink-0">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          RichardMeha AI Online
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pt-20 pb-40 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => {
            if (msg.isHidden) return null;

            if (msg.role === 'user') {
              return (
                <div key={idx} className="flex justify-end items-end gap-2 animate-in slide-in-from-right-2 duration-300">
                  <div className="bg-blue-600 text-white px-4 md:px-5 py-3 md:py-3.5 rounded-3xl rounded-br-sm shadow-md max-w-[85%] md:max-w-[75%] text-sm md:text-base">
                    {msg.content}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 text-xs shadow-inner">
                    {userProfile.name.charAt(0)}
                  </div>
                </div>
              );
            }

            if (msg.role === 'system') {
              return (
                <div key={idx} className="flex justify-center my-4">
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-2 rounded-full font-medium shadow-sm text-center">
                    {msg.content}
                  </div>
                </div>
              );
            }

            // AI Response
            return (
              <div key={idx} className="flex items-start gap-2 md:gap-3 animate-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot size={18} className="md:w-5 md:h-5" />
                </div>
                <div className="flex flex-col gap-1 max-w-[90%] md:max-w-[85%]">
                  <div className="bg-white border border-slate-200 text-slate-700 px-4 md:px-5 py-4 rounded-3xl rounded-tl-sm shadow-sm text-sm md:text-base w-full overflow-hidden leading-relaxed">
                    {renderFormattedText(msg.content)}
                  </div>
                  {/* TTS & Translate Action Buttons for AI Message */}
                  <div className="flex justify-start gap-2 ml-2">
                    <button 
                      onClick={() => handleTTS(msg.content)}
                      className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm transition-colors"
                    >
                      <Volume2 size={12} /> Dengar
                    </button>
                    <button 
                      onClick={() => translateMessage(idx, msg.content)}
                      className={`text-[10px] flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors shadow-sm
                        ${msg.showTranslation 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600'}
                      `}
                    >
                      <Languages size={12} /> {msg.showTranslation ? 'Sembunyikan' : 'Terjemahkan'}
                    </button>
                  </div>
                  {msg.showTranslation && msg.translation && (
                    <div className="mx-2 mt-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-sm text-blue-800 animate-in fade-in slide-in-from-top-1 duration-300 italic">
                       {msg.translation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div className="bg-white border border-slate-200 text-slate-500 px-5 py-4 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-sm font-medium text-slate-400">Mengetik...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-100 via-slate-50 to-transparent pt-6 pb-4 px-3 md:px-6">
        <div className="max-w-4xl mx-auto relative">
          
          {/* Quick Shortcuts */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            <button onClick={() => setInputValue("I'm ready to practice")} className="shrink-0 text-xs bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 px-4 py-2 rounded-full transition-all font-semibold shadow-sm hover:shadow active:scale-95">
              🚀 I'm ready to practice
            </button>
            <button onClick={() => setInputValue("How to say ")} className="shrink-0 text-xs bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 px-4 py-2 rounded-full transition-all font-semibold shadow-sm hover:shadow active:scale-95">
              🤔 How to say ... ?
            </button>
            <button onClick={() => setInputValue("Tolong koreksi jawabanku")} className="shrink-0 text-xs bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 px-4 py-2 rounded-full transition-all font-semibold shadow-sm hover:shadow active:scale-95">
              📝 Tolong koreksi
            </button>
          </div>

          {/* Form Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
            className={`flex items-end gap-2 bg-white rounded-3xl border-2 shadow-lg transition-all p-2
              ${isRecording ? 'border-rose-400 shadow-rose-100' : 'border-slate-200 shadow-slate-200/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50'}
            `}
          >
            {/* STT Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 shrink-0 rounded-full transition-all flex items-center justify-center h-10 w-10 md:h-12 md:w-12 self-center ${
                isRecording 
                  ? 'bg-rose-100 text-rose-600 animate-pulse' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
              title="Bicara sekarang"
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Text Area */}
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputValue);
                }
              }}
              placeholder={isRecording ? "Mendengarkan suara Anda..." : "Ketik jawaban atau bicara..."}
              className="flex-1 max-h-32 min-h-[44px] md:min-h-[48px] bg-transparent resize-none outline-none py-3 px-2 text-sm md:text-base text-slate-700 self-center"
              rows={1}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition-all shrink-0 flex items-center justify-center h-10 w-10 md:h-12 md:w-12 self-center active:scale-90"
            >
              <Send size={18} className={inputValue.trim() && !isLoading ? "ml-1" : ""} />
            </button>
          </form>
          
          <div className="text-center mt-2 hidden md:block">
            <span className="text-[10px] text-slate-400 font-medium">Tekan <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 shadow-sm">Enter</kbd> untuk mengirim, <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 shadow-sm">Shift + Enter</kbd> untuk baris baru.</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
