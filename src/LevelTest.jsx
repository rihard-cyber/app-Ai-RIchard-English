import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, XCircle, ArrowRight, GraduationCap, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { VOCABULARY_QUESTIONS } from './data/vocabularyTest';

export default function LevelTest({ onComplete }) {
  const [step, setStep] = useState('welcome'); // 'welcome', 'quiz', 'result'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [finalLevel, setFinalLevel] = useState('');

  const currentQuestion = VOCABULARY_QUESTIONS[currentQuestionIndex];

  const handleAnswer = (option) => {
    const isCorrect = option === currentQuestion.answer;
    setAnswers([...answers, { questionId: currentQuestion.id, isCorrect, level: currentQuestion.level }]);
    
    if (currentQuestionIndex < VOCABULARY_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    setIsLoading(true);
    
    // Simple logic: determine level based on the highest level where they got majority correct
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const levelScores = {};
    
    levels.forEach(l => {
      const qInLevel = VOCABULARY_QUESTIONS.filter(q => q.level === l);
      const correctInLevel = answers.filter(a => a.level === l && a.isCorrect).length;
      levelScores[l] = correctInLevel / qInLevel.length;
    });

    let detectedLevel = 'Pemula (A1-A2)';
    if (levelScores['C2'] >= 0.5) detectedLevel = 'Ahli (C2)';
    else if (levelScores['C1'] >= 0.5) detectedLevel = 'Mahir (C1)';
    else if (levelScores['B2'] >= 0.5) detectedLevel = 'Advanced (B2)';
    else if (levelScores['B1'] >= 0.5) detectedLevel = 'Intermediate (B1)';
    else if (levelScores['A2'] >= 0.5) detectedLevel = 'Pemula Lanjut (A2)';
    else detectedLevel = 'Pemula Dasar (A1)';

    setFinalLevel(detectedLevel);
    saveResult(detectedLevel);
  };

  const saveResult = async (level) => {
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
      setIsLoading(false);
      setStep('result');
    }, 2000);
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20">
          <GraduationCap size={48} />
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-4">Tes Penempatan Awal</h1>
        <p className="text-slate-400 max-w-md mb-10 text-lg leading-relaxed">
          Halo! Saya **Kaka Richard**. Mari kita ukur sejauh mana kemampuan kosa kata Bahasa Inggrismu untuk menentukan kurikulum yang tepat.
        </p>
        <button 
          onClick={() => setStep('quiz')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 text-lg"
        >
          Mulai Tes Sekarang <ArrowRight size={20} />
        </button>
        <p className="mt-6 text-slate-500 text-sm">Estimasi waktu: 3-5 menit</p>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-700">
        <div className="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-yellow-500/40 animate-bounce">
          <Trophy size={64} className="text-white" />
        </div>
        <h2 className="text-4xl font-black mb-2">Luar Biasa!</h2>
        <p className="text-slate-400 mb-8">Kaka Richard telah menganalisa hasil tesmu.</p>
        
        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-[2.5rem] mb-10 w-full max-w-sm">
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Level Kamu Saat Ini:</p>
           <h3 className="text-3xl font-black text-blue-400">{finalLevel}</h3>
        </div>

        <button 
          onClick={() => onComplete(finalLevel)}
          className="bg-white text-slate-900 font-bold py-4 px-12 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-lg"
        >
          Masuk ke Dashboard <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 flex flex-col">
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between mb-12">
        <div className="flex items-center gap-2">
           <GraduationCap className="text-blue-500" />
           <span className="font-bold tracking-tight">LEVEL ASSESSMENT</span>
        </div>
        <div className="text-xs font-bold bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          Question {currentQuestionIndex + 1} of {VOCABULARY_QUESTIONS.length}
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center pb-20">
        {isLoading ? (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <Loader2 className="animate-spin text-blue-500 mx-auto" size={64} />
            <h2 className="text-2xl font-bold">Menganalisa jawabanmu...</h2>
            <p className="text-slate-400">Kaka Richard sedang menyusun profil belajarmu.</p>
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4 text-center md:text-left">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20 uppercase tracking-widest">
                Level {currentQuestion.level}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className="group bg-slate-800/50 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 p-6 rounded-2xl text-left transition-all active:scale-98 flex items-center justify-between"
                >
                  <span className="text-lg font-medium group-hover:text-white">{option}</span>
                  <div className="w-8 h-8 rounded-full border-2 border-slate-600 group-hover:border-white/50 flex items-center justify-center text-xs font-bold">
                    {String.fromCharCode(65 + idx)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto w-full py-6 border-t border-slate-800 flex justify-center">
         <div className="flex gap-1">
            {VOCABULARY_QUESTIONS.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i <= currentQuestionIndex ? 'bg-blue-500' : 'bg-slate-800'}`} />
            ))}
         </div>
      </footer>
    </div>
  );
}
