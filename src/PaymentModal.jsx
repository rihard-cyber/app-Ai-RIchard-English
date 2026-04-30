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
      Bell
    } from 'lucide-react';

    export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, planName, price }) {
      const [step, setStep] = useState('select'); // 'select', 'processing', 'success'
      const [paymentMethod, setPaymentMethod] = useState(null);

      if (!isOpen) return null;

      const methods = [
        { id: 'gopay', name: 'GoPay / QRIS', icon: <QrCode className="text-blue-500" />, color: 'bg-blue-50' },
        { id: 'dana', name: 'DANA', icon: <Smartphone className="text-blue-400" />, color: 'bg-blue-50' },
        { id: 'va', name: 'Virtual Account (Semua Bank)', icon: <Building2 className="text-slate-600" />, color: 'bg-slate-50' },
        { id: 'card', name: 'Kartu Kredit / Debit', icon: <CreditCard className="text-indigo-600" />, color: 'bg-indigo-50' },
      ];

      const handlePay = () => {
        setStep('processing');
        // Simulate payment process
        setTimeout(() => {
          setStep('success');
          // Add notification simulation here if needed
        }, 3000);
      };

      const handleFinalize = () => {
        onPaymentSuccess();
        onClose();
        setStep('select');
      };

      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
            
            {step === 'select' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Checkout</h2>
                    <p className="text-slate-500 text-sm">Pilih metode pembayaran aman</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">&times;</button>
                </div>

                <div className="bg-slate-50 rounded-3xl p-5 mb-8 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-sm">Paket Dipilih:</span>
                    <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">PREMIUM</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <h3 className="text-xl font-bold text-slate-800">{planName}</h3>
                    <span className="text-2xl font-black text-blue-600">Rp{price}</span>
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
                        <span className="font-bold text-slate-700">{m.name}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.id ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                        {paymentMethod === m.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                    </button>
                  ))}
                </div>

                <button 
                  disabled={!paymentMethod}
                  onClick={handlePay}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Bayar Sekarang <ChevronRight size={20} />
                </button>
              </div>
            )}

            {step === 'processing' && (
              <div className="p-12 text-center py-24">
                <div className="relative mb-8 flex justify-center">
                   <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                     <Zap size={32} />
                   </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3">Memproses Pembayaran</h2>
                <p className="text-slate-500">Jangan tutup halaman ini, kami sedang mengonfirmasi ke {paymentMethod?.toUpperCase()}...</p>
              </div>
            )}

            {step === 'success' && (
              <div className="p-8 text-center py-12">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3">Berhasil! 🎉</h2>
                <p className="text-slate-500 mb-8 px-6">Selamat! Akun Anda sekarang menjadi **PRO**. Nikmati semua fitur premium tanpa batas.</p>
                
                <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left border border-slate-100">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="bg-emerald-500 p-1 rounded-full"><Bell size={14} className="text-white"/></div>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notifikasi Sistem</span>
                   </div>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">
                     "Pembayaran via {paymentMethod?.toUpperCase()} dikonfirmasi. Invoice telah dikirim ke email Anda. Selamat belajar!"
                   </p>
                </div>

                <button 
                  onClick={handleFinalize}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all active:scale-95"
                >
                  Masuk ke Dashboard Pro
                </button>
              </div>
            )}

          </div>
        </div>
      );
    }
