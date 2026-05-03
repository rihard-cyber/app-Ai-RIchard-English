import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  Loader2,
  Sparkles,
  Crown
} from 'lucide-react';
import { supabase } from './supabaseClient';

const PRONUNCIATION_PROMPT = `
Kamu adalah Richard, seorang Pelatih Pengucapan (Pronunciation Coach) Bahasa Inggris yang sangat ahli, profesional, dan akurat.
Tugasmu adalah menganalisis rekaman suara dari user, mendeteksi kesalahan pengucapan, dan memberikan feedback yang sangat konstruktif.
Bahasamu harus ramah, profesional, dan menggunakan Bahasa Indonesia yang baik agar mudah dipahami.
Kamu adalah Richard, Pelatih Pengucapan (Pronunciation Coach) Bahasa Inggris level Native & Profesional.
Tugasmu adalah menganalisis rekaman suara user secara mendalam, mendeteksi kesalahan pengucapan (mispronunciation) sekecil apapun, dan memberikan feedback yang sangat konstruktif, akurat, dan profesional.
Bahasamu harus ramah, memotivasi, namun tegas dalam memperbaiki kesalahan. Gunakan Bahasa Indonesia yang profesional.

Return JSON ONLY in this exact format. DO NOT wrap with markdown tags like \`\`\`json:
ATURAN WAJIB:
1. Output WAJIB 100% JSON valid. Tidak boleh ada teks apa pun di luar JSON.
2. JANGAN gunakan karakter baris baru (enter/newline) asli di dalam teks JSON. Gunakan "\\n" untuk membuat baris baru.
3. Jangan gunakan format markdown seperti \`\`\`json. Langsung mulai dengan { dan akhiri dengan }.

Format JSON:
{
  "grammar_score": 0-100,
  "vocab_score": 0-100,
  "fluency_score": 0-100,
  "comprehension_score": 0-100,
  "mistakes": ["Kata salah 1 (seharusnya X)", "Kata salah 2 (seharusnya Y)"],
  "mistakes": ["Kata salah 1 (diucapkan X, seharusnya Y)", "Kata salah 2 (diucapkan A, seharusnya B)"],
  "level_estimate": "A1-C2",
  "confidence": 0.0-1.0,
  "analysis": "Analisa mendalam kata per kata mana yang benar dan salah",
  "tips": "Saran perbaikan posisi lidah atau bibir"
  "analysis": "Analisa profesional kata per kata. Jelaskan mengapa salah dan bagaimana bunyinya. Gunakan \\n\\n untuk paragraf.",
  "tips": "Saran perbaikan posisi lidah, gigi, atau bibir yang sangat spesifik dan mudah diikuti."
}
`;

const fetchGeminiWithRotation = async (payload) => {
  let rawKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  try {
    const { data } = await supabase.from('app_settings').select('value').eq('id', 'api_keys').single();
    if (data && data.value) {
      rawKey = data.value;
      localStorage.setItem('gemini_api_key', rawKey);
    }
  } catch (err) { console.error("DB Key Error:", err); }

  const apiKeys = rawKey.split(',').map(k => k.trim()).filter(k => k);
  if (apiKeys.length === 0) throw new Error("API Key AI belum diatur.");

  const translateToOpenAIFormat = (geminiPayload) => {
    const messages = [];
    if (geminiPayload.systemInstruction?.parts?.[0]?.text) {
      messages.push({ role: "system", content: geminiPayload.systemInstruction.parts[0].text });
    }
    if (geminiPayload.contents) {
      geminiPayload.contents.forEach(c => {
        messages.push({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts[0].text });
      });
    }
    return { messages, temperature: geminiPayload.generationConfig?.temperature || 0.7, max_tokens: geminiPayload.generationConfig?.maxOutputTokens || 1024 };
  };

  let lastError = "Unknown Error";

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const key of apiKeys) {
      try {
        if (key.startsWith('gsk_')) {
          const groqPayload = { ...translateToOpenAIFormat(payload), model: "llama-3.3-70b-versatile" };
          const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(groqPayload) });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error?.message || `Groq Error: ${res.status}`);
          return { candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] };
        } else if (key.startsWith('sk-')) {
          const oaPayload = { ...translateToOpenAIFormat(payload), model: "gpt-4o-mini" };
          const res = await fetch(`https://api.openai.com/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(oaPayload) });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error?.message || `OpenAI Error: ${res.status}`);
          return { candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] };
        } else {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error?.message || `Gemini Error: ${res.status}`);
          return data;
        }
      } catch (err) {
        lastError = err.message;
        const lowerErr = lastError.toLowerCase();
        if (lowerErr.includes('quota') || lowerErr.includes('limit') || lowerErr.includes('failed to fetch') || lowerErr.includes('429') || lowerErr.includes('insufficient') || lowerErr.includes('too many') || lowerErr.includes('leaked') || lowerErr.includes('api key')) continue;
        throw err;
      }
    }
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 3500));
  }
  throw new Error(`Sistem AI sedang sibuk/limit. Mohon tunggu dan coba lagi. (Pesan terakhir: ${lastError})`);
};

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

      const data = await fetchGeminiWithRotation(payload);
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
    if (!SpeechRecognition) {
      alert("Browser atau perangkat Anda tidak mendukung fitur mikrofon (Gunakan Chrome atau pastikan koneksi menggunakan HTTPS).");
      return;
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        analyzePronunciation(result);
      };
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert("Akses mikrofon ditolak. Izinkan mikrofon di pengaturan perangkat/browser Anda.");
        } else if (event.error === 'network') {
          alert("Error jaringan pada Speech Recognition. Pastikan koneksi internet stabil atau gunakan browser Chrome standar.");
        }
      };
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Mic start error:", error);
      setIsRecording(false);
      alert("Terjadi kesalahan saat memulai mikrofon.");
    }
  };

  const analyzePronunciation = async (text) => {
    setIsLoading(true);
    try {
      const payload = {
        contents: [{ role: 'user', parts: [{ text: `Kalimat target: "${targetSentence}"\nUser mengucapkan: "${text}"\n\nTolong berikan skor dan analisa pengucapannya.` }] }],
        systemInstruction: { parts: [{ text: PRONUNCIATION_PROMPT }] }
      };

      const data = await fetchGeminiWithRotation(payload);
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error analyzing pronunciation.";

      // Bersihkan text dari format markdown (```json ... ```) jika AI tetap mengirimkannya
      const cleanText = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          let jsonStr = jsonMatch[0];
          jsonStr = jsonStr.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
            return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
          });
          const parsed = JSON.parse(jsonStr);
          const confidence = parsed.confidence !== undefined ? parsed.confidence : 0.8;
          const consistencyFactor = 0.9;
          const finalFluency = Math.max(10, Math.round((parsed.fluency_score || 80) * confidence * consistencyFactor));

          setAnalysis({ score: finalFluency, ...parsed, raw: aiResponse });
          setUsageCount(prev => prev + 1);
          if (onComplete) onComplete(finalFluency);
        } else {
          setAnalysis({ raw: aiResponse });
          setUsageCount(prev => prev + 1);
        }
      } catch (err) {
        setAnalysis({ raw: aiResponse });
        setUsageCount(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
      setAnalysis({ raw: `⚠️ Maaf, terjadi kesalahan sistem: ${error.message}` });
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
    <div className="p-4 md:p-8 w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-[calc(96px+env(safe-area-inset-bottom))] overflow-x-hidden">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
          <Mic size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pronunciation Coach</h2>
          <p className="text-sm text-slate-500">Dengarkan kalimatnya, lalu ulangi untuk mendapatkan skor akurasi.</p>
        </div>
      </div>

      <div className="bg-white w-full max-w-full rounded-3xl border border-slate-200 shadow-xl p-6 md:p-10 text-center space-y-8 relative overflow-hidden">
        {/* Progress background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/30 to-transparent pointer-events-none"></div>

        <div className="relative">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-4">Ucapkan Kalimat Ini:</p>
          <h3 className="text-2xl md:text-4xl font-extrabold text-slate-800 leading-tight break-words">
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
            <p className="text-lg font-medium text-slate-600 italic break-words">"{transcript}"</p>
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-white w-full max-w-full rounded-3xl border border-rose-100 shadow-xl p-6 md:p-8 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-yellow-500" /> Hasil Penilaian
            </h3>
            {analysis.score !== undefined && (
              <div className="text-2xl font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">
                {analysis.score}%
              </div>
            )}
          </div>

          {analysis.analysis ? (
            <div className="space-y-6 text-slate-600 leading-relaxed text-sm md:text-base">
              <div className="bg-blue-50 p-4 md:p-6 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">💡 Analisis Pengucapan</h4>
                <p className="whitespace-pre-wrap break-words">{analysis.analysis}</p>
              </div>
              {analysis.mistakes && analysis.mistakes.length > 0 && (
                <div className="bg-rose-50 p-4 md:p-6 rounded-2xl border border-rose-100">
                  <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">⚠️ Kesalahan Utama</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-rose-700 font-medium break-words">
                    {analysis.mistakes.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
              <div className="bg-emerald-50 p-4 md:p-6 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">🎯 Tips Perbaikan</h4>
                <p className="whitespace-pre-wrap break-words">{analysis.tips}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-slate-600 leading-relaxed">
              {analysis.raw?.split('\n').map((line, i) => <p key={i} className="text-sm md:text-base">{line}</p>)}
            </div>
          )}

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
