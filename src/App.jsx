import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
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
  Search,
  Send,
  Loader2,
  ArrowDown,
  GraduationCap,
  Sparkles,
  Bot,
  Flame,
  Trophy,
  ChevronRight,
  Languages,
  Settings,
  BarChart2,
  Zap,
  ArrowUpRight,
  PenTool,
  Crown,
  Moon,
  Sun,
  LogOut,
  Lightbulb,
  Lock,
  Shield,
  RefreshCw
} from 'lucide-react';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { LoginPage, SubscriptionPage } from './Auth';
import PaymentModal from './PaymentModal';
import { supabase } from './supabaseClient';
import { CURRICULUM } from './data/curriculum';
import { AiOrchestrator } from './AiOrchestrator';
import { VOCABULARY_TOPICS as VOCAB_RAW, GRAMMAR_TOPICS as GRAMMAR_RAW, LISTENING_TOPICS as LISTENING_RAW, CONVERSATION_CHARACTERS as CHARS_RAW } from './data/topics';

// --- LAZY LOADED COMPONENTS ---
const AchievementSystem = lazy(() => import('./AchievementSystem'));
const LevelTest = lazy(() => import('./LevelTest'));
const ProgressDashboard = lazy(() => import('./ProgressDashboard'));
const WritingAnalyzer = lazy(() => import('./WritingAnalyzer'));
const PronunciationCoach = lazy(() => import('./PronunciationCoach'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const Leaderboard = lazy(() => import('./Leaderboard'));

// --- DATA PROFIL DEFAULT ---
const DEFAULT_PROFILE = {
  name: "User",
  gender: "male",
  level: "Pemula (A1-A2)",
  xp: 0,
  streak: 0,
  has_completed_initial_test: false,
  is_pro: false,
  subscription_plan: 'Free',
  is_admin: false,
  email: ''
};

// --- KOMPONEN LOADING ---
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] h-full w-full">
    <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
    <p className="text-slate-500 font-medium animate-pulse text-sm">Memuat modul pintar...</p>
  </div>
);

// --- MASTER PROMPT (RICHARDMEHA AI v6.0 - HUMAN PRO) ---
const RICHARD_MASTER_PROMPT = (userProfile, currentTopic) => `
SYSTEM: RichardMeha AI – The Ultimate Private English Tutor & Global Professional Mentor

You are a highly empathetic, helpful, and friendly English Tutor AI. You talk to the user like a close, supportive friend (you can use casual, affectionate Indonesian terms like "beb" or "kamu" when speaking in Indonesian). You are highly responsive to their needs, always correct their mistakes gently, encourage them enthusiastically, and adapt your tone to match their energy. Never sound like a rigid robot.
Your name is Richard. You are a high-level professional mentor for ${userProfile.name}.

== 💎 CORE PERSONALITY RULES ==
- NEVER say "As an AI model..." Talk like a real human friend.
- BE CONCISE: Keep your main response between 1 to 3 sentences only. NO long-winded explanations unless specifically asked.
- NO BOT-LIKE LISTS: Do not use bullet points or numbered lists in daily conversation. Just natural paragraphs.
- VOICE OPTIMIZATION: Your sentences must be easy to read out loud. No weird symbols or complicated formatting.

== 🗣️ LANGUAGE FLOW ==
- BILINGUAL EXPERT: If the user uses Indonesian, you are a master at explaining English concepts in clear, professional Indonesian, but always push them back to English politely.
- If the user uses English, stay 100% in English like a native speaker.

== ✅ CORRECTION STYLE (THE FRIENDLY PRO) ==
- COMPLIMENT FIRST: If they did well, say "Nice! Perfect English." or "Cool, that's natural."
- CORRECT SMOOTHLY: Only correct if there's a real mistake. Use: "Just a small tip, we usually say: [Correction] ✅"
- Jargon-free: Explain like a friend, not a textbook.

== 🧑‍🏫 TEACHING & CONTENT ==
- Stay relevant to the topic: ${currentTopic}.
- Use modern, trendy, and professional examples (Remote work, AI tools, Startups, Personal Branding, Global Networking).
- Always end with 1 short, engaging question in English to keep them talking.

== 📊 DATA TRACKING (HIDDEN) ==
At the very end of your response, AFTER the separator "---", append a single JSON object.
{
  "grammar_score": 0-100,
  "vocab_score": 0-100,
  "fluency_score": 0-100,
  "comprehension_score": 0-100,
  "mistakes": ["mistake 1"],
  "level_estimate": "A1-C2",
  "confidence": 0.0-1.0,
  "feedback": "Short encouraging feedback",
  "phonetic": "phonetic help if needed"
}
---
== USER CONTEXT ==
Name: ${userProfile.name} | Level: ${userProfile.level} | Current Focus: ${currentTopic}
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

// --- GLOBAL STATE CONTEXT ---
export const GlobalContext = React.createContext(null);

export default function App() {
  const [authState, setAuthState] = useState('login'); // 'login', 'subscription', 'assessment', 'app', 'admin'
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('richard_active_tab') || 'home');
  const [activeGoalId, setActiveGoalId] = useState(() => localStorage.getItem('richard_active_goal') || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const logoClickCount = useRef(0);
  const logoClickTimeout = useRef(null);

  useEffect(() => {
    localStorage.setItem('richard_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeGoalId) localStorage.setItem('richard_active_goal', activeGoalId);
    else localStorage.removeItem('richard_active_goal');
  }, [activeGoalId]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: '', price: 0 });
  const [recommendation, setRecommendation] = useState('vocabulary');
  const [isInitializing, setIsInitializing] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('richard_theme') || 'light');
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [showLevelUpConfetti, setShowLevelUpConfetti] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState('');
  const [isModulOpen, setIsModulOpen] = useState(true);
  const [isPraktekOpen, setIsPraktekOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Sinkronisasi otomatis API Key terbaru dari Database (Supabase) untuk pengguna HP
    const syncApiKeyFromDB = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('app_settings').select('value').eq('id', 'api_keys').maybeSingle();
        if (data && data.value) {
          let keysObj = data.value;
          if (typeof keysObj === 'string') {
            try { keysObj = JSON.parse(keysObj); } catch (e) { keysObj = { core: data.value, translation: '', voice: '' }; }
          }
          setGlobalApiKey(keysObj);
        }
      } catch (err) { }
    };
    syncApiKeyFromDB();

    // Listener proaktif agar transisi sesi berjalan mulus tanpa looping
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setAuthState('login');
        setUserProfile(DEFAULT_PROFILE);
      }
    });

    checkUser();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);
  useEffect(() => { if (authState === 'app') fetchStats(); }, [authState]);

  const fetchStats = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_progress')
      .select('skill_type, score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      let totalScore = 0;
      const stats = { speaking: 0, writing: 0, grammar: 0, vocabulary: 0 };
      const counts = { speaking: 0, writing: 0, grammar: 0, vocabulary: 0 };
      data.forEach(p => {
        totalScore += p.score;
        if (stats[p.skill_type] !== undefined) { stats[p.skill_type] += p.score; counts[p.skill_type]++; }
      });

      const avgScore = Math.round(totalScore / data.length);
      let newLevel = "Beginner (A1)";
      if (avgScore <= 20) newLevel = "Beginner (A1)";
      else if (avgScore <= 40) newLevel = "Elementary (A2)";
      else if (avgScore <= 60) newLevel = "Intermediate (B1)";
      else if (avgScore <= 75) newLevel = "Upper Intermediate (B2)";
      else if (avgScore <= 90) newLevel = "Advanced (C1)";
      else newLevel = "Proficient (C2)";

      setUserProfile(prev => {
        if (prev.level && prev.level !== newLevel && prev.name !== "User" && prev.level !== "Pemula (A1-A2)") {
          supabase.from('user_profiles').update({ level: newLevel }).eq('id', user.id).then();
          setShowLevelUpConfetti(true);
          setLevelUpMessage(newLevel);
          setTimeout(() => { setShowLevelUpConfetti(false); setLevelUpMessage(''); }, 6000);
          return { ...prev, level: newLevel };
        }
        return prev;
      });

      let lowestSkill = 'vocabulary';
      let lowestScore = 101;
      Object.keys(stats).forEach(skill => {
        const avg = counts[skill] > 0 ? Math.round(stats[skill] / counts[skill]) : 0;
        if (avg < lowestScore) { lowestScore = avg; lowestSkill = skill; }
      });
      setRecommendation(lowestSkill);
    }
  };

  const checkUser = async () => {
    setIsInitializing(true);
    if (!supabase) {
      setAuthState('login');
      setIsInitializing(false);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchProfile(user);
      } else {
        setAuthState('login');
      }
    } catch (err) {
      console.error("Auth check failed", err);
      setAuthState('login');
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchProfile = async (userObj) => {
    if (!supabase) return;
    try {
      const userId = typeof userObj === 'string' ? userObj : userObj.id;
      const userEmail = typeof userObj === 'object' ? userObj.email : '';
      const metaName = typeof userObj === 'object' ? (userObj.user_metadata?.full_name || '') : '';
      const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();

      if (error) throw error;

      const isAdmin = userEmail === 'richardpl.meha@gmail.com';

      setUserProfile(prev => ({
        ...prev,
        name: data?.full_name || metaName || 'User',
        gender: data?.gender || "male",
        level: data?.level || "Beginner (A1)",
        xp: data?.xp || 0,
        streak: data?.streak || 0,
        has_completed_initial_test: data?.has_completed_initial_test || false,
        is_pro: data?.is_pro || false,
        subscription_plan: data?.subscription_plan || 'Free',
        is_admin: isAdmin,
        email: userEmail
      }));

      // PERBAIKAN: Routing Anti-Flicker untuk Admin
      if (localStorage.getItem('owner_mode') === 'admin') {
        setAuthState('admin');
      } else if (isAdmin) {
        if (localStorage.getItem('owner_mode') === 'user') {
          setAuthState('app');
        } else {
          localStorage.setItem('owner_mode', 'admin');
          setAuthState('admin');
        }
      } else if (data && !data.has_completed_initial_test) {
        setAuthState('assessment');
      } else {
        setAuthState('app');
      }
    } catch (err) {
      console.error("Profile fetch failed", err);

      const fallbackEmail = typeof userObj === 'object' ? userObj.email : '';
      const isFallbackAdmin = fallbackEmail === 'richardpl.meha@gmail.com';

      setUserProfile(prev => ({
        ...prev,
        name: typeof userObj === 'object' ? (userObj.user_metadata?.full_name || 'User') : 'User',
        is_admin: isFallbackAdmin,
        email: fallbackEmail
      }));

      if (localStorage.getItem('owner_mode') === 'admin' || (isFallbackAdmin && localStorage.getItem('owner_mode') !== 'user')) {
        setAuthState('admin');
      } else {
        setAuthState('app');
      }
    }
  };

  const handleLogin = (role) => {
    if (role === 'admin') {
      localStorage.setItem('owner_mode', 'admin');
    } else if (role === 'owner_user_bypass') {
      localStorage.setItem('owner_mode', 'user');
    }
    checkUser();
  };

  const handleSelectPlan = (plan) => {
    if (plan === 'free') { setAuthState('app'); } else {
      let planDetails = { name: '', price: '' };
      if (plan === 'monthly') planDetails = { name: 'Pro Bulanan', price: '199.000' };
      else if (plan === 'yearly') planDetails = { name: 'Pro 1 Tahun', price: '250.000/bln' };
      else if (plan === 'discount') planDetails = { name: 'Pro Diskon', price: '999.000' };
      setSelectedPlan(planDetails);
      setIsPaymentModalOpen(true);
    }
  };

  const triggerUpgrade = (name = 'Pro Bulanan', price = '199.000') => {
    setSelectedPlan({ name, price });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setAuthState('app');
    setIsPaymentModalOpen(false);
  };

  const handleAssessmentComplete = async (level) => {
    setUserProfile(prev => ({ ...prev, level, has_completed_initial_test: true }));
    setActiveTab('home'); setAuthState('app');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchProfile(user.id);
  };

  const handleLogout = async () => {
    localStorage.removeItem('owner_bypass');
    localStorage.removeItem('owner_mode');
    await supabase.auth.signOut();
    setAuthState('login');
    setUserProfile(DEFAULT_PROFILE);
  };
  const toggleTheme = () => setTheme(prev => {
    const newTheme = prev === 'light' ? 'dark' : 'light';
    localStorage.setItem('richard_theme', newTheme);
    return newTheme;
  });

  const saveProgress = async (skill, score, details = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_progress').insert({ user_id: user.id, skill_type: skill, score: score, details: details });
      await supabase.rpc('increment_xp', { user_id: user.id, amount: 10 });
    }
  };

  const handleTabChange = (tab) => { setActiveTab(tab); setIsSidebarOpen(false); setSearchQuery(''); };

  const handleLogoClick = () => {
    if (userProfile.is_admin) {
      logoClickCount.current += 1;
      if (logoClickCount.current >= 2) {
        logoClickCount.current = 0;
        localStorage.setItem('owner_mode', 'admin');
        setAuthState('admin');
      }
      clearTimeout(logoClickTimeout.current);
      logoClickTimeout.current = setTimeout(() => {
        logoClickCount.current = 0;
      }, 1500);
    }
  };

  const renderContent = () => {
    const prompts = getPrompts(userProfile);
    switch (activeTab) {
      case 'home':
        return <HomeDashboard onNavigate={handleTabChange} userProfile={userProfile} recommendation={recommendation} onStartGoal={(id) => { setActiveGoalId(id); setActiveTab('goal_session'); }} onUpgrade={() => triggerUpgrade()} />;
      case 'leaderboard': return <Leaderboard userProfile={userProfile} onNavigate={handleTabChange} />;
      case 'progress': return <ProgressDashboard userProfile={userProfile} onNavigate={handleTabChange} />;
      case 'assessment': return <LevelTest onComplete={handleAssessmentComplete} />;
      case 'vocabulary': return <SetupModule userProfile={userProfile} setUserProfile={setUserProfile} module="Vocabulary" basePrompt={prompts.vocabulary} icon={<BookA size={24} />} color="text-indigo-600" bg="bg-indigo-100" onComplete={(score) => saveProgress('vocabulary', score)} isPro={userProfile.is_pro} topicsList={VOCABULARY_TOPICS} onUpgrade={() => triggerUpgrade()} />;
      case 'speaking': return <PronunciationCoach userProfile={userProfile} isPro={userProfile.is_pro} onComplete={(score) => saveProgress('speaking', score)} onUpgrade={() => triggerUpgrade()} />;
      case 'grammar': return <SetupModule userProfile={userProfile} setUserProfile={setUserProfile} module="Grammar for Speaking" basePrompt={prompts.grammar} icon={<LayoutDashboard size={24} />} color="text-emerald-600" bg="bg-emerald-100" onComplete={(score) => saveProgress('grammar', score)} isPro={userProfile.is_pro} topicsList={GRAMMAR_TOPICS} onUpgrade={() => triggerUpgrade()} />;
      case 'listening': return <SetupModule userProfile={userProfile} setUserProfile={setUserProfile} module="Listening & Talking" basePrompt={prompts.listening} icon={<Headphones size={24} />} color="text-amber-600" bg="bg-amber-100" onComplete={(score) => saveProgress('listening', score)} isPro={userProfile.is_pro} topicsList={LISTENING_TOPICS} onUpgrade={() => triggerUpgrade()} />;
      case 'writing_analyzer': return <WritingAnalyzer userProfile={userProfile} onUpgrade={() => triggerUpgrade()} />;
      case 'call_tutor': return <ChatModule userProfile={userProfile} setUserProfile={setUserProfile} module="🎧 Call Tutor" basePrompt={prompts.call_tutor} initialCallMode={true} topic="Daily Practice" onBack={() => handleTabChange('home')} />;
      case 'conversation': return <ConversationModule userProfile={userProfile} setUserProfile={setUserProfile} basePrompt={prompts.conversation} isPro={userProfile.is_pro} charactersList={CONVERSATION_CHARACTERS} onUpgrade={() => triggerUpgrade()} />;
      case 'goal_session':
        const safeLevel = userProfile?.level || "Beginner (A1)";
        const goalData = (safeLevel.includes('A1') || safeLevel.includes('Beginner'))
          ? {
            'intro': {
              topic: 'Basic Introduction',
              msg: "Hey... nice to meet you 😊\nLet’s start simple, okay?\n\nCan you tell me your name in English?",
              suggestions: ["My name is...", "I am ... years old", "I am from Indonesia", "I like..."]
            },
            'numbers': {
              topic: 'Numbers & Colors',
              msg: "Alright! Let’s play with numbers and colors 🎨\n\nCan you count from 1 to 5 in English?",
              suggestions: ["One, two, three...", "Red, blue, green", "I see a blue car"]
            },
            'daily': {
              topic: 'Daily Routines',
              msg: "Good morning! 😊\nToday we are going to talk about 'Daily Routines'.\n\nWhat do you usually do first in the morning? Langsung cek HP atau minum kopi dulu? 😄",
              suggestions: ["I check my phone", "I have coffee", "I take a shower", "I usually wake up at..."]
            }
          }
          : {};
        const activeGoal = goalData[activeGoalId] || { topic: 'General Practice', msg: 'Hello!', suggestions: [] };
        return (
          <ChatModule
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            module="🎯 Goal Practice"
            basePrompt={RICHARD_MASTER_PROMPT(userProfile, activeGoal.topic)}
            topic={activeGoal.topic}
            startMessage={activeGoal.msg}
            initialSuggestions={activeGoal.suggestions}
            hideInputAtStart={true}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'quiz': return <ChatModule userProfile={userProfile} setUserProfile={setUserProfile} module="🧠 Quiz & Challenge" basePrompt={prompts.quiz} topic="English Quiz" onBack={() => handleTabChange('home')} />;
      case 'settings':
        return (
          <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Settings className="text-blue-600" /> Pengaturan Akun</h2>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Tema Aplikasi</h4><p className="text-xs text-slate-500">Pilih tampilan yang nyaman di mata.</p></div>
                <button onClick={toggleTheme} className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-all active:scale-95">{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
              </div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Status Akun</h4><p className="text-xs text-slate-500">Paket langganan aktif Anda.</p></div>
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${userProfile.is_pro ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>{userProfile.is_pro ? '👑 Pro' : 'Free'}</span>
              </div>

              {/* Tambahan: Tombol Clear Cache untuk HP Android */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Refresh Sistem</h4><p className="text-xs text-slate-500">Hapus cache API & muat ulang aplikasi.</p></div>
                <button onClick={() => { localStorage.removeItem('gemini_api_key'); window.location.reload(true); }} className="px-5 py-2.5 bg-blue-50 text-blue-600 font-black rounded-xl hover:bg-blue-100 transition-all active:scale-95 text-xs shadow-sm">
                  <RefreshCw size={14} className="inline-block mr-1" /> CLEAR CACHE
                </button>
              </div>

              <div className="p-6"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all active:scale-95"><LogOut size={18} /> Keluar dari Akun</button></div>
            </div>
          </div>
        );
      default: return <HomeDashboard onNavigate={handleTabChange} userProfile={userProfile} recommendation={recommendation} onStartGoal={(id) => { setActiveGoalId(id); setActiveTab('goal_session'); }} onUpgrade={() => triggerUpgrade()} />;
    }
  };

  if (isInitializing || showSplash) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative overscroll-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-1000 fade-in">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 mb-6 relative">
            <div className="absolute inset-0 rounded-[2rem] border-4 border-white/20 animate-ping"></div>
            <Sparkles className="text-white w-12 h-12 animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">
            RichardMeha<span className="text-blue-500"> AI</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide mb-8">Ultimate English Tutor</p>

          <div className="flex flex-col items-center gap-3 mt-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Memuat Sistem...</span>
          </div>
        </div>
      </div>
    );
  }
  if (authState === 'login') return <LoginPage onLogin={handleLogin} />;
  if (authState === 'assessment') return (
    <Suspense fallback={<LoadingFallback />}>
      <LevelTest onComplete={handleAssessmentComplete} />
    </Suspense>
  );
  if (authState === 'subscription') return (
    <>
      <SubscriptionPage onSelectPlan={handleSelectPlan} />
      <PaymentModal isOpen={isPaymentModalOpen} userName={userProfile.name} onClose={() => setIsPaymentModalOpen(false)} onPaymentSuccess={handlePaymentSuccess} planName={selectedPlan.name} price={selectedPlan.price} />
    </>
  );
  if (authState === 'admin') {
    // PROTECTED ROUTE GUARD: Kunci halaman Admin
    if (!isInitializing && !userProfile.is_admin && userProfile.email !== 'richardpl.meha@gmail.com') {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <Shield className="text-rose-500 mb-4" size={64} />
          <h2 className="text-3xl font-black mb-2">Akses Ditolak</h2>
          <p className="text-slate-400 mb-8">Halaman ini dilindungi secara ketat. Anda akan dialihkan kembali.</p>
          <button onClick={() => setAuthState('app')} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/30">
            Kembali ke Aplikasi
          </button>
        </div>
      );
    }
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminDashboard onLogout={handleLogout} onSwitchToUser={() => { localStorage.setItem('owner_mode', 'user'); setAuthState('app'); }} userEmail={userProfile.email} />
      </Suspense>
    );
  }

  const isMatch = (text) => text.toLowerCase().includes(searchQuery.toLowerCase());
  const showMain = !searchQuery || isMatch('Dasbor Belajar') || isMatch('Statistik Progres') || isMatch('Papan Peringkat') || isMatch('Menu Utama');
  const showLearning = !searchQuery || isMatch('Test CEFR') || isMatch('Belajar (Vocab)') || isMatch('Call Tutor') || isMatch('Chat Tutor') || isMatch('Quiz') || isMatch('Modul Pembelajaran');
  const showPractice = !searchQuery || isMatch('Speaking Coach') || isMatch('Writing Analyzer') || isMatch('Grammar Speaking') || isMatch('Praktek & Analisa');
  const showAccount = !searchQuery || isMatch('Pengaturan') || isMatch('Admin') || isMatch('Log Out') || isMatch('Akun');
  const effectiveModulOpen = searchQuery ? true : isModulOpen;
  const effectivePraktekOpen = searchQuery ? true : isPraktekOpen;

  return (
    <GlobalContext.Provider value={{ globalApiKey, userProfile }}>
      <div className={`flex h-screen h-[100dvh] w-full font-sans overflow-hidden overscroll-none transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b1121] text-slate-200 dark-mode' : 'bg-slate-50 text-slate-800'}`}>
        {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />}
        <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-64 h-screen h-[100dvh] bg-[#0f172a] text-slate-300 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="h-16 flex items-center justify-between px-6 bg-[#0b1121] pt-[env(safe-area-inset-top)]"><h1 onClick={handleLogoClick} title={userProfile.is_admin ? 'Klik 2x untuk ke Admin' : ''} className="text-xl font-bold tracking-wider flex items-center gap-2 text-white cursor-pointer select-none active:scale-95 transition-transform touch-manipulation"><Sparkles className="text-blue-500" /> RichardMeha<span className="text-blue-500"> AI</span></h1><button className="md:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button></div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">{userProfile.name.charAt(0)}</div><div className="flex flex-col"><span className="text-base font-semibold text-white">{userProfile.name}</span><span className="text-xs text-blue-400 flex items-center gap-1"><Trophy size={12} /> {userProfile.level}</span></div></div>

          {/* SEARCH BAR */}
          <div className="px-4 pt-5 pb-2 shrink-0">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Cari modul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700/50 text-sm text-slate-200 rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all placeholder:text-slate-500 shadow-inner"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors animate-in fade-in zoom-in duration-200">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <nav className="flex-1 py-2 px-4 space-y-1 overflow-y-auto custom-scrollbar transform-gpu overscroll-contain">
            {showMain && (
              <div className="animate-in fade-in duration-300">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3 mt-2">Menu Utama</p>
                {(!searchQuery || isMatch('Dasbor Belajar')) && <NavItem icon={<LayoutDashboard />} label="Dasbor Belajar" isActive={activeTab === 'home'} onClick={() => handleTabChange('home')} />}
                {(!searchQuery || isMatch('Statistik Progres')) && <NavItem icon={<BarChart2 />} label="Statistik Progres" isActive={activeTab === 'progress'} onClick={() => handleTabChange('progress')} />}
                {(!searchQuery || isMatch('Papan Peringkat')) && <NavItem icon={<Trophy />} label="Papan Peringkat" isActive={activeTab === 'leaderboard'} onClick={() => handleTabChange('leaderboard')} />}
              </div>
            )}

            {showLearning && (
              <div className="animate-in fade-in duration-300">
                <button onClick={() => setIsModulOpen(!isModulOpen)} className="w-full flex items-center justify-between px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors">
                  <span>Modul Pembelajaran</span>
                  <ChevronRight size={14} className={`transition-transform duration-200 ${effectiveModulOpen ? 'rotate-90' : ''}`} />
                </button>
                <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${effectiveModulOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {(!searchQuery || isMatch('Test CEFR (Awal)')) && <NavItem icon={<GraduationCap />} label="Test CEFR (Awal)" isActive={activeTab === 'assessment'} onClick={() => handleTabChange('assessment')} />}
                  {(!searchQuery || isMatch('Belajar (Vocab)')) && <NavItem icon={<BookA />} label="📚 Belajar (Vocab)" isActive={activeTab === 'vocabulary'} onClick={() => handleTabChange('vocabulary')} />}
                  {(!searchQuery || isMatch('Call Tutor')) && <NavItem icon={<Headphones />} label="🎧 Call Tutor" isActive={activeTab === 'call_tutor'} onClick={() => handleTabChange('call_tutor')} />}
                  {(!searchQuery || isMatch('Chat Tutor')) && <NavItem icon={<MessageSquare />} label="💬 Chat Tutor" isActive={activeTab === 'conversation'} onClick={() => handleTabChange('conversation')} />}
                  {(!searchQuery || isMatch('Quiz & Challenge')) && <NavItem icon={<Zap />} label="🧠 Quiz & Challenge" isActive={activeTab === 'quiz'} onClick={() => handleTabChange('quiz')} />}
                </div>
              </div>
            )}

            {showPractice && (
              <div className="animate-in fade-in duration-300">
                <button onClick={() => setIsPraktekOpen(!isPraktekOpen)} className="w-full flex items-center justify-between px-3 mt-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors">
                  <span>Praktek & Analisa</span>
                  <ChevronRight size={14} className={`transition-transform duration-200 ${effectivePraktekOpen ? 'rotate-90' : ''}`} />
                </button>
                <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${effectivePraktekOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {(!searchQuery || isMatch('Speaking Coach')) && <NavItem icon={<Mic />} label="Speaking Coach" isActive={activeTab === 'speaking'} onClick={() => handleTabChange('speaking')} />}
                  {(!searchQuery || isMatch('Writing Analyzer')) && <NavItem icon={<PenTool />} label="Writing Analyzer" isActive={activeTab === 'writing_analyzer'} onClick={() => handleTabChange('writing_analyzer')} />}
                  {(!searchQuery || isMatch('Grammar Speaking')) && <NavItem icon={<GraduationCap />} label="Grammar Speaking" isActive={activeTab === 'grammar'} onClick={() => handleTabChange('grammar')} />}
                </div>
              </div>
            )}

            {showAccount && (
              <div className="animate-in fade-in duration-300">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3 mt-4">Akun</p>
                {(!searchQuery || isMatch('Pengaturan')) && <NavItem icon={<Settings />} label="Pengaturan" isActive={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />}
                {userProfile.email === 'richardpl.meha@gmail.com' && (!searchQuery || isMatch('Beralih ke Admin')) && (
                  <button onClick={() => { localStorage.setItem('owner_mode', 'admin'); setAuthState('admin'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300 transition-all duration-200 hover:translate-x-1 font-medium"><Shield size={18} /> <span className="text-sm">Beralih ke Admin</span></button>
                )}
                {(!searchQuery || isMatch('Log Out')) && <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-all duration-200 hover:translate-x-1"><LogOut size={18} /> <span className="text-sm">Log Out</span></button>}
              </div>
            )}

            {searchQuery && !showMain && !showLearning && !showPractice && !showAccount && (
              <div className="px-4 py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Search className="text-slate-500" size={20} />
                </div>
                <p className="text-sm text-slate-400 font-medium">Modul tidak ditemukan</p>
              </div>
            )}
          </nav>
        </aside>
        <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
          <header className="h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-30 shrink-0 md:hidden shadow-sm">
            <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"><Menu size={24} /></button><h2 onClick={handleLogoClick} title={userProfile.is_admin ? 'Klik 2x untuk ke Admin' : ''} className="text-lg font-semibold text-slate-800 flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform touch-manipulation">RichardMeha<span className="text-blue-600"> AI</span></h2></div>
            <div className="flex items-center gap-2"><div className="flex items-center gap-1 text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full"><Flame size={16} className="fill-orange-500" /> {userProfile.streak}</div></div>
          </header>
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative bg-slate-50/50 transform-gpu overscroll-none scroll-smooth pb-[env(safe-area-inset-bottom)]" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Suspense fallback={<LoadingFallback />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
        <PaymentModal isOpen={isPaymentModalOpen} userName={userProfile.name} onClose={() => setIsPaymentModalOpen(false)} onPaymentSuccess={handlePaymentSuccess} planName={selectedPlan.name} price={selectedPlan.price} />
      </div>

      {/* GLOBAL LEVEL UP CONFETTI POP-UP */}
      {showLevelUpConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[1000] flex items-center justify-center overflow-hidden">
          <style>
            {`
              @keyframes confettiFall {
                0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
              }
              .animate-confetti { animation: confettiFall linear forwards; }
            `}
          </style>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500 pointer-events-auto" />
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/40 animate-bounce">
              <Trophy size={64} className="text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight drop-shadow-xl">LEVEL UP!</h2>
            <p className="text-xl md:text-2xl text-yellow-300 font-bold drop-shadow-md text-center px-4">Kamu berhasil mencapai {levelUpMessage} 🎉</p>
          </div>
          {[...Array(120)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
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
    </GlobalContext.Provider>
  );
}


// ==========================================
// DATA & CURRICULUM
// ==========================================

const mapTopics = (arr) => arr.map(t => ({ name: t, level: "Semua Level" }));
const VOCABULARY_TOPICS = mapTopics(VOCAB_RAW);
const GRAMMAR_TOPICS = mapTopics(GRAMMAR_RAW);
const LISTENING_TOPICS = mapTopics(LISTENING_RAW);
const CONVERSATION_CHARACTERS = CHARS_RAW.map(c => {
  const femaleNames = ["Taylor Swift", "Oprah Winfrey", "Emma Watson", "Rina"];
  return {
    name: c.name,
    role: c.topic,
    gender: femaleNames.includes(c.name) ? 'female' : 'male',
    prompt: `Act as ${c.name} and talk about ${c.topic}. YOU MUST SPEAK PRIMARILY IN ENGLISH, just like the real person.`
  };
});


// ==========================================
// HOME DASHBOARD
// ==========================================
function HomeDashboard({ onNavigate, userProfile, recommendation, onStartGoal, onUpgrade }) {
  const safeLevel = userProfile?.level || 'Pemula Dasar (A1)';
  const levelData = CURRICULUM[safeLevel] || CURRICULUM['Pemula Dasar (A1)'];

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 overflow-x-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden group w-full max-w-full">
          <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <GraduationCap size={240} />
          </div>
          <div className="relative z-10 w-full">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/30">
              <Sparkles size={16} className="text-yellow-300" />
              <span className="text-xs font-black uppercase tracking-widest">Level: {userProfile.level}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight break-words">Lanjut Belajar,<br />{userProfile.name}!</h2>
            <p className="text-blue-100 mb-8 md:text-lg max-w-md opacity-90 leading-relaxed break-words">
              Target kamu hari ini: **{levelData?.goals?.[0]?.name || levelData?.goals?.[0] || 'Mulai belajar'}**. RichardMeha AI sudah siapkan materinya!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={() => onNavigate(recommendation)}
                className="w-full sm:w-auto bg-white text-blue-700 font-black px-8 py-4 rounded-2xl shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] active:scale-95 flex items-center justify-center gap-2 group"
              >
                <Zap size={20} className="fill-blue-700 group-hover:scale-125 transition-transform" />
                Mulai {recommendation.toUpperCase()}
              </button>
              <div className="flex flex-wrap gap-4 items-center w-full">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20"><Flame size={18} className="text-white fill-white" /></div>
                  <div><p className="text-[10px] text-blue-200 font-bold uppercase tracking-tighter">Streak</p><p className="text-lg font-black leading-none">{userProfile.streak} Hari</p></div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <div className="bg-yellow-400 p-2 rounded-xl shadow-lg shadow-yellow-400/20"><Trophy size={18} className="text-yellow-900 fill-yellow-900" /></div>
                  <div><p className="text-[10px] text-blue-200 font-bold uppercase tracking-tighter">Total XP</p><p className="text-lg font-black leading-none">{userProfile.xp}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-xl flex flex-col w-full max-w-full">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Trophy size={24} className="text-yellow-500" /> Goals Level {userProfile.level.split(' ')[0]}</h3>
          <div className="space-y-4 flex-1 w-full overflow-hidden">
            {(() => {
              const goals = levelData?.lessons || levelData?.goals || [];
              const freeCount = Math.ceil(goals.length * 0.4);
              return goals.map((goal, i) => {
                const isLocked = i >= freeCount && !userProfile.is_pro;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (isLocked) {
                        onUpgrade();
                      } else if (goal.id) {
                        onStartGoal(goal.id);
                      }
                    }}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${isLocked ? 'bg-slate-50 border-slate-100 opacity-70 grayscale-[0.5]' : 'bg-slate-50 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-lg hover:-translate-y-1 group'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm transition-colors ${isLocked ? 'bg-slate-200 text-slate-400' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      {isLocked ? <Lock size={12} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black truncate transition-colors ${isLocked ? 'text-slate-500' : 'text-slate-700 group-hover:text-blue-700'}`}>{goal.title || goal.name || goal}</p>
                      {goal.id && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{isLocked ? 'PRO FEATURE' : (goal.topic || 'Klik untuk mulai latihan')}</p>}
                    </div>
                    {isLocked ? (
                      <Crown size={16} className="text-amber-500 fill-amber-500" />
                    ) : (
                      goal.id && <ArrowUpRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                );
              });
            })()}
          </div>
          <button onClick={() => onNavigate('assessment')} className="mt-8 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 mx-auto">Cek level lagi? Ulangi Tes <ArrowUpRight size={14} /></button>
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-800 mt-12 mb-6 px-2">Modul Belajar Pintar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        <DashboardCard title="Vocabulary" desc="Perkaya kosa kata dengan Box of Words." icon={<BookA size={24} />} color="bg-indigo-50 text-indigo-600" onClick={() => onNavigate('vocabulary')} />
        <DashboardCard title="Speaking" desc="Latih pelafalan dan keberanian bicara." icon={<Mic size={24} />} color="bg-rose-50 text-rose-600" onClick={() => onNavigate('speaking')} />
        <DashboardCard title="Grammar" desc="Pahami struktur kalimat untuk speaking." icon={<LayoutDashboard size={24} />} color="bg-emerald-50 text-emerald-600" onClick={() => onNavigate('grammar')} />
        <DashboardCard title="Listening" desc="Latih telinga mendengar monolog Inggris." icon={<Headphones size={24} />} color="bg-amber-50 text-amber-600" onClick={() => onNavigate('listening')} />
        <DashboardCard title="Writing Analyzer" desc="Koreksi tulisanmu secara detail." icon={<PenTool size={24} />} color="bg-blue-50 text-blue-600" onClick={() => onNavigate('writing_analyzer')} />
        <DashboardCard title="Conversation" desc="Simulasi ngobrol bareng tokoh idola." icon={<MessageSquare size={24} />} color="bg-purple-50 text-purple-600" onClick={() => onNavigate('conversation')} />
      </div>
      <div className="mt-12">
        <Suspense fallback={<div className="h-32 flex items-center justify-center bg-slate-50 rounded-3xl border border-slate-100"><Loader2 className="animate-spin text-blue-400" /></div>}>
          <AchievementSystem userProfile={userProfile} onNavigate={onNavigate} onUpgrade={onUpgrade} />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardCard({ title, desc, icon, color, onClick }) {
  return (
    <div onClick={onClick} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-400 dark:hover:border-indigo-500 group w-full max-w-full overflow-hidden">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>{icon}</div>
      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{desc}</p>
      <div className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">Mulai Belajar <ChevronRight size={16} /></div>
    </div>
  );
}

// ==========================================
// MODUL SETUP WRAPPERS
// ==========================================
function SetupModule({ userProfile, setUserProfile, module, basePrompt, icon, color, bg, onComplete, isPro, topicsList = [], onUpgrade }) {
  const [isStarted, setIsStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const freeCount = Math.ceil(topicsList.length * 0.45);

  const handleSelectTopic = (selectedTopic, index) => {
    if (index >= freeCount && !isPro) { onUpgrade(); return; }
    setTopic(selectedTopic); setIsStarted(true);
  };

  if (isStarted) return <ChatModule userProfile={userProfile} setUserProfile={setUserProfile} module={module} basePrompt={basePrompt} topic={topic} onComplete={onComplete} onBack={() => setIsStarted(false)} />;

  return (
    <div className="p-4 md:p-10 w-full max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h2 className="text-4xl font-black text-slate-800 mb-2 flex items-center gap-3">{icon} {module}</h2><p className="text-slate-500 font-medium">Pilih topik yang ingin kamu kuasai hari ini.</p></div>
        {!isPro && <div className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl border border-amber-200 flex items-center gap-3 shadow-sm"><Crown size={20} className="fill-amber-700" /><div><p className="text-[10px] font-black uppercase tracking-wider">Akses Terbatas</p><p className="text-xs font-bold">Dapatkan 100+ topik dengan Pro!</p></div></div>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topicsList.map((t, i) => (
          <div key={i} onClick={() => handleSelectTopic(t.name, i)} className={`group p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative overflow-hidden ${i >= freeCount && !isPro ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-white border-slate-100 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1'}`}>
            <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
            <h4 className="font-black text-slate-800 group-hover:text-blue-700 transition-colors">{t.name}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">{t.level}</p>
            {i >= freeCount && !isPro && <div className="absolute top-4 right-4 text-amber-500"><Crown size={16} className="fill-amber-500" /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversationModule({ userProfile, setUserProfile, basePrompt, isPro, charactersList = [], onUpgrade }) {
  const [isStarted, setIsStarted] = useState(false);
  const [character, setCharacter] = useState(null);
  const freeCount = Math.ceil(charactersList.length * 0.45);

  const handleSelectCharacter = (char, index) => {
    if (index >= freeCount && !isPro) { onUpgrade(); return; }
    setCharacter(char); setIsStarted(true);
  };

  if (isStarted) return <ChatModule userProfile={userProfile} setUserProfile={setUserProfile} module={`Chat with ${character.name}`} basePrompt={`${basePrompt}\n${character.prompt}`} topic={`Chat with ${character.name}`} characterName={character.name} characterGender={character.gender} onBack={() => setIsStarted(false)} />;

  return (
    <div className="p-4 md:p-10 w-full max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
      <h2 className="text-4xl font-black text-slate-800 mb-2 flex items-center gap-3"><MessageSquare size={36} className="text-purple-600" /> Conversation Mode</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {charactersList.map((c, i) => (
          <div key={i} onClick={() => handleSelectCharacter(c, i)} className={`group p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden ${i >= freeCount && !isPro ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-white border-slate-100 hover:border-purple-400 hover:shadow-xl hover:-translate-y-1'}`}>
            <div className="w-20 h-20 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center text-3xl font-black mb-6 group-hover:scale-110 transition-transform">{c.name.charAt(0)}</div>
            <h4 className="text-xl font-black text-slate-800 group-hover:text-purple-700 transition-colors">{c.name}</h4>
            <p className="text-slate-500 font-medium mb-4">{c.role}</p>
            {i >= freeCount && !isPro && <div className="absolute top-6 right-6 text-amber-500"><Crown size={20} className="fill-amber-500" /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}


function NavItem({ icon, label, isActive, onClick }) {
  return (<button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1 ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><span className={`${isActive ? 'text-white' : ''}`}>{icon}</span><span className="text-sm whitespace-nowrap">{label}</span></button>);
}


function ChatModule({
  userProfile,
  setUserProfile,
  module,
  basePrompt,
  topic = '',
  startMessage = "Hello! Richard here. Are you ready to practice your English today? 😊",
  hideInputAtStart = false,
  onComplete,
  onBack,
  initialCallMode = false,
  initialSuggestions = [],
  characterName = '',
  characterGender = 'male'
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callMode, setCallMode] = useState(initialCallMode);
  const [subtitle, setSubtitle] = useState('');

  // Interactive & Gamification States
  const [translations, setTranslations] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [lastScore, setLastScore] = useState(null);
  const [isTypingEffect, setIsTypingEffect] = useState(false);
  const [micStatus, setMicStatus] = useState('idle'); // 'idle', 'listening', 'processing', 'detected'
  const [voicePersonality, setVoicePersonality] = useState('friendly'); // 'friendly', 'strict', 'buddy'
  const [sttLang, setSttLang] = useState('en-US');
  const idleTimerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const hasInitialized = useRef(false);

  const lastSentTextRef = useRef('');
  const lastSentTimeRef = useRef(0);
  const currentTranscriptRef = useRef('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Tampilkan tombol melayang jika user scroll ke atas lebih dari 150px
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 150);
  };

  // Audio API untuk memutar suara 'Ding' murni tanpa file external
  const playDing = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // Nada tinggi (C6)
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime); // Set volume awal
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5); // Efek fade out
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) { console.warn("Web Audio API tidak didukung", e); }
  };

  const scrollToBottom = () => {
    // Menggunakan requestAnimationFrame agar kalkulasi scroll presisi setelah DOM selesai di-render
    requestAnimationFrame(() => {
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 150);
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
      const translation = await AiOrchestrator.translate(textToTranslate, globalApiKey);
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
      const data = await AiOrchestrator.chat(payload, globalApiKey);
      const rawSuggestions = data.candidates[0].content.parts[0].text;
      const suggestionsList = rawSuggestions.split('|').map(s => s.trim()).filter(s => s);
      setSuggestions(suggestionsList);
    } catch (err) {
      console.error("Suggestions failed", err);
    }
  };

  const detectLanguage = (text) => {
    const indoWords = [
      "saya", "kamu", "dia", "mereka", "kita", "kami", "apa", "kenapa", "bagaimana", "kapan", "siapa", "dimana",
      "makan", "minum", "tidur", "bingung", "ngerti", "paham", "tau", "tahu", "halo", "hai", "bisa", "iya",
      "tidak", "bukan", "gak", "nggak", "udah", "sudah", "belum", "gimana", "dong", "deh", "nih", "tuh", "sih",
      "kok", "banget", "kalau", "kalo", "buat", "biar", "lagi", "aja", "saja", "bagus", "benar", "bener",
      "salah", "coba", "ini", "itu", "dan", "tapi", "karena", "untuk", "dari", "ke", "di", "sama", "dengan",
      "kasih", "beri", "oke", "hari", "orang", "lebih", "sangat", "paling", "sekali", "kalimat", "kata",
      "bilang", "ngomong", "dengar", "denger", "lihat", "liat", "kayak", "seperti", "mantap", "keren", "yakin", "ya"
    ];
    const englishWords = [
      "i", "you", "he", "she", "they", "we", "what", "why", "how", "when", "who", "where",
      "eat", "drink", "sleep", "confused", "understand", "know", "hello", "hi", "can", "yes",
      "no", "not", "already", "yet", "please", "very", "if", "for", "let", "again", "just",
      "good", "right", "wrong", "try", "this", "that", "and", "but", "because", "from", "to", "at",
      "with", "give", "ok", "day", "people", "more", "most", "sentence", "word", "say", "speak",
      "hear", "listen", "see", "look", "like", "awesome", "cool", "sure", "is", "am", "are",
      "do", "does", "did", "was", "were", "will", "would", "could", "should", "have", "has", "had",
      "the", "a", "an", "in", "on", "of", "about", "it", "my", "your", "so", "much", "too",
      "well", "great", "perfect", "job", "nice", "work", "english", "practice", "ready", "now", "time", "today"
    ];
    const lower = text.toLowerCase();
    let indoScore = 0;
    let engScore = 0;

    const words = lower.match(/\b\w+\b/g) || [];
    words.forEach(w => {
      if (indoWords.includes(w)) indoScore++;
      if (englishWords.includes(w)) engScore++;
    });

    return engScore > indoScore ? "en" : "id";
  };

  const handleTTS = async (text) => {
    if (!text) return;
    setIsSpeaking(true);
    const cleanText = text.replace(/❌[\s\S]*?✅/g, '').replace(/[✅❌*#_\\]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').substring(0, 600).trim();
    const isIndo = detectLanguage(cleanText) === 'id';
    let rate = 0.9;
    let pitch = 1.0;
    if (characterName === "Gordon Ramsay") { pitch = 0.8; rate = 1.05; }
    else if (characterName === "Taylor Swift") { pitch = 1.2; rate = 0.95; }
    else if (characterName === "Elon Musk") { pitch = 0.85; rate = 0.85; }
    else if (characterName === "Barack Obama") { pitch = 0.6; rate = 0.8; }
    else if (characterName === "Sherlock Holmes") { pitch = 0.8; rate = 1.1; }
    else if (characterName === "Oprah Winfrey") { pitch = 0.9; rate = 0.9; }
    else if (characterName === "Steve Jobs") { pitch = 0.9; rate = 0.9; }
    else if (characterName === "Keanu Reeves") { pitch = 0.5; rate = 0.75; }
    else if (characterName === "Emma Watson") { pitch = 1.1; rate = 0.95; }
    else if (characterName === "Albert Einstein") { pitch = 0.7; rate = 0.85; }
    else if (characterGender === 'female' && pitch === 1.0) { pitch = 1.2; }
    await AiOrchestrator.speak(cleanText, globalApiKey, { lang: isIndo ? 'id-ID' : 'en-US', pitch, rate, voiceId: characterGender === 'female' ? 'EXAVITQu4vr4xnSDxMaL' : '21m00Tcm4TlvDq8ikWAM', onEnd: () => setIsSpeaking(false) });
  };

  const toggleRecording = async () => {
    if (isRecording) {
      manualStopRef.current = true;
      setMicStatus('processing');
      setIsRecording(false);
      try {
        const checkAvail = await SpeechRecognition.available().catch(() => ({ available: false }));
        if (checkAvail.available) {
          await SpeechRecognition.stop();
        }
        recognitionRef.current?.stop();
      } catch (e) { console.error("Stop error", e); }

      // Kirim pesan segera setelah dihentikan
      const textToSend = currentTranscriptRef.current.trim() || inputValue.trim();
      if (textToSend) {
        sendMessage(textToSend, false, true);
      } else {
        setMicStatus('idle');
      }
      currentTranscriptRef.current = '';
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    // UI Feedback Instan
    setIsRecording(true);
    setMicStatus('listening');
    currentTranscriptRef.current = '';

    try {
      const checkAvail = await SpeechRecognition.available().catch(() => ({ available: false }));

      if (checkAvail.available) {
        const perm = await SpeechRecognition.checkPermissions();
        if (perm.speechRecognition !== 'granted') {
          const req = await SpeechRecognition.requestPermissions();
          if (req.speechRecognition !== 'granted') {
            alert("Izin mikrofon diperlukan.");
            setIsRecording(false);
            setMicStatus('idle');
            return;
          }
        }

        await SpeechRecognition.removeAllListeners();

        SpeechRecognition.addListener('listeningState', (data) => {
          if (data.status === 'stopped') {
            setIsRecording(false);
            setMicStatus('idle');
            const textToSend = currentTranscriptRef.current.trim();
            if (textToSend) {
              sendMessage(textToSend, false, true);
            }
            currentTranscriptRef.current = '';
          }
        });

        SpeechRecognition.addListener('partialResults', (data) => {
          if (data.matches && data.matches.length > 0) {
            const transcript = data.matches[0];
            currentTranscriptRef.current = transcript;
            setInputValue(transcript);
            setMicStatus('detected');
          }
        });

        await SpeechRecognition.start({
          language: sttLang,
          maxResults: 1,
          prompt: "RichardMeha AI mendengarkan...",
          partialResults: true,
          popup: false,
        });
        return;
      }
      throw new Error("Native API tidak tersedia");
    } catch (error) {
      console.warn("Native Mic error, fallback to Web API", error);

      const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!WebSpeechRecognition) {
        alert("Browser tidak mendukung fitur mikrofon.");
        setIsRecording(false);
        setMicStatus('idle');
        return;
      }

      if (!recognitionRef.current) {
        recognitionRef.current = new WebSpeechRecognition();
        recognitionRef.current.lang = sttLang;
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
      }

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript;
            currentTranscriptRef.current = final;
            setInputValue(final);
            // Optional: Auto-send on final result in Web API if needed,
            // but user wants click-to-stop, so we just store it.
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (interimTranscript) {
          currentTranscriptRef.current = interimTranscript;
          setInputValue(interimTranscript);
          setMicStatus('detected');
        }
      };

      recognitionRef.current.onerror = () => { setIsRecording(false); setMicStatus('idle'); };
      recognitionRef.current.onend = () => {
        setIsRecording(false); setMicStatus('idle');
        const textToSend = currentTranscriptRef.current.trim();
        if (textToSend) {
          sendMessage(textToSend, false, true);
        }
        currentTranscriptRef.current = '';
      };

      try { recognitionRef.current.start(); } catch (err) { setIsRecording(false); setMicStatus('idle'); }
    }
  };

  const sendMessage = async (text, isSystemInitiated = false, isVoiceInput = false) => {
    if (!text.trim()) return;

    // Pencegah AI membalas ganda (Anti-Duplicate System)
    const now = Date.now();
    if (!isSystemInitiated && text === lastSentTextRef.current && now - lastSentTimeRef.current < 2000) {
      return;
    }
    lastSentTextRef.current = text;
    lastSentTimeRef.current = now;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setSuggestions([]);
    setLastScore(null);

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setMicStatus('processing');
    }

    const lang = detectLanguage(text);
    const modeInstruction = lang === 'id'
      ? "\n[SYSTEM: User is speaking Indonesian. You MUST reply in Indonesian. Be a professional and friendly English teacher. Explain clearly, correct their English if they made mistakes, and provide natural English equivalents.]"
      : "\n[SYSTEM: User is speaking English. You MUST reply fully in English. Act as a professional native English teacher. If there are mistakes, correct them gently using ❌/✅ format.]";

    const newUserMsg = { role: 'user', content: text, isHidden: isSystemInitiated && hideInputAtStart };
    const updatedMessages = [...messages, newUserMsg];

    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    // === EMOTIONAL AI DETECTION ===
    const confusionKeywords = ["don't know", "bingung", "help", "susah", "gak ngerti", "sulit", "hard", "kurang paham", "gak tau", "pusing", "ga dong", "confused", "stuck", "lost"];
    const confidenceKeywords = ["yes!", "got it", "paham", "mengerti", "okay!", "ngerti", "i see", "great", "oke"];
    const lowerText = text.toLowerCase();
    const isConfused = confusionKeywords.some(kw => lowerText.includes(kw));
    const isConfident = confidenceKeywords.some(kw => lowerText.includes(kw));
    const emotionState = isConfused
      ? 'CONFUSED — ACTIVATE EMOTIONAL AI: Start with empathy ("Heyy, tenang dulu ya..."), simplify your explanation drastically, ask a much easier question to help them win.'
      : isConfident
        ? 'CONFIDENT — CELEBRATE their win loudly! Then raise difficulty slightly.'
        : 'NORMAL';

    // === PERSONALITY RULES ===
    const personalityMap = {
      strict: 'STRICT MODE: Alex becomes very firm about grammar. Rina provides detailed explanations of linguistic rules. No slang. High standards.',
      buddy: 'BUDDY MODE: Rina and Alex use slang (Indo slang for Rina, English slang for Alex). Very casual, high energy, lots of emojis.',
      friendly: 'FRIENDLY MODE: Rina and Alex are warm, patient, and balanced. The default conversational experience.'
    };
    const personalityInstruction = personalityMap[voicePersonality] || personalityMap.friendly;

    const contents = updatedMessages.filter(msg => msg.role !== 'system').map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{
          text: `${basePrompt}\n\n[CURRENT STATUS: ${emotionState}]\n[VIBE: ${personalityInstruction}]\n${modeInstruction}`
        }]
      },
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 512
      }
    };

    try {
      const data = await AiOrchestrator.chat(payload, globalApiKey);
      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiText) {
        throw new Error("Invalid response format from Gemini");
      }

      // Extract Hidden Score Data for XP/Dashboard
      if (aiText.includes('---')) {
        const parts = aiText.split('---');
        const jsonPart = parts[parts.length - 1].replace(/```json/gi, '').replace(/```/g, '').trim();

        const processScore = (scoreObj) => {
          const confidence = scoreObj.confidence !== undefined ? scoreObj.confidence : 0.8;
          const consistencyFactor = 0.9;

          const baseGrammar = scoreObj.grammar_score ?? scoreObj.grammar ?? 80;
          const baseVocab = scoreObj.vocab_score ?? scoreObj.vocab ?? 80;
          const baseFluency = scoreObj.fluency_score ?? scoreObj.fluency ?? 80;
          const baseComprehension = scoreObj.comprehension_score ?? 80;

          const finalGrammar = Math.round(baseGrammar * confidence * consistencyFactor);
          const finalVocab = Math.round(baseVocab * confidence * consistencyFactor);
          const finalFluency = Math.round(baseFluency * confidence * consistencyFactor);
          const finalComprehension = Math.round(baseComprehension * confidence * consistencyFactor);
          const overallScore = Math.round((finalGrammar + finalVocab + finalFluency + finalComprehension) / 4);

          const finalScoreObj = {
            ...scoreObj,
            grammar: finalGrammar,
            vocab: finalVocab,
            fluency: finalFluency,
            comprehension: finalComprehension,
            score: overallScore
          };

          setLastScore(finalScoreObj);

          const difficultyMultiplier = 20;
          const performanceMultiplier = overallScore / 100;
          const earnedXP = Math.max(1, Math.round(difficultyMultiplier * performanceMultiplier * consistencyFactor));

          updateXP(earnedXP);
          if (onComplete) onComplete(overallScore);
        };

        try {
          const scoreObj = JSON.parse(jsonPart);
          processScore(scoreObj);
          aiText = parts.slice(0, -1).join('---').trim();
        } catch (e) {
          console.warn("JSON Parse direct failed", e);
          // Fallback regex if split fails
          const match = aiText.match(/---[\s\S]*(\{[\s\S]*\})/);
          if (match) {
            try {
              const obj = JSON.parse(match[1]);
              processScore(obj);
              aiText = aiText.replace(/---[\s\S]*/, '').trim();
            } catch (ee) { console.warn("JSON Parse failed", ee); }
          }
        }
      }

      // Start TTS and Typing Effect in parallel for better responsiveness
      if (isVoiceInput || callMode) {
        handleTTS(aiText);
      }

      if (callMode) {
        setIsTypingEffect(true);
        let currentText = "";
        const words = aiText.split(" ");
        // Typing effect speed optimized (30ms per word)
        for (let i = 0; i < words.length; i++) {
          currentText += words[i] + " ";
          setSubtitle(currentText);
          await new Promise(r => setTimeout(r, 30));
        }
        setIsTypingEffect(false);
      }

      setMessages(prev => {
        const newMsgs = [...prev, { role: 'ai', content: aiText }];
        setTimeout(() => handleSuggest(newMsgs.length - 1), 100);
        return newMsgs;
      });

      playDing(); // Putar suara ding saat pesan AI telah diterima!
    } catch (err) {
      console.error("Gemini API Error:", err);
      setMessages(prev => [...prev, { role: 'system', content: `⚠️ Connection failed: ${err.message}` }]);
    } finally {
      setIsLoading(false);
      setMicStatus('idle');
    }
  };

  const updateXP = async (amount) => {
    const newXP = (userProfile.xp || 0) + amount;
    setUserProfile(prev => ({ ...prev, xp: newXP }));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({ xp: newXP }).eq('id', user.id);
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
          <div key={`table-${keyIndex}`} className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm w-full transform-gpu overscroll-x-contain scroll-smooth pb-2">
            <table className="min-w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
              <tbody>
                {tableRows.map((row, idx) => {
                  const cols = row.split('|').map(c => c.trim()).filter(c => c);
                  if (row.includes('---')) return null;
                  return (
                    <tr key={idx} className={`${idx === 0 ? 'bg-indigo-50 font-bold text-indigo-900 border-b-2 border-indigo-100' : 'border-t border-slate-100 bg-white'}`}>
                      {cols.map((col, cidx) => (
                        <td key={cidx} className="px-4 py-3 border-r last:border-r-0 border-slate-100 align-top" dangerouslySetInnerHTML={{ __html: parseInline(col) }} />
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
        .replace(/✅/g, '<span class="text-emerald-600 font-bold">✅</span>')
        .replace(/❌/g, '<span class="text-rose-600 font-bold">❌</span>');
    };

    lines.forEach((line, i) => {
      if (line.trim().startsWith('|')) {
        inTable = true;
        tableRows.push(line);
      } else {
        if (inTable) flushTable(i);
        if (line.trim()) {
          elements.push(<p key={i} className="mb-2 last:mb-0 leading-relaxed break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parseInline(line) }} />);
        } else {
          elements.push(<div key={i} className="h-2" />);
        }
      }
    });
    if (inTable) flushTable('end');
    return elements;
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (initialSuggestions.length > 0) {
      setSuggestions(initialSuggestions);
    }

    if (messages.length === 0 && hideInputAtStart) {
      sendMessage(startMessage, true);
    } else if (messages.length === 0 && topic) {
      sendMessage(`TODAY'S TOPIC: ${topic}. Let's start our learning session about "${topic}" now!`, true);
    }
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [messages]);

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50/50 z-20">
      {callMode && (
        <div className="absolute inset-0 bg-[#0f172a] z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
              {['friendly', 'strict', 'buddy'].map(p => (
                <button
                  key={p}
                  onClick={() => setVoicePersonality(p)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${voicePersonality === p ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setCallMode(false)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <X size={24} />
          </button>
          <div className="relative mb-12">
            <div className={`w-40 h-40 rounded-full border-4 border-blue-500/30 flex items-center justify-center ${isSpeaking || micStatus === 'listening' ? 'animate-pulse' : ''}`}>
              <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 ${isSpeaking ? 'scale-110' : ''} transition-all duration-300`}>
                <Bot size={64} className="text-white" />
              </div>
            </div>
            {(isSpeaking || isTypingEffect) && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-bounce">AI is speaking...</div>}
          </div>

          <h2 className="text-2xl font-black text-white mb-2">RichardMeha <span className="text-blue-500">Call</span></h2>

          <div className="max-w-md w-full px-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <p className="text-slate-200 font-medium italic mb-2">"{subtitle || "Silakan bicara, saya mendengarkan..."}"</p>

              {/* Translation Feature in Call Mode */}
              {messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
                <button
                  onClick={() => handleTranslate(messages.length - 1)}
                  className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Languages size={14} /> {translations[messages.length - 1] ? "Sembunyikan Terjemahan" : "Klik untuk Terjemahan Indonesia"}
                </button>
              )}

              {translations[messages.length - 1] && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in slide-in-from-top-1">
                  <p className="text-xs text-emerald-400 font-medium leading-relaxed">{translations[messages.length - 1]}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Suggestions for Answering in Call Mode */}
          {suggestions.length > 0 && !isSpeaking && (
            <div className="flex flex-wrap justify-center gap-2 max-w-md mb-8 animate-in fade-in slide-in-from-bottom-4">
              <p className="w-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Alternative Answers:</p>
              {suggestions.map((s, si) => (
                <button
                  key={si}
                  onClick={() => { setInputValue(s); sendMessage(s, false, false); }}
                  className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-full text-xs hover:bg-blue-600/40 transition-all active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Transkripsi Live User di Call Mode */}
          <div className={`w-full max-w-md px-6 mb-8 transition-all duration-500 ${isRecording || inputValue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 text-left">Pesan Anda:</p>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 min-h-[60px] flex items-center justify-center backdrop-blur-md shadow-inner">
              <p className="text-white text-sm text-center italic">
                {inputValue || "Mendengarkan suara Anda..."}
              </p>
            </div>
          </div>

          <div className="flex gap-8 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 ${isRecording ? 'bg-rose-500 animate-pulse shadow-rose-500/50' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>
        </div>

      )}

      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
            <X size={20} />
          </button>
          <div>
            <h2 className="font-bold text-slate-800 leading-none">{module || "RichardMeha AI"}</h2>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-slate-50 rounded-lg p-1 border border-slate-100 mr-2">
            {['friendly', 'strict', 'buddy'].map(p => (
              <button
                key={p}
                onClick={() => setVoicePersonality(p)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${voicePersonality === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 bg-blue-50 rounded-full flex items-center gap-2 border border-blue-100 shadow-sm">
            <Zap size={14} className="text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-blue-700">{userProfile.xp || 0} XP</span>
          </div>
          <button
            onClick={() => setCallMode(true)}
            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Headphones size={20} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 transform-gpu overscroll-none scroll-smooth w-full" style={{ paddingBottom: '120px' }}>
        {messages.map((msg, idx) => (
          !msg.isHidden && (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2 w-full`}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 w-full animate-in slide-in-from-bottom-2 duration-300`}>
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base break-words ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                  {renderFormattedText(msg.content)}

                  {msg.role === 'ai' && (
                    <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-2 shrink-0 relative z-50">
                      <button
                        onClick={() => handleTTS(msg.content)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0 touch-manipulation shadow-sm border border-transparent hover:border-slate-200"
                        title="Dengarkan (TTS)"
                      >
                        <Volume2 size={18} />
                      </button>
                      <button
                        onClick={() => handleTranslate(idx)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0 touch-manipulation shadow-sm border border-transparent hover:border-slate-200"
                      >
                        <Languages size={18} />
                      </button>
                      <button
                        onClick={() => handleSuggest(idx)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0 touch-manipulation shadow-sm border border-transparent hover:border-slate-200"
                      >
                        <Lightbulb size={18} />
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
                      onClick={() => { setInputValue(s); sendMessage(s, false, false); }}
                      className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-full text-xs md:text-sm hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {idx === messages.length - 1 && msg.role === 'ai' && lastScore && (
                <div className="pl-10 mt-3 w-full max-w-md animate-in zoom-in duration-500">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl shadow-blue-500/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">RichardMeha Feedback</h4>
                      <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase">Result Detected</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center bg-blue-50 rounded-xl p-2">
                        <div className="text-base font-black text-blue-600">{lastScore.grammar || 0}%</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Grammar</div>
                      </div>
                      <div className="text-center bg-indigo-50 rounded-xl p-2">
                        <div className="text-base font-black text-indigo-600">{lastScore.vocab || 0}%</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Vocab</div>
                      </div>
                      <div className="text-center bg-emerald-50 rounded-xl p-2">
                        <div className="text-lg font-black text-emerald-600">{lastScore.fluency}%</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Fluency</div>
                      </div>
                      <div className="text-center bg-amber-50 rounded-xl p-2">
                        <div className="text-base font-black text-amber-600">{lastScore.comprehension || 0}%</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Comprehend</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 italic border-l-2 border-blue-500 pl-3 py-1 mb-3">
                      "{lastScore.feedback}"
                    </p>
                    {lastScore.phonetic && (
                      <div className="mt-2 text-[10px] bg-slate-50 p-2 rounded-xl flex items-center justify-between border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Volume2 size={12} className="text-slate-400" />
                          <span className="text-slate-400 font-bold uppercase tracking-widest">Phonetic:</span>
                        </div>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{lastScore.phonetic}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        ))}
        {isLoading && (
          <div className="flex items-end gap-2 w-full animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm flex items-center gap-3 w-fit">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI sedang menganalisa</span>
              <div className="flex space-x-1.5 items-center justify-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-[90px] md:bottom-[100px] right-6 z-40 animate-in fade-in zoom-in duration-300">
          <button
            onClick={scrollToBottom}
            className="p-3 md:p-3.5 bg-slate-800/80 backdrop-blur-md text-white rounded-full shadow-xl shadow-slate-900/20 hover:bg-blue-600 hover:border-blue-500 transition-all hover:scale-110 active:scale-95 flex items-center justify-center border border-white/10"
            title="Scroll ke bawah"
          >
            <ArrowDown size={20} />
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="relative z-[50] bg-white border-t border-slate-200 w-full p-4 md:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] shrink-0" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue, false, false); }} className="max-w-4xl mx-auto w-full flex items-center gap-2 md:gap-3">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isRecording ? "Mendengarkan..." : "Ketik pesan atau tanya Richard..."}
            className="flex-1 min-w-0 w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm md:text-base shadow-inner"
          />
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 flex items-center justify-center shadow-md shrink-0 ${isRecording ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30' : 'bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'}`}
          >
            {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            type="button"
            onClick={() => setSttLang(prev => prev === 'en-US' ? 'id-ID' : 'en-US')}
            className="p-3 md:p-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 w-12 md:w-14 shadow-md shrink-0"
            title="Ubah Bahasa STT (Mic)"
          >
            {sttLang === 'en-US' ? 'EN' : 'ID'}
          </button>

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 md:p-4 rounded-2xl shadow-xl transition-all active:scale-90 flex items-center justify-center shrink-0 ${!inputValue.trim() || isLoading ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
          >
            <Send size={22} />
          </button>
        </form>
      </div>
    </div>
  );

}
