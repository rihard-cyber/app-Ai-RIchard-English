import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Shield, Zap, Crown, Mail, KeyRound, User as UserIcon } from 'lucide-react';

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'verify'
  
  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verification State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('');
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleSignIn = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(); // Bypass directly to app for demo
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Password tidak sama!');
      return;
    }
    // Simulate sending OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    alert(`[SIMULASI EMAIL] Kode OTP Anda telah dikirim ke ${email}:\n\nKode: ${code}`);
    setMode('verify');
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode === generatedCode) {
      alert('Verifikasi Berhasil! Selamat datang di AI Richard.');
      onLogin();
    } else {
      alert('Kode OTP salah! Coba lagi.');
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Only keep last typed digit
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md running-border rounded-3xl p-[3px] animate-in zoom-in-95 duration-500">
        <div className="running-border-inner rounded-[22px] bg-[#0f172a]/90 backdrop-blur-xl p-8 flex flex-col relative z-10 overflow-hidden">
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="text-white w-8 h-8" />
            </div>
          </div>

          <div className="relative">
            {/* SIGN IN FORM */}
            <div className={`transition-all duration-500 transform ${mode === 'signin' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 className="text-3xl font-bold text-white text-center mb-2">AI Richard</h1>
              <p className="text-slate-400 text-center mb-8 text-sm">Masuk untuk memulai petualangan belajarmu.</p>
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="richard@example.com"
                      className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group mt-2">
                  Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">Belum punya akun? <button onClick={() => setMode('signup')} className="text-blue-400 font-bold hover:underline">Daftar sekarang</button></p>
              </div>
            </div>

            {/* SIGN UP FORM */}
            <div className={`transition-all duration-500 transform ${mode === 'signup' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Buat Akun Baru</h1>
              <p className="text-slate-400 text-center mb-6 text-sm">Daftar untuk mendapatkan API key gratis.</p>
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Lengkap" className="w-full pl-11 pr-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Aktif" className="w-full pl-11 pr-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Buat Password" className="w-full pl-11 pr-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi Password" className="w-full pl-11 pr-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group mt-2">
                  Kirim Kode Verifikasi <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
              <div className="mt-4 text-center">
                <p className="text-slate-400 text-sm">Sudah punya akun? <button onClick={() => setMode('signin')} className="text-blue-400 font-bold hover:underline">Sign In</button></p>
              </div>
            </div>

            {/* VERIFY OTP FORM */}
            <div className={`transition-all duration-500 transform ${mode === 'verify' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Verifikasi Email</h1>
              <p className="text-slate-400 text-center mb-8 text-sm">Kami telah mengirimkan 6 digit kode ke <span className="font-bold text-white">{email}</span></p>
              
              <form onSubmit={handleVerify} className="space-y-8">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input 
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-slate-800/80 border-2 border-slate-600 text-white focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all"
                      maxLength={1}
                      required
                    />
                  ))}
                </div>
                
                <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group">
                  Verifikasi & Masuk <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">Tidak menerima kode? <button onClick={() => alert('Kode baru dikirim ulang!')} className="text-blue-400 font-bold hover:underline">Kirim ulang</button></p>
                <button onClick={() => setMode('signup')} className="text-slate-500 text-sm mt-4 hover:text-white transition-colors">Kembali ke pendaftaran</button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export function SubscriptionPage({ onSelectPlan }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4">Pilih Paket Belajarmu</h1>
          <p className="text-slate-500 md:text-lg max-w-2xl mx-auto">Tingkatkan pengalaman belajarmu dengan akses tanpa batas ke fitur AI Richard. Pilih paket yang paling sesuai dengan kebutuhanmu.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow animate-in zoom-in-95 duration-500 delay-100">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Basic Free</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-bold text-slate-800">Rp0</span>
              <span className="text-slate-500 mb-1">/selamanya</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-slate-600 text-sm">
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-500 shrink-0" size={20}/> <span>Akses tes CEFR (1x sehari)</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-500 shrink-0" size={20}/> <span>Chat dengan Kaka Richard (Terbatas)</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-500 shrink-0" size={20}/> <span>Materi Grammar dasar</span></li>
            </ul>
            <button onClick={() => onSelectPlan('free')} className="w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors">
              Pilih Gratis
            </button>
          </div>

          {/* Monthly Plan - Popular */}
          <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-xl shadow-blue-900/20 flex flex-col relative transform md:-translate-y-4 animate-in zoom-in-95 duration-500 delay-200">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
              PALING POPULER
            </div>
            <div className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro Monthly</h3>
            <div className="flex items-end gap-1 mb-6 text-white">
              <span className="text-4xl font-bold">Rp49.000</span>
              <span className="text-blue-200 mb-1">/bulan</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-blue-50 text-sm">
              <li className="flex gap-3"><CheckCircle2 className="text-blue-300 shrink-0" size={20}/> <span>Akses tes CEFR sepuasnya</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-blue-300 shrink-0" size={20}/> <span>Chat tanpa batas dengan Kaka Richard</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-blue-300 shrink-0" size={20}/> <span>Semua materi Grammar & Vocabulary</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-blue-300 shrink-0" size={20}/> <span>Fitur Roleplay & Simulasi bebas</span></li>
            </ul>
            <button onClick={() => onSelectPlan('monthly')} className="w-full py-3.5 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-colors shadow-sm">
              Mulai Langganan
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow animate-in zoom-in-95 duration-500 delay-300">
             <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <Crown size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Pro Yearly</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-bold text-slate-800">Rp399.000</span>
              <span className="text-slate-500 mb-1">/tahun</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-slate-600 text-sm">
              <li className="flex gap-3"><CheckCircle2 className="text-purple-500 shrink-0" size={20}/> <span>Semua fitur Pro Monthly</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-purple-500 shrink-0" size={20}/> <span>Lebih hemat 30%</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-purple-500 shrink-0" size={20}/> <span>Laporan proges belajar mingguan</span></li>
            </ul>
            <button onClick={() => onSelectPlan('yearly')} className="w-full py-3.5 rounded-xl border-2 border-purple-200 text-purple-700 font-bold hover:bg-purple-50 hover:border-purple-300 transition-colors">
              Pilih Tahunan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
