import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Shield, Zap, Crown, Mail, KeyRound, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from './supabaseClient';

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'verify'
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [shakeField, setShakeField] = useState('');

  const logoClickCount = useRef(0);
  const logoClickTimeout = useRef(null);
  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification State
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [resetCountdown, setResetCountdown] = useState(0);

  // Listener untuk menangkap event reset password dari link di Email
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update_password');
      }
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Countdown Timer untuk Mencegah Spam Reset Password
  useEffect(() => {
    let timer;
    if (resetCountdown > 0) {
      timer = setInterval(() => {
        setResetCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resetCountdown]);

  // Kalkulator Kekuatan Password
  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 6) score += 20;
    if (pass.length >= 8) score += 20;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;
    return Math.min(score, 100);
  };

  const passwordStrength = calculatePasswordStrength(password);
  const getStrengthColor = (score) => {
    if (score === 0) return 'bg-transparent';
    if (score <= 40) return 'bg-rose-500';
    if (score <= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };
  const getStrengthText = (score) => {
    if (score === 0) return '';
    if (score <= 40) return 'Lemah';
    if (score <= 60) return 'Sedang';
    return 'Kuat';
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const triggerShake = (field, msg) => {
    setShakeField(field);
    showToast(msg, 'error');
    setTimeout(() => setShakeField(''), 500); // Hapus animasi setelah 500ms
  };

  const handleLogoClick = () => {
    logoClickCount.current += 1;
    if (logoClickCount.current >= 2) {
      logoClickCount.current = 0;
      setMode('admin_login');
    }
    clearTimeout(logoClickTimeout.current);
    logoClickTimeout.current = setTimeout(() => {
      logoClickCount.current = 0;
    }, 1500);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);

    // Bersihkan spasi kosong dari keyboard Android
    const safeEmail = email.trim().toLowerCase();
    const safePassword = password.trim();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: safeEmail,
        password: safePassword,
      });
      if (error) throw error;

      if (mode === 'admin_login') {
        onLogin('admin');
      } else {
        onLogin('user');
      }
    } catch (error) {
      if (error.message === 'Invalid login credentials') {
        showToast('Email atau password salah. Cek kembali penulisan Anda.', 'error');
      } else if (error.message.includes('Email not confirmed')) {
        showToast('Email belum diverifikasi. Silakan periksa inbox Anda.', 'error');
        setMode('verify');
      } else {
        showToast('Login Gagal: ' + error.message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    // 1. Validasi Ketat
    if (!fullName.trim()) return triggerShake('fullName', 'Nama lengkap wajib diisi!');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return triggerShake('email', 'Format email tidak valid!');
    if (password.length < 6) return triggerShake('password', 'Password minimal 6 karakter!');
    if (password !== confirmPassword) return triggerShake('confirmPassword', 'Password dan konfirmasi tidak sama!');

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      if (error) throw error;

      showToast('Pendaftaran berhasil! Silakan cek email Anda untuk kode verifikasi.', 'success');
      setMode('verify');
    } catch (error) {
      showToast('Daftar Gagal: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 8) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: enteredCode,
        type: 'signup'
      });
      if (error) throw error;

      showToast('Verifikasi Berhasil! Selamat datang di RichardMeha AI.', 'success');
      onLogin();
    } catch (error) {
      showToast('Kode OTP salah atau sudah kadaluarsa.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Mengirim Link Reset Password ke Email User
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Masukkan email Anda terlebih dahulu.', 'error');
      return;
    }
    if (resetCountdown > 0) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;

      showToast('Link reset password telah dikirim ke email Anda. Silakan cek inbox/spam.', 'success');
      setResetCountdown(60); // Mengunci tombol selama 60 detik
    } catch (error) {
      showToast('Gagal mengirim link: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Mengganti ke Password yang Baru
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Password dan konfirmasi tidak sama!', 'error');
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      showToast('Password berhasil diperbarui! Silakan masuk menggunakan password baru Anda.', 'success');
      setMode('signin');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast('Gagal Update: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Login instan menggunakan Akun Google
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error) {
      showToast("Login Google Gagal: " + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 7) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-gradient-to-br from-[#0b1121] via-[#0f172a] to-[#1a1040] flex items-center justify-center p-4 overflow-hidden relative overscroll-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.5s ease-in-out; }
        `}
      </style>

      {toast.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 backdrop-blur-xl ${toast.type === 'error' ? 'glass-dark border-rose-500/30 text-rose-300' : 'glass-dark border-emerald-500/30 text-emerald-300'}`}>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md running-border rounded-3xl p-[3px] animate-in zoom-in-95 duration-500 mx-2">
        <div className="running-border-inner rounded-[22px] bg-[#0f172a]/80 backdrop-blur-xl p-6 md:p-8 flex flex-col relative z-10 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-[480px] max-h-[85vh] w-full border border-white/5 shadow-2xl">

          <div className="flex justify-center mb-3">
            <div onClick={handleLogoClick} className="cursor-pointer select-none w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 transition-all active:scale-90 hover:scale-105 touch-manipulation relative">
              <div className="absolute inset-0 rounded-2xl border border-white/20"></div>
              <Sparkles className="text-white w-10 h-10" />
            </div>
          </div>

          <div className="relative flex-1">
            <div className={`transition-all duration-500 transform ${mode === 'signin' ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 onClick={handleLogoClick} className="text-3xl font-bold text-white text-center mb-1 cursor-pointer select-none active:scale-95 transition-transform touch-manipulation">RichardMeha <span className="text-blue-500">AI</span></h1>
              <p className="text-slate-500 text-center mb-8 text-sm font-medium">Masuk untuk memulai petualangan belajarmu</p>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="richard@example.com"
                      className="w-full pl-11 pr-5 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" required
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="block text-sm font-bold text-slate-300">Password</label>
                    <button type="button" disabled={isLoading} onClick={() => switchMode('forgot')} className="text-xs text-blue-400 hover:text-blue-300 font-bold focus:outline-none disabled:opacity-50 transition-colors">Lupa Password?</button>
                  </div>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button disabled={isLoading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-[0.98] flex items-center justify-center gap-2 group mt-2 text-sm">
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Memproses...</> : <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>

              <div className="relative flex items-center py-4 mt-3">
                <div className="flex-grow border-t border-slate-700/30"></div>
                <span className="flex-shrink-0 mx-4 text-slate-600 text-[10px] uppercase tracking-widest font-bold">ATAU MASUK DENGAN</span>
                <div className="flex-grow border-t border-slate-700/30"></div>
              </div>
              <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all border border-white/10 hover:border-white/20 shadow-sm flex items-center justify-center gap-3 active:scale-[0.98] backdrop-blur-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Akun Google
              </button>
              <div className="mt-6 text-center">
                <p className="text-slate-500 text-sm font-medium">Belum punya akun? <button disabled={isLoading} onClick={() => switchMode('signup')} className="text-blue-400 font-bold hover:text-blue-300 focus:outline-none disabled:opacity-50 transition-colors">Daftar sekarang</button></p>
              </div>
            </div>

            {/* SIGN UP FORM */}
            <div className={`transition-all duration-500 transform ${mode === 'signup' ? 'translate-x-0 opacity-100 relative' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 className="text-2xl font-bold text-white text-center mb-2 mt-2">Buat Akun Baru</h1>
              <p className="text-slate-400 text-center mb-6 text-sm">Daftar untuk akses RichardMeha AI.</p>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <div className="relative">
                    <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 ${shakeField === 'fullName' ? 'text-rose-500' : 'text-slate-500'}`} size={18} />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Lengkap" className={`w-full pl-11 pr-5 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${shakeField === 'fullName' ? 'border-rose-500 animate-shake' : 'border-slate-700 focus:border-blue-500'}`} />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${shakeField === 'email' ? 'text-rose-500' : 'text-slate-500'}`} size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Aktif" className={`w-full pl-11 pr-5 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${shakeField === 'email' ? 'border-rose-500 animate-shake' : 'border-slate-700 focus:border-blue-500'}`} />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <KeyRound className={`absolute left-4 top-1/2 -translate-y-1/2 ${shakeField === 'password' ? 'text-rose-500' : 'text-slate-500'}`} size={18} />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Buat Password" className={`w-full pl-11 pr-12 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${shakeField === 'password' ? 'border-rose-500 animate-shake' : 'border-slate-700 focus:border-blue-500'}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-2 px-1 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">Kekuatan Password:</span>
                        <span className={`text-[10px] font-bold ${passwordStrength <= 40 ? 'text-rose-400' : passwordStrength <= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>{getStrengthText(passwordStrength)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-300`} style={{ width: `${passwordStrength}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <KeyRound className={`absolute left-4 top-1/2 -translate-y-1/2 ${shakeField === 'confirmPassword' ? 'text-rose-500' : 'text-slate-500'}`} size={18} />
                    <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi Password" className={`w-full pl-11 pr-12 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${shakeField === 'confirmPassword' ? 'border-rose-500 animate-shake' : 'border-slate-700 focus:border-blue-500'}`} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button disabled={isLoading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group mt-2">
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Memproses...</> : <>Kirim Kode Verifikasi <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
              <div className="mt-4 text-center">
                <p className="text-slate-400 text-sm">Sudah punya akun? <button disabled={isLoading} onClick={() => switchMode('signin')} className="text-blue-400 font-bold hover:underline focus:outline-none disabled:opacity-50">Sign In</button></p>
              </div>
            </div>

            {/* VERIFY OTP FORM */}
            <div className={`transition-all duration-500 transform ${mode === 'verify' ? 'translate-x-0 opacity-100 relative' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 className="text-2xl font-bold text-white text-center mb-2 mt-4">Verifikasi Email</h1>
              <p className="text-slate-400 text-center mb-8 text-sm">Kami telah mengirimkan 8 digit kode ke <span className="font-bold text-white">{email}</span></p>

              <form onSubmit={handleVerify} className="space-y-8">
                <div className="flex justify-between gap-1 md:gap-1.5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold rounded-xl bg-slate-800/80 border-2 border-slate-600 text-white focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all"
                      maxLength={1}
                      required
                    />
                  ))}
                </div>

                <button disabled={isLoading} type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group">
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Verifikasi & Masuk <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /></>}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={() => switchMode('signup')} className="text-slate-500 text-sm mt-4 hover:text-white transition-colors focus:outline-none">Kembali ke pendaftaran</button>
              </div>
            </div>

            {/* FORGOT PASSWORD FORM */}
            <div className={`transition-all duration-500 transform ${mode === 'forgot' ? 'translate-x-0 opacity-100 relative' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 className="text-2xl font-bold text-white text-center mb-2 mt-4">Lupa Password?</h1>
              <p className="text-slate-400 text-center mb-8 text-sm">Masukkan email Anda untuk menerima link reset password.</p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
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

                <button disabled={isLoading || resetCountdown > 0} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group mt-2">
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : resetCountdown > 0 ? `Kirim Ulang (${resetCountdown}s)` : <>Kirim Link Reset <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={() => switchMode('signin')} className="text-slate-400 text-sm mt-4 hover:text-white transition-colors focus:outline-none">Kembali ke Halaman Login</button>
              </div>
            </div>

            {/* UPDATE PASSWORD FORM */}
            <div className={`transition-all duration-500 transform ${mode === 'update_password' ? 'translate-x-0 opacity-100 relative' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 className="text-2xl font-bold text-white text-center mb-2 mt-4">Buat Password Baru</h1>
              <p className="text-slate-400 text-center mb-8 text-sm">Silakan masukkan password baru Anda.</p>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password Baru" className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi Password" className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button disabled={isLoading} type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group mt-2">
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Simpan Password Baru <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /></>}
                </button>
              </form>
            </div>

            {/* ADMIN LOGIN FORM (HIDDEN) */}
            <div className={`transition-all duration-500 transform ${mode === 'admin_login' ? 'translate-x-0 opacity-100 relative' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-center mb-2 mt-4">Admin Portal OWNER</h1>
              <p className="text-slate-400 text-center mb-8 text-sm">Masuk ke Dasbor Pemantauan Sistem.</p>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="Admin Email"
                      className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-slate-800/50 border border-emerald-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" required
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    <input
                      type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Admin Password"
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-800/50 border border-emerald-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 focus:outline-none">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button disabled={isLoading} type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-70 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group mt-4 active:scale-95">
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Autentikasi...</> : <>MASUK SEBAGAI OWNER 👑 <Shield size={18} className="group-hover:rotate-12 transition-transform" /></>}
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export function SubscriptionPage({ onSelectPlan }) {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 md:p-8 overflow-x-hidden overscroll-none pb-[calc(16px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))]">
      <div className="max-w-7xl w-full mx-auto">
        <div className="text-center mb-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pilih Paket Terbaikmu</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-4 tracking-tight">Pilih Paket Belajarmu</h1>
          <p className="text-slate-500 md:text-lg max-w-2xl mx-auto font-medium">Tingkatkan pengalaman belajarmu dengan akses tanpa batas ke fitur RichardMeha AI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-6xl mx-auto">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-glass flex flex-col hover:shadow-glass-lg transition-all duration-300 animate-in zoom-in-95 duration-500 delay-100 hover:-translate-y-1">
            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Paket Gratis</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-bold text-slate-800">Rp0</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-slate-600 text-sm">
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> <span>Akses tes CEFR (1x sehari)</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> <span>Akses 45% materi Basic</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> <span>Chat terbatas dengan AI</span></li>
            </ul>
            <button onClick={() => onSelectPlan('free')} className="w-full py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]">
              Pilih Gratis
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-glass flex flex-col hover:shadow-glass-lg transition-all duration-300 animate-in zoom-in-95 duration-500 delay-150 hover:-translate-y-1">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Pro Bulanan</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-3xl font-bold text-slate-800">Rp199.000</span>
              <span className="text-slate-500 mb-1">/bln</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-slate-600 text-sm">
              <li className="flex gap-3"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> <span>Akses 100% semua materi</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> <span>Chat tanpa batas dengan AI</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> <span>Fitur Voice & Roleplay bebas</span></li>
            </ul>
            <button onClick={() => onSelectPlan('monthly')} className="w-full py-4 rounded-2xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-all active:scale-[0.98]">
              Pilih Bulanan
            </button>
          </div>

          <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/30 flex flex-col relative transform md:-translate-y-4 animate-in zoom-in-95 duration-500 delay-200 hover:-translate-y-5 transition-all duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg">
              PALING POPULER
            </div>
            <div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6">
              <Crown size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro 1 Tahun</h3>
            <div className="flex items-end gap-1 mb-6 text-white">
              <span className="text-3xl font-bold">Rp250.000</span>
              <span className="text-blue-200 mb-1">/bln</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-blue-50 text-sm">
              <li className="flex gap-3"><CheckCircle2 className="text-blue-300 shrink-0" size={20} /> <span>Semua fitur Pro Bulanan</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-blue-300 shrink-0" size={20} /> <span>Akses tes CEFR premium</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-blue-300 shrink-0" size={20} /> <span>Laporan proges komprehensif</span></li>
            </ul>
            <button onClick={() => onSelectPlan('yearly')} className="w-full py-4 rounded-2xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-all active:scale-[0.98] shadow-md">
              Mulai Langganan
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border-2 border-purple-200 shadow-glass flex flex-col relative hover:shadow-glass-lg transition-all duration-300 animate-in zoom-in-95 duration-500 delay-300 hover:-translate-y-1">
            <div className="absolute -top-3 right-4 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md rotate-3">
              DISKON BESAR!
            </div>
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Pro Diskon</h3>
            <div className="flex flex-col gap-1 mb-6">
              <span className="text-sm font-semibold text-slate-400 line-through decoration-rose-400 decoration-2">Rp2.388.000</span>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-purple-700">Rp999.000</span>
                <span className="text-slate-500 mb-1 font-medium">/thn</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-slate-600 text-sm">
              <li className="flex gap-3"><CheckCircle2 className="text-purple-500 shrink-0" size={20} /> <span>Hemat jutaan rupiah</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-purple-500 shrink-0" size={20} /> <span>Akses seumur hidup ke materi</span></li>
              <li className="flex gap-3"><CheckCircle2 className="text-purple-500 shrink-0" size={20} /> <span>Layanan prioritas</span></li>
            </ul>
            <button onClick={() => onSelectPlan('discount')} className="w-full py-4 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-200">
              Ambil Diskon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
