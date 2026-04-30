import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  Building2, 
  QrCode, 
  ChevronRight, 
  Loader2,
  Zap,
  Bell,
  Copy,
  Mail
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, planName, price, userName = "Sahabat Richard" }) {
  const [step, setStep] = useState('select'); // 'select', 'qris', 'va', 'processing', 'success'
  const [paymentMethod, setPaymentMethod] = useState(null);

  if (!isOpen) return null;

  const methods = [
    { id: 'qris', name: 'QRIS (GoPay, DANA, OVO, ShopeePay)', icon: <QrCode className="text-blue-500" />, color: 'bg-blue-50' },
    { id: 'va', name: 'Virtual Account Bank Transfer', icon: <Building2 className="text-emerald-600" />, color: 'bg-emerald-50' },
    { id: 'card', name: 'Kartu Kredit / Debit', icon: <CreditCard className="text-indigo-600" />, color: 'bg-indigo-50' },
  ];

  const handleNext = () => {
    if (paymentMethod === 'qris') {
      setStep('qris');
    } else if (paymentMethod === 'va') {
      setStep('va');
    } else {
      setStep('processing');
      simulatePayment();
    }
  };

  const simulatePayment = () => {
    setTimeout(() => {
      setStep('success');
    }, 4000);
  };

  const handleFinalize = () => {
    onPaymentSuccess();
    onClose();
    setTimeout(() => setStep('select'), 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* STEP 1: PILIH METODE */}
        {step === 'select' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Checkout</h2>
                <p className="text-slate-500 text-sm">Pilih metode pembayaran aman</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">&times;</button>
            </div>

            <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl p-5 mb-8 shadow-lg shadow-blue-500/20 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="flex justify-between items-center mb-2 relative z-10">
                <span className="text-blue-100 text-sm">Paket Dipilih:</span>
                <span className="bg-white text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">PREMIUM</span>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <h3 className="text-xl font-bold text-white">{planName}</h3>
                <span className="text-2xl font-black text-white">Rp{price}</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {methods.map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    paymentMethod === m.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${m.color}`}>{m.icon}</div>
                    <span className="font-bold text-slate-700 text-left leading-tight">{m.name}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === m.id ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                    {paymentMethod === m.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </button>
              ))}
            </div>

            <button 
              disabled={!paymentMethod}
              onClick={handleNext}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Lanjutkan <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: QRIS BARCODE */}
        {step === 'qris' && (
          <div className="p-8 text-center">
             <div className="flex justify-between items-center mb-6">
              <button onClick={() => setStep('select')} className="text-slate-400 hover:text-slate-700 font-medium text-sm">&larr; Kembali</button>
              <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase">QRIS</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Scan Barcode</h2>
            <p className="text-slate-500 text-sm mb-6">Buka aplikasi GoPay, DANA, atau M-Banking Anda lalu scan kode di bawah ini.</p>
            
            <div className="bg-slate-100 p-4 rounded-3xl inline-block mb-6 border-2 border-dashed border-slate-300">
               <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=richardmeha_qris_simulation" alt="QRIS Barcode" className="w-48 h-48 rounded-xl mix-blend-multiply" />
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl text-sm mb-8 font-medium border border-blue-100">
              Total Tagihan: <strong className="text-lg">Rp{price}</strong>
            </div>

            <button 
              onClick={() => { setStep('processing'); simulatePayment(); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95"
            >
              Saya Sudah Bayar
            </button>
          </div>
        )}

        {/* STEP 3: VIRTUAL ACCOUNT */}
        {step === 'va' && (
          <div className="p-8 text-left">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setStep('select')} className="text-slate-400 hover:text-slate-700 font-medium text-sm">&larr; Kembali</button>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full uppercase">Transfer VA</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Transfer Bank (VA)</h2>
            <p className="text-slate-500 text-sm mb-6">Transfer tepat sesuai nominal ke nomor Virtual Account berikut.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-6">
               <div className="text-xs text-slate-500 uppercase font-bold mb-1">Nomor Virtual Account</div>
               <div className="flex items-center justify-between mb-4">
                 <div className="text-2xl font-black text-slate-800 tracking-wider">8801 9283 4712</div>
                 <button className="text-blue-600 bg-blue-50 p-2 rounded-xl hover:bg-blue-100"><Copy size={20}/></button>
               </div>
               
               <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Pembayaran</div>
               <div className="text-2xl font-black text-blue-600">Rp{price}</div>
            </div>

            <div className="space-y-2 mb-8">
               <div className="text-sm font-bold text-slate-700 mb-2">Instruksi:</div>
               <div className="text-sm text-slate-600 flex gap-2"><span className="text-slate-400">1.</span> Buka aplikasi M-Banking Anda.</div>
               <div className="text-sm text-slate-600 flex gap-2"><span className="text-slate-400">2.</span> Pilih menu Transfer > Virtual Account.</div>
               <div className="text-sm text-slate-600 flex gap-2"><span className="text-slate-400">3.</span> Masukkan nomor VA di atas.</div>
            </div>

            <button 
              onClick={() => { setStep('processing'); simulatePayment(); }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95"
            >
              Saya Sudah Transfer
            </button>
          </div>
        )}

        {/* STEP 4: PROCESSING */}
        {step === 'processing' && (
          <div className="p-12 text-center py-24">
            <div className="relative mb-8 flex justify-center">
               <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                 <Zap size={32} />
               </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">Memverifikasi...</h2>
            <p className="text-slate-500">Sistem sedang mengecek pembayaran Anda. Mohon jangan tutup halaman ini.</p>
          </div>
        )}

        {/* STEP 5: SUCCESS & EMAIL SIMULATION */}
        {step === 'success' && (
          <div className="p-8 text-center py-12">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Pembayaran Berhasil!</h2>
            <p className="text-slate-500 mb-8 px-2">Terima kasih {userName}, akun Anda sekarang berstatus <strong className="text-blue-600">PRO</strong>.</p>
            
            {/* Email Notification Simulation */}
            <div className="bg-slate-50 rounded-3xl p-5 mb-8 text-left border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Mail size={64}/></div>
               <div className="flex items-center gap-2 mb-3">
                 <div className="bg-blue-500 p-1.5 rounded-full"><Mail size={12} className="text-white"/></div>
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Email Terkirim</span>
               </div>
               
               {/* To User */}
               <div className="mb-4 pb-4 border-b border-slate-200 border-dashed relative z-10">
                 <div className="text-xs font-bold text-slate-800 mb-1">Kepada: {userName} (Anda)</div>
                 <p className="text-xs text-slate-600 leading-relaxed italic">
                   "Halo {userName}!🎉 Selamat datang di kelas premium RichardMeha AI. Pembayaran untuk {planName} berhasil kami terima. Kami sangat antusias menemani perjalananmu menguasai Bahasa Inggris. Let's make your dream come true!"
                 </p>
               </div>

               {/* To Admin */}
               <div className="relative z-10">
                 <div className="text-xs font-bold text-slate-800 mb-1">Notifikasi Sistem (Ke Admin)</div>
                 <p className="text-[10px] text-slate-500 font-mono">
                   User: {userName} | Paket: {planName} | Metode: {paymentMethod} | Status: PAID.
                 </p>
               </div>
            </div>

            <button 
              onClick={handleFinalize}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all active:scale-95"
            >
              Mulai Belajar Sekarang
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
