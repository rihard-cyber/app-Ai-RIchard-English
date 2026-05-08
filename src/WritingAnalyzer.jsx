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
  Lock,
  Share2
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { GlobalContext } from './App';
import { AiOrchestrator } from './AiOrchestrator';

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

      const data = await AiOrchestrator.chat(payload, globalApiKey);
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
          <div key={`table-${keyIndex}`} className="overflow-x-auto my-8 rounded-2xl border border-slate-200 shadow-sm w-full bg-white">
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                {tableRows.map((row, idx) => {
                  if (row.replace(/[\s|-]/g, '') === '') return null; // Mengabaikan baris pembatas markdown spt |---|---|
                  const cols = row.split('|').map(c => c.trim()).filter(c => c);
                  const isHeader = idx === 0;
                  return (
                    <tr key={idx} className={isHeader ? "bg-slate-50 border-b border-slate-200" : "border-b border-slate-100 bg-white hover:bg-slate-50/50 transition-colors last:border-0"}>
                      {cols.map((col, cidx) => (
                        <td key={cidx} className={`px-6 py-4 align-top ${isHeader ? 'text-xs font-bold text-slate-500 uppercase tracking-wider' : 'text-slate-700 font-medium'}`} dangerouslySetInnerHTML={{ __html: col.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>') }} />
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

        let formattedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>').replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>').replace(/`(.*?)`/g, '<code class="bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

        if (trimmed.startsWith('###')) {
          elements.push(<h3 key={i} className="text-xl md:text-2xl font-bold text-slate-800 mt-10 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^###\s*/, '') }} />);
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          elements.push(<li key={i} className="ml-6 mb-2 list-disc marker:text-indigo-400 text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s*/, '') }} />);
        } else if (trimmed !== '') {
          elements.push(<p key={i} className="mb-4 text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />);
        }
      }
    });

    if (inTable) flushTable('end');
    return elements;
  };

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col items-center text-center mb-8 md:mb-12">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
          <PenTool size={32} />
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Writing Analyzer</span></h2>
        <p className="text-slate-500 font-medium max-w-xl mx-auto md:text-lg">Tingkatkan kualitas tulisan bahasa Inggris kamu. Dapatkan koreksi tata bahasa, struktur kalimat, dan gaya bahasa instan ala profesional.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all focus-within:border-indigo-300 focus-within:shadow-[0_8px_30px_rgba(99,102,241,0.08)] relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik atau paste tulisan bahasa Inggrismu di sini..."
          className="w-full h-64 md:h-80 p-6 md:p-8 text-lg text-slate-700 outline-none resize-none placeholder:text-slate-300 font-medium leading-relaxed bg-transparent"
          spellCheck="false"
        ></textarea>

        <div className="bg-white px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-400">
            <span>{text.trim() ? text.trim().split(/\s+/).filter(x => x).length : 0} <span className="font-normal text-slate-500">Kata</span></span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{text.length} <span className="font-normal text-slate-500">Karakter</span></span>
          </div>
          <button
            onClick={analyzeWriting}
            disabled={isLoading || !text.trim()}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-indigo-200" />}
            Analisa Sekarang
          </button>
        </div>
      </div>

      {
        !isPro && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 md:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400 shrink-0 border border-white/10">
                <Crown size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm md:text-base">Tingkatkan ke Pro untuk Hasil Maksimal</h4>
                <p className="text-slate-400 text-xs md:text-sm mt-1">Dapatkan analisa mendalam, perbaikan tone, dan saran advanced vocabulary.</p>
              </div>
            </div>
            <button onClick={onUpgrade} className="w-full md:w-auto whitespace-nowrap bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/20 active:scale-95">
              Upgrade Pro
            </button>
          </div>
        )
      }

      {
        analysis && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-10 animate-in zoom-in-95 duration-500 relative overflow-hidden mt-8">
            <div className="absolute top-0 right-0 p-6">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(analysis);
                  alert("Hasil analisa disalin!");
                }}
                className="text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 transition-colors"
                title="Copy Analysis"
              >
                <Copy size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Hasil Analisa</h3>
                <p className="text-sm text-emerald-600 font-bold tracking-wide mt-1">Selesai diperiksa oleh AI</p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none text-slate-600 prose-headings:font-bold prose-headings:text-slate-800 prose-p:leading-relaxed prose-a:text-indigo-600 prose-code:text-rose-500 prose-code:bg-rose-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium prose-code:before:content-none prose-code:after:content-none">
              {renderFormattedAnalysis(analysis)}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                <button
                  onClick={() => { setAnalysis(null); setText(''); }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all active:scale-95"
                >
                  <RotateCcw size={18} /> Analisa Teks Baru
                </button>
                <button
                  onClick={() => {
                    const textMsg = `Saya baru saja mengecek grammar & kualitas tulisan bahasa Inggris saya menggunakan RichardMeha AI. Keren banget, koreksinya mendetail ala native speaker! 🚀`;
                    const url = `https://play.google.com/store/apps/details?id=com.richardmeha.englishku`;
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(textMsg + '\n\n' + url)}`;
                    window.open(waUrl, '_system');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-xl transition-all active:scale-95"
                >
                  <Share2 size={18} /> Bagikan ke WA
                </button>
              </div>
              {!isPro && (
                <button onClick={onUpgrade} className="w-full md:w-auto px-6 py-3 font-bold text-white bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                  <Crown size={18} /> Buka Fitur Pro
                </button>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
}
