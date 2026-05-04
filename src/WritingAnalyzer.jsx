import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Loader2,
  Copy,
  Crown,
  Lock
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { GlobalContext } from './App';

const WRITING_SYSTEM_PROMPT = (isPro) => `
Kamu adalah sistem "Professional Writing Analyzer" yang sangat analitis, objektif, dan akurat (seperti Grammarly).
Tugasmu adalah menganalisa teks bahasa Inggris dari user secara detail.

ATURAN MERESPONS:
1. JANGAN gunakan basa-basi, salam (halo/hai), atau kalimat penyemangat yang panjang. Langsung ke inti analisa.
2. Gunakan bahasa Indonesia yang profesional, ringkas, baku, dan jelas.
3. Format WAJIB menggunakan Markdown (Gunakan Heading 3 (###) untuk judul bagian, format tabel untuk koreksi, dan bullet points).

${isPro ? `
[PRO MODE] BERIKAN 5 BAGIAN INI SECARA BERURUTAN:
### 📊 Skor Keseluruhan: [Skor]/100
(Berikan 1-2 kalimat evaluasi objektif tentang tingkat keterbacaan teks).

### 🛠️ Detail Koreksi
| Teks Asli | Perbaikan | Jenis Error | Penjelasan Singkat |
|---|---|---|---|
| ... | ... | ... | ... |

### 💡 Saran Alternatif (Natural Phrasing)
(Berikan 3-5 cara native speaker menulis pesan ini agar lebih natural dan profesional).

### 🎭 Analisa Tone & Style
(Sebutkan nada tulisan saat ini, dan berikan saran bagaimana membuatnya lebih profesional atau sopan).

### 🚀 Upgrade Kosa Kata (Advanced Vocab)
(Berikan 3 saran penggantian kata biasa menjadi kosa kata tingkat lanjut C1/C2).
` : `
[FREE MODE] BERIKAN 2 BAGIAN INI:
### 📊 Skor Keseluruhan: [Skor]/100
(Berikan 1-2 kalimat evaluasi objektif).

### 🛠️ Koreksi Tata Bahasa Dasar
| Teks Asli | Perbaikan | Penjelasan Singkat |
|---|---|---|
| ... | ... | ... |

---
**🔒 UPGRADE TO PRO:** Dapatkan analisa mendalam, perbaikan tone, dan saran kosa kata tingkat lanjut (Advanced Vocabulary)!
`}
`;

const fetchGeminiWithRotation = async (payload, contextApiKey = '') => {
  let rawKey = contextApiKey || localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
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

export default function WritingAnalyzer({ userProfile, onUpgrade }) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(() => parseInt(localStorage.getItem('writing_analyzer_usage') || '0'));
  const isPro = userProfile?.is_pro;
  
  const { globalApiKey } = React.useContext(GlobalContext) || {};

  const isLocked = !isPro && usageCount >= 3;

  const analyzeWriting = async () => {
    if (!text.trim()) return;
    setIsLoading(true);

    try {
      const payload = {
        contents: [{ role: 'user', parts: [{ text: `Analyze this text:\n\n${text}` }] }],
        systemInstruction: { parts: [{ text: WRITING_SYSTEM_PROMPT(isPro) }] }
      };

      const data = await fetchGeminiWithRotation(payload, globalApiKey);
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, Richard sedang sibuk. Coba sebentar lagi ya!";
      setAnalysis(aiResponse);
      setUsageCount(prev => {
        const next = prev + 1;
        localStorage.setItem('writing_analyzer_usage', next.toString());
        return next;
      });
    } catch (error) {
      console.error(error);
      setAnalysis("Koneksi bermasalah. Pastikan internetmu stabil ya!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-400 to-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/20">
            <Crown size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">Writing Analyzer PRO 👑</h2>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">
            Kamu sudah menggunakan jatah gratis harian (3x analisa). Upgrade ke PRO untuk analisa mendalam tanpa batas!
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

  const renderFormattedAnalysis = (content) => {
    const lines = content.split('\n');
    let inTable = false;
    let tableRows = [];
    const elements = [];

    const flushTable = (keyIndex) => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${keyIndex}`} className="overflow-x-auto my-6 rounded-2xl border border-slate-200 shadow-sm w-full">
            <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
              <tbody>
                {tableRows.map((row, idx) => {
                  if (row.replace(/[\s|-]/g, '') === '') return null; // Mengabaikan baris pembatas markdown spt |---|---|
                  const cols = row.split('|').map(c => c.trim()).filter(c => c);
                  const isHeader = idx === 0;
                  return (
                    <tr key={idx} className={isHeader ? "bg-indigo-50 font-bold text-indigo-900 border-b-2 border-indigo-100" : "border-t border-slate-100 bg-white hover:bg-slate-50 transition-colors"}>
                      {cols.map((col, cidx) => (
                        <td key={cidx} className={`px-4 py-3 align-top ${isHeader ? 'uppercase tracking-wider text-[10px]' : ''}`} dangerouslySetInnerHTML={{ __html: col.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-100 text-rose-500 px-1 py-0.5 rounded text-xs font-mono">$1</code>') }} />
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

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        inTable = true;
        tableRows.push(trimmed);
      } else {
        if (inTable) flushTable(i);

        // Styling teks tebal (bold) dan miring (italic)
        let formattedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code class="bg-slate-100 text-rose-500 px-1 py-0.5 rounded text-[10px] font-mono">$1</code>');

        if (trimmed.startsWith('###')) {
          elements.push(<h3 key={i} className="text-lg font-black text-slate-800 mt-8 mb-3 flex items-center gap-2" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^###\s*/, '') }} />);
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          elements.push(<li key={i} className="ml-4 mb-2 list-disc marker:text-indigo-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s*/, '') }} />);
        } else if (trimmed !== '') {
          elements.push(<p key={i} className="mb-3 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />);
        }
      }
    });

    if (inTable) flushTable('end');
    return elements;
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
            <PenTool size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Writing Analyzer</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Professional Feedback Engine</p>
          </div>
        </div>
        {!isPro && (
          <button
            onClick={onUpgrade}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
          >
            <Crown size={14} /> UPGRADE PRO
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden ring-1 ring-slate-100">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your English text here... RichardMeha will check it for you! 😊"
          className="w-full h-48 md:h-64 p-8 text-lg text-slate-700 outline-none resize-none placeholder:text-slate-300 font-medium leading-relaxed"
        ></textarea>

        <div className="bg-slate-50/50 backdrop-blur-sm p-6 border-t border-slate-100 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Text Density</span>
            <span className="text-sm font-bold text-slate-700">{text.split(/\s+/).filter(x => x).length} Words</span>
          </div>
          <button
            onClick={analyzeWriting}
            disabled={isLoading || !text.trim()}
            className="bg-slate-900 hover:bg-black text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-slate-900/10"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-blue-400" />}
            Analyze Now
          </button>
        </div>
      </div>

      {!isPro && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Lock size={20} />
          </div>
          <p className="text-xs text-amber-800 font-medium">
            You are currently in **Free Mode**. Deep analysis, tone improvement, and advanced vocabulary are locked.
            <button onClick={onUpgrade} className="ml-2 underline font-black">Unlock Pro features 👑</button>
          </p>
        </div>
      )}

      {analysis && (
        <div className="bg-white rounded-[2.5rem] border border-indigo-100 shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText(analysis);
                alert("Copied to clipboard!");
              }}
              className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl cursor-pointer hover:bg-indigo-100 transition-colors shadow-sm"
            >
              <Copy size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Analysis Report</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">RichardMeha Verified</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600">
            {renderFormattedAnalysis(analysis)}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => { setAnalysis(null); setText(''); }}
              className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest"
            >
              <RotateCcw size={16} /> Reset Analyzer
            </button>
            {!isPro && (
              <button onClick={onUpgrade} className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                See more with PRO <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
