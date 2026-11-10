import React from 'react';
import { TransferItem } from '../types';
import { DeviceAvatar } from './DeviceAvatar';
import { Check, X, FileText, Image, Film, Copy, Download, Sparkles } from 'lucide-react';
import { formatFileSize, getFileCategory } from '../utils/deviceDetector';
import { Language, translations } from '../locales/strings';

interface IncomingSheetProps {
  transfer: TransferItem;
  onAccept: (transferId: string) => void;
  onDecline: (transferId: string) => void;
  lang: Language;
}

export const IncomingSheet: React.FC<IncomingSheetProps> = ({
  transfer,
  onAccept,
  onDecline,
  lang,
}) => {
  const t = translations[lang];
  const category = getFileCategory(transfer.fileType, transfer.fileName);
  const isText = !!transfer.textContent;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10 animate-in slide-in-from-bottom-10 duration-300">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-3" />

        <div className="p-6 sm:p-7 text-center">
          {/* Sender Avatar */}
          <div className="flex justify-center mb-4">
            <DeviceAvatar
              type={transfer.senderType}
              name={transfer.senderName}
              size="lg"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-bold tracking-wider uppercase mb-1">
            <Sparkles size={12} />
            <span>{isText ? t.incomingText : t.incomingTransfer}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight">
            {transfer.senderName}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {t.wantsToSend}
          </p>

          {/* Media / Content Preview Card */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-left shadow-inner">
            {isText ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <Copy size={14} />
                  <span>{lang === 'bn' ? 'টেক্সট বার্তা / লিঙ্ক' : 'Text Message / Link'}</span>
                </div>
                <p className="text-sm text-slate-100 bg-slate-900/90 p-3 rounded-xl break-words max-h-40 overflow-y-auto select-all font-mono border border-white/5">
                  {transfer.textContent}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {transfer.previewUrl ? (
                  <img
                    src={transfer.previewUrl}
                    alt={transfer.fileName}
                    className="w-20 h-20 rounded-2xl object-cover border border-white/15 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-sky-400 shrink-0 shadow-md">
                    {category === 'image' && <Image size={28} />}
                    {category === 'video' && <Film size={28} />}
                    {category === 'document' && <FileText size={28} />}
                    {category === 'audio' && <FileText size={28} />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {transfer.fileName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {formatFileSize(transfer.fileSize)}
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-sky-400 uppercase tracking-wider">
                    {transfer.fileType || category} · 100% Original
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tactile Action Buttons */}
          <div className="grid grid-cols-2 gap-3.5 mt-6">
            <button
              type="button"
              onClick={() => onDecline(transfer.id)}
              className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-slate-300 glass-button hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <X size={16} />
              <span>{t.decline}</span>
            </button>

            <button
              type="button"
              onClick={() => onAccept(transfer.id)}
              className="w-full py-3.5 px-4 rounded-2xl text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 shadow-xl shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>{t.accept}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
