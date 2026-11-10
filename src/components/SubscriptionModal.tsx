import React, { useState } from 'react';
import { UserSubscription, SubscriptionPlan, AdminSettings } from '../types';
import { X, Check, Crown, Zap, ShieldCheck, Smartphone, Copy, CheckCircle2, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { Language, translations } from '../locales/strings';
import { sound } from '../utils/audio';

interface SubscriptionModalProps {
  subscription: UserSubscription;
  adminSettings: AdminSettings;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  onClose: () => void;
  onSubmitPayment: (data: {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    plan: SubscriptionPlan;
    method: 'bkash' | 'nagad' | 'rocket';
    senderNumber: string;
    trxId: string;
    amount: number;
  }) => Promise<boolean>;
  lang: Language;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  subscription,
  adminSettings,
  deviceId,
  deviceName,
  deviceType,
  onClose,
  onSubmitPayment,
  lang,
}) => {
  const t = translations[lang];
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(subscription.status === 'pending');

  const plans = [
    {
      id: 'monthly' as const,
      name: lang === 'bn' ? '১ মাস আনলিমিটেড' : 'Monthly Pro',
      price: adminSettings.monthlyPrice || 99,
      badge: lang === 'bn' ? 'জনপ্রিয়' : 'Popular',
      desc: lang === 'bn' ? '৩০ দিনের জন্য আনলিমিটেড ট্রান্সফার' : '30 days unlimited 4K file sharing',
    },
    {
      id: 'yearly' as const,
      name: lang === 'bn' ? '১ বছর আনলিমিটেড' : 'Yearly Pro',
      price: adminSettings.yearlyPrice || 799,
      badge: lang === 'bn' ? '৩৩% সাশ্রয়' : 'Save 33%',
      desc: lang === 'bn' ? '৩৬৫ দিনের প্রিমিয়াম এয়ারড্রপ' : 'Full year high-speed access',
    },
    {
      id: 'lifetime' as const,
      name: lang === 'bn' ? 'আজীবন ভিআইপি (VIP)' : 'Lifetime VIP',
      price: adminSettings.lifetimePrice || 1499,
      badge: lang === 'bn' ? 'লাইফটাইম' : 'Best Value',
      desc: lang === 'bn' ? 'একবার পেমেন্টেই আজীবন ব্যবহার' : 'Pay once, enjoy forever',
    },
  ];

  const currentPlanObj = plans.find((p) => p.id === selectedPlan) || plans[0];

  const getMethodNumber = () => {
    switch (paymentMethod) {
      case 'bkash':
        return adminSettings.bkashNumber || '01712-345678';
      case 'nagad':
        return adminSettings.nagadNumber || '01812-345678';
      case 'rocket':
        return adminSettings.rocketNumber || '01912-345678';
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(getMethodNumber().replace(/[^0-9]/g, ''));
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber.trim() || !trxId.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmitPayment({
      deviceId,
      deviceName,
      deviceType,
      plan: selectedPlan,
      method: paymentMethod,
      senderNumber: senderNumber.trim(),
      trxId: trxId.trim().toUpperCase(),
      amount: currentPlanObj.price,
    });

    setIsSubmitting(false);
    if (success) {
      sound.playSendChirp();
      setSubmittedSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-3 shadow-lg shadow-amber-500/15">
            <Crown size={28} />
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">
            {lang === 'bn' ? 'এয়ারড্রপ প্রো সাবস্ক্রিপশন' : 'AirDrop Pro Subscription'}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'ম্যাকবুক ও অ্যান্ড্রয়েডের মধ্যে কোনো সাইজ লিমিট ছাড়া আনলিমিটেড হাই-স্পিড ৪কে ফটো ও ভিডিও ট্রান্সফার করতে প্রো সাবস্ক্রিপশন নিন।'
              : 'Unlock unlimited high-speed original 4K transfers, clipboard sync, and zero file size limits across all your devices.'}
          </p>
        </div>

        {/* If Active Pro */}
        {subscription.status === 'active' ? (
          <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-lg font-bold text-white">
              {lang === 'bn' ? 'আপনার প্রো লাইসেন্স সক্রিয় রয়েছে!' : 'Your Pro License is Active!'}
            </h4>
            <p className="text-xs text-emerald-300">
              {lang === 'bn'
                ? 'আপনি আনলিমিটেড ট্রান্সফার ও সর্বোচ্চ স্পিড উপভোগ করছেন।'
                : 'You have full access to unlimited transfers with sub-second speeds.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
            >
              {t.close}
            </button>
          </div>
        ) : submittedSuccess ? (
          /* Verification Pending Notice */
          <div className="p-6 rounded-3xl bg-amber-950/40 border border-amber-500/40 text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
              <Clock size={30} />
            </div>
            <h4 className="text-lg font-bold text-white">
              {lang === 'bn' ? 'পেমেন্ট ভেরিফিকেশন অপেক্ষারত (Pending)' : 'Payment Verification Pending'}
            </h4>
            <p className="text-xs text-amber-200/90 leading-relaxed max-w-sm mx-auto">
              {lang === 'bn'
                ? 'আপনার TrxID সফলভাবে জমা হয়েছে। অ্যাডমিন পেমেন্ট চেক করে অনুমোদন (Approve) দিলে আপনার প্রো লাইসেন্স সাথে সাথে চালু হয়ে যাবে।'
                : 'Your Transaction ID has been submitted. The admin will verify and approve your license shortly.'}
            </p>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/5 text-[11px] font-mono text-slate-300 inline-block">
              Device: {deviceName} ({deviceId.slice(0, 10)})
            </div>
            <div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl glass-button text-white text-xs font-bold transition-all"
              >
                {t.close}
              </button>
            </div>
          </div>
        ) : (
          /* Subscription Plans & Payment Form */
          <div>
            {/* Free Trial Quota Status */}
            <div className="mb-5 p-3 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {lang === 'bn' ? 'ফ্রি ট্রায়াল ট্রান্সফার বাকি:' : 'Free Trial Transfers Left:'}
              </span>
              <span className="font-mono font-bold text-sky-400 px-2 py-0.5 rounded-lg bg-sky-950 border border-sky-800">
                {subscription.freeTransfersLeft} Transfers
              </span>
            </div>

            {/* Plan Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlan(p.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    selectedPlan === p.id
                      ? 'border-amber-500 bg-amber-950/30 text-white ring-2 ring-amber-500/40 shadow-lg'
                      : 'border-white/5 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {p.badge}
                  </span>
                  <p className="text-xs font-bold text-white mt-1">{p.name}</p>
                  <p className="text-lg font-extrabold text-amber-400 font-mono mt-1">
                    ৳{p.price}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{p.desc}</p>
                </button>
              ))}
            </div>

            {/* Payment Method Selector (bKash / Nagad / Rocket) */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                {lang === 'bn' ? 'পেমেন্ট মাধ্যম বেছে নিন:' : 'Select Payment Method:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'bkash'
                      ? 'border-pink-500 bg-pink-950/40 text-pink-300 shadow-md ring-1 ring-pink-500'
                      : 'border-white/5 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span>bKash (বিকাশ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'nagad'
                      ? 'border-orange-500 bg-orange-950/40 text-orange-300 shadow-md ring-1 ring-orange-500'
                      : 'border-white/5 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>Nagad (নগদ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('rocket')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'rocket'
                      ? 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-md ring-1 ring-purple-500'
                      : 'border-white/5 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Rocket (রকেট)</span>
                </button>
              </div>
            </div>

            {/* Payment Number & Send Money Instructions */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400">
                    {paymentMethod.toUpperCase()} Personal (সেন্ড মানি করুন):
                  </p>
                  <p className="text-base font-extrabold font-mono text-white mt-0.5">
                    {getMethodNumber()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold glass-button text-sky-300 hover:text-white transition-all"
                >
                  {copiedNumber ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedNumber ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'নম্বর কপি' : 'Copy')}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 leading-normal">
                {lang === 'bn'
                  ? `১. আপনার ${paymentMethod} অ্যাপ থেকে উপরের নম্বরে ৳${currentPlanObj.price} টাকা 'Send Money' করুন।`
                  : `1. Send ৳${currentPlanObj.price} via ${paymentMethod} Send Money to the number above.`}
                <br />
                {lang === 'bn'
                  ? '২. পেমেন্ট সফল হওয়ার পর নিচের বক্সে আপনার মোবাইল নম্বর ও TrxID লিখে সাবমিট করুন।'
                  : '2. After payment, enter your sender number and Transaction ID (TrxID) below.'}
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'bn' ? 'প্রেরক মোবাইল নম্বর (Sender No)' : 'Sender Phone Number'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'bn' ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BIK983KL2"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !senderNumber.trim() || !trxId.trim()}
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 disabled:opacity-40 disabled:pointer-events-none shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Sparkles size={16} />
                <span>
                  {isSubmitting
                    ? (lang === 'bn' ? 'সাবমিট হচ্ছে...' : 'Submitting...')
                    : (lang === 'bn' ? `পেমেন্ট ভেরিফাই করুন (৳${currentPlanObj.price})` : `Submit Verification (৳${currentPlanObj.price})`)}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
