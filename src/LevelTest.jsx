import React, { useState } from 'react';
import { Trophy, CheckCircle2, ArrowRight, GraduationCap, Sparkles, Loader2, Volume2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { VOCABULARY_QUESTIONS } from './data/vocabularyTest';

export default function LevelTest({ onComplete }) {
  const [step, setStep] = useState('welcome'); // 'welcome', 'quiz', 'result'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [finalLevel, setFinalLevel] = useState('');

  const currentQuestion = VOCABULARY_QUESTIONS[currentQuestionIndex];

  const handleTTS = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

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
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const levelScores = {};

    levels.forEach(l => {
      const qInLevel = VOCABULARY_QUESTIONS.filter(q => q.level === l);
      if (qInLevel.length === 0) return;
      const correctInLevel = answers.filter(a => a.level === l && a.isCorrect).length;
      levelScores[l] = correctInLevel / qInLevel.length;
    });

    let detectedLevel = 'Beginner (A1)';
    if (levelScores['C1'] >= 0.5) detectedLevel = 'Advanced (C1-C2)';
    else if (levelScores['B2'] >= 0.5) detectedLevel = 'Upper Intermediate (B2)';
    else if (levelScores['B1'] >= 0.5) detectedLevel = 'Intermediate (B1)';
    else if (levelScores['A2'] >= 0.5) detectedLevel = 'Elementary (A2)';
    else detectedLevel = 'Beginner (A1)';

    setFinalLevel(detectedLevel);
    saveResult(detectedLevel);
  };

  const saveResult = async (level) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({
        level: level,
        has_completed_initial_test: true
      }).eq('id', user.id);
    }

    setTimeout(() => {
      setIsLoading(false);
      setStep('result');
      handleTTS(`Awesome! Your English level is ${level}. Welcome to the family!`);
    }, 2000);
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-[#060b18] text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <GraduationCap size={48} />
          </div>
        </div>
        <h1 className="text-3xl md:text-6xl font-black mb-4 tracking-tight">Level Assessment</h1>
        <p className="text-slate-400 max-w-md mb-10 text-lg leading-relaxed font-medium">
          "Hey there! I'm **RichardMeha AI**. Let's find your perfect starting point, shall we?"
        </p>
        <button
          onClick={() => { setStep('quiz'); handleTTS("Let's get started with your first question!"); }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 text-lg group"
        >
          Start Assessment <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <div className="mt-12 flex items-center gap-6 text-slate-500 text-sm">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> 10 Questions</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> CEFR Standard</div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="min-h-screen bg-[#060b18] text-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-700">
        <div className="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-yellow-500/40 animate-bounce">
          <Trophy size={64} className="text-white" />
        </div>
        <h2 className="text-4xl font-black mb-2">Assessment Complete!</h2>
        <p className="text-slate-400 mb-8 font-medium">I've analyzed your English proficiency.</p>

        <div className="bg-slate-900/50 border border-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] mb-10 w-full max-w-sm shadow-2xl shadow-blue-500/5">
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Assigned Level:</p>
          <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{finalLevel}</h3>
        </div>

        <button
          onClick={() => onComplete(finalLevel)}
          className="bg-white text-slate-900 font-black py-4 px-12 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-lg hover:bg-slate-100"
        >
          Enter Dashboard <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b18] text-white p-4 md:p-8 flex flex-col">
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between mb-12">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-500" size={20} />
          <span className="font-black tracking-widest text-xs">ULTIMATE ASSESSMENT v3.0</span>
        </div>
        <div className="text-[10px] font-black bg-white/5 px-4 py-2 rounded-full border border-white/10 uppercase tracking-widest text-slate-400">
          Q-{currentQuestionIndex + 1} / {VOCABULARY_QUESTIONS.length}
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center pb-20">
        {isLoading ? (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <Loader2 className="animate-spin text-blue-500 mx-auto" size={64} />
            <h2 className="text-2xl font-black">Analyzing your results...</h2>
            <p className="text-slate-400 font-medium">RichardMeha AI is crafting your personalized path.</p>
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4 text-center md:text-left">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-black border border-blue-500/20 uppercase tracking-widest">
                Difficulty: {currentQuestion.level}
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
                  className="group bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-400 p-6 rounded-2xl text-left transition-all active:scale-98 flex items-center justify-between shadow-lg"
                >
                  <span className="text-lg font-bold group-hover:text-white transition-colors">{option}</span>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center text-sm font-black transition-all">
                    {String.fromCharCode(65 + idx)}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleTTS(currentQuestion.question)}
              className="mx-auto flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Volume2 size={16} /> Listen to Question
            </button>
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto w-full py-6 border-t border-white/5 flex justify-center">
        <div className="flex gap-1.5">
          {VOCABULARY_QUESTIONS.map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i <= currentQuestionIndex ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/5'}`} />
          ))}
        </div>
      </footer>
    </div>
  );
}
