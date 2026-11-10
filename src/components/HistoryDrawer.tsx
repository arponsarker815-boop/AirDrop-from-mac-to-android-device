import React, { useState } from 'react';
import { HistoryRecord } from '../types';
import { X, Download, Copy, Trash2, Image, Film, FileText, ArrowUpRight, ArrowDownLeft, Eye, Sparkles } from 'lucide-react';
import { formatFileSize, getFileCategory } from '../utils/deviceDetector';
import { Language, translations } from '../locales/strings';

interface HistoryDrawerProps {
  history: HistoryRecord[];
  onClearHistory: () => void;
  onClose: () => void;
  lang: Language;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onClearHistory,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<'all' | 'media' | 'text'>('all');
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);

  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'media') return item.fileType.startsWith('image/') || item.fileType.startsWith('video/');
    if (filter === 'text') return !!item.textContent;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md h-full glass-panel border-l border-white/10 p-6 sm:p-7 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {t.viewHistory}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {history.length} {lang === 'bn' ? 'টি সফল এয়ারড্রপ ট্রান্সফার' : 'AirDrop transfers recorded'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                title={t.clearHistory}
                aria-label={t.clearHistory}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Segmented Control (§1.A of frontend-design skill) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl my-4 border border-white/10">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              filter === 'all' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'সব ফাইল' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('media')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              filter === 'media' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'ফটো ও ৪কে ভিডিও' : 'Media (4K)'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('text')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              filter === 'text' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'ক্লিপবোর্ড নোট' : 'Text'}
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredHistory.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-600 mb-3">
                <FileText size={28} />
              </div>
              <p className="text-xs font-medium">{t.historyEmpty}</p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const category = getFileCategory(item.fileType, item.fileName);
              const isSent = item.direction === 'sent';
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.fileName}
                          className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-sky-400">
                          {category === 'image' && <Image size={22} />}
                          {category === 'video' && <Film size={22} />}
                          {category === 'document' && <FileText size={22} />}
                          {category === 'text' && <FileText size={22} />}
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-1 -right-1 p-1 rounded-full ${
                          isSent ? 'bg-sky-600' : 'bg-emerald-600'
                        } text-white shadow-md`}
                      >
                        {isSent ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {item.fileName}
                      </p>
                      {item.textContent ? (
                        <p className="text-[11px] text-slate-300 line-clamp-1 font-mono mt-0.5">
                          {item.textContent}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {formatFileSize(item.fileSize)} · {dateStr}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        {isSent ? `${t.receiver}: ${item.peerName}` : `${t.sender}: ${item.peerName}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {item.previewUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewMedia({ url: item.previewUrl!, title: item.fileName })}
                          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                          title={t.preview}
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      {item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          download={item.fileName}
                          className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 transition-colors"
                          title={t.downloadAgain}
                        >
                          <Download size={15} />
                        </a>
                      )}
                      {item.textContent && (
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(item.textContent!)}
                          className="p-2 text-slate-400 hover:text-sky-400 rounded-xl hover:bg-slate-800 transition-colors"
                          title={t.copyText}
                        >
                          <Copy size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* High-Resolution Fullscreen Media Preview Modal */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] glass-panel rounded-3xl overflow-hidden p-3 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center px-4 py-2 text-xs text-white">
              <span className="font-bold truncate max-w-md">{previewMedia.title}</span>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={previewMedia.url}
              alt={previewMedia.title}
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
