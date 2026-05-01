import React, { useState } from 'react';
import { 
  PenTool, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ArrowRight,
  Loader2,
  Copy,
  Lightbulb,
  Crown,
  Lock
} from 'lucide-react';

const WRITING_SYSTEM_PROMPT = (isPro) => `
Kamu adalah Editor Bahasa Inggris Ahli.
Tugasmu adalah menganalisa tulisan user secara detail.

${isPro ? `
[PRO MODE ENABLED]
ANALISA HARUS SANGAT MENDALAM:
1. Skor Keseluruhan (0-100).
2. Tabel Koreksi: | Original | Error Type | Correction | Explanation (ID) |
3. Saran Alternatif (Natural Phrasing): 5 cara berbeda agar lebih natural dan profesional.
4. Analisa Tone & Style.
5. Saran Vocabulary Advanced.
` : `
[FREE MODE]
ANALISA TERBATAS:
1. Koreksi Grammar dasar saja.
2. Skor Keseluruhan.
(Tampilkan pesan di akhir: "Upgrade to PRO for deep analysis, tone improvement, and advanced vocabulary!")
`}

Gunakan nada bicara RichardMeha AI yang memberi semangat (encouraging).
`;

export default function WritingAnalyzer({ userProfile, onUpgrade }) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isPro = userProfile?.is_pro;

  const analyzeWriting = async () => {
    if (!text.trim()) return;
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Analyze this text:\n\n${text}` }] }],
          systemInstruction: { parts: [{ text: WRITING_SYSTEM_PROMPT(isPro) }] }
        })
      });

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      setAnalysis(aiResponse);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedAnalysis = (content) => {
      const lines = content.split('\n');
      return lines.map((line, i) => {
          if (line.includes('|')) {
              return <div key={i} className="text-xs font-mono bg-slate-50 p-2 border-b border-slate-200">{line}</div>;
          }
          return <p key={i} className="mb-2 text-sm leading-relaxed">{line}</p>;
      });
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
