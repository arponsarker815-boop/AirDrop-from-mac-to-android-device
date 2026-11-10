import React, { useState, useRef, useEffect } from 'react';
import { Wifi, QrCode, History, Copy, Volume2, VolumeX, Smartphone, Monitor, Globe, ChevronDown, Crown, ShieldCheck } from 'lucide-react';
import { Language, translations, availableLanguages } from '../locales/strings';
import { SubscriptionStatus } from '../types';

interface HeaderProps {
  lang: Language;
  onSelectLang: (lang: Language) => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onOpenPairing: () => void;
  onOpenHistory: () => void;
  onOpenTextSync: () => void;
  onOpenSubscription: () => void;
  onOpenAdmin: () => void;
  subscriptionStatus?: SubscriptionStatus;
  isSimulatorActive: boolean;
  onToggleSimulator: () => void;
  activePeerCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onSelectLang,
  isMuted,
  onToggleSound,
  onOpenPairing,
  onOpenHistory,
  onOpenTextSync,
  onOpenSubscription,
  onOpenAdmin,
  subscriptionStatus,
  isSimulatorActive,
  onToggleSimulator,
}) => {
  const t = translations[lang];
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const currentLangObj = availableLanguages.find((l) => l.code === lang) || availableLanguages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <a href="/" className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
            AirDrop <span className="text-sky-400 font-semibold text-sm">Mac ↔ Android</span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (concise, single-line, whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-semibold text-slate-300">
          <button
            type="button"
            onClick={onOpenPairing}
            className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 decoration-sky-400/50"
          >
            <QrCode className="w-4 h-4 text-sky-400" />
            <span>{lang === 'bn' ? 'কিউআর পেয়ারিং' : lang === 'hi' ? 'क्यूआर' : 'QR Pairing'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenTextSync}
            className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 decoration-indigo-400/50"
          >
            <Copy className="w-4 h-4 text-indigo-400" />
            <span>{lang === 'bn' ? 'ক্লিপবোর্ড' : 'Clipboard'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSubscription}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
              subscriptionStatus === 'active'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-gradient-to-r from-amber-500/20 to-amber-400/10 border-amber-500/40 text-amber-300 hover:border-amber-400'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{subscriptionStatus === 'active' ? (lang === 'bn' ? 'প্রো সক্রিয়' : 'Pro Active') : (lang === 'bn' ? 'সাবস্ক্রিপশন' : 'Pro VIP')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 text-slate-400 text-xs"
            title="Owner & Admin Payment Approval"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'bn' ? 'ওনার প্যানেল' : 'Admin'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSimulator}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
              isSimulatorActive
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-sm shadow-sky-500/20'
                : 'glass-button text-slate-300 hover:text-white'
            }`}
          >
            {isSimulatorActive ? <Smartphone className="w-3.5 h-3.5 text-sky-400" /> : <Monitor className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isSimulatorActive ? (lang === 'bn' ? 'সিমুলেটর চালু' : 'Simulator On') : (lang === 'bn' ? 'সিমুলেটর' : 'Simulator')}</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Multilingual Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={isMuted ? t.audioMuted : t.audioUnmuted}
            className="p-2 rounded-xl text-slate-400 hover:text-white glass-button transition-colors"
            title={isMuted ? t.audioMuted : t.audioUnmuted}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Multilingual Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl glass-button text-slate-200 transition-all hover:border-sky-500/40"
              aria-label="Select Language"
            >
              <span className="text-sm">{currentLangObj.flag}</span>
              <span className="hidden sm:inline font-semibold">{currentLangObj.nativeName}</span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl shadow-2xl border border-white/10 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">
                  Languages / ভাষা
                </div>
                <div className="py-1 max-h-64 overflow-y-auto">
                  {availableLanguages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        onSelectLang(l.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-colors text-left ${
                        lang === l.code
                          ? 'bg-sky-600/30 text-sky-300 font-bold border border-sky-500/40'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{l.flag}</span>
                        <span>{l.nativeName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenPairing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg shadow-sky-600/30 transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ফোন যুক্ত' : 'Connect'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
