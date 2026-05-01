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
  Languages,
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  Lock
} from 'lucide-react';
import { Lightbulb } from 'lucide-react';
import { LoginPage, SubscriptionPage } from './Auth';
import LevelTest from './LevelTest';
import ProgressDashboard from './ProgressDashboard';
import WritingAnalyzer from './WritingAnalyzer';
import PronunciationCoach from './PronunciationCoach';
import AchievementSystem from './AchievementSystem';
import PaymentModal from './PaymentModal';
import { supabase } from './supabaseClient';
import { CURRICULUM } from './data/curriculum';
import { VOCABULARY_TOPICS, GRAMMAR_TOPICS, SPEAKING_TOPICS, LISTENING_TOPICS, CONVERSATION_CHARACTERS } from './data/topics';

// --- KONFIGURASI API GEMINI ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY_B64 ? atob(import.meta.env.VITE_GEMINI_API_KEY_B64) : (import.meta.env.VITE_GEMINI_API_KEY || ""); 

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

// --- MASTER PROMPT (AI GRAVITY) ---
const RICHARD_MASTER_PROMPT = (userProfile, currentTopic) => `
You are RichardMeha AI, an intelligent and interactive English learning tutor from Kampung Inggris.
User: ${userProfile.name} (${userProfile.gender}). Current Level: ${userProfile.level}.
Topic: "${currentTopic}".

== CORE RULES ==
- Stay strictly on the selected learning topic: "${currentTopic}".
- Never go off-topic.
- Always be interactive, ask questions back.
- Act like a real human tutor, friendly and natural.
- If user is passive, you must guide conversation.
- Always create a learning flow (not random answers).

== DUAL TUTOR MODES ==
1. Indonesian Tutor (👤 Explanation Mode):
- Use when user speaks Indonesian or asks for explanation.
- Explain in Bahasa Indonesia clearly.
- Help user understand meaning, give examples, translate when needed.

2. English Tutor (👤 Practice Mode):
- Use when user speaks English or is practicing conversation.
- Speak ONLY English.
- Encourage user to reply in English.
- Correct mistakes gently.
- Continue conversation like real chat.

== BEHAVIOR ==
- Always ask follow-up questions to keep conversation alive.
- Suggest next sub-topic if conversation slows.
- Give mini challenges (e.g., "try to make your own sentence using 'I go to...'").
- Detect user level and adjust difficulty automatically.
- Give short, clear responses (not robotic).
- Natural style, like chatting on WhatsApp. Friendly, supportive, engaging.

== CORRECTION MODE ==
- If user makes a mistake:
  ❌ [Incorrect sentence]
  ✅ [Correct sentence]
- Explain the grammar briefly in Indonesian.
`;

const getPrompts = (userProfile) => {
  return {
    assessment: `Kamu adalah RichardMeha AI. Lakukan CEFR assessment untuk ${userProfile.name}. Mulai dengan Speaking Test.`,
    vocabulary: RICHARD_MASTER_PROMPT(userProfile, "Vocabulary Mastery"),
    grammar: RICHARD_MASTER_PROMPT(userProfile, "Grammar for Speaking"),
    speaking: RICHARD_MASTER_PROMPT(userProfile, "Speaking Coach"),
    listening: RICHARD_MASTER_PROMPT(userProfile, "Listening & Talk"),
    conversation: RICHARD_MASTER_PROMPT(userProfile, "Daily Conversation"),
    quiz: RICHARD_MASTER_PROMPT(userProfile, "English Quiz Challenge"),
    call_tutor: RICHARD_MASTER_PROMPT(userProfile, "Voice Call Practice")
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
      await fetchProfile(user);
      setAuthState('app');
    } else {
      setAuthState('login');
    }
    setIsInitializing(false);
  };

  const fetchProfile = async (userObj) => {
    // userObj can be a full Supabase user object or just an ID string
    const userId = typeof userObj === 'string' ? userObj : userObj.id;
    const metaName = typeof userObj === 'object' ? (userObj.user_metadata?.full_name || '') : '';

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUserProfile({
        name: data.full_name || metaName || 'User',
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
      // Create profile if not exists (failsafe), still load name from auth metadata
      if (metaName) setUserProfile(prev => ({ ...prev, name: metaName }));
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
      let planDetails = { name: '', price: '' };
      if (plan === 'monthly') planDetails = { name: 'Pro Bulanan', price: '199.000' };
      else if (plan === 'yearly') planDetails = { name: 'Pro 1 Tahun', price: '250.000/bln' };
      else if (plan === 'discount') planDetails = { name: 'Pro Diskon', price: '999.000' };
      
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
        return <SetupModule module="Vocabulary" basePrompt={prompts.vocabulary} icon={<BookA size={24}/>} color="text-indigo-600" bg="bg-indigo-100" onComplete={(score) => saveProgress('vocabulary', score)} isPro={userProfile.is_pro} topicsList={VOCABULARY_TOPICS} />;
      case 'speaking':
        return <SetupModule module="Speaking Coach" basePrompt={prompts.speaking} icon={<Mic size={24}/>} color="text-rose-600" bg="bg-rose-100" onComplete={(score) => saveProgress('speaking', score)} isPro={userProfile.is_pro} topicsList={SPEAKING_TOPICS} />;
      case 'grammar':
        return <SetupModule module="Grammar for Speaking" basePrompt={prompts.grammar} icon={<LayoutDashboard size={24}/>} color="text-emerald-600" bg="bg-emerald-100" onComplete={(score) => saveProgress('grammar', score)} isPro={userProfile.is_pro} topicsList={GRAMMAR_TOPICS} />;
      case 'listening':
        return <SetupModule module="Listening & Talking" basePrompt={prompts.listening} icon={<Headphones size={24}/>} color="text-amber-600" bg="bg-amber-100" onComplete={(score) => saveProgress('listening', score)} isPro={userProfile.is_pro} topicsList={LISTENING_TOPICS} />;
      case 'writing_analyzer':
        return <WritingAnalyzer isPro={userProfile.is_pro} />;


      case 'call_tutor':
        return <ChatModule module="🎧 Call Tutor" basePrompt={prompts.call_tutor} initialCallMode={true} topic="Daily Practice" onBack={() => handleTabChange('home')} />;
      case 'conversation':
        return <ConversationModule basePrompt={prompts.conversation} isPro={userProfile.is_pro} charactersList={CONVERSATION_CHARACTERS} />;
      case 'quiz':
        return <ChatModule module="🧠 Quiz & Challenge" basePrompt={prompts.quiz} topic="English Quiz" onBack={() => handleTabChange('home')} />;
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
          <NavItem icon={<BookA />} label="📚 Belajar (Vocab)" isActive={activeTab === 'vocabulary'} onClick={() => handleTabChange('vocabulary')} />
          <NavItem icon={<Headphones />} label="🎧 Call Tutor" isActive={activeTab === 'call_tutor'} onClick={() => handleTabChange('call_tutor')} />
          <NavItem icon={<MessageSquare />} label="💬 Chat Tutor" isActive={activeTab === 'conversation'} onClick={() => handleTabChange('conversation')} />
          <NavItem icon={<Zap />} label="🧠 Quiz & Challenge" isActive={activeTab === 'quiz'} onClick={() => handleTabChange('quiz')} />
          
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3 mt-6">Praktek & Analisa</p>
          <NavItem icon={<Mic />} label="Speaking Coach" isActive={activeTab === 'speaking'} onClick={() => handleTabChange('speaking')} />
          <NavItem icon={<PenTool />} label="Writing Analyzer" isActive={activeTab === 'writing_analyzer'} onClick={() => handleTabChange('writing_analyzer')} />
          <NavItem icon={<GraduationCap />} label="Grammar Speaking" isActive={activeTab === 'grammar'} onClick={() => handleTabChange('grammar')} />
          
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
        isOpen={isPaymentModalOpen} userName={userProfile.name}
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
function SetupModule({ module, basePrompt, icon, color, bg, onComplete, isPro, topicsList = [] }) {
  const [isStarted, setIsStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [showProWarning, setShowProWarning] = useState(false);

  // 45% Free logic
  const freeCount = Math.ceil(topicsList.length * 0.45);

  const handleSelectTopic = (selectedTopic, index) => {
    if (index >= freeCount && !isPro) {
      setShowProWarning(true);
      return;
    }
    // Stop any TTS when switching topics
    window.speechSynthesis?.cancel();
    setTopic(selectedTopic);
    setIsStarted(true);
  };

  const handleBackToTopics = () => {
    window.speechSynthesis?.cancel();
    setIsStarted(false);
    setTopic('');
  };

  if (showProWarning) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg text-center animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/20">
             <Crown size={48} />
           </div>
           <h2 className="text-3xl font-black text-slate-800 mb-4">Fitur Khusus PRO 👑</h2>
           <p className="text-slate-500 mb-10 text-lg leading-relaxed">
             Topik <strong>Premium</strong> ini adalah fitur eksklusif. Upgrade akunmu untuk membuka akses tanpa batas ke seluruh materi cerdas RichardMeha AI.
           </p>
           <button 
             onClick={() => window.location.reload()}
             className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-lg"
           >
             Upgrade Sekarang
           </button>
           <button onClick={() => setShowProWarning(false)} className="mt-6 text-sm text-slate-400 font-medium hover:text-slate-600 transition-colors">Kembali pilih topik gratis</button>
        </div>
      </div>
    );
  }

  if (isStarted) {
    // IMPORTANT: Inject topic explicitly into both system prompt and first message
    const dynamicPrompt = `${basePrompt}

== INSTRUKSI TOPIK WAJIB ==
Topik pembelajaran SAAT INI yang HARUS kamu bahas adalah: "${topic}"
JANGAN membahas topik lain. Mulai sesi dengan memperkenalkan topik "${topic}" secara langsung.`;
    return <ChatModule key={topic} module={module} basePrompt={dynamicPrompt} topic={topic} onBack={handleBackToTopics} onComplete={onComplete} />;
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in zoom-in-95 duration-300 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-inner shrink-0`}>
          {icon}
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800">Modul {module}</h2>
          <p className="text-slate-500">Pilih topik yang ingin kamu kuasai bersama RichardMeha AI hari ini.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pb-20 custom-scrollbar pr-2">
        {topicsList.map((t, i) => {
          const isLocked = i >= freeCount && !isPro;
          return (
            <button 
              key={i}
              onClick={() => handleSelectTopic(t.name || t, i)}
              // Instant response - no hover translate animation on mobile
              className={`p-4 rounded-2xl border-2 text-left group relative overflow-hidden flex flex-col min-h-[80px] justify-center active:scale-95
                ${isLocked 
                  ? 'bg-slate-50 border-slate-200 hover:border-amber-300 cursor-pointer' 
                  : 'bg-white border-blue-100 hover:border-blue-500 hover:shadow-md'
                }
              `}
            >
              {isLocked && (
                <div className="absolute top-3 right-3 text-amber-500 bg-amber-100 p-1.5 rounded-lg opacity-80">
                  <Lock size={16} />
                </div>
              )}
              <span className={`font-bold text-sm md:text-base leading-snug pr-6 ${isLocked ? 'text-slate-500' : 'text-slate-700 group-hover:text-blue-700'}`}>
                {t.name || t}
              </span>
              {t.topic && <span className="text-xs text-slate-400 mt-1 block opacity-80">{t.topic}</span>}
            </button>
          )
        })}
      </div>
    </div>
  );
}

function ConversationModule({ basePrompt, isPro, charactersList = [] }) {
  const [isStarted, setIsStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [character, setCharacter] = useState('');
  const [showProWarning, setShowProWarning] = useState(false);

  const freeCount = Math.ceil(charactersList.length * 0.45);

  const handleSelectChar = (charObj, index) => {
    if (index >= freeCount && !isPro) {
      setShowProWarning(true);
      return;
    }
    setCharacter(charObj.name);
    setTopic(charObj.topic);
    setIsStarted(true);
  };

  if (showProWarning) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg text-center animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/20">
             <Crown size={48} />
           </div>
           <h2 className="text-3xl font-black text-slate-800 mb-4">Karakter Premium 👑</h2>
           <p className="text-slate-500 mb-10 text-lg leading-relaxed">
             Tokoh percakapan ini eksklusif. Upgrade akunmu untuk ngobrol dengan seluruh tokoh cerdas RichardMeha AI.
           </p>
           <button 
             onClick={() => window.location.reload()}
             className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-lg"
           >
             Upgrade Sekarang
           </button>
           <button onClick={() => setShowProWarning(false)} className="mt-6 text-sm text-slate-400 font-medium hover:text-slate-600 transition-colors">Kembali pilih tokoh gratis</button>
        </div>
      </div>
    );
  }

  if (isStarted) {
    const dynamicPrompt = `${basePrompt}

Tokoh yang mau saya ajak ngobrol adalah: ${character}
Topik obrolannya adalah: ${topic}`;
    return <ChatModule module="Conversation" basePrompt={dynamicPrompt} topic={`${character} - ${topic}`} startMessage={`Tolong beri contoh dialog antara aku dan ${character} tentang ${topic}`} hideInputAtStart={false} />;
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in zoom-in-95 duration-300 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
          <MessageSquare size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800">Roleplay Percakapan</h2>
          <p className="text-slate-500">Pilih tokoh favoritmu dan topik obrolan untuk berlatih improvisasi speaking.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20 custom-scrollbar pr-2">
        {charactersList.map((t, i) => {
          const isLocked = i >= freeCount && !isPro;
          return (
            <button 
              key={i}
              onClick={() => handleSelectChar(t, i)}
              className={`p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden flex flex-col min-h-[100px] justify-center
                ${isLocked 
                  ? 'bg-slate-50 border-slate-200 hover:border-amber-300 cursor-pointer' 
                  : 'bg-white border-purple-100 hover:border-purple-500 hover:shadow-lg hover:-translate-y-1'
                }
              `}
            >
              {isLocked && (
                <div className="absolute top-3 right-3 text-amber-500 bg-amber-100 p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                  <Lock size={16} />
                </div>
              )}
              <span className={`font-bold text-lg leading-snug pr-6 ${isLocked ? 'text-slate-500 group-hover:text-amber-700' : 'text-purple-700 group-hover:text-purple-800'}`}>
                {t.name}
              </span>
              <span className="text-sm text-slate-500 mt-2 block opacity-90 leading-tight">{t.topic}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
}

function ChatModule({ module, basePrompt, topic = '', startMessage = 'Mulai pelajaran hari ini RichardMeha AI!', hideInputAtStart = false, onComplete, onBack, initialCallMode = false }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [translations, setTranslations] = useState({}); // { index: text }
  const [suggestions, setSuggestions] = useState([]);
  const [activeToolsIndex, setActiveToolsIndex] = useState(null);
  const idleTimerRef = useRef(null);
  const [isTypingEffect, setIsTypingEffect] = useState(false);

  const [callMode, setCallMode] = useState(initialCallMode);
  const [subtitle, setSubtitle] = useState('');
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const hasInitialized = useRef(false);
  const audioRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Language Detection Logic
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setSuggestions([]);
    idleTimerRef.current = setTimeout(() => {
      if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
        handleSuggest(messages.length - 1);
      }
    }, 5000);
  };

  const handleTranslate = async (index) => {
    if (translations[index]) {
      setTranslations(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      return;
    }

    const textToTranslate = messages[index].content;
    setIsLoading(true);
    try {
      const payload = {
        contents: [{ role: 'user', parts: [{ text: textToTranslate }] }],
        systemInstruction: { parts: [{ text: "Translate this English sentence to natural, casual, friendly Indonesian (Kampung Inggris style). ONLY return the translation." }] }
      };
      const res = await fetch('http://localhost:3000/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const translation = data.candidates[0].content.parts[0].text;
      setTranslations(prev => ({ ...prev, [index]: translation }));
    } catch (err) {
      console.error("Translation failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggest = async (index) => {
    const history = messages.slice(0, index + 1).map(m => `${m.role}: ${m.content}`).join('\n');
    try {
      const payload = {
        contents: [{ role: 'user', parts: [{ text: `Conversation history:\n${history}\n\nSuggest 3–4 very short, natural English response options for the user based on the last AI message. Format: Just the options separated by | character. No numbering.` }] }],
        systemInstruction: { parts: [{ text: "You are a helpful assistant providing English conversation suggestions." }] }
      };
      const res = await fetch('http://localhost:3000/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const rawSuggestions = data.candidates[0].content.parts[0].text;
      const suggestionsList = rawSuggestions.split('|').map(s => s.trim()).filter(s => s);
      setSuggestions(suggestionsList);
    } catch (err) {
      console.error("Suggestions failed", err);
    }
  };

  const detectLanguage = (text) => {
    const indonesianWords = ["apa", "saya", "kamu", "belajar", "mau", "halo", "bisa", "tolong", "ngomong", "arti", "terjemahkan"];
    const englishWords = ["what", "i", "you", "learn", "want", "hello", "can", "please", "speak", "meaning", "translate"];

    const lowerText = text.toLowerCase();
    let scoreID = indonesianWords.filter(w => lowerText.includes(w)).length;
    let scoreEN = englishWords.filter(w => lowerText.includes(w)).length;

    return scoreID > scoreEN ? "id" : "en";
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (messages.length === 0 && hideInputAtStart) {
      sendMessage(startMessage, true);
    } else if (messages.length === 0 && topic) {
      sendMessage(`TOPIK HARI INI: ${topic}. Mulai sesi pembelajaran tentang "${topic}" sekarang!`, true);
    }
  }, []);

  // --- TTS: Gemini 2.5 Flash Neural Voice ---
  const handleTTS = async (text) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    if (!text?.trim()) return;
    setIsSpeaking(true);
    setSubtitle(text);

    try {
      const res = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: 'Puck', 
        })
      });

      if (!res.ok) throw new Error('TTS API failed');

      const data = await res.json();
      if (!data.audioData) throw new Error('No audio returned');

      const audioBytes = atob(data.audioData);
      const audioArray = new Uint8Array(audioBytes.length);
      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
      }
      const blob = new Blob([audioArray], { type: data.mimeType || 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        setSubtitle('');
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        if (callMode) toggleRecording();
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.play();

    } catch (err) {
      console.warn('Fallback to browser voice');
      setIsSpeaking(false);
      const cleanText = text.replace(/<[^>]*>/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
      if (cleanText && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(cleanText);
        u.lang = detectLanguage(cleanText) === 'id' ? 'id-ID' : 'en-US';
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => { setIsSpeaking(false); if (callMode) toggleRecording(); };
        window.speechSynthesis.speak(u);
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    window.speechSynthesis?.cancel();
    if (audioRef.current) audioRef.current.pause();
    setIsSpeaking(false);

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = callMode ? 'en-US' : 'id-ID';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          if (callMode) {
            sendMessage(finalTranscript);
          } else {
            setInputValue(prev => prev + finalTranscript + ' ');
          }
        }
      };

      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setIsRecording(false);
    }
  };

  const sendMessage = async (text, isSystemInitiated = false) => {
    if (!text.trim()) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const lang = detectLanguage(text);
    const modeInstruction = lang === 'id' 
      ? "\n(Note: User speaks Indonesian. Explain/help using Indonesian Tutor persona.)"
      : "\n(Note: User speaks English. Practice conversation using English Tutor persona.)";

    const newUserMsg = { role: 'user', content: text, isHidden: isSystemInitiated && hideInputAtStart };
    const updatedMessages = [...messages, newUserMsg];
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const contents = updatedMessages.filter(msg => !msg.isHidden).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const payload = {
        contents: contents,
        systemInstruction: { parts: [{ text: basePrompt + modeInstruction }] },
        generationConfig: { temperature: 0.7 }
      };

      const res = await fetch('http://localhost:3000/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const aiText = data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
      handleTTS(aiText);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: '⚠️ Connection failed.' }]);
    } finally {
      setIsLoading(false);
    }
  };

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
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-xs font-mono font-bold">$1</code>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/❌ (.*)/g, '<span class="text-rose-600 font-bold">❌ $1</span>')
        .replace(/✅ (.*)/g, '<span class="text-emerald-600 font-bold">✅ $1</span>');
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
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Call Mode Overlay */}
      {callMode && (
        <div className="absolute inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-500">
          <button onClick={() => setCallMode(false)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center gap-8 mb-12">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl ${isSpeaking || isRecording ? 'ring-8 ring-blue-500/30 animate-pulse' : ''}`}>
              <Bot size={64} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black mb-2">RichardMeha AI</h2>
              <p className="text-blue-400 font-bold tracking-widest uppercase text-xs">
                {isSpeaking || isTypingEffect ? 'AI sedang berbicara...' : isRecording ? 'Listening...' : 'Ready'}
              </p>
            </div>
          </div>

          <div className="max-w-xl w-full bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] text-center min-h-[150px] flex items-center justify-center">
             <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-slate-200">
               {subtitle || "Silakan bicara, saya mendengarkan..."}
             </p>
          </div>

          <div className="mt-12 flex gap-6">
            <button 
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 ${isRecording ? 'bg-rose-500 text-white' : 'bg-white text-slate-900'}`}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>
        </div>
      )}

      {/* Header UI */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 px-4 md:px-6 flex justify-between items-center z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {onBack && (
            <button onClick={onBack} className="shrink-0 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 bg-slate-100 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 border border-slate-200">
              <ChevronRight size={14} className="rotate-180" /> <span className="hidden sm:inline">Kembali</span>
            </button>
          )}
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">{module}</h3>
            {topic && <p className="text-xs text-slate-500 truncate">Topik: <span className="font-medium text-blue-600">{topic}</span></p>}
          </div>
        </div>
        <button 
          onClick={() => setCallMode(true)}
          className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 hover:bg-blue-100 transition-all active:scale-95"
        >
          <Headphones size={16} /> Mode Telepon
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 space-y-6">
        {messages.map((msg, idx) => (
          !msg.isHidden && (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2 w-full`}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 w-full animate-in slide-in-from-bottom-2 duration-300`}>
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                  {renderFormattedText(msg.content)}
                  
                  {msg.role === 'ai' && (
                    <div className="mt-2 flex justify-end gap-1 border-t border-slate-100 pt-1">
                      <button 
                        onClick={() => handleTranslate(idx)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        title="Translate to ID"
                      >
                        <Languages size={14} />
                      </button>
                      <button 
                        onClick={() => handleSuggest(idx)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        title="Suggest Answers"
                      >
                        <Lightbulb size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {translations[idx] && (
                <div className="ml-10 max-w-[80%] bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-xs md:text-sm border border-emerald-100 animate-in fade-in slide-in-from-top-1 duration-300">
                  <p className="font-medium italic leading-relaxed">{translations[idx]}</p>
                </div>
              )}

              {idx === messages.length - 1 && msg.role === 'ai' && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-10 mt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                  {suggestions.map((s, si) => (
                    <button 
                      key={si}
                      onClick={() => { setInputValue(s); sendMessage(s); }}
                      className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-full text-xs md:text-sm hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium pl-10">
            <Loader2 size={14} className="animate-spin" /> RichardMeha AI sedang berpikir...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }} className="max-w-4xl mx-auto flex gap-2">
          <input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isRecording ? "Mendengarkan..." : "Ketik pesan atau tanya RichardMeha AI..."}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all"
          />
          <button type="button" onClick={toggleRecording} className={`p-3 rounded-2xl transition-all ${isRecording ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button disabled={!inputValue.trim() || isLoading} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-slate-200 active:scale-90 transition-all">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
