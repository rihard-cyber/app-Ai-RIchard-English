import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Trophy, ArrowRight, GraduationCap } from 'lucide-react';
import { supabase } from './supabaseClient';

const ASSESSMENT_PROMPT = `
Kamu adalah Kaka Richard, Tutor Ahli Bahasa Inggris.
Tugasmu adalah melakukan tes penempatan (Placement Test) untuk murid baru.

ATURAN TES:
1. Sapa murid dengan ramah dan jelaskan bahwa ini adalah tes penempatan singkat.
2. Berikan 5-7 pertanyaan secara bertahap (satu per satu).
3. Pertanyaan harus mencakup: 
   - Dasar (Perkenalan)
   - Grammar (Tenses sederhana)
   - Situasional (Apa yang kamu lakukan jika...)
   - Opini (Topik bebas)
4. Setelah pertanyaan selesai, kamu HARUS memberikan kesimpulan level murid.

KATEGORI LEVEL:
- "Pemula (A1-A2)": Jika masih kesulitan menyusun kalimat dasar.
- "Intermediate (B1)": Jika bisa berkomunikasi tapi masih ada error grammar.
- "Advanced (B2)": Jika lancar dan grammar sudah cukup baik.
- "Mahir (C1-C2)": Jika sudah seperti native speaker.

PENTING: Di akhir tes, tuliskan format rahasia ini agar sistem bisa membaca level:
[RESULT_LEVEL: Nama Level]
Contoh: [RESULT_LEVEL: Intermediate (B1)]

Mari mulai tesnya sekarang!
`;

export default function LevelTest({ onComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start the test
    sendMessage("Halo Kaka Richard, saya siap mengikuti tes penempatan!", true);
  }, []);

  const sendMessage = async (text, isHidden = false) => {
    if (!text.trim()) return;

    if (!isHidden) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
      setInput('');
    }

    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      if (isHidden) {
        history.push({ role: 'user', parts: [{ text: text }] });
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: history,
          systemInstruction: { parts: [{ text: ASSESSMENT_PROMPT }] }
        })
      });

      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;

      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);

      // Check if level is determined
      if (aiText.includes('[RESULT_LEVEL:')) {
        const match = aiText.match(/\[RESULT_LEVEL:\s*(.*?)\]/);
        if (match && match[1]) {
          const detectedLevel = match[1];
          setTimeout(() => handleFinish(detectedLevel), 3000);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async (level) => {
    setIsFinishing(true);
    
    // Save to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ 
          level: level, 
          has_completed_initial_test: true 
        })
        .eq('id', user.id);
    }

    setTimeout(() => {
      onComplete(level);
    }, 2000);
  };

  if (isFinishing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f172a] text-white p-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/20 animate-bounce">
          <Trophy size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Tes Selesai!</h2>
        <p className="text-slate-400 max-w-md">Kaka Richard telah menganalisa kemampuanmu. Menyiapkan kurikulum belajar yang paling cocok...</p>
        <div className="mt-8">
            <Loader2 className="animate-spin text-blue-500 mx-auto" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] overflow-hidden">
      <header className="h-16 bg-[#0b1121] border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <GraduationCap className="text-blue-500" /> Penilaian Awal (CEFR)
        </h1>
        <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full">
          AI Richard - Placement Test
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {msg.content.replace(/\[RESULT_LEVEL:.*?\]/g, '')}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 md:p-6 bg-gradient-to-t from-[#0b1121] to-transparent">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ketik jawabanmu..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-xl"
            disabled={isLoading}
          />
          <button 
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white w-14 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
