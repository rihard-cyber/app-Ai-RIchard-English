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
  Mail,
  X,
  Copy,
  Wallet
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, planName, price, userName = "Sahabat Richard" }) {
  const [step, setStep] = useState('select'); // 'select', 'qris', 'va', 'processing', 'success'
  const [paymentMethod, setPaymentMethod] = useState(null);

  if (!isOpen) return null;

  const methods = [
    { id: 'qris', name: 'QRIS (Gopay, Dana, OVO, Shopee)', icon: <QrCode className="text-blue-500" />, color: 'bg-blue-50' },
    { id: 'va', name: 'Virtual Account Transfer', icon: <Building2 className="text-emerald-600" />, color: 'bg-emerald-50' },
    { id: 'wallet', name: 'E-Wallet (Dana/LinkAja)', icon: <Wallet className="text-orange-500" />, color: 'bg-orange-50' },
  ];

  const simulatePayment = async () => {
    // In real app, this would be: 
    // const res = await fetch(`http://localhost:3000/api/payments/status/${userId}`);
    // const data = await res.json();
    // if (data.is_pro) setStep('success');
    
    // For now, we simulate a 3-second automated check:
    setTimeout(() => {
      setStep('success');
    }, 3000);
  };

  const handleFinalize = () => {
    onPaymentSuccess();
    onClose();
    setTimeout(() => setStep('select'), 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 ring-1 ring-white/20">
        
        {step === 'select' && (
          <div className="p-10">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Checkout</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Payment Method Selection</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors">
                 <X size={24} />
              </button>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 mb-10 shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
              <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg"><Zap size={16} fill="white"/></div>
                   <span className="text-[10px] font-black tracking-widest uppercase text-blue-400">Premium Plan</span>
                </div>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <h3 className="text-xl font-bold">{planName}</h3>
                <div className="text-right">
                   <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Due</p>
                   <span className="text-3xl font-black">Rp{price}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-10">
              {methods.map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all active:scale-98 ${
                    paymentMethod === m.id ? 'border-blue-600 bg-blue-50 shadow-inner ring-4 ring-blue-500/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-xl ${m.color} shadow-sm`}>{m.icon}</div>
                    <span className="font-black text-slate-700 text-left text-sm">{m.name}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === m.id ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20' : 'border-slate-200'}`}>
                    {paymentMethod === m.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </button>
              ))}
            </div>

            <button 
              disabled={!paymentMethod}
              onClick={() => {
                 if (paymentMethod === 'qris') setStep('qris');
                 else if (paymentMethod === 'va') setStep('va');
                 else { setStep('processing'); simulatePayment(); }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              Continue Payment <ChevronRight size={24} />
            </button>
          </div>
        )}

        {step === 'qris' && (
          <div className="p-10 text-center animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center mb-8">
              <button onClick={() => setStep('select')} className="text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest">&larr; Back</button>
              <div className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-tighter">QRIS Gateway</div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Scan & Pay</h2>
            <p className="text-slate-400 text-sm mb-10 font-medium px-4">Open your favorite payment app and scan this secure QR code.</p>
            
            <div className="relative inline-block mb-10">
               <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse" />
               <div className="relative bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 ring-8 ring-slate-50">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=richardmeha_qris" alt="QRIS" className="w-48 h-48 rounded-xl" />
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-between mb-10 border border-slate-100">
               <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Bill</span>
               <span className="text-2xl font-black text-slate-800">Rp{price}</span>
            </div>

            <button 
              onClick={() => { setStep('processing'); simulatePayment(); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-600/20 transition-all active:scale-95 text-lg"
            >
              Verify Payment
            </button>
          </div>
        )}

        {step === 'va' && (
          <div className="p-10 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => setStep('select')} className="text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest">&larr; Back</button>
              <div className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-tighter">VA Transfer</div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Virtual Account</h2>
            <p className="text-slate-400 text-sm mb-10 font-medium">Please transfer the exact amount to the account number below.</p>
            
            <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-10 shadow-2xl relative overflow-hidden ring-4 ring-white/10">
               <div className="absolute right-[-10%] bottom-[-20%] w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
               <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">VA Account Number</div>
               <div className="flex items-center justify-between mb-6">
                 <div className="text-3xl font-black text-white tracking-widest">8801 9283 4712</div>
                 <button className="text-emerald-400 hover:text-emerald-300 p-2"><Copy size={24}/></button>
               </div>
               
               <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Billing Amount</div>
               <div className="text-2xl font-black text-emerald-400">Rp{price}</div>
            </div>

            <button 
              onClick={() => { setStep('processing'); simulatePayment(); }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-2xl shadow-emerald-600/20 transition-all active:scale-95 text-lg"
            >
              I Have Transferred
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-12 text-center py-24 animate-in fade-in duration-500">
            <div className="relative mb-10 flex justify-center">
               <div className="w-32 h-32 rounded-full border-8 border-slate-50 border-t-blue-600 animate-spin shadow-inner"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Zap size={48} className="text-blue-600 fill-blue-600" />
               </div>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Verifying...</h2>
            <p className="text-slate-400 font-medium px-4">RichardMeha AI is confirming your payment. This takes a moment.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-10 text-center py-12 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce shadow-2xl shadow-emerald-500/20">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">Payment Success!</h2>
            <p className="text-slate-400 mb-10 font-medium">Welcome to the inner circle, **{userName}**. Your PRO status is now active!</p>
            
            <div className="bg-slate-50 rounded-[2rem] p-6 mb-10 text-left border border-slate-100 relative overflow-hidden ring-1 ring-slate-200">
               <div className="flex items-center gap-3 mb-4">
                 <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Mail size={16}/></div>
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Notification Sent</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic font-medium">
                "Hey {userName}! 🎉 Your premium access is ready. Time to master English like a pro with RichardMeha AI. Let's do this!"
              </p>
            </div>

            <button 
              onClick={handleFinalize}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] shadow-2xl transition-all active:scale-95 text-lg"
            >
              Unlock Everything
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
