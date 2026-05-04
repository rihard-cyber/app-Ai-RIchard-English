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
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { supabase } from './supabaseClient';
import { fetchGeminiWithRotation } from './api';

const PRONUNCIATION_PROMPT = `
Kamu adalah Richard, Pelatih Pengucapan (Pronunciation Coach) Bahasa Inggris level Native & Profesional.
Tugasmu adalah menganalisis rekaman suara user secara mendalam, mendeteksi kesalahan pengucapan (mispronunciation) sekecil apapun, dan memberikan feedback yang sangat konstruktif, akurat, dan profesional.
Bahasamu harus ramah, memotivasi, namun tegas dalam memperbaiki kesalahan. Gunakan Bahasa Indonesia yang profesional.

ATURAN WAJIB:
1. Output WAJIB 100% JSON valid. Tidak boleh ada teks apa pun di luar JSON.
2. JANGAN gunakan karakter baris baru (enter/newline) asli di dalam teks JSON. Gunakan "\\n" untuk membuat baris baru.
3. Jangan gunakan format markdown seperti \`\`\`json. Langsung mulai dengan { dan akhiri dengan }.

Format JSON:
{
  "fluency_score": 0-100,
  "mistakes": ["Kata salah 1 (diucapkan X, seharusnya Y)", "Kata salah 2 (diucapkan A, seharusnya B)"],
  "level_estimate": "A1-C2",
  "confidence": 0.0-1.0,
  "analysis": "Analisa profesional kata per kata. Jelaskan mengapa salah dan bagaimana bunyinya. Gunakan \\n\\n untuk paragraf.",
  "tips": "Saran perbaikan posisi lidah, gigi, atau bibir yang sangat spesifik dan mudah diikuti."
}
`;

export default function PronunciationCoach({ userProfile, onComplete, isPro, onUpgrade }) {
  const [targetSentence, setTargetSentence] = useState('');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [usageCount, setUsageCount] = useState(() => parseInt(localStorage.getItem('speaking_coach_usage') || '0'));
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const currentTranscriptRef = useRef('');

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

  const toggleRecording = async () => {
    if (isRecording) {
      manualStopRef.current = true;
      setIsRecording(false);
      try {
        const checkAvail = await SpeechRecognition.available().catch(() => ({ available: false }));
        if (checkAvail.available) {
          await SpeechRecognition.stop();
        }
        recognitionRef.current?.stop();
      } catch (e) { }

      // Kirim untuk dianalisa segera setelah berhenti
      const textToSend = currentTranscriptRef.current.trim();
      if (textToSend) {
        analyzePronunciation(textToSend);
      }
      currentTranscriptRef.current = '';
      return;
    }

    try {
      manualStopRef.current = false;
      setIsRecording(true);
      setTranscript('');
      currentTranscriptRef.current = '';

      // Native Capacitor Speech Recognition
      const checkAvail = await SpeechRecognition.available().catch(() => ({ available: false }));
      if (checkAvail.available) {
        const perm = await SpeechRecognition.checkPermissions();
        if (perm.speechRecognition !== 'granted') {
          const req = await SpeechRecognition.requestPermissions();
          if (req.speechRecognition !== 'granted') {
            alert("Izin mikrofon diperlukan.");
            setIsRecording(false);
            return;
          }
        }

        await SpeechRecognition.removeAllListeners();

        // Listener untuk status sistem agar sinkron
        SpeechRecognition.addListener('listeningState', (data) => {
          if (data.status === 'stopped') {
            setIsRecording(false);
            if (!manualStopRef.current) {
              const textToSend = currentTranscriptRef.current.trim();
              if (textToSend) analyzePronunciation(textToSend);
              currentTranscriptRef.current = '';
            }
          }
        });

        SpeechRecognition.addListener('partialResults', (data) => {
          if (data.matches && data.matches.length > 0) {
            const t = data.matches[0];
            currentTranscriptRef.current = t;
            setTranscript(t);
          }
        });

        await SpeechRecognition.start({
          language: 'en-US',
          maxResults: 1,
          prompt: "Ucapkan kalimatnya...",
          partialResults: true,
          popup: false,
        });
        return;
      }
      throw new Error("Native API unavailable");
    } catch (error) {
      console.warn("Native Mic error, fallback to Web API", error);

      const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!WebSpeechRecognition) {
        alert("Browser tidak mendukung fitur mikrofon.");
        setIsRecording(false);
        return;
      }

      if (!recognitionRef.current) {
        recognitionRef.current = new WebSpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
      }

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const current = finalTranscript || interimTranscript;
        if (current) {
          currentTranscriptRef.current = current;
          setTranscript(current);
        }
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        if (!manualStopRef.current) {
          const textToSend = currentTranscriptRef.current.trim();
          if (textToSend) analyzePronunciation(textToSend);
          currentTranscriptRef.current = '';
        }
      };

      try { recognitionRef.current.start(); } catch (err) { }
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

  const speakSentence = async () => {
    try {
      await TextToSpeech.speak({
        text: targetSentence,
        lang: 'en-US',
        rate: 0.8,
      });
    } catch (err) {
      console.warn("Capacitor TTS gagal, beralih ke WebView TTS bawaan", err);
      if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        const utterance = new SpeechSynthesisUtterance(targetSentence);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 w-full max-w-4xl mx-auto space-y-6 pb-12">
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

      {/* Global Standardized Input Bar for Pronunciation Coach */}
      <div className="relative z-50 bg-white border-t border-slate-200 w-full p-4 md:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] shrink-0" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-4xl mx-auto w-full flex justify-center items-center gap-4 md:gap-8">
          <button
            onClick={speakSentence}
            className="p-4 md:p-5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
            title="Dengarkan Contoh"
          >
            <Volume2 size={24} />
          </button>
          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 ${isRecording ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50' : 'bg-white border-4 border-rose-500 text-rose-500 hover:bg-rose-50'}`}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          <button
            onClick={generateNewSentence}
            className="p-4 md:p-5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
            title="Kalimat Baru"
          >
            <RefreshCw size={24} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
