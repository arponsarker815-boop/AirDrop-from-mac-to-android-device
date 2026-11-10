import React, { useState, useRef } from 'react';
import { Laptop, Smartphone, Send, ArrowRight, ArrowLeft, Check, Download, Image, Film, FileText, Sparkles, Volume2, X, Battery, Wifi, ShieldCheck, Zap, Upload, Camera } from 'lucide-react';
import { sound } from '../utils/audio';
import { Language, translations } from '../locales/strings';
import confetti from 'canvas-confetti';

interface DualDeviceSimulatorProps {
  onClose: () => void;
  lang: Language;
}

interface SimulatedTransfer {
  id: string;
  sender: 'mac' | 'android';
  title: string;
  category: 'image' | 'video' | 'text';
  size: string;
  resolution: string;
  previewUrl: string;
  status: 'idle' | 'sending' | 'ringing' | 'accepted' | 'declined';
  progress: number;
}

export const DualDeviceSimulator: React.FC<DualDeviceSimulatorProps> = ({ onClose, lang }) => {
  const t = translations[lang];
  const customFileInputRef = useRef<HTMLInputElement>(null);

  const sampleItems = [
    {
      title: 'DSC_Dhaka_Sunset_4K.jpg',
      category: 'image' as const,
      size: '6.4 MB',
      resolution: '4032 × 3024 · 12MP RAW',
      previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=85',
    },
    {
      title: 'Galaxy_S24_Ultra_Night.jpg',
      category: 'image' as const,
      size: '14.2 MB',
      resolution: '12000 × 9000 · 200MP Expert RAW',
      previewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=85',
    },
    {
      title: 'CoxBazar_Drone_UHD.mp4',
      category: 'video' as const,
      size: '52.8 MB',
      resolution: '3840 × 2160 · 60fps 4K',
      previewUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=85',
    },
    {
      title: 'WiFi Credentials & Location Pin: 23.8103° N, 90.4125° E',
      category: 'text' as const,
      size: '184 B',
      resolution: 'Instant Clipboard',
      previewUrl: '',
    },
  ];

  const [activeTransfer, setActiveTransfer] = useState<SimulatedTransfer>({
    id: 'sim_1',
    sender: 'android',
    title: sampleItems[1].title,
    category: sampleItems[1].category,
    size: sampleItems[1].size,
    resolution: sampleItems[1].resolution,
    previewUrl: sampleItems[1].previewUrl,
    status: 'idle',
    progress: 0,
  });

  const [direction, setDirection] = useState<'android-to-mac' | 'mac-to-android'>('android-to-mac');
  const [macDownloads, setMacDownloads] = useState<Array<{ url: string; title: string; res: string; size: string }>>([
    {
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=85',
      title: 'Galaxy_S24_Ultra_Night.jpg',
      res: '200MP Expert RAW',
      size: '14.2 MB',
    },
  ]);
  const [androidGallery, setAndroidGallery] = useState<Array<{ url: string; title: string; res: string }>>([
    {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=85',
      title: 'DSC_Dhaka_Sunset_4K.jpg',
      res: '4032 × 3024',
    },
  ]);

  const handleStartSimulatedTransfer = (item: typeof sampleItems[0]) => {
    sound.playSendChirp();

    setActiveTransfer({
      id: 'sim_' + Date.now(),
      sender: direction === 'android-to-mac' ? 'android' : 'mac',
      title: item.title,
      category: item.category,
      size: item.size,
      resolution: item.resolution,
      previewUrl: item.previewUrl,
      status: 'sending',
      progress: 30,
    });

    setTimeout(() => {
      sound.playIncomingPing();
      setActiveTransfer((prev) => ({
        ...prev,
        status: 'ringing',
        progress: 60,
      }));
    }, 600);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImg = file.type.startsWith('image/');
      if (isImg) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          handleStartSimulatedTransfer({
            title: file.name,
            category: 'image',
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            resolution: 'Original Resolution',
            previewUrl: ev.target?.result as string,
          });
        };
        reader.readAsDataURL(file);
      } else {
        handleStartSimulatedTransfer({
          title: file.name,
          category: 'video',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          resolution: file.type || 'Binary File',
          previewUrl: '',
        });
      }
    }
  };

  const handleAcceptSimulated = () => {
    sound.playSuccessTone();
    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}

    setActiveTransfer((prev) => ({
      ...prev,
      status: 'accepted',
      progress: 100,
    }));

    if (direction === 'android-to-mac') {
      if (activeTransfer.previewUrl) {
        setMacDownloads((prev) => [
          {
            url: activeTransfer.previewUrl,
            title: activeTransfer.title,
            res: activeTransfer.resolution,
            size: activeTransfer.size,
          },
          ...prev,
        ]);
      }
    } else {
      if (activeTransfer.previewUrl) {
        setAndroidGallery((prev) => [
          { url: activeTransfer.previewUrl, title: activeTransfer.title, res: activeTransfer.resolution },
          ...prev,
        ]);
      }
    }
  };

  const handleDeclineSimulated = () => {
    sound.playDeclineTone();
    setActiveTransfer((prev) => ({
      ...prev,
      status: 'declined',
      progress: 0,
    }));
  };

  return (
    <div className="my-6 p-5 sm:p-7 rounded-3xl glass-panel border border-amber-500/30 shadow-2xl animate-in fade-in">
      <input
        type="file"
        ref={customFileInputRef}
        onChange={handleCustomFileUpload}
        className="hidden"
        id="simulator-custom-file"
      />

      {/* Simulator Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
              HIGH-FIDELITY SIMULATOR
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {t.testSimulator}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.simulatorHint}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Direction toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setDirection('android-to-mac')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                direction === 'android-to-mac'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone size={14} />
              <span>Android → MacBook</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('mac-to-android')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                direction === 'mac-to-android'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop size={14} />
              <span>MacBook → Android</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
            aria-label="Close Simulator"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Side-by-side Dual Device Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mt-6 items-stretch">
        {/* Device A: Android Smartphone (Sender or Receiver) */}
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col justify-between max-w-sm mx-auto w-full shadow-2xl ring-1 ring-white/5 order-2 lg:order-1">
          <div>
            {/* Android Status Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pb-2 font-mono">
              <span className="font-bold text-white">10:42</span>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-2 ring-slate-700 mx-auto" />
              <span>WiFi 6 · 98%</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-md">
                  <Smartphone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Samsung Galaxy S24 Ultra</p>
                  <p className="text-[10px] text-slate-400 font-medium">Android 15 · AirDrop Active</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {direction === 'android-to-mac' ? 'Sender (Phone)' : 'Receiver'}
              </span>
            </div>

            {/* Android Body: Sending files to MacBook */}
            {direction === 'android-to-mac' ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {lang === 'bn' ? 'অ্যান্ড্রয়েড থেকে ম্যাকবুকে ফাইল পাঠান:' : 'AirDrop files from Android to MacBook:'}
                </p>

                <div className="space-y-2">
                  {sampleItems.slice(0, 3).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleStartSimulatedTransfer(item)}
                      className="w-full p-2.5 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-emerald-500/70 text-left flex items-center justify-between transition-all group hover:bg-slate-950 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0 overflow-hidden shadow-inner">
                          {item.previewUrl ? (
                            <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <FileText size={20} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.size} · {item.resolution}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0 ml-1">
                        <span>Send</span>
                        <ArrowRight size={13} />
                      </span>
                    </button>
                  ))}
                </div>

                {/* Upload own file from computer to send as Android phone */}
                <button
                  type="button"
                  onClick={() => customFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-2xl glass-button text-sky-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <Upload size={14} />
                  <span>{lang === 'bn' ? 'কম্পিউটার থেকে নিজের ফাইল বাছুন' : 'Upload custom file from disk'}</span>
                </button>
              </div>
            ) : (
              /* Android Receiving Sheet (when Mac sends to Android) */
              <div className="mt-4">
                {activeTransfer.status === 'ringing' ? (
                  <div className="p-4 rounded-2xl bg-sky-950/95 border border-sky-400/60 shadow-2xl animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Laptop size={16} className="text-sky-400" />
                      <p className="text-xs font-bold text-white">MacBook Pro wants to share:</p>
                    </div>
                    <p className="text-xs font-bold text-sky-200 truncate">{activeTransfer.title}</p>
                    <p className="text-[10px] font-mono text-sky-300/80">{activeTransfer.size} · {activeTransfer.resolution}</p>

                    {activeTransfer.previewUrl && (
                      <img
                        src={activeTransfer.previewUrl}
                        alt="Incoming preview"
                        className="w-full h-32 object-cover rounded-xl my-2.5 border border-sky-400/40 shadow-md"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleDeclineSimulated}
                        className="py-2.5 text-xs font-bold rounded-xl glass-button text-slate-300"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptSimulated}
                        className="py-2.5 text-xs font-extrabold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/40"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {lang === 'bn' ? 'অ্যান্ড্রয়েড গ্যালারি:' : 'Android Gallery:'}
                      </p>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold">
                        {androidGallery.length} Files
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {androidGallery.map((item, i) => (
                        <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group shadow-md">
                          <img src={item.url} alt={`Saved ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-white/5 mt-5 text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Android WiFi 6 Direct</span>
            <span className="text-emerald-400 font-semibold">● Channel Active</span>
          </div>
        </div>

        {/* Device B: MacBook Pro 16" (Receiver or Sender) */}
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl order-1 lg:order-2">
          <div>
            {/* macOS Menu bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-white ml-2">MacBook Pro 16" (macOS)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <Wifi size={12} className="text-sky-400" />
                <span>5GHz WiFi</span>
                <span aria-hidden="true">·</span>
                <Battery size={12} className="text-emerald-400" />
                <span>94%</span>
              </div>
            </div>

            {/* Mac Receiving View from Android */}
            {direction === 'android-to-mac' ? (
              <div className="mt-4 space-y-3">
                {activeTransfer.status === 'ringing' ? (
                  /* macOS Sonoma Style AirDrop Notification in top right of MacBook screen */
                  <div className="p-4 rounded-2xl bg-slate-950/95 border border-sky-400/50 shadow-2xl animate-in slide-in-from-top-3 duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-sky-500 flex items-center justify-center text-white">
                          <Wifi size={12} />
                        </div>
                        <span className="text-xs font-bold text-white">AirDrop</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Just Now</span>
                    </div>

                    <div className="flex items-center gap-3.5 my-3">
                      {activeTransfer.previewUrl ? (
                        <img
                          src={activeTransfer.previewUrl}
                          alt="Mac incoming"
                          className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                          <Smartphone size={24} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">Samsung Galaxy S24 Ultra</p>
                        <p className="text-xs text-sky-300 font-semibold truncate mt-0.5">{activeTransfer.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{activeTransfer.size} · {activeTransfer.resolution}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleDeclineSimulated}
                        className="py-2 text-xs font-bold rounded-xl glass-button text-slate-300"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptSimulated}
                        className="py-2 text-xs font-extrabold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/40"
                      >
                        Accept & Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {t.savedToMacDownloads}:
                      </p>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        {macDownloads.length} Saved
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {macDownloads.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between gap-3 shadow-inner"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={item.url} alt={item.title} className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{item.title}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.size} · {item.res}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                            Saved
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Mac as Sender (Mac to Android) */
              <div className="mt-4 space-y-3">
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {lang === 'bn' ? 'ম্যাকবুক থেকে অ্যান্ড্রয়েডে পাঠান:' : 'AirDrop files from Mac to Android:'}
                </p>
                <div className="space-y-2">
                  {sampleItems.slice(0, 3).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleStartSimulatedTransfer(item)}
                      className="w-full p-2.5 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-sky-500 text-left flex items-center justify-between transition-all group"
                    >
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
                        <span>Send</span>
                        <ArrowRight size={13} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-white/5 mt-5 text-[11px] text-slate-400 flex justify-between font-mono">
            <span>~/Downloads/AirDrop</span>
            <span className="text-emerald-400 font-semibold">● macOS Direct</span>
          </div>
        </div>
      </div>
    </div>
  );
};
