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
  Lightbulb
} from 'lucide-react';

const WRITING_SYSTEM_PROMPT = `
Kamu adalah Editor Bahasa Inggris Ahli.
Tugasmu adalah menganalisa tulisan user secara detail.

ANALISA HARUS MENCAKUP:
1. Skor Keseluruhan (0-100).
2. Tabel Koreksi:
   | Original | Error Type | Correction | Explanation (ID) |
3. Saran Alternatif (Natural Phrasing): 3 cara berbeda untuk mengatakan hal yang sama agar lebih natural.
4. Tips Grammar/Vocab berdasarkan kesalahan.

Gunakan nada bicara yang memberi semangat (encouraging).
`;

export default function WritingAnalyzer() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeWriting = async () => {
    if (!text.trim()) return;
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Tolong analisa tulisan saya ini:\n\n${text}` }] }],
          systemInstruction: { parts: [{ text: WRITING_SYSTEM_PROMPT }] }
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
      // Basic markdown parser for the specific structure
      const lines = content.split('\n');
      return lines.map((line, i) => {
          if (line.includes('|')) {
              // Simple table renderer (placeholder logic, similar to App.jsx)
              return <div key={i} className="text-xs font-mono bg-slate-50 p-2 border-b border-slate-200">{line}</div>;
          }
          return <p key={i} className="mb-2 text-sm leading-relaxed">{line}</p>;
      });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
          <PenTool size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Writing Analyzer Pro</h2>
          <p className="text-sm text-slate-500">Tulis atau tempel teks bahasa Inggrismu untuk dikoreksi AI.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis sesuatu di sini... (Contoh: I go to school yesterday and I am happy)"
          className="w-full h-48 md:h-64 p-6 text-lg text-slate-700 outline-none resize-none placeholder:text-slate-300"
        ></textarea>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {text.split(/\s+/).filter(x => x).length} Words
          </span>
          <button 
            onClick={analyzeWriting}
            disabled={isLoading || !text.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Analisa Sekarang
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl p-6 md:p-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className="bg-indigo-50 text-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors">
                <Copy size={16} onClick={() => navigator.clipboard.writeText(analysis)} />
             </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" /> Hasil Analisa
          </h3>
          
          <div className="prose prose-slate max-w-none">
             {renderFormattedAnalysis(analysis)}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
             <button 
                onClick={() => { setAnalysis(null); setText(''); }}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
             >
                <RotateCcw size={16} /> Mulai Baru
             </button>
          </div>
        </div>
      )}

      {/* Placeholder tips when no analysis */}
      {!analysis && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0"><Lightbulb size={20}/></div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Cek Tenses</h4>
                <p className="text-xs text-slate-500">AI akan mendeteksi apakah tensesmu konsisten.</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
              <div className="bg-purple-50 p-2 rounded-lg text-purple-600 shrink-0"><Sparkles size={20}/></div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Natural Phrasing</h4>
                <p className="text-xs text-slate-500">Dapatkan saran cara bicara yang lebih natural.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
