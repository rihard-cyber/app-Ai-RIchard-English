import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, Shield, CreditCard, Upload } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, planName, price, userName }) {
  const [banks, setBanks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(null);

  // Nomor WhatsApp Admin (Gunakan format 62 tanpa + atau 0 di depan)
  const ADMIN_WA_NUMBER = "6285280545310"; // Nomor WhatsApp Admin Resmi

  useEffect(() => {
    if (isOpen) fetchBanks();
  }, [isOpen]);

  const fetchBanks = async () => {
    const { data } = await supabase.from('payment_methods').select('*').eq('is_active', true);
    setBanks(data || []);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert pending transaction to database
      await supabase.from('transactions').insert([{
        user_id: user.id,
        user_name: userName,
        plan_name: planName,
        amount: typeof price === 'string' ? parseInt(price.replace(/[^0-9]/g, '')) : price,
        status: 'pending'
      }]);

      // Format pesan notifikasi WhatsApp untuk Admin
      const waMessage = `Halo Admin RichardMeha AI 🚀,\n\nSaya telah melakukan pembayaran untuk langganan fitur PRO dan menunggu konfirmasi ACC.\n\n*Detail Pesanan:*\n👤 Nama: ${userName}\n📧 Email: ${user.email}\n🎁 Paket: ${planName}\n💰 Nominal: Rp${price}\n\n_(Silakan lampirkan foto/screenshot bukti transfer Anda di bawah pesan ini)_`;

      // Buka otomatis WhatsApp ke nomor Admin dengan pesan terisi
      const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');

      alert('Pesanan dicatat! Anda akan diarahkan ke WhatsApp Admin untuk mengirimkan bukti transfer.');
      onPaymentSuccess();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overscroll-none overflow-hidden">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] mx-2">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-slate-800">Selesaikan Pembayaran</h2>
            <p className="text-sm font-medium text-slate-500">Paket: {planName} • Rp{price}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-700 shadow-sm"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 transform-gpu overscroll-contain scroll-smooth">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl flex gap-3 text-sm">
            <Shield className="shrink-0 text-blue-600" />
            <p>Silakan transfer sesuai nominal ke salah satu rekening resmi kami di bawah ini.</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 flex items-center gap-2"><CreditCard size={18} /> Rekening Tujuan</h4>
            {banks.length === 0 ? <p className="text-sm text-slate-400">Memuat rekening...</p> : banks.map(bank => (
              <div key={bank.id} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-300 transition-colors w-full">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{bank.provider}</p>
                  <p className="text-lg font-black text-slate-800 break-words">{bank.account_number}</p>
                  <p className="text-xs font-medium text-slate-500">A.N. {bank.account_name}</p>
                </div>
                <button onClick={() => handleCopy(bank.account_number, bank.id)} className={`p-2.5 rounded-xl transition-all ${copied === bank.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {copied === bank.id ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0">
          <p className="text-xs text-center text-slate-500 mb-4">Sudah melakukan transfer?</p>
          <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
            {isSubmitting ? 'Memproses...' : <><Upload size={18} /> Konfirmasi Telah Bayar</>}
          </button>
        </div>
      </div>
    </div>
  );
}