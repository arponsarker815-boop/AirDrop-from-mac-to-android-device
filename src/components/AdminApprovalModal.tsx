import React, { useState, useEffect } from 'react';
import { PaymentRequest, DeviceInfo, AdminSettings } from '../types';
import { X, Check, CheckCircle2, XCircle, ShieldCheck, Key, RefreshCw, Smartphone, Laptop, Settings, DollarSign, Crown, AlertCircle } from 'lucide-react';
import { Language, translations } from '../locales/strings';
import { sound } from '../utils/audio';

interface AdminApprovalModalProps {
  onClose: () => void;
  lang: Language;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({ onClose, lang }) => {
  const [pin, setPin] = useState('8150');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'devices' | 'settings'>('pending');
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable settings
  const [editBkash, setEditBkash] = useState('');
  const [editNagad, setEditNagad] = useState('');
  const [editRocket, setEditRocket] = useState('');
  const [editMonthly, setEditMonthly] = useState(99);
  const [editYearly, setEditYearly] = useState(799);
  const [editLifetime, setEditLifetime] = useState(1499);
  const [editPin, setEditPin] = useState('');

  const fetchAdminData = async (authPin: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/auth-and-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: authPin }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setPayments(data.payments || []);
        setConnectedDevices(data.devices || []);
        setAdminSettings(data.settings);

        if (data.settings) {
          setEditBkash(data.settings.bkashNumber);
          setEditNagad(data.settings.nagadNumber);
          setEditRocket(data.settings.rocketNumber);
          setEditMonthly(data.settings.monthlyPrice);
          setEditYearly(data.settings.yearlyPrice);
          setEditLifetime(data.settings.lifetimePrice);
          setEditPin(data.settings.adminPin);
        }
      } else {
        setErrorMsg('ভুল অ্যাডমিন পিন (Invalid Admin PIN)');
      }
    } catch {
      setErrorMsg('সার্ভারে সংযোগ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData(pin);
  };

  const handleApprove = async (paymentId: string) => {
    try {
      const res = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, paymentId }),
      });

      if (res.ok) {
        sound.playSuccessTone();
        setSuccessMsg('পেমেন্ট সফলভাবে অনুমোদিত হয়েছে ও প্রো লাইসেন্স চালু হয়েছে!');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchAdminData(pin);
      }
    } catch {
      setErrorMsg('অনুমোদন ব্যর্থ হয়েছে');
    }
  };

  const handleReject = async (paymentId: string) => {
    try {
      const res = await fetch('/api/admin/reject-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, paymentId, notes: 'Invalid TrxID' }),
      });

      if (res.ok) {
        sound.playDeclineTone();
        fetchAdminData(pin);
      }
    } catch {
      setErrorMsg('বাতিলকরণ ব্যর্থ হয়েছে');
    }
  };

  const handleToggleProLicense = async (deviceId: string, currentStatus?: string) => {
    const action = currentStatus === 'active' ? 'revoke' : 'grant';
    try {
      const res = await fetch('/api/admin/grant-device-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, deviceId, action, plan: 'lifetime' }),
      });

      if (res.ok) {
        sound.playSuccessTone();
        fetchAdminData(pin);
      }
    } catch {
      setErrorMsg('লাইসেন্স পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          newSettings: {
            bkashNumber: editBkash,
            nagadNumber: editNagad,
            rocketNumber: editRocket,
            monthlyPrice: Number(editMonthly),
            yearlyPrice: Number(editYearly),
            lifetimePrice: Number(editLifetime),
            adminPin: editPin || pin,
          },
        }),
      });

      if (res.ok) {
        setSuccessMsg('অ্যাডমিন সেটিংস সফলভাবে সেভ হয়েছে!');
        if (editPin) setPin(editPin);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setErrorMsg('সেটিংস সেভ ব্যর্থ হয়েছে');
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">
              {lang === 'bn' ? 'অ্যাডমিন অনুমোদন ও পারমিশন প্যানেল' : 'Admin Payment Approval Panel'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'পেমেন্ট ভেরিফাই করুন এবং ব্যবহারকারী ডিভাইসকে প্রো লাইসেন্স অনুমোদন দিন'
                : 'Verify user payments and grant AirDrop Pro transfer permissions'}
            </p>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {!isAuthenticated ? (
          /* Login Screen */
          <form onSubmit={handleLogin} className="max-w-sm mx-auto my-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-sky-400">
              <Key size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {lang === 'bn' ? 'মাস্টার অ্যাডমিন পিন দিন' : 'Enter Admin Master PIN'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'bn' ? 'ডিফল্ট ওনার পিন: 8150' : 'Default Owner PIN: 8150'}
              </p>
            </div>

            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN (8150)"
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-center text-lg font-mono font-bold text-white tracking-widest focus:outline-none focus:border-amber-500 shadow-inner"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {loading ? 'যাচাই হচ্ছে...' : 'লগইন করুন (Access Panel)'}
            </button>
          </form>
        ) : (
          /* Dashboard */
          <div>
            {/* Tabs */}
            <div className="flex gap-2 mb-5 p-1 bg-slate-950/80 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{lang === 'bn' ? 'পেন্ডিং পেমেন্ট' : 'Pending Payments'}</span>
                {pendingPayments.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-mono">
                    {pendingPayments.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('devices')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'devices'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{lang === 'bn' ? 'ডিভাইস পারমিশন' : 'Device Licenses'}</span>
                <span className="font-mono text-[10px] text-slate-400">({connectedDevices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings size={13} />
                <span>{lang === 'bn' ? 'বিকাশ/নগদ সেটিংস' : 'Payment Settings'}</span>
              </button>
            </div>

            {/* Tab 1: Pending Payments */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                  <span>{pendingPayments.length} {lang === 'bn' ? 'টি পেমেন্ট অনুমোদনের অপেক্ষায়' : 'requests waiting'}</span>
                  <button
                    type="button"
                    onClick={() => fetchAdminData(pin)}
                    className="flex items-center gap-1 text-sky-400 hover:underline"
                  >
                    <RefreshCw size={12} />
                    <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
                  </button>
                </div>

                {pendingPayments.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500/60" />
                    <p className="text-xs font-semibold">
                      {lang === 'bn' ? 'কোনো পেন্ডিং পেমেন্ট নেই' : 'No pending payment requests'}
                    </p>
                  </div>
                ) : (
                  pendingPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-amber-500/50 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-amber-400">
                            {p.deviceType === 'mac' ? <Laptop size={20} /> : <Smartphone size={20} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{p.deviceName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Method: <span className="uppercase text-amber-300 font-bold">{p.method}</span> · Sender: <span className="text-white font-bold">{p.senderNumber}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-amber-400 font-mono">
                            ৳{p.amount}
                          </span>
                          <p className="text-[10px] text-slate-500 uppercase">{p.plan}</p>
                        </div>
                      </div>

                      {/* TrxID Badge */}
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">TrxID:</span>
                        <span className="font-mono font-extrabold text-sky-300 tracking-wider select-all">
                          {p.trxId}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleReject(p.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 glass-button hover:text-white"
                        >
                          {lang === 'bn' ? 'বাতিল (Reject)' : 'Reject'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(p.id)}
                          className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>{lang === 'bn' ? 'অনুমোদন দিন ও প্রো চালু করুন' : 'Approve & Activate Pro'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Connected Devices & Instant License Grant */}
            {activeTab === 'devices' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'কানেক্টেড যেকোনো ডিভাইসে সরাসরি আজীবন প্রো লাইসেন্স অন/অফ করুন:'
                    : 'Directly toggle Pro license for any connected phone or MacBook:'}
                </p>

                {connectedDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                        {dev.type === 'mac' ? <Laptop size={20} /> : <Smartphone size={20} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate">{dev.name}</p>
                          {dev.subscriptionStatus === 'active' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {dev.id.slice(0, 10)} · Battery: {dev.batteryLevel || 90}%
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleProLicense(dev.id, dev.subscriptionStatus)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        dev.subscriptionStatus === 'active'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      }`}
                    >
                      {dev.subscriptionStatus === 'active'
                        ? (lang === 'bn' ? 'প্রো বাতিল' : 'Revoke Pro')
                        : (lang === 'bn' ? 'সরাসরি প্রো দিন' : 'Grant Pro')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Payment Numbers & Pricing Settings */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      বিকাশ নম্বর (bKash)
                    </label>
                    <input
                      type="text"
                      value={editBkash}
                      onChange={(e) => setEditBkash(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      নগদ নম্বর (Nagad)
                    </label>
                    <input
                      type="text"
                      value={editNagad}
                      onChange={(e) => setEditNagad(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      রকেট নম্বর (Rocket)
                    </label>
                    <input
                      type="text"
                      value={editRocket}
                      onChange={(e) => setEditRocket(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      মাসিক প্যাকেজ (টাকা)
                    </label>
                    <input
                      type="number"
                      value={editMonthly}
                      onChange={(e) => setEditMonthly(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      বাৎসরিক প্যাকেজ (টাকা)
                    </label>
                    <input
                      type="number"
                      value={editYearly}
                      onChange={(e) => setEditYearly(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      আজীবন ভিআইপি (টাকা)
                    </label>
                    <input
                      type="number"
                      value={editLifetime}
                      onChange={(e) => setEditLifetime(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    নতুন অ্যাডমিন পিন (New PIN)
                  </label>
                  <input
                    type="password"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value)}
                    placeholder="পাসওয়ার্ড পরিবর্তন করতে লিখুন (ঐচ্ছিক)"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  সেটিংস সংরক্ষণ করুন (Save Settings)
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
