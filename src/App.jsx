import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Headphones,
  BookA,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
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
  RefreshCw,
  Trash2,
  WifiOff,
  Bell,
  BellOff,
  Star,
  Share2
} from 'lucide-react';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { LoginPage, SubscriptionPage } from './Auth';
import PaymentModal from './PaymentModal';
import { supabase } from './supabaseClient';
import { CURRICULUM } from './data/curriculum';
import { AiOrchestrator } from './AiOrchestrator';
import ChatModule from './ChatModule';
import Sidebar from './Sidebar';
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

// --- SOUND EFFECTS UTILITY ---
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      // Modern Console UI Pop/Chime (C6 -> E6 cepat)
      const now = audioCtx.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1046.50, now); // C6
      oscillator.frequency.exponentialRampToValueAtTime(1318.51, now + 0.05); // E6

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } else if (type === 'levelup') {
      // Modern Console Achievement (Arpeggio Sparkle)
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // Chord C Major

      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const startTime = now + (i * 0.08);
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    }
  } catch (e) {
    console.warn("AudioContext not supported", e);
  }
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [loadingText, setLoadingText] = useState('Memuat Sistem...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // State untuk melacak preferensi Notifikasi Pengingat
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(() => {
    const saved = localStorage.getItem('richard_notifications');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('richard_notifications', isNotificationEnabled);
  }, [isNotificationEnabled]);

  // --- SETUP LOCAL NOTIFICATIONS ---
  useEffect(() => {
    let actionListener;
    const manageNotifications = async () => {
      try {
        if (isNotificationEnabled) {
          let permStatus = await LocalNotifications.checkPermissions();
          if (permStatus.display !== 'granted') {
            permStatus = await LocalNotifications.requestPermissions();
          }
          if (permStatus.display !== 'granted') {
            setIsNotificationEnabled(false);
            return; // Batal jika ditolak
          }

          const pending = await LocalNotifications.getPending();
          if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
          }

          await LocalNotifications.schedule({
            notifications: [{
              title: "Waktunya Belajar! 🚀",
              body: "RichardMeha AI sudah menunggumu. Yuk lanjut tingkatkan level bahasa Inggrismu malam ini!",
              id: 1,
              schedule: {
                allowWhileIdle: true,
                on: { hour: 19, minute: 0 },
                repeats: true
              }
            }]
          });
        } else {
          const pending = await LocalNotifications.getPending();
          if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
          }
        }

        // Listener untuk mendeteksi saat notifikasi diklik dan aplikasi terbuka
        actionListener = await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          const notifId = notificationAction.notification.id;
          if (notifId === 1) { // ID 1 adalah pengingat belajar kita
            // Beri jeda sejenak agar WebView dan UI React selesai di-render
            setTimeout(async () => {
              const msg = "Selamat datang kembali! RichardMeha AI sudah siap menemanimu belajar hari ini.";
              try {
                await TextToSpeech.speak({ text: msg, lang: 'id-ID', rate: 1.0 });
              } catch (e) { console.warn("TTS Error saat buka notifikasi:", e); }
            }, 1500);
          }
        });
      } catch (error) { console.warn("Local Notifications Error:", error); }
    };

    const timerId = setTimeout(() => manageNotifications(), 5000);
    return () => {
      clearTimeout(timerId);
      if (actionListener) actionListener.remove();
    };
  }, [isNotificationEnabled]);

  useEffect(() => {
    if (showSplash) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + Math.floor(Math.random() * 15) + 5;
          return next > 99 ? 99 : next;
        });
      }, 150);

      const texts = ['Memuat Sistem...', 'Menyiapkan AI...', 'Koneksi ke Server...', 'Hampir Siap...'];
      let textIndex = 0;
      const textInterval = setInterval(() => {
        textIndex = (textIndex + 1) % texts.length;
        setLoadingText(texts[textIndex]);
      }, 500);

      return () => {
        clearInterval(interval);
        clearInterval(textInterval);
      };
    }
  }, [showSplash]);

  // State untuk melacak preferensi Sapaan Suara Otomatis
  const [isVoiceGreetingEnabled, setIsVoiceGreetingEnabled] = useState(() => {
    const saved = localStorage.getItem('richard_voice_greeting');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('richard_voice_greeting', isVoiceGreetingEnabled);
  }, [isVoiceGreetingEnabled]);

  // State untuk melacak preferensi Gender Suara Sapaan
  const [voiceGreetingGender, setVoiceGreetingGender] = useState(() => {
    return localStorage.getItem('richard_voice_greeting_gender') || 'female';
  });

  useEffect(() => {
    localStorage.setItem('richard_voice_greeting_gender', voiceGreetingGender);
  }, [voiceGreetingGender]);

  // State untuk melacak gesture Swipe (Geser Layar)
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Logika Sidebar: Swipe Right dari ujung kiri layar (x < 40px)
      if (distanceX < -40 && touchStart.x < 40 && !isSidebarOpen) {
        setIsSidebarOpen(true);
        return;
      }
      if (distanceX > 40 && isSidebarOpen) {
        setIsSidebarOpen(false);
        return;
      }

      // Logika Pindah Tab Utama via Swipe (Hanya berjalan jika sidebar tertutup)
      const swipeableTabs = ['home', 'progress', 'leaderboard', 'settings'];
      const currentIndex = swipeableTabs.indexOf(activeTab);

      if (currentIndex !== -1 && !isSidebarOpen) {
        // Swipe Kiri (Ke menu selanjutnya)
        if (distanceX > 70 && currentIndex < swipeableTabs.length - 1) {
          setActiveTab(swipeableTabs[currentIndex + 1]);
          setSearchQuery('');
        }
        // Swipe Kanan (Ke menu sebelumnya)
        if (distanceX < -70 && currentIndex > 0 && touchStart.x >= 40) { // Batasi sentuhan agar tidak memicu sidebar
          setActiveTab(swipeableTabs[currentIndex - 1]);
          setSearchQuery('');
        }
      }
    }
  };

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    // Stabilisasi Web Speech API: Preload voice awal untuk menghindari suara silent di first load
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Tracker state terkini untuk Global Back Button
  const backButtonStateRef = useRef({ isSidebarOpen, isPaymentModalOpen, activeTab, authState });
  useEffect(() => {
    backButtonStateRef.current = { isSidebarOpen, isPaymentModalOpen, activeTab, authState };
  }, [isSidebarOpen, isPaymentModalOpen, activeTab, authState]);

  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', () => {
      const { isSidebarOpen: sidebar, isPaymentModalOpen: modal, activeTab: tab, authState: auth } = backButtonStateRef.current;

      if (auth !== 'app') {
        CapacitorApp.minimizeApp();
      } else if (sidebar) {
        setIsSidebarOpen(false);
      } else if (modal) {
        setIsPaymentModalOpen(false);
      } else if (tab !== 'home') {
        setActiveTab('home');
      } else {
        CapacitorApp.minimizeApp();
      }
    });
    return () => { backListener.then(listener => listener.remove()); };
  }, []);

  useEffect(() => {
    // Ambil API Key terbaru (Single Source of Truth) dari Supabase
    const fetchKeys = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('app_settings').select('value').eq('id', 'api_keys').maybeSingle();
        if (data && data.value) {
          let keysObj = data.value;
          if (typeof keysObj === 'string') {
            try {
              keysObj = JSON.parse(keysObj);
            } catch (e) {
              keysObj = { openai: '', gemini: data.value, groq: '', l10n: '', elevenlabs: '', elevenlabsVoiceId: '', iflytekAppId: '', iflytekApiKey: '', iflytekApiSecret: '' };
            }
          }
          setGlobalApiKey(keysObj);
        }
      } catch (err) { }
    };
    fetchKeys();

    // Supabase Realtime Subscription untuk update API Key secara instan
    const apiKeysChannel = supabase
      .channel('public:app_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: "id=eq.api_keys" }, (payload) => {
        if (payload.new && payload.new.value) {
          let keysObj = payload.new.value;
          if (typeof keysObj === 'string') {
            try { keysObj = JSON.parse(keysObj); } catch (e) { keysObj = { openai: '', gemini: payload.new.value, groq: '', l10n: '', elevenlabs: '', elevenlabsVoiceId: '', iflytekAppId: '', iflytekApiKey: '', iflytekApiSecret: '' }; }
          }
          setGlobalApiKey(keysObj);
        }
      })
      .subscribe();

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
      supabase.removeChannel(apiKeysChannel);
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
          // Eksekusi side-effect di luar siklus render murni (menghindari error StrictMode React 18)
          Promise.resolve().then(() => {
            supabase.from('user_profiles').update({ level: newLevel }).eq('id', user.id).then();
            playSound('levelup');
            setShowLevelUpConfetti(true);
            setLevelUpMessage(newLevel);
            if (navigator.vibrate) {
              try { navigator.vibrate([100, 50, 100, 50, 100]); } catch (e) { } // Getaran panjang saat level up
            }
            setTimeout(() => { setShowLevelUpConfetti(false); setLevelUpMessage(''); }, 6000);
          });
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
      let { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();

      if (error) throw error;

      // AUTO-INSERT JIKA PROFIL BELUM ADA (User Baru Mendaftar)
      if (!data && userObj) {
        const newProfile = {
          id: userId,
          email: userEmail,
          full_name: metaName || 'User',
          gender: 'male',
          level: 'Beginner (A1)',
          xp: 0,
          streak: 0,
          has_completed_initial_test: false,
          is_pro: false,
          subscription_plan: 'Free'
        };
        const insertRes = await supabase.from('user_profiles').insert(newProfile).select().maybeSingle();
        if (insertRes.error) console.error("Auto-Insert Profile Error:", insertRes.error);
        if (insertRes.data) data = insertRes.data;
      }

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

  const handleDeleteHistory = async () => {
    if (!window.confirm("Yakin ingin menghapus seluruh riwayat belajar (XP, level, dan progres)? Data tidak bisa dikembalikan.")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_progress').delete().eq('user_id', user.id);
      await supabase.from('user_profiles').update({ xp: 0, level: 'Beginner (A1)', has_completed_initial_test: false, streak: 0 }).eq('id', user.id);
      alert("Riwayat berhasil dihapus. Aplikasi akan dimuat ulang.");
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt("PERINGATAN KRITIS: Anda yakin ingin menghapus akun? Ketik 'HAPUS' untuk mengonfirmasi:");
    if (confirmation !== 'HAPUS') return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').delete().eq('id', user.id);
      await supabase.from('user_progress').delete().eq('user_id', user.id);
      await handleLogout();
      alert("Data profil berhasil dihapus. Silakan hubungi Admin (richardpl.meha@gmail.com) jika Anda ingin menghapus email Anda secara permanen dari sistem.");
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'RichardMeha AI - Ultimate English Tutor',
      text: 'Hai! Yuk belajar bahasa Inggris bareng RichardMeha AI. Aplikasinya keren banget dan seru lho!',
      url: 'https://play.google.com/store/apps/details?id=com.richardmeha.englishku'
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
        window.open(waUrl, '_system');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const saveProgress = async (skill, score, details = {}) => {
    if (navigator.vibrate) {
      try { navigator.vibrate([50, 50, 50]); } catch (e) { } // Getaran success beruntun
    }
    playSound('success');
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
        return <HomeDashboard onNavigate={handleTabChange} userProfile={userProfile} recommendation={recommendation} onStartGoal={(id) => { setActiveGoalId(id); setActiveTab('goal_session'); }} onUpgrade={() => triggerUpgrade()} isVoiceGreetingEnabled={isVoiceGreetingEnabled} voiceGreetingGender={voiceGreetingGender} />;
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
          <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 transform-gpu">
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Sapaan Suara</h4><p className="text-xs text-slate-500">Sapaan otomatis saat membuka aplikasi.</p></div>
                <button onClick={() => setIsVoiceGreetingEnabled(!isVoiceGreetingEnabled)} className={`p-3 rounded-2xl transition-all active:scale-95 ${isVoiceGreetingEnabled ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {isVoiceGreetingEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              </div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Notifikasi Pengingat</h4><p className="text-xs text-slate-500">Pengingat belajar setiap jam 7 malam.</p></div>
                <button onClick={() => setIsNotificationEnabled(!isNotificationEnabled)} className={`p-3 rounded-2xl transition-all active:scale-95 ${isNotificationEnabled ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {isNotificationEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </button>
              </div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Jenis Suara Sapaan</h4><p className="text-xs text-slate-500">Pilih suara sapaan pria atau wanita.</p></div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const msg = "Halo, ini adalah contoh suara sapaan otomatis.";
                      const pitch = voiceGreetingGender === 'male' ? 0.8 : 1.2;
                      try {
                        await TextToSpeech.speak({ text: msg, lang: 'id-ID', rate: 1.0, pitch });
                      } catch (e) {
                        const utterance = new SpeechSynthesisUtterance(msg);
                        utterance.lang = 'id-ID';
                        utterance.pitch = pitch;
                        const voices = window.speechSynthesis.getVoices();
                        const idVoices = voices.filter(v => v.lang.includes('id') || v.lang.includes('ID'));
                        if (idVoices.length > 0) {
                          let targetVoice = idVoices.find(v => voiceGreetingGender === 'male' ? /male|pria|laki|ardi|andika/i.test(v.name) : /female|perempuan|wanita|gadis|siti/i.test(v.name));
                          if (targetVoice) utterance.voice = targetVoice;
                        }
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    disabled={!isVoiceGreetingEnabled}
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50 border border-indigo-100 shadow-sm"
                    title="Preview Suara"
                  >
                    <Volume2 size={18} />
                  </button>
                  <select value={voiceGreetingGender} onChange={(e) => setVoiceGreetingGender(e.target.value)} disabled={!isVoiceGreetingEnabled} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-all shadow-sm disabled:opacity-50">
                    <option value="female">Wanita</option>
                    <option value="male">Pria</option>
                  </select>
                </div>
              </div>

              {/* Tombol Rate App */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Beri Nilai Aplikasi</h4><p className="text-xs text-slate-500">Dukung RichardMeha AI dengan ulasan bintang 5!</p></div>
                <button onClick={() => window.open('https://play.google.com/store/apps/details?id=com.richardmeha.englishku', '_system')} className="px-5 py-2.5 bg-yellow-50 text-yellow-600 font-black rounded-xl hover:bg-yellow-100 transition-all active:scale-95 text-xs shadow-sm flex items-center gap-1">
                  <Star size={14} className="fill-yellow-600" /> RATE APP
                </button>
              </div>

              {/* Tombol Bagikan Aplikasi */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Bagikan Aplikasi</h4><p className="text-xs text-slate-500">Ajak temanmu belajar bahasa Inggris bersama.</p></div>
                <button onClick={handleShareApp} className="px-5 py-2.5 bg-emerald-50 text-emerald-600 font-black rounded-xl hover:bg-emerald-100 transition-all active:scale-95 text-xs shadow-sm flex items-center gap-1">
                  <Share2 size={14} className="stroke-[3]" /> SHARE
                </button>
              </div>

              {/* Tambahan: Tombol Clear Cache untuk HP Android */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Refresh Sistem</h4><p className="text-xs text-slate-500">Hapus cache API & muat ulang aplikasi.</p></div>
                <button onClick={() => { window.location.reload(true); }} className="px-5 py-2.5 bg-blue-50 text-blue-600 font-black rounded-xl hover:bg-blue-100 transition-all active:scale-95 text-xs shadow-sm">
                  <RefreshCw size={14} className="inline-block mr-1" /> CLEAR CACHE
                </button>
              </div>

              {/* Opsi Hapus Data / Akun */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Reset Riwayat Belajar</h4><p className="text-xs text-slate-500">Mulai ulang progres (XP & Level) dari 0.</p></div>
                <button onClick={handleDeleteHistory} className="px-5 py-2.5 bg-amber-50 text-amber-600 font-black rounded-xl hover:bg-amber-100 transition-all active:scale-95 text-xs shadow-sm"><RefreshCw size={14} className="inline-block mr-1" /> RESET DATA</button>
              </div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div><h4 className="font-bold text-slate-800">Hapus Akun</h4><p className="text-xs text-slate-500">Hapus profil secara permanen.</p></div>
                <button onClick={handleDeleteAccount} className="px-5 py-2.5 bg-rose-50 text-rose-600 font-black rounded-xl hover:bg-rose-100 transition-all active:scale-95 text-xs shadow-sm"><Trash2 size={14} className="inline-block mr-1" /> HAPUS AKUN</button>
              </div>

              <div className="p-6"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all active:scale-95"><LogOut size={18} /> Keluar dari Akun</button></div>
            </div>
          </div>
        );
      default: return <HomeDashboard onNavigate={handleTabChange} userProfile={userProfile} recommendation={recommendation} onStartGoal={(id) => { setActiveGoalId(id); setActiveTab('goal_session'); }} onUpgrade={() => triggerUpgrade()} isVoiceGreetingEnabled={isVoiceGreetingEnabled} voiceGreetingGender={voiceGreetingGender} />;
    }
  };

  if (isInitializing || showSplash) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative overscroll-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500 fade-in transform-gpu w-full max-w-xs">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 mb-6 relative">
            <div className="absolute inset-0 rounded-[2rem] border-4 border-white/20 animate-ping"></div>
            <Sparkles className="text-white w-12 h-12 animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">
            RichardMeha<span className="text-blue-500"> AI</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide mb-12">Ultimate English Tutor</p>

          <div className="w-full flex flex-col gap-3 mt-4">
            <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase text-slate-400">
              <span>{loadingText}</span>
              <span className="text-blue-400">{loadingProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-200 ease-out" style={{ width: `${loadingProgress}%` }}></div>
            </div>
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

  return (
    <GlobalContext.Provider value={{ globalApiKey, userProfile }}>
      <style>
        {`
          /* Modern CSS Haptic Feedback */
          button, .cursor-pointer {
            -webkit-tap-highlight-color: transparent; /* Hilangkan kotak biru Android saat tap */
          }
          .active\\:scale-95:active, .active\\:scale-90:active {
            transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275) !important; /* Bounce memantul ala iOS */
            transition-duration: 100ms !important;
          }

          /* --- ELEGANT DARK MODE GLOBAL OVERRIDES --- */
          /* Membalikkan warna kartu (bg-white) menjadi gelap elegan secara otomatis */
          .dark-mode .bg-white {
            background-color: #1e293b !important; /* slate-800 */
            border-color: rgba(255, 255, 255, 0.05) !important;
            color: #f8fafc !important; /* slate-50 */
          }
          /* Membalikkan warna panel abu-abu muda menjadi lebih gelap (Deep Navy) */
          .dark-mode .bg-slate-50, .dark-mode .bg-slate-100 {
            background-color: #0f172a !important; /* slate-900 */
            border-color: rgba(255, 255, 255, 0.05) !important;
            color: #e2e8f0 !important;
          }
          /* Memastikan teks yang tadinya gelap (untuk light mode) menjadi putih/terang */
          .dark-mode .text-slate-800, .dark-mode .text-slate-700 {
            color: #f1f5f9 !important; /* slate-100 */
          }
          .dark-mode .text-slate-600, .dark-mode .text-slate-500 {
            color: #94a3b8 !important; /* slate-400 */
          }
          /* Membuat bayangan (Shadow) lebih pekat agar menyatu dengan latar belakang gelap */
          .dark-mode .shadow-xl, .dark-mode .shadow-lg, .dark-mode .shadow-sm {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
          }
          /* Meredupkan area input agar tidak menyilaukan */
          .dark-mode input, .dark-mode textarea, .dark-mode select {
            background-color: #0f172a !important; /* slate-900 */
            color: #f8fafc !important;
            border-color: #334155 !important;
          }
        `}
      </style>
      {isOffline && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-4 duration-300 border border-slate-700">
          <WifiOff size={16} className="text-rose-500" /> Koneksi Terputus
        </div>
      )}
      <div
        className={`flex h-screen h-[100dvh] w-full font-sans overflow-hidden overscroll-none transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b1121] text-slate-200 dark-mode' : 'bg-slate-50 text-slate-800'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        <Sidebar
          currentRoute={activeTab}
          onNavigate={handleTabChange}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          userProfile={userProfile}
          onLogout={handleLogout}
          onAdminClick={() => { localStorage.setItem('owner_mode', 'admin'); setAuthState('admin'); }}
        />

        <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
          <header className="h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-30 shrink-0 md:hidden shadow-sm">
            <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"><Menu size={24} /></button><h2 onClick={handleLogoClick} title={userProfile.is_admin ? 'Klik 2x untuk ke Admin' : ''} className="text-lg font-semibold text-slate-800 flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform touch-manipulation">RichardMeha<span className="text-blue-600"> AI</span></h2></div>
            <div className="flex items-center gap-2"><div className="flex items-center gap-1 text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full"><Flame size={16} className="fill-orange-500" /> {userProfile.streak}</div></div>
          </header>
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative bg-slate-50/50 transform-gpu overscroll-none scroll-smooth pb-[env(safe-area-inset-bottom)]" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Suspense fallback={<LoadingFallback />}>
              <div key={activeTab} className="w-full min-h-full animate-in fade-in slide-in-from-right-8 duration-300 ease-out fill-mode-forwards">
                {renderContent()}
              </div>
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
const getGreetingTime = () => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour <= 10) return 'Pagi';
  if (hour >= 11 && hour <= 14) return 'Siang';
  if (hour >= 15 && hour <= 18) return 'Sore';
  return 'Malam';
};

function HomeDashboard({ onNavigate, userProfile, recommendation, onStartGoal, onUpgrade, isVoiceGreetingEnabled, voiceGreetingGender }) {
  const safeLevel = userProfile?.level || 'Pemula Dasar (A1)';
  const levelData = CURRICULUM[safeLevel] || CURRICULUM['Pemula Dasar (A1)'];
  const { globalApiKey } = React.useContext(GlobalContext) || {};
  const [toastMessage, setToastMessage] = useState('');
  const [displayedToast, setDisplayedToast] = useState('');

  // Efek Ketikan Animasi (Typewriter)
  React.useEffect(() => {
    if (toastMessage) {
      let i = 0;
      setDisplayedToast('');
      const interval = setInterval(() => {
        setDisplayedToast(toastMessage.substring(0, i + 1));
        i++;
        if (i >= toastMessage.length) clearInterval(interval);
      }, 40); // Kecepatan ketikan 40ms per huruf
      return () => clearInterval(interval);
    }
  }, [toastMessage]);

  React.useEffect(() => {
    // Fitur Sapaan Suara Otomatis Berdasarkan Waktu
    const hasGreeted = sessionStorage.getItem('has_greeted');
    if (!hasGreeted) {
      const waktu = getGreetingTime();

      // Ambil nama panggilan saja (kata pertama) dan hilangkan simbol/emoji
      let namaPanggilan = 'Pengguna';
      if (userProfile?.name && userProfile.name.trim() !== '' && userProfile.name !== 'User') {
        namaPanggilan = userProfile.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
      }

      const greetingMsg = `Selamat ${waktu}, ${namaPanggilan}, dan selamat datang!`;

      // Menampilkan popup toast dengan durasi lebih panjang untuk membaca efek ketikan
      setToastMessage(greetingMsg);
      setTimeout(() => setToastMessage(''), 7000);

      if (isVoiceGreetingEnabled) {
        const speakGreeting = async () => {
          try {
            // Coba gunakan AI Premium Voice (iFLYTEK / ElevenLabs) terlebih dahulu
            if (globalApiKey && (globalApiKey.iflytekApiKey || globalApiKey.elevenlabs)) {
              await AiOrchestrator.speak(greetingMsg, globalApiKey, {
                lang: 'id-ID',
                rate: 1.0,
                pitch: voiceGreetingGender === 'male' ? 0.8 : 1.2,
                voiceId: voiceGreetingGender === 'male' ? '21m00Tcm4TlvDq8ikWAM' : 'EXAVITQu4vr4xnSDxMaL' // ID default Pria/Wanita
              });
              return;
            }
            throw new Error("No premium voice keys available");
          } catch (apiErr) {
            try {
              // Fallback 1: Capacitor Native TTS
              await TextToSpeech.speak({
                text: greetingMsg,
                lang: 'id-ID',
                rate: 1.0,
                pitch: voiceGreetingGender === 'male' ? 0.8 : 1.2,
              });
            } catch (err) {
              // Fallback 2: Browser Web Speech API
              console.warn("Greeting TTS Error, fallback to Web API:", err);
              const utterance = new SpeechSynthesisUtterance(greetingMsg);
              utterance.lang = 'id-ID';
              utterance.pitch = voiceGreetingGender === 'male' ? 0.8 : 1.2;
              const voices = window.speechSynthesis.getVoices();
              const idVoices = voices.filter(v => v.lang.includes('id') || v.lang.includes('ID'));
              if (idVoices.length > 0) {
                let targetVoice = idVoices.find(v => voiceGreetingGender === 'male' ? /male|pria|laki|ardi|andika/i.test(v.name) : /female|perempuan|wanita|gadis|siti/i.test(v.name));
                if (targetVoice) utterance.voice = targetVoice;
              }
              window.speechSynthesis.speak(utterance);
            }
          }
        };
        setTimeout(speakGreeting, 300);
      }

      // Tandai bahwa user sudah disapa di sesi ini
      sessionStorage.setItem('has_greeted', 'true');
    }
  }, [userProfile, isVoiceGreetingEnabled, voiceGreetingGender]);

  return (
    <div className="p-4 md:p-8 w-full max-w-[1280px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 transform-gpu pb-20 overflow-x-hidden">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl border bg-emerald-50 border-emerald-200 text-emerald-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <Sparkles size={20} />
          <span className="font-bold text-sm">{displayedToast}<span className="animate-pulse font-light">|</span></span>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Main Blue Card */}
        <div className="flex-1 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-[36px] p-8 md:p-10 text-white shadow-[0_10px_40px_rgba(37,99,235,0.2)] relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-500 transform-gpu pointer-events-none">
            <GraduationCap size={280} />
          </div>
          <div className="relative z-10 w-full">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6 border border-white/20">
              <Sparkles size={14} className="text-yellow-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/90">LEVEL: {userProfile.level.toUpperCase()}</span>
            </div>
            
            <h2 className="text-4xl md:text-[44px] font-black mb-4 leading-[1.1] tracking-tight">
              Lanjut Belajar,<br />{userProfile.name}!
            </h2>
            
            <p className="text-blue-50 mb-10 md:text-[15px] max-w-md opacity-90 leading-relaxed font-medium">
              Target kamu hari ini: **{levelData?.goals?.[0]?.name || levelData?.goals?.[0] || 'Perkenalan Diri'}**.<br/>
              RichardMeha AI sudah siapkan materinya!
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              <button
                onClick={() => onNavigate(recommendation)}
                className="bg-white text-[#2563EB] font-black px-6 py-3.5 rounded-[16px] shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-[13px] uppercase tracking-widest shrink-0"
              >
                <Zap size={18} className="fill-[#2563EB]" />
                Mulai SPEAKING
              </button>
              
              <div className="flex gap-3 items-center">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-2 flex items-center gap-3">
                  <div className="bg-[#FF7A00] p-1.5 rounded-full shadow-sm">
                    <Flame size={16} className="text-white fill-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/80 font-black uppercase tracking-widest leading-none mb-0.5">Streak</span>
                    <span className="text-sm font-black text-white leading-none">{userProfile.streak} Hari</span>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-2 flex items-center gap-3">
                  <div className="bg-[#FBBF24] p-1.5 rounded-full shadow-sm">
                    <Trophy size={16} className="text-yellow-900 fill-yellow-900" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/80 font-black uppercase tracking-widest leading-none mb-0.5">Total XP</span>
                    <span className="text-sm font-black text-white leading-none">{userProfile.xp}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Right Sidebar */}
        <div className="w-full lg:w-[360px] bg-white rounded-[36px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col shrink-0">
          <h3 className="text-[17px] font-black text-slate-800 mb-6 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500 stroke-[2.5]" /> Goals Level {userProfile.level.split(' ')[0]}
          </h3>
          <div className="space-y-3 flex-1 w-full overflow-hidden">
            {(() => {
              const goals = levelData?.lessons || levelData?.goals || [
                { title: 'Greetings & Introductions', topic: 'HELLO, NICE TO MEET YOU. I AM FROM INDONESIA.' },
                { title: 'Numbers, Colors & Time', topic: 'TELLING TIME, COUNTING, AND BASIC COLORS.' },
                { title: 'Family & Daily Life', topic: 'PRO FEATURE' },
                { title: 'Basic Questions', topic: 'PRO FEATURE' }
              ];
              const freeCount = Math.ceil(goals.length * 0.4);
              return goals.slice(0,4).map((goal, i) => {
                const isLocked = i >= freeCount && !userProfile.is_pro;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (isLocked) onUpgrade();
                      else if (goal.id) onStartGoal(goal.id);
                    }}
                    className={`flex items-center gap-4 p-4 rounded-[20px] transition-all cursor-pointer relative overflow-hidden bg-white border ${isLocked ? 'border-slate-50 opacity-60 grayscale-[0.5]' : 'border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-blue-200 hover:-translate-y-0.5'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                      {isLocked ? <Lock size={12} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`text-xs font-black truncate leading-tight ${isLocked ? 'text-slate-500' : 'text-slate-700'}`}>{goal.title || goal.name || goal}</p>
                      <p className={`text-[8px] font-black uppercase tracking-widest mt-1 truncate ${isLocked ? 'text-slate-400' : 'text-slate-400'}`}>{isLocked ? 'PRO FEATURE' : (goal.topic || 'HELLO, NICE TO MEET YOU.')}</p>
                    </div>
                    {isLocked ? (
                      <Crown size={14} className="text-yellow-500 fill-yellow-500 absolute right-4 top-1/2 -translate-y-1/2" />
                    ) : (
                      <ArrowUpRight size={14} className="text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                );
              });
            })()}
          </div>
          <button onClick={() => onNavigate('assessment')} className="mt-6 text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 mx-auto">Cek level lagi? Ulangi Tes <ArrowUpRight size={12} /></button>
        </div>
      </div>

      <h3 className="text-[22px] font-black text-slate-800 mt-12 mb-6 px-2">Modul Belajar Pintar</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 w-full">
        <DashboardCard title="Vocabulary" icon={<BookA size={20} />} color="bg-[#F0F5FF] text-[#3B82F6]" onClick={() => onNavigate('vocabulary')} />
        <DashboardCard title="Speaking" icon={<Mic size={20} />} color="bg-[#FFF0F0] text-[#EF4444]" onClick={() => onNavigate('speaking')} />
        <DashboardCard title="Grammar" icon={<LayoutDashboard size={20} />} color="bg-[#F0FFF4] text-[#10B981]" onClick={() => onNavigate('grammar')} />
      </div>
      <div className="mt-12">
        <Suspense fallback={<div className="h-32 flex items-center justify-center bg-slate-50 rounded-[32px]"><Loader2 className="animate-spin text-blue-400" /></div>}>
          <AchievementSystem userProfile={userProfile} onNavigate={onNavigate} onUpgrade={onUpgrade} />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardCard({ title, icon, color, onClick }) {
  return (
    <div onClick={onClick} className="bg-white p-6 md:p-8 rounded-[36px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] cursor-pointer transition-all hover:-translate-y-1 group w-full flex flex-col justify-between min-h-[180px] md:min-h-[200px]">
      <div className={`w-14 h-14 rounded-[20px] ${color} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-md`}>
        {icon}
      </div>
      <h4 className="text-[20px] font-black text-slate-800 mt-auto">{title}</h4>
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
    <div className="p-4 md:p-10 w-full max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 transform-gpu overflow-x-hidden">
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
    <div className="p-4 md:p-10 w-full max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 transform-gpu overflow-x-hidden">
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


function NavItem({ icon, label, isActive, onClick, badge }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1 ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
      <div className="flex items-center gap-3">
        <span className={`${isActive ? 'text-white' : ''}`}>{icon}</span>
        <span className="text-sm whitespace-nowrap">{label}</span>
      </div>
      {badge && <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse shadow-sm shadow-rose-500/30">{badge}</span>}
    </button>
  );
}
