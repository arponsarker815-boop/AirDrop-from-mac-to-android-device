import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Smartphone, Wifi, Share2, HelpCircle, Laptop, ShieldCheck } from 'lucide-react';
import { Language, translations } from '../locales/strings';

interface PairingModalProps {
  roomCode: string;
  onChangeRoom: (newRoom: string) => void;
  onClose: () => void;
  lang: Language;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  roomCode,
  onChangeRoom,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [customRoom, setCustomRoom] = useState(roomCode);
  const [isChangingRoom, setIsChangingRoom] = useState(false);

  const pairUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?room=${encodeURIComponent(roomCode)}`
    : '';

  useEffect(() => {
    if (pairUrl) {
      QRCode.toDataURL(pairUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#38bdf8',
          light: '#030712',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [pairUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveRoom = () => {
    if (customRoom.trim()) {
      onChangeRoom(customRoom.trim());
      setIsChangingRoom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto border border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400 mb-3 shadow-lg shadow-sky-500/10">
            <QrCode size={28} />
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {t.scanQrToConnect}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'আপনার অ্যান্ড্রয়েড ফোনের ক্যামেরা বা গুগল লেন্স দিয়ে নিচের কিউআর কোডটি স্ক্যান করলে ম্যাক ও ফোন তৎক্ষণাৎ কানেক্ট হয়ে যাবে।'
              : 'Scan with your Android camera or Google Lens to connect your phone and MacBook in 1 second.'}
          </p>

          {/* High-Resolution QR Canvas Frame */}
          <div className="my-5 p-4.5 bg-slate-950 border border-white/10 rounded-3xl inline-block shadow-2xl relative group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="AirDrop Pairing QR Code"
                className="w-60 h-60 rounded-2xl mx-auto shadow-inner"
              />
            ) : (
              <div className="w-60 h-60 flex items-center justify-center text-slate-600 font-mono text-xs">
                Generating High-Res QR...
              </div>
            )}
            <div className="absolute inset-x-0 -bottom-2.5 flex justify-center">
              <span className="px-3 py-0.5 rounded-full bg-sky-950 border border-sky-500/40 text-[10px] font-mono font-bold text-sky-400 shadow-md">
                DIRECT HIGH-SPEED PAIRING
              </span>
            </div>
          </div>

          {/* Room Code & Copy Link Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-slate-300">
              <Wifi size={14} className="text-sky-400" />
              <span className="font-semibold">{t.roomCode}:</span>
              {isChangingRoom ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customRoom}
                    onChange={(e) => setCustomRoom(e.target.value)}
                    className="bg-slate-900 text-white px-2 py-0.5 rounded-lg text-xs w-28 border border-sky-500 focus:outline-none font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveRoom}
                    className="text-sky-400 hover:text-white font-bold px-1"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsChangingRoom(true)}
                  className="font-mono font-bold text-sky-400 hover:underline"
                  title="Click to edit room"
                >
                  {roomCode}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold glass-button text-slate-200 transition-all active:scale-95"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedLink ? t.copied : (lang === 'bn' ? 'লিঙ্ক কপি করুন' : 'Copy Direct Link')}</span>
            </button>
          </div>

          {/* Steps & Guidance */}
          <div className="mt-6 text-left p-4.5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>{t.howToConnect}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{t.step1}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t.step2}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t.step3}</p>
          </div>

          {/* Android PWA Install badge */}
          <div className="mt-4 p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/20 text-left flex items-start gap-3">
            <Share2 size={16} className="text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-sky-200">
                {t.installPwa}
              </p>
              <p className="text-[11px] text-sky-300/80 mt-0.5 leading-normal">
                {lang === 'bn'
                  ? 'অ্যান্ড্রয়েড ফোনের ব্রাউজার থেকে "Install app" বা "Add to Home screen" দিলে এটি এয়ারড্রপ অ্যাপের মতো স্থায়ীভাবে হোমস্ক্রিনে চলে আসবে।'
                  : 'Add to home screen from Android browser to keep it accessible just like Apple AirDrop.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
