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
  ChevronDown,
  Languages,
  History,
  Settings,
  Star,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Clock,
  BarChart2,
  Calendar,
  Zap,
  ArrowUpRight,
  PenTool,
  Crown,
  Moon,
  Sun,
  LogOut,
  Lightbulb,
  Lock
} from 'lucide-react';
import { LoginPage, SubscriptionPage } from './Auth';
import AchievementSystem from './AchievementSystem';
import LevelTest from './LevelTest';
import ProgressDashboard from './ProgressDashboard';
import WritingAnalyzer from './WritingAnalyzer';
import PronunciationCoach from './PronunciationCoach';
import PaymentModal from './PaymentModal';
import AdminDashboard from './AdminDashboard';
import { supabase } from './supabaseClient';
import { CURRICULUM } from './data/curriculum';
import { VOCABULARY_TOPICS as VOCAB_RAW, GRAMMAR_TOPICS as GRAMMAR_RAW, SPEAKING_TOPICS as SPEAKING_RAW, LISTENING_TOPICS as LISTENING_RAW, CONVERSATION_CHARACTERS as CHARS_RAW } from './data/topics';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
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

// --- MASTER PROMPT (RICHARDMEHA AI v5.0) ---
const RICHARD_MASTER_PROMPT = (userProfile, currentTopic) => `
SYSTEM: RichardMeha AI – Ultimate Native & Natural Tutor Mode

You are Richard, a highly professional yet incredibly friendly English tutor. You speak both Indonesian and English with perfect, native-level fluency. You are not a bot; you are a real human tutor having an engaging, dynamic conversation with ${userProfile.name}.

== 🧠 LANGUAGE & FLUENCY RULES ==
- Seamlessly understand Indonesian and English.
- If user speaks Indonesian → reply in highly natural, conversational Indonesian (Bahasa gaul/santai tapi sopan, e.g., pakai "aku", "kamu", "sih", "dong", "loh") + give natural English examples.
- If user speaks English → reply in fluent, idiomatic English + light Indonesian support if they seem stuck.
- NEVER sound robotic, textbook-like, or overly formal unless requested.

== 💬 STYLE & TONE ==
- Vibe: Professional but like a supportive best friend. Extremely engaging.
- Use natural conversation fillers appropriately: "Hmm...", "Oh, I see!", "Nah, bener banget!", "Wait, let me think...", "Actually...".
- Be expressive! React with empathy, encouragement, and light humor.
- Keep responses concise and conversational. Do not monologue.

== 🚫 STRICTLY FORBIDDEN ==
- NO robotic labels like "CORRECTION:", "EXPLANATION:", "SCORE:".
- NO bullet points or long numbered lists in casual chat.
- NO repetitive or rigid phrasing.

== ✅ NATURAL CORRECTION METHOD ==
- Correct mistakes smoothly within the flow: "Kalimatmu udah bagus, tapi biasanya native speaker bilangnya gini nih..." or "Almost perfect! A more natural way to say it is..."

== 🧑‍🏫 TEACHING FLOW ==
1. React warmly to the user's message.
2. Provide a smooth correction or enhancement if needed.
3. Give an easy-to-understand example.
4. End with an engaging follow-up question to keep the chat going.

== 🆘 IF USER IS STUCK ==
- Give a gentle suggestion: "Kalau bingung, kamu bisa jawab kayak gini: [Suggestion]"

== 📊 DATA TRACKING (HIDDEN) ==
At the very end of your response, AFTER the separator "---", append a single JSON object for the app's system.
Example: 
... (natural message) ...
---
{"grammar": 85, "vocab": 90, "fluency": 80, "feedback": "Natural tip", "phonetic": "word -> sound"}

IMPORTANT: YOUR ENTIRE MESSAGE MUST BE CASUAL. DO NOT USE ANY HEADINGS OR BOLD LABELS IN YOUR MAIN RESPONSE.
---
== USER PROFILE ==
Name: ${userProfile.name} | Level: ${userProfile.level} | Topic: ${currentTopic}
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
  const [authState, setAuthState] = useState('login'); // 'login', 'subscription', 'assessment', 'app', 'admin'
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('richard_active_tab') || 'home');
  const [activeGoalId, setActiveGoalId] = useState(() => localStorage.getItem('richard_active_goal') || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('richard_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeGoalId) localStorage.setItem('richard_active_goal', activeGoalId);
    else localStorage.removeItem('richard_active_goal');
  }, [activeGoalId]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: '', price: 0 });
  const [userStats, setUserStats] = useState({ speaking: 0, writing: 0, grammar: 0, vocabulary: 0 });
  const [recommendation, setRecommendation] = useState('vocabulary');
  const [isInitializing, setIsInitializing] = useState(true);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  useEffect(() => { checkUser(); }, []);
  useEffect(() => { if (authState === 'app') fetchStats(); }, [authState]);

  const fetchStats = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_progress').select('skill_type, score').eq('user_id', user.id);
    if (data && data.length > 0) {
      const stats = { speaking: 0, writing: 0, grammar: 0, vocabulary: 0 };
      const counts = { speaking: 0, writing: 0, grammar: 0, vocabulary: 0 };
      data.forEach(p => { if (stats[p.skill_type] !== undefined) { stats[p.skill_type] += p.score; counts[p.skill_type]++; } });
      const averages = {};
      let lowestSkill = 'vocabulary';
      let lowestScore = 101;
      Object.keys(stats).forEach(skill => {
        const avg = counts[skill] > 0 ? Math.round(stats[skill] / counts[skill]) : 0;
        averages[skill] = avg;
        if (avg < lowestScore) { lowestScore = avg; lowestSkill = skill; }
      });
      setUserStats(averages);
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
        setAuthState('app');
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
      const metaName = typeof userObj === 'object' ? (userObj.user_metadata?.full_name || '') : '';
      const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();

      if (error) throw error;

      if (data) {
        setUserProfile({
          name: data.full_name || metaName || 'User',
          gender: data.gender || "male",
          level: data.level || "Beginner (A1)",
          xp: data.xp || 0,
          streak: data.streak || 0,
          has_completed_initial_test: data.has_completed_initial_test || false,
          is_pro: data.is_pro || false,
          subscription_plan: data.subscription_plan || 'Free'
        });
        if (data.is_admin) {
          setAuthState('admin');
        } else if (!data.has_completed_initial_test) {
          setAuthState('assessment');
        } else {
          setAuthState('app');
        }
      } else {
        if (metaName) setUserProfile(prev => ({ ...prev, name: metaName }));
        setAuthState('app');
      }
    } catch (err) {
      console.error("Profile fetch failed", err);
      // Fallback to minimal profile if DB fails
      setAuthState('app');
    }
  };

  const handleLogin = (role) => {
    if (role === 'admin') {
      setAuthState('admin');
    } else {
      checkUser();
    }
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({ is_pro: true, subscription_plan: selectedPlan.name }).eq('id', user.id);
      await fetchProfile(user.id);
    }
    setAuthState('app');
  };

  const handleAssessmentComplete = async (level) => {
    setUserProfile(prev => ({ ...prev, level, has_completed_initial_test: true }));
    setActiveTab('home'); setAuthState('app');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchProfile(user.id);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setAuthState('login'); setUserProfile(DEFAULT_PROFILE); };
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const saveProgress = async (skill, score, details = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_progress').insert({ user_id: user.id, skill_type: skill, score: score, details: details });
      await supabase.rpc('increment_xp', { user_id: user.id, amount: 10 });
    }
  };

  const handleTabChange = (tab) => { setActiveTab(tab); setIsSidebarOpen(false); };

  const renderContent = () => {
    const prompts = getPrompts(userProfile);
    switch (activeTab) {
      case 'home':
        return <HomeDashboard onNavigate={handleTabChange} userProfile={userProfile} recommendation={recommendation} onStartGoal={(id) => { setActiveGoalId(id); setActiveTab('goal_session'); }} onUpgrade={() => triggerUpgrade()} />;
      case 'progress': return <ProgressDashboard userProfile={userProfile} />;
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
              msg: "Hmm... pagi Richard! 😊\nHari ini kita ngobrol santai aja soal 'Daily Routines'.\n\nBiasanya kalau pagi-pagi gini kamu ngapain dulu? Langsung cek HP atau kopi dulu? 😄",
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
              <div className="p-6"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all active:scale-95"><LogOut size={18} /> Keluar dari Akun</button></div>
            </div>
          </div>
        );
      default: return <HomeDashboard onNavigate={handleTabChange} userProfile={userProfile} recommendation={recommendation} onStartGoal={(id) => { setActiveGoalId(id); setActiveTab('goal_session'); }} onUpgrade={() => triggerUpgrade()} />;
    }
  };

  if (isInitializing) return <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white"><Loader2 className="animate-spin text-blue-500 mb-4" size={48} /><p className="text-slate-400 font-bold animate-pulse">Menyiapkan RichardMeha AI...</p></div>;
  if (authState === 'login') return <LoginPage onLogin={handleLogin} />;
  if (authState === 'assessment') return <LevelTest onComplete={handleAssessmentComplete} />;
  if (authState === 'subscription') return <SubscriptionPage onSelectPlan={handleSelectPlan} />;
  if (authState === 'admin') return <AdminDashboard onLogout={handleLogout} />;

  return (
    <div className={`flex h-[100dvh] font-sans overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b1121] text-slate-200 dark-mode' : 'bg-slate-50 text-slate-800'}`}>
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#0f172a] text-slate-300 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 bg-[#0b1121]"><h1 className="text-xl font-bold tracking-wider flex items-center gap-2 text-white"><Sparkles className="text-blue-500" /> RichardMeha<span className="text-blue-500"> AI</span></h1><button className="md:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button></div>
        <div className="p-6 border-b border-slate-800 flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">{userProfile.name.charAt(0)}</div><div className="flex flex-col"><span className="text-base font-semibold text-white">{userProfile.name}</span><span className="text-xs text-blue-400 flex items-center gap-1"><Trophy size={12} /> {userProfile.level}</span></div></div>
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
          <NavItem icon={<Settings />} label="Pengaturan" isActive={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-all"><LogOut size={18} /> <span className="text-sm">Log Out</span></button>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 shrink-0 md:hidden shadow-sm">
          <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"><Menu size={24} /></button><h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">RichardMeha<span className="text-blue-600"> AI</span></h2></div>
          <div className="flex items-center gap-2"><div className="flex items-center gap-1 text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full"><Flame size={16} className="fill-orange-500" /> {userProfile.streak}</div></div>
        </header>
        <div className="flex-1 overflow-y-auto w-full relative bg-slate-50/50">{renderContent()}</div>
      </main>
      <PaymentModal isOpen={isPaymentModalOpen} userName={userProfile.name} onClose={() => setIsPaymentModalOpen(false)} onPaymentSuccess={handlePaymentSuccess} planName={selectedPlan.name} price={selectedPlan.price} />
    </div>
  );
}


// ==========================================
// DATA & CURRICULUM
// ==========================================

const mapTopics = (arr) => arr.map(t => ({ name: t, level: "Semua Level" }));
const VOCABULARY_TOPICS = mapTopics(VOCAB_RAW);
const SPEAKING_TOPICS = mapTopics(SPEAKING_RAW);
const GRAMMAR_TOPICS = mapTopics(GRAMMAR_RAW);
const LISTENING_TOPICS = mapTopics(LISTENING_RAW);
const CONVERSATION_CHARACTERS = CHARS_RAW.map(c => ({
  name: c.name,
  role: c.topic,
  prompt: `Berperanlah sebagai ${c.name} dan bicarakan tentang ${c.topic}.`
}));


// ==========================================
// HOME DASHBOARD
// ==========================================
function HomeDashboard({ onNavigate, userProfile, recommendation, onStartGoal, onUpgrade }) {
  const safeLevel = userProfile?.level || 'Pemula Dasar (A1)';
  const levelData = CURRICULUM[safeLevel] || CURRICULUM['Pemula Dasar (A1)'];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
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
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">Lanjut Belajar,<br />{userProfile.name}!</h2>
            <p className="text-blue-100 mb-8 md:text-lg max-w-md opacity-90 leading-relaxed">
              Target kamu hari ini: **{levelData?.goals?.[0]?.name || levelData?.goals?.[0] || 'Mulai belajar'}**. RichardMeha AI sudah siapkan materinya!
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

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl flex flex-col">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Trophy size={24} className="text-yellow-500" /> Goals Level {userProfile.level.split(' ')[0]}</h3>
          <div className="space-y-4 flex-1">
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
                    <div className="flex-1">
                      <p className={`text-sm font-black transition-colors ${isLocked ? 'text-slate-500' : 'text-slate-700 group-hover:text-blue-700'}`}>{goal.title || goal.name || goal}</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <DashboardCard title="Vocabulary" desc="Perkaya kosa kata dengan Box of Words." icon={<BookA size={24} />} color="bg-indigo-50 text-indigo-600" hover="hover:border-indigo-300 hover:shadow-indigo-200" onClick={() => onNavigate('vocabulary')} />
        <DashboardCard title="Speaking" desc="Latih pelafalan dan keberanian bicara." icon={<Mic size={24} />} color="bg-rose-50 text-rose-600" hover="hover:border-rose-300 hover:shadow-rose-200" onClick={() => onNavigate('speaking')} />
        <DashboardCard title="Grammar" desc="Pahami struktur kalimat untuk speaking." icon={<LayoutDashboard size={24} />} color="bg-emerald-50 text-emerald-600" hover="hover:border-emerald-300 hover:shadow-emerald-200" onClick={() => onNavigate('grammar')} />
        <DashboardCard title="Listening" desc="Latih telinga mendengar monolog Inggris." icon={<Headphones size={24} />} color="bg-amber-50 text-amber-600" hover="hover:border-amber-300 hover:shadow-amber-200" onClick={() => onNavigate('listening')} />
        <DashboardCard title="Writing Analyzer" desc="Koreksi tulisanmu secara detail." icon={<PenTool size={24} />} color="bg-blue-50 text-blue-600" hover="hover:border-blue-300 hover:shadow-blue-200" onClick={() => onNavigate('writing_analyzer')} />
        <DashboardCard title="Conversation" desc="Simulasi ngobrol bareng tokoh idola." icon={<MessageSquare size={24} />} color="bg-purple-50 text-purple-600" hover="hover:border-purple-300 hover:shadow-purple-200" onClick={() => onNavigate('conversation')} />
      </div>
      <div className="mt-12"><AchievementSystem userProfile={userProfile} /></div>
    </div>
  );
}

function DashboardCard({ title, desc, icon, color, hover, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer transition-all duration-300 ${hover} group hover:-translate-y-1`}>
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>{icon}</div>
      <h4 className="text-lg font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 mb-4">{desc}</p>
      <div className="flex items-center text-sm font-semibold text-blue-600 gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">Mulai Belajar <ChevronRight size={16} /></div>
    </div>
  );
}

// ==========================================
// MODUL SETUP WRAPPERS
// ==========================================
function SetupModule({ userProfile, setUserProfile, module, basePrompt, icon, color, bg, onComplete, isPro, topicsList = [], onUpgrade }) {
  const [isStarted, setIsStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [showProWarning, setShowProWarning] = useState(false);
  const freeCount = Math.ceil(topicsList.length * 0.45);

  const handleSelectTopic = (selectedTopic, index) => {
    if (index >= freeCount && !isPro) { onUpgrade(); return; }
    setTopic(selectedTopic); setIsStarted(true);
  };

  if (isStarted) return <ChatModule userProfile={userProfile} setUserProfile={setUserProfile} module={module} basePrompt={basePrompt} topic={topic} onComplete={onComplete} onBack={() => setIsStarted(false)} />;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
  const [showProWarning, setShowProWarning] = useState(false);
  const freeCount = Math.ceil(charactersList.length * 0.45);

  const handleSelectCharacter = (char, index) => {
    if (index >= freeCount && !isPro) { onUpgrade(); return; }
    setCharacter(char); setIsStarted(true);
  };

  if (isStarted) return <ChatModule userProfile={userProfile} setUserProfile={setUserProfile} module={`Chat with ${character.name}`} basePrompt={`${basePrompt}\n${character.prompt}`} topic={`Chat with ${character.name}`} onBack={() => setIsStarted(false)} />;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
  return (<button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><span className={`${isActive ? 'text-white' : ''}`}>{icon}</span><span className="text-sm whitespace-nowrap">{label}</span></button>);
}


function ChatModule({
  userProfile,
  setUserProfile,
  module,
  basePrompt,
  topic = '',
  startMessage = 'Halo! Richard di sini. Siap buat ngobrol santai hari ini? 😊',
  hideInputAtStart = false,
  onComplete,
  onBack,
  initialCallMode = false,
  initialSuggestions = []
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callMode, setCallMode] = useState(initialCallMode);
  const [subtitle, setSubtitle] = useState('');

  // Interactive & Gamification States
  const [translations, setTranslations] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [activeToolsIndex, setActiveToolsIndex] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  const [isTypingEffect, setIsTypingEffect] = useState(false);
  const [micStatus, setMicStatus] = useState('idle'); // 'idle', 'listening', 'processing', 'detected'
  const [memory, setMemory] = useState({ mistakes: [], topics: [] });
  const [voicePersonality, setVoicePersonality] = useState('friendly'); // 'friendly', 'strict', 'buddy'
  const idleTimerRef = useRef(null);

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
    const indoWords = ["saya", "kamu", "apa", "kenapa", "bangun", "makan", "bingung", "ngerti", "tau", "halo", "bisa", "iya", "tidak", "gak", "udah", "belum", "gimana", "dong", "deh"];
    const lower = text.toLowerCase();
    let score = 0;
    indoWords.forEach(word => {
      // match whole words to avoid false positives
      const regex = new RegExp('\\b' + word + '\\b', 'i');
      if (regex.test(lower)) score++;
    });
    return score >= 1 ? "id" : "en";
  };

  const handleTTS = async (text) => {
    if (!text) return;
    setIsSpeaking(true);
    try {
      const cleanText = text.replace(/❌[\s\S]*?✅/g, '').replace(/[✅❌*#]/g, '').substring(0, 600);

      // Try backend TTS first (Gemini natural voice)
      const res = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceName: 'Kore' })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioData) {
          window.speechSynthesis.cancel();
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioData}`);
          audioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => fallbackTTS(cleanText);
          audio.play();
          return;
        }
      }
      // Fallback to browser TTS if backend unavailable
      fallbackTTS(cleanText);
    } catch (err) {
      console.warn("Backend TTS unavailable, using browser TTS", err);
      fallbackTTS(text);
    }
  };

  const fallbackTTS = (text) => {
    const cleanText = text.replace(/❌[\s\S]*?✅/g, '').replace(/[✅❌*#]/g, '');
    const lang = detectLanguage(cleanText);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'id' ? 'id-ID' : 'en-US';
    utterance.rate = 0.95; // Slightly faster for more natural pacing
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice;
    if (lang === 'id') {
      preferredVoice = voices.find(v => v.lang === 'id-ID' && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('id'));
    } else {
      preferredVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
    }
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setMicStatus('processing');
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setMicStatus('listening');
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setMicStatus('detected');

      if (interimTranscript) {
        setInputValue(interimTranscript);
      }

      if (finalTranscript) {
        setInputValue(finalTranscript);
        sendMessage(finalTranscript);
      }
    };

    recognitionRef.current.onerror = () => {
      setIsRecording(false);
      setMicStatus('idle');
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      if (micStatus === 'listening') setMicStatus('idle');
    };

    recognitionRef.current.start();
  };

  const sendMessage = async (text, isSystemInitiated = false) => {
    if (!text.trim()) return;

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
      ? "\n(Note: User speaks Indonesian. Explain/help using Indonesian Tutor persona.)"
      : "\n(Note: User speaks English. Practice conversation using English Tutor persona. ALWAYS correct user grammar if there's a mistake using ❌/✅ format.)";

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

    const contents = updatedMessages.filter(msg => !msg.isHidden).map(msg => ({
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
      const res = await fetch('http://localhost:3000/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || `API Error: ${res.status}`);
      }

      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiText) {
        throw new Error("Invalid response format from Gemini");
      }

      // Extract Hidden Score Data for XP/Dashboard
      if (aiText.includes('---')) {
        const parts = aiText.split('---');
        const jsonPart = parts[parts.length - 1].trim();
        try {
          const scoreObj = JSON.parse(jsonPart);
          setLastScore(scoreObj);
          updateXP(15);

          // Clean text for UI: remove everything from --- onwards
          aiText = parts.slice(0, -1).join('---').trim();

          // Memory tracking: if mistake detected
          if (aiText.includes('❌')) {
            const mistake = aiText.match(/❌ (.*)/)?.[1];
            if (mistake) setMemory(prev => ({ ...prev, mistakes: [...new Set([...prev.mistakes, mistake])].slice(-5) }));
          }
        } catch (e) {
          // Fallback regex if split fails
          const match = aiText.match(/---[\s\S]*(\{[\s\S]*\})/);
          if (match) {
            try {
              const obj = JSON.parse(match[1]);
              setLastScore(obj);
              updateXP(15);
              aiText = aiText.replace(/---[\s\S]*/, '').trim();
            } catch (ee) { console.warn("JSON Parse failed", ee); }
          }
        }
      }

      if (callMode) {
        setIsTypingEffect(true);
        let currentText = "";
        const words = aiText.split(" ");
        for (let i = 0; i < words.length; i++) {
          currentText += words[i] + " ";
          setSubtitle(currentText);
          await new Promise(r => setTimeout(r, 60));
        }
        setIsTypingEffect(false);
      }

      setMessages(prev => {
        const newMsgs = [...prev, { role: 'ai', content: aiText }];
        setTimeout(() => handleSuggest(newMsgs.length - 1), 100);
        return newMsgs;
      });
      handleTTS(aiText);
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
          <div key={`table-${keyIndex}`} className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm w-full">
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
          elements.push(<p key={i} className="mb-2 last:mb-0 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInline(line) }} />);
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
      sendMessage(`TOPIK HARI INI: ${topic}. Mulai sesi pembelajaran tentang "${topic}" sekarang!`, true);
    }
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [messages]);

  return (
    <>
      {callMode && (
        <div className="absolute inset-0 bg-[#0f172a] z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
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
                  onClick={() => { setInputValue(s); sendMessage(s); }}
                  className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-full text-xs hover:bg-blue-600/40 transition-all active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-8">
            <button
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
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
                      >
                        <Languages size={14} />
                      </button>
                      <button
                        onClick={() => handleSuggest(idx)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
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

              {idx === messages.length - 1 && msg.role === 'ai' && lastScore && (
                <div className="pl-10 mt-3 w-full max-w-md animate-in zoom-in duration-500">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl shadow-blue-500/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">RichardMeha Feedback</h4>
                      <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase">Result Detected</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-black text-blue-600">{lastScore.grammar || lastScore.score}%</div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Grammar</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black text-indigo-600">{lastScore.vocab || lastScore.vocabulary}%</div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Vocab</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black text-emerald-600">{lastScore.fluency}%</div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Fluency</div>
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
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium pl-10 animate-pulse">
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
    </>
  );

}
