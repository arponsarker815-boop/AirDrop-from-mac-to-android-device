import React, { useState } from 'react';
import { PeerDevice } from '../types';
import { X, Copy, Send, Check, Smartphone, Laptop, Sparkles } from 'lucide-react';
import { Language, translations } from '../locales/strings';
import { sound } from '../utils/audio';

interface ClipboardSyncModalProps {
  peers: PeerDevice[];
  onSendText: (targetPeer: PeerDevice, text: string) => void;
  onClose: () => void;
  lang: Language;
}

export const ClipboardSyncModal: React.FC<ClipboardSyncModalProps> = ({
  peers,
  onSendText,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [text, setText] = useState('');
  const [selectedPeerId, setSelectedPeerId] = useState<string>(peers[0]?.id || '');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
      }
    } catch {
      // Browsers with security prompt
    }
  };

  const handleSend = () => {
    const target = peers.find((p) => p.id === selectedPeerId) || peers[0];
    if (target && text.trim()) {
      onSendText(target, text.trim());
      sound.playSendChirp();
      setCopiedNotification(true);
      setTimeout(() => {
        setCopiedNotification(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2.5 text-indigo-400 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Copy size={18} />
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {t.quickText}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {lang === 'bn'
              ? 'ম্যাকবুক থেকে অ্যান্ড্রয়েডে অথবা অ্যান্ড্রয়েড থেকে ম্যাকবুকে দ্রুত যেকোনো টেক্সট, লিঙ্ক বা পাসওয়ার্ড পাঠান'
              : 'Instantly sync notes, URLs, OTPs or passwords between your MacBook and Android device'}
          </p>

          {/* Select Target Device */}
          <div className="mt-5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              {lang === 'bn' ? 'প্রাপক ডিভাইস নির্বাচন করুন' : 'Select Target Device'}
            </label>
            {peers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {peers.map((peer) => (
                  <button
                    key={peer.id}
                    type="button"
                    onClick={() => setSelectedPeerId(peer.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      (selectedPeerId || peers[0].id) === peer.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/50'
                        : 'border-white/5 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                      {peer.type === 'mac' ? <Laptop size={18} className="text-sky-400" /> : <Smartphone size={18} className="text-emerald-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-white">{peer.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{peer.model}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 p-3 rounded-2xl font-medium">
                {t.noPeersFound} · {lang === 'bn' ? 'আগে আপনার অ্যান্ড্রয়েড ফোন কানেক্ট করুন' : 'Connect Android phone first'}
              </p>
            )}
          </div>

          {/* Text Input Area */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="clipboard-input" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {lang === 'bn' ? 'টেক্সট বা লিঙ্ক লিখুন' : 'Enter Text / Link'}
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
              >
                <Copy size={13} />
                <span>{lang === 'bn' ? 'ক্লিপবোর্ড থেকে পেস্ট' : 'Paste Clipboard'}</span>
              </button>
            </div>
            <textarea
              id="clipboard-input"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.quickTextPlaceholder}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono shadow-inner resize-none"
            />
          </div>

          {/* Action Button */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl glass-button transition-colors"
            >
              {t.close}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={peers.length === 0 || !text.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
            >
              {copiedNotification ? (
                <>
                  <Check size={14} className="text-emerald-300" />
                  <span>{lang === 'bn' ? 'পাঠানো হয়েছে!' : 'Sent!'}</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>{t.sendTextBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
