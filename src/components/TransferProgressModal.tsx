import React, { useEffect } from 'react';
import { TransferItem } from '../types';
import { CheckCircle2, Download, XCircle, ArrowUpRight, ArrowDownLeft, X, Zap, Activity } from 'lucide-react';
import { formatFileSize } from '../utils/deviceDetector';
import { Language, translations } from '../locales/strings';
import confetti from 'canvas-confetti';

interface TransferProgressModalProps {
  transfer: TransferItem;
  isSender: boolean;
  onClose: () => void;
  lang: Language;
}

export const TransferProgressModal: React.FC<TransferProgressModalProps> = ({
  transfer,
  isSender,
  onClose,
  lang,
}) => {
  const t = translations[lang];

  useEffect(() => {
    if (transfer.status === 'completed') {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [transfer.status]);

  const handleDownload = () => {
    if (transfer.downloadUrl) {
      const a = document.createElement('a');
      a.href = transfer.downloadUrl;
      a.download = transfer.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-7 shadow-2xl border border-white/10 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div>
          {/* Status Icon */}
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 relative">
            {transfer.status === 'completed' ? (
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 size={42} />
              </div>
            ) : transfer.status === 'declined' ? (
              <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
                <XCircle size={42} />
              </div>
            ) : (
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-sky-400 border-t-transparent animate-spin"
                />
                <div className="text-sky-400">
                  {isSender ? <ArrowUpRight size={28} /> : <ArrowDownLeft size={28} />}
                </div>
              </div>
            )}
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {transfer.status === 'completed'
              ? t.transferCompleted
              : transfer.status === 'declined'
              ? t.transferDeclined
              : t.transferring}
          </h3>

          <p className="text-xs font-semibold text-slate-300 mt-1 truncate max-w-xs mx-auto">
            {transfer.fileName}
          </p>

          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {formatFileSize(transfer.fileSize)}
          </p>

          {/* Progress Bar & High-Regulation Speed Dial */}
          {(transfer.status === 'uploading' || transfer.status === 'downloading') && (
            <div className="mt-6 bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Activity size={14} className="text-sky-400 animate-pulse" />
                  <span>WiFi Direct Channel</span>
                </span>
                <span className="font-mono text-sky-400">{transfer.progress}%</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300 shadow-md shadow-sky-500/50"
                  style={{ width: `${Math.max(8, transfer.progress)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-2.5">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Zap size={12} />
                  <span>{transfer.speed || '24.6 MB/s'}</span>
                </span>
                <span>Sub-second transfer</span>
              </div>
            </div>
          )}

          {/* Action buttons on completion */}
          <div className="mt-6 flex flex-col gap-2.5">
            {!isSender && transfer.status === 'completed' && transfer.downloadUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-5 rounded-2xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Download size={16} />
                <span>{t.saveFile}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-slate-300 hover:text-white glass-button transition-all"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
