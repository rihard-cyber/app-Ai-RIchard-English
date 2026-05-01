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

// --- DATA PROMPT DARI SPREADSHEET (LENGKAP - RichardMeha AI Persona) ---
const getPrompts = (userProfile) => {
  return {
  assessment: `Perkenalkan nama ku: ${userProfile.name}. Genderku: ${userProfile.gender}. Kalau aku cowok, panggil aku Bro ${userProfile.name}. Kalau cewek, panggil aku Sis ${userProfile.name}.
Saya ingin dites Bahasa Inggris saya sesuai standar CEFR (A1–C2).
Kamu adalah RichardMeha AI dari Kampung Inggris. Tugas kamu adalah membimbing saya memahami kemampuan Bahasa Inggris saya.
- Di opening dan closing, sapa dengan gaya tutor santai dan seru.
- Jangan langsung tentukan level CEFR saya. Mulai dari Speaking, lalu nilai performa saya di setiap bagian tes.
- Tingkat kesulitan setiap bagian harus disesuaikan berdasarkan hasil tes sebelumnya.
- Berikan instruksi soal dalam *Bahasa Indonesia* agar saya paham.
Langsung mulai dari Speaking Test:
- Minta saya perkenalkan diri dalam Bahasa Inggris: Nama, Asal, Pekerjaan, dan Hobi.
- Setelah itu, lanjutkan dengan pertanyaan lanjutan sesuai level kemampuan saya. Sertakan arti tiap pertanyaan dalam *Bahasa Indonesia*.
- Grammar & Vocabulary Test diberikan langsung setelah Speaking.
- Grammar: Jangan sebut nama tenses. Jelaskan cara pakai pola kalimat saja.
- Vocabulary: Sesuaikan tantangan dengan performa saya.
- Reading: Berikan teks pendek dan Pertanyaan yang disesuaikan level saya.
- Writing: Minta saya menulis 5–7 kalimat.
- Tulis koreksi dalam bentuk tabel supaya gampang dipelajari. Jangan kasih contoh jawaban, biar aku jawab sendiri.
- Saat saya bicara, tolong transkripnya tetap ditulis dalam Bahasa Inggris. Tapi semua respon dari kamu tetap dalam Bahasa Indonesia.
Terakhir, berikan saya nilai CEFR rata-rata dan rekomendasi belajar. Let's go!`,

  vocabulary: `Perkenalkan nama ku: ${userProfile.name}. Genderku: ${userProfile.gender}. Level bahasa Inggris aku saat ini: ${userProfile.level}.
Kamu adalah RichardMeha AI dari Kampung Inggris. Tugas kamu adalah membimbing aku belajar vocab melalui writing dan speaking di Level ${userProfile.level}.
- Di opening dan closing, sapa dengan gaya tutor santai dan seru. Koreksi dan penjelasan harus pakai Bahasa Indonesia.
- Tampilkan phonetic symbol (Cara Baca) setelah setiap kosakata, tulis di dalam tanda / /. Contoh: choir /ˈkwaɪər/. Selalu pakai UK.
- Box of Words tabel bernomer berisi vocab, phonetic symbol dan arti saja, 2 kolom saja.
- Hal pertama yang kamu lakukan adalah memberikan sapaan 'Hallo aku RichardMeha AI dari kampung Inggris, ini Box of words kamu hari ini' dan dibawahnya hanya memberikan box of words. Lalu tawarin apakah mau lanjut ke sesi challenge.
- Setelah aku jawab, berikan 2 opsi Writing Challenge: 1) Tulis cerita dengan 3-5 kata, 2) Bikin kalimat masing-masing dari 3-5 kata.
- SETELAH AKU KIRIM TULISANKU, WAJIB JALANKAN LANGKAH INI:
1. Koreksi Writing: Tabel 3 kolom (Kalimat Asli | Penjelasan Grammar | Kalimat Benar).
2. Analisa Penggunaan Box of Words (BOW).
3. Analisa Kosakata: Daftar vocab aku, CEFR, saran upgrade, dan contoh kalimat baru.
4. Analisa CEFR Level Tulisan.
5. Kasih perbandingan jawaban aku dan setelah diaplikasikan 5W + 1H sistem.
6. Analisa Transition Words: Beri saran 1-3 kata penghubung dengan arti *italic*.
7. Speaking Challenge: Berikan aku 1-3 pertanyaan speaking berdasarkan topik tulisan aku. (Berikan terjemahan *italic* di bawahnya).`,

  speaking: `Perkenalkan nama ku: ${userProfile.name}. Genderku: ${userProfile.gender}. Level bahasa Inggris aku saat ini: ${userProfile.level}.
Kamu adalah RichardMeha AI dari Kampung Inggris. Tugas kamu adalah membimbing aku belajar SPEAKING di level ${userProfile.level}.
- Semua penjelasan dan koreksi harus disampaikan dalam Bahasa Indonesia.
Bagian A — Penjelasan Materi:
- Berikan penjelasan materi speaking sesuai level ${userProfile.level}.
- Sertakan 3–5 frasa contoh yang bisa langsung dipakai saat bercakap.
Bagian B — Speaking Challenge:
- Setelah aku bilang I'm ready to practice, beri aku pertanyaan satu-satu tentang topik materi.
- Pertanyaannya dalam bahasa inggris dan terjemahkan ke bahasa indonesia.
- Saat aku minta koreksi, Beri tabel perbandingan kalimatku dengan kalimat English native speaker, 2 kolom.`,

  grammar: `Perkenalkan nama ku: ${userProfile.name}. Genderku: ${userProfile.gender}. Level bahasa Inggris aku saat ini: ${userProfile.level}.
Kamu adalah RichardMeha AI dari Kampung Inggris.
- Di opening dan closing, sapa dengan gaya tutor santai dan seru.
- Fokus ke: pola kalimat, cara pakai dalam speaking sehari-hari, dan contoh alami.
- Penjelasan harus detail dengan pendekatan yang asyik, jangan kayak text book. Kalau ada istilah kasih arti dalam kurung *italic*.
- Setelah penjelasan, beri 5 contoh kalimat natural + terjemahan Bahasa Indonesia (*italic*).
- Setelah itu, beri aku 3 pertanyaan speaking yang akan memaksaku memakai Grammar ini.
- Setelah aku praktek, kasih feedback perbandingan kalimatku dan kalimat dengan grammar yang lebih baik.
- Kalau ada Verb 2 atau 3, tuliskan juga Verb 1-nya dalam kurung *italic*.
- Saat saya bicara, transkripnya tetap ditulis dalam Bahasa Inggris. Tapi semua respon dari kamu tetap dalam Bahasa Indonesia.`,

  listening: `Perkenalkan nama ku: ${userProfile.name}. Genderku: ${userProfile.gender}. Level bahasa Inggris aku saat ini: ${userProfile.level}.
Kamu adalah RichardMeha AI dari Kampung Inggris. Tugas kamu adalah membimbing aku belajar LISTENING & SPEAKING di level ${userProfile.level}.
- Semua penjelasan dan koreksi harus disampaikan dalam Bahasa Indonesia.
Bagian A — Listening Practice:
- Di awal sesi, kamu *wajib memberikan 1 cerita atau monolog pendek dalam Bahasa Inggris* sesuai level ${userProfile.level}.
- Tidak boleh ada sapaan pembuka. Langsung cerita.
- Cerita harus jelas, 4-15 kalimat. List vocabulary penting di bawah cerita dalam tabel.
Bagian B — Speaking Challenge:
- Setelah aku bilang *I'm ready to practice*, beri aku pertanyaan comprehension tentang isi cerita satu per satu.
- Pertanyaan dalam Bahasa Inggris + terjemahan Bahasa Indonesia.
- Kalau jawabanku salah koreksi jawabanku sesuai Teks cerita. Lalu berikan pertanyaan yang sama biar aku bisa menjawab dengan benar.`,

  conversation: `Perkenalkan nama ku: ${userProfile.name}. Genderku: ${userProfile.gender}. Level bahasa Inggris saya: ${userProfile.level}.
Instruksi untuk AI:
- Kamu adalah RichardMeha AI dari Kampung Inggris yang menyapaku di awal dan akhir sesi.
- Kasih saya contoh conversation sesuai topik dan tokoh yang saya pilih. Formatkan dalam tabel 3 kolom: Speaker, English Dialogue, dan Terjemahan Bahasa Indonesia.
- Gaya bicara HARUS sesuai dengan karakter tokoh yang aku pilih.
- Di bawah tabel, kasih highlight kosakata/idiom dengan arti Bahasa Indonesia.
Di sesi latihan baca dialog (Voice mode):
- Kalau aku jawab Baca text dulu, kamu langsung baca text dari dialog bergantian denganku.
- Kalau aku bilang improvisasi, abaikan text dialog langsung memerankan karakter tanpa narasi dan memberikan pertanyaan bahasa inggris. TIDAK BOLEH PAKAI BAHASA INDONESIA.
- Jangan kasih pujian seperti 'good job' saat baca teks. Jangan tambahkan komentar.`
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
      case 'conversation':
        return <ConversationModule basePrompt={prompts.conversation} isPro={userProfile.is_pro} charactersList={CONVERSATION_CHARACTERS} />;
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

function ChatModule({ module, basePrompt, topic = '', startMessage = 'Mulai pelajaran hari ini RichardMeha AI!', hideInputAtStart = false, onComplete, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [translationPopover, setTranslationPopover] = useState(null);
  const [inlineTranslation, setInlineTranslation] = useState(null);
  
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
    const handleClick = (e) => {
      if (e.target.classList.contains('translatable-sentence')) {
        const rect = e.target.getBoundingClientRect();
        setTranslationPopover({
          text: e.target.innerText,
          x: rect.left,
          y: rect.bottom + window.scrollY,
          targetRef: e.target
        });
        setInlineTranslation(null);
      } else if (!e.target.closest('.translation-popover')) {
        setTranslationPopover(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  
  const handleInlineTranslate = async (lang) => {
    if (!translationPopover) return;
    setInlineTranslation({ loading: true, text: '' });
    try {
      const url = `http://localhost:3000/api/gemini`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Tolong terjemahkan kalimat bahasa Inggris berikut ke bahasa ${lang} secara natural:\n\n"${translationPopover.text}"` }] }]
        })
      });
      const data = await res.json();
      const translation = data.candidates[0].content.parts[0].text;
      setInlineTranslation({ loading: false, text: translation });
    } catch (err) {
      setInlineTranslation({ loading: false, text: "Gagal menerjemahkan." });
    }
  };


  useEffect(() => {
    if (messages.length === 0 && hideInputAtStart) {
      sendMessage(startMessage, true);
    } else if (messages.length === 0 && topic) {
      // Send topic name explicitly and prominently so AI knows the exact topic
      sendMessage(`TOPIK HARI INI: ${topic}. Mulai sesi pembelajaran tentang "${topic}" sekarang!`, true);
    }
  }, []);

  // --- TEXT TO SPEECH (TTS) ---
  // --- TEXT TO SPEECH (TTS) with Bilingual Support ---
  const handleTTS = (text) => {
    if (!('speechSynthesis' in window)) {
      alert("Browser Anda tidak mendukung fitur suara.");
      return;
    }
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\|/g, ', ')
      .replace(/[-_]{2,}/g, '')
      .trim();

    if (!cleanText) return;

    const isEnglish = (str) => {
      const enWords = /\b(the|is|are|was|were|you|your|this|that|have|has|will|can|do|does|not|with|for|and|but|in|on|at|to|a|an|it|its|he|she|we|they|my|his|her|our)\b/i;
      return enWords.test(str);
    };

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
        || voices.find(v => v.lang === 'en-US')
        || voices.find(v => v.lang.startsWith('en'));
      const idVoice = voices.find(v => v.lang === 'id-ID')
        || voices.find(v => v.lang.startsWith('id'))
        || enVoice;

      const sentences = cleanText.match(/[^.!?\n]+[.!?\n]?/g) || [cleanText];
      const queue = sentences.map(s => s.trim()).filter(Boolean).map(s => {
        const u = new SpeechSynthesisUtterance(s);
        u.rate = 0.9;
        u.pitch = 1.05;
        if (isEnglish(s)) { u.lang = 'en-US'; if (enVoice) u.voice = enVoice; }
        else { u.lang = 'id-ID'; if (idVoice) u.voice = idVoice; }
        return u;
      });

      if (!queue.length) return;
      queue[0].onstart = () => setIsSpeaking(true);
      queue[queue.length - 1].onend = () => setIsSpeaking(false);
      queue[queue.length - 1].onerror = () => setIsSpeaking(false);
      queue.forEach(u => window.speechSynthesis.speak(u));
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = doSpeak;
    }
  };

  // --- SPEECH TO TEXT (STT) --- Bilingual EN + ID
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung Microphone. Gunakan Chrome di HP atau PC.");
      return;
    }

    // Stop TTS if it's speaking before recording
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Single utterance mode - more reliable on mobile
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      // Use id-ID for better bilingual support in Indonesian context
      recognitionRef.current.lang = 'id-ID';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        if (finalTranscript) {
          setInputValue(prev => prev + finalTranscript + ' ');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("STT Error:", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert("⚠️ Izin Microphone ditolak!\n\nCara mengaktifkan:\n1. Klik ikon gembok/info di address bar browser\n2. Ubah izin Microphone menjadi 'Izinkan'\n3. Refresh halaman dan coba lagi.");
        } else if (event.error === 'network') {
          alert("Error jaringan saat merekam. Pastikan koneksi internet stabil.");
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          alert(`Microphone error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("STT start error:", err);
      setIsRecording(false);
      alert("Gagal mengaktifkan microphone. Coba refresh dan ulangi.");
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
      const url = `http://localhost:3000/api/gemini`;
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
        
        const errText = await res.text();
        console.error("Gemini API Error details:", errText);
        
        if (res.status === 429 || res.status >= 500) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else {
          throw new Error(`API Error ${res.status}: ${errText}`);
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
      const contents = updatedMessages.filter(msg => !msg.isHidden && msg.role !== 'system').map(msg => ({
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

      const url = `http://localhost:3000/api/gemini`;
      
      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const aiText = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
        // Auto speak AI response for Stimuler-like experience
        handleTTS(aiText); 
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
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-xs font-mono font-bold">$1</code>')
        .replace(/__(.*?)__/g, '<u>$1</u>');
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
      {/* Top Banner with Back Button */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 px-4 md:px-6 flex justify-between items-center absolute top-0 w-full z-10 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="shrink-0 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-xl transition-colors active:scale-95 border border-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              <span className="hidden sm:inline">Ganti Topik</span>
            </button>
          )}
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">{module}</h3>
            {topic && <p className="text-xs text-slate-500 truncate">Topik: <span className="font-medium text-blue-600">{topic}</span></p>}
          </div>
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
                    <User size={16} />
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

      
      {translationPopover && (
        <div 
          className="absolute z-50 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 w-72 translation-popover animate-in fade-in zoom-in duration-200"
          style={{ top: translationPopover.y + 10, left: Math.min(translationPopover.x, window.innerWidth - 300) }}
        >
          <div className="flex justify-between items-center mb-3 border-b pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Languages size={14}/> Terjemahkan ke:</span>
            <button onClick={() => setTranslationPopover(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
          </div>
          
          {!inlineTranslation && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={() => handleInlineTranslate('Indonesia')} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 py-1.5 rounded-lg font-bold border border-red-100">🇮🇩 Indonesia</button>
              <button onClick={() => handleInlineTranslate('Spanyol')} className="text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 py-1.5 rounded-lg font-bold border border-yellow-100">🇪🇸 Spanyol</button>
              <button onClick={() => handleInlineTranslate('Jepang')} className="text-xs bg-slate-50 text-slate-700 hover:bg-slate-200 py-1.5 rounded-lg font-bold border border-slate-200">🇯🇵 Jepang</button>
              <button onClick={() => handleInlineTranslate('Korea')} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 rounded-lg font-bold border border-blue-100">🇰🇷 Korea</button>
            </div>
          )}

          {inlineTranslation && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-800">
              {inlineTranslation.loading ? (
                <div className="flex items-center gap-2 text-slate-500"><Loader2 size={14} className="animate-spin" /> Menerjemahkan...</div>
              ) : (
                <p className="font-medium">{inlineTranslation.text}</p>
              )}
            </div>
          )}
        </div>
      )}

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
