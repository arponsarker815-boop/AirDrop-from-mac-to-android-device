import React, { useState, useRef } from 'react';
import { DeviceInfo, PeerDevice } from '../types';
import { DeviceAvatar } from './DeviceAvatar';
import { QrCode, Upload, Smartphone, Laptop, Sparkles, Check, Edit2, ShieldCheck, Radio, Camera, Image, ArrowUpRight } from 'lucide-react';
import { Language, translations } from '../locales/strings';

interface RadarViewProps {
  localDevice: DeviceInfo;
  peers: PeerDevice[];
  onSelectPeer: (peer: PeerDevice) => void;
  onOpenPairing: () => void;
  onUpdateDeviceName: (newName: string) => void;
  onFilesDropped: (files: FileList, targetPeer?: PeerDevice) => void;
  lang: Language;
  onStartSimulator: () => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  localDevice,
  peers,
  onSelectPeer,
  onOpenPairing,
  onUpdateDeviceName,
  onFilesDropped,
  lang,
  onStartSimulator,
}) => {
  const t = translations[lang];
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(localDevice.name);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const defaultTarget = peers.length === 1 ? peers[0] : undefined;
      onFilesDropped(e.dataTransfer.files, defaultTarget);
    }
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdateDeviceName(editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleMobileFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const macPeer = peers.find((p) => p.type === 'mac') || peers[0];
      onFilesDropped(e.target.files, macPeer);
    }
  };

  const getPeerPosition = (index: number, total: number) => {
    if (total === 1) {
      return { top: '24%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    const r = 36;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    return {
      top: `${y}%`,
      left: `${x}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  const macPeer = peers.find((p) => p.type === 'mac');

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-3xl transition-all duration-300 overflow-hidden glass-panel ${
        isDragging
          ? 'border-sky-400 ring-4 ring-sky-500/30 bg-sky-950/40'
          : 'border-slate-800/80 bg-slate-900/60'
      }`}
    >
      {/* Hidden input for Android gallery/camera file picker */}
      <input
        type="file"
        ref={mobileFileInputRef}
        onChange={handleMobileFilePicked}
        multiple
        accept="image/*,video/*,application/pdf,*"
        className="hidden"
        id="android-direct-picker"
      />

      {/* Drag & drop overlay cue */}
      {isDragging && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md pointer-events-none animate-in fade-in">
          <div className="w-20 h-20 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 mb-4 animate-bounce">
            <Upload size={36} />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{t.dropFilesHere}</p>
          <p className="text-sm text-sky-300 mt-1">
            {lang === 'bn' ? 'ফাইলটি ছেড়ে দিলে সরাসরি ডিভাইসে পাঠানো হবে' : 'Release to transfer in 100% original quality'}
          </p>
        </div>
      )}

      {/* Top Telemetry Header */}
      <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t.radarTitle}
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>WiFi 6 · 5GHz</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.radarSubtitle}
          </p>
        </div>

        {/* Local Device Identity Box */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-2.5 shrink-0 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-slate-900 text-sm font-semibold text-white px-2.5 py-1 rounded-xl border border-sky-500 focus:outline-none w-40"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="p-1.5 hover:text-sky-400 text-slate-300 rounded-lg hover:bg-slate-800"
                aria-label="Save name"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{t.localDevice}</p>
                <p className="text-sm font-bold text-white leading-tight">{localDevice.name}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditedName(localDevice.name);
                  setIsEditingName(true);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={t.changeName}
                aria-label={t.changeName}
              >
                <Edit2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prominent Android to MacBook Quick-Send Bar */}
      <div className="px-5 sm:px-7 py-3 bg-sky-950/30 border-b border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Smartphone size={14} />
          </div>
          <span className="font-bold text-white">
            {t.sendFromAndroidToMac}
          </span>
          <span className="text-slate-500">→</span>
          <span className="text-sky-400 font-medium">
            {macPeer ? `${macPeer.name} (Online)` : 'MacBook Pro / Air'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => mobileFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Image size={13} />
            <span>{t.takePhotoOrGallery}</span>
          </button>
        </div>
      </div>

      {/* High-Regulation Radar Canvas Area */}
      <div className="relative w-full aspect-square max-w-[580px] mx-auto p-4 flex items-center justify-center my-6">
        {/* Orbital Range Rings with High Precision Math */}
        <div className="absolute inset-4 rounded-full border border-sky-500/10 pointer-events-none" />
        <div className="absolute inset-16 rounded-full border border-sky-500/15 pointer-events-none" />
        <div className="absolute inset-28 rounded-full border border-sky-500/20 pointer-events-none" />
        <div className="absolute inset-40 rounded-full border border-sky-500/25 pointer-events-none" />

        {/* High-Resolution Range Markers */}
        <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 select-none">
          RANGE: 5.0m
        </span>
        <span className="absolute top-18 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 select-none">
          RANGE: 3.0m
        </span>
        <span className="absolute top-30 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 select-none">
          RANGE: 1.5m
        </span>

        {/* Degree Markings */}
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 font-bold">0° N</span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 font-bold">180° S</span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 font-bold">270° W</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 font-bold">90° E</span>

        {/* Ambient Expanding Waves */}
        <div className="absolute w-48 h-48 rounded-full border border-sky-400/30 radar-exp-1 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full border border-sky-400/20 radar-exp-2 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full border border-sky-400/10 radar-exp-3 pointer-events-none" />

        {/* High-Resolution Sweep Beam */}
        <div className="absolute inset-4 rounded-full overflow-hidden pointer-events-none">
          <div
            className="w-full h-full radar-sweep-beam-hires"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(56, 189, 248, 0.3) 0deg, rgba(2, 132, 199, 0.08) 50deg, transparent 90deg)',
            }}
          />
        </div>

        {/* Center: Current Local Device */}
        <div className="relative z-10">
          <DeviceAvatar
            type={localDevice.type}
            name={localDevice.name}
            model={localDevice.model}
            avatarColor={localDevice.avatarColor}
            size="lg"
            isLocal={true}
            batteryLevel={localDevice.batteryLevel}
            isCharging={localDevice.isCharging}
            subscriptionStatus={localDevice.subscriptionStatus}
          />
        </div>

        {/* Discovered Orbiting Peers */}
        {peers.map((peer, idx) => {
          const style = getPeerPosition(idx, peers.length);
          return (
            <div
              key={peer.id}
              style={style}
              className="absolute z-20 transition-all duration-500 device-float-subtle"
            >
              <DeviceAvatar
                type={peer.type}
                name={peer.name}
                model={peer.model}
                avatarColor={peer.avatarColor}
                size="md"
                batteryLevel={peer.batteryLevel}
                isCharging={peer.isCharging}
                subscriptionStatus={peer.subscriptionStatus}
                onClick={() => onSelectPeer(peer)}
              />
            </div>
          );
        })}

        {/* If no peers found, show high-regulation helper prompt */}
        {peers.length === 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-sm glass-panel rounded-2xl p-4.5 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-1.5 text-sky-400 mb-1">
              <Radio size={14} className="animate-spin" />
              <p className="text-xs font-bold text-white tracking-wide">
                {t.noPeersFound}
              </p>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal">
              {lang === 'bn'
                ? 'আপনার অ্যান্ড্রয়েড ফোনের ক্যামেরা দিয়ে নিচের QR কোডটি স্ক্যান করে ওপেন করুন।'
                : 'Scan the QR code with your Android camera or join the same room.'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3.5">
              <button
                type="button"
                onClick={onOpenPairing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all active:scale-95"
              >
                <QrCode size={14} />
                <span>{t.scanQrToConnect}</span>
              </button>
              <button
                type="button"
                onClick={onStartSimulator}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-button text-amber-300 text-xs font-bold transition-all active:scale-95"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>{lang === 'bn' ? 'সিমুলেটরে টেস্ট' : 'Dual Screen Test'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Technical Status Bar */}
      <div className="p-4 sm:p-5 bg-slate-950/60 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Laptop size={15} className="text-sky-400" />
            <span>MacBook</span>
          </div>
          <span className="text-sky-400 font-bold">⇄</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Smartphone size={15} className="text-emerald-400" />
            <span>Android</span>
          </div>
          <span aria-hidden="true" className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
            Bidirectional Direct WiFi (Sub-5ms Latency)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenPairing}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            <QrCode size={14} />
            <span>{t.scanQrToConnect}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
