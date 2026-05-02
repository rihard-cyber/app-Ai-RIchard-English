import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Play,
  Loader2,
  Sparkles,
  Crown
} from 'lucide-react';

const PRONUNCIATION_PROMPT = `
Kamu adalah Pelatih Pengucapan (Pronunciation Coach) Bahasa Inggris.
Tugasmu adalah memberikan kalimat latihan, mendengarkan input user, dan memberikan skor akurasi.

PROSEDUR:
1. Berikan 1 kalimat bahasa Inggris yang menantang (sesuaikan dengan level user).
2. Tunggu user mengucapkannya.
3. Berikan skor (0-100%) dan feedback mendetail:
   - Mana kata yang sudah benar.
   - Mana kata yang pengucapannya masih kurang tepat.
   - Berikan tips cara memposisikan lidah/bibir jika perlu.

FORMAT RESPONS:
Score: [Score]%
Analysis: [Analisa kata per kata]
Tips: [Saran perbaikan]
`;

export default function PronunciationCoach({ userProfile, onComplete, isPro, onUpgrade }) {
  const [targetSentence, setTargetSentence] = useState('');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [usageCount, setUsageCount] = useState(() => parseInt(localStorage.getItem('speaking_coach_usage') || '0'));
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('speaking_coach_usage', usageCount.toString());
  }, [usageCount]);

  // Lock after 3 attempts (approx 40% of a full session context) if not PRO
  const isLocked = !isPro && usageCount >= 3;

  if (isLocked) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-gradient-to-tr from-rose-400 to-pink-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-rose-500/20">
            <Crown size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">Speaking Coach PRO 👑</h2>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">
            Kamu sudah menggunakan jatah gratis harian (3x latihan). Upgrade ke PRO untuk latihan tanpa batas dengan feedback AI instan!
          </p>
          <button
            onClick={onUpgrade}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-lg"
          >
            Upgrade Sekarang
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    generateNewSentence();
  }, []);

  const generateNewSentence = async () => {
    setIsLoading(true);
    setAnalysis(null);
    setTranscript('');

    try {
      const payload = {
        contents: [{ role: 'user', parts: [{ text: `Berikan saya 1 kalimat latihan pengucapan untuk level ${userProfile.level}. Berikan kalimatnya saja tanpa teks lain.` }] }],
        systemInstruction: { parts: [{ text: "You are a helpful English teacher. ONLY return 1 short, clear practice sentence. No extra text." }] }
      };

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        setTargetSentence("⚠️ API Key Gemini belum diatur (VITE_GEMINI_API_KEY).");
        setIsLoading(false);
        return;
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API Error");
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Hello, how are you today?";
      setTargetSentence(text.trim().replace(/"/g, ''));
    } catch (error) {
      console.error(error);
      setTargetSentence("I want to improve my English skills.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        analyzePronunciation(result);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const analyzePronunciation = async (text) => {
    setIsLoading(true);
    try {
      const payload = {
        contents: [{ role: 'user', parts: [{ text: `Kalimat target: "${targetSentence}"\nUser mengucapkan: "${text}"\n\nTolong berikan skor dan analisa pengucapannya.` }] }],
        systemInstruction: { parts: [{ text: PRONUNCIATION_PROMPT }] }
      };

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        setAnalysis("⚠️ API Key Gemini belum diatur. Tambahkan di file .env Anda.");
        setIsLoading(false);
        return;
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API Error");
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error analyzing pronunciation.";
      setAnalysis(aiResponse);
      setUsageCount(prev => prev + 1);

      // Auto-save progress if score detected
      const scoreMatch = aiResponse.match(/Score: (\d+)/);
      if (scoreMatch && onComplete) {
        onComplete(parseInt(scoreMatch[1]));
      }
    } catch (error) {
      console.error(error);
      setAnalysis("Maaf, koneksi ke RichardMeha terputus. Coba lagi ya!");
    } finally {
      setIsLoading(false);
    }
  };

  const speakSentence = () => {
    const utterance = new SpeechSynthesisUtterance(targetSentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
          <Mic size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pronunciation Coach</h2>
          <p className="text-sm text-slate-500">Dengarkan kalimatnya, lalu ulangi untuk mendapatkan skor akurasi.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-10 text-center space-y-8 relative overflow-hidden">
        {/* Progress background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/30 to-transparent pointer-events-none"></div>

        <div className="relative">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-4">Ucapkan Kalimat Ini:</p>
          <h3 className="text-2xl md:text-4xl font-extrabold text-slate-800 leading-tight">
            {isLoading && !targetSentence ? <Loader2 className="animate-spin mx-auto text-slate-300" size={40} /> : `"${targetSentence}"`}
          </h3>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={speakSentence}
            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            title="Dengarkan Contoh"
          >
            <Volume2 size={24} />
          </button>
          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className={`p-8 rounded-full transition-all active:scale-90 shadow-2xl ${isRecording
                ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-100'
                : 'bg-white border-4 border-rose-500 text-rose-500 hover:bg-rose-50'
              }`}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          <button
            onClick={generateNewSentence}
            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            title="Kalimat Baru"
          >
            <RefreshCw size={24} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {transcript && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Deteksi Suara Anda:</p>
            <p className="text-lg font-medium text-slate-600 italic">"{transcript}"</p>
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-xl p-6 md:p-8 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-yellow-500" /> Hasil Penilaian
            </h3>
            {analysis.match(/Score: (\d+)/) && (
              <div className="text-2xl font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">
                {analysis.match(/Score: (\d+)/)[1]}%
              </div>
            )}
          </div>

          <div className="space-y-4 text-slate-600 leading-relaxed">
            {analysis.split('\n').map((line, i) => (
              <p key={i} className="text-sm md:text-base">{line}</p>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={generateNewSentence}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-10 rounded-2xl transition-all shadow-lg shadow-rose-500/20 active:scale-95"
            >
              Latihan Kalimat Lain
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
