import React, { useState, useRef } from 'react';
import { PeerDevice } from '../types';
import { X, Upload, Image, FileText, Film, Copy, CheckCircle2, ArrowRight, Trash2, Plus, Sparkles } from 'lucide-react';
import { formatFileSize, getFileCategory } from '../utils/deviceDetector';
import { Language, translations } from '../locales/strings';
import { DeviceAvatar } from './DeviceAvatar';

interface SendModalProps {
  targetPeer: PeerDevice;
  onClose: () => void;
  onSendFile: (targetPeer: PeerDevice, file: File, previewUrl?: string) => void;
  onSendQuickText: (targetPeer: PeerDevice, text: string) => void;
  lang: Language;
}

interface SelectedFileItem {
  file: File;
  previewUrl?: string;
  category: string;
}

export const SendModal: React.FC<SendModalProps> = ({
  targetPeer,
  onClose,
  onSendFile,
  onSendQuickText,
  lang,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'files' | 'text'>('files');
  const [filesList, setFilesList] = useState<SelectedFileItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList) => {
    const newItems: SelectedFileItem[] = [];
    Array.from(files).forEach((file) => {
      const category = getFileCategory(file.type, file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilesList((prev) => [
            ...prev,
            { file, previewUrl: e.target?.result as string, category },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        newItems.push({ file, category });
      }
    });

    if (newItems.length > 0) {
      setFilesList((prev) => [...prev, ...newItems]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFilesList((prev) => prev.filter((_, i) => i !== index));
  };

  const totalSize = filesList.reduce((acc, item) => acc + item.file.size, 0);

  const handleSend = () => {
    if (activeTab === 'files' && filesList.length > 0) {
      // Send the first file or batch (main item)
      const primary = filesList[0];
      onSendFile(targetPeer, primary.file, primary.previewUrl);
      onClose();
    } else if (activeTab === 'text' && textInput.trim()) {
      onSendQuickText(targetPeer, textInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <DeviceAvatar
              type={targetPeer.type}
              name=""
              avatarColor={targetPeer.avatarColor}
              size="sm"
            />
            <div>
              <p className="text-[11px] font-bold text-sky-400 tracking-wider uppercase">
                {lang === 'bn' ? 'এয়ারড্রপ প্রাপক ডিভাইস' : 'AirDrop Target Device'}
              </p>
              <h3 className="text-lg font-extrabold text-white">
                {targetPeer.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'files'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Image size={15} />
            <span>{lang === 'bn' ? 'ফটো, ৪কে ভিডিও ও ফাইল' : 'Photos, 4K Videos & Files'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'text'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Copy size={15} />
            <span>{lang === 'bn' ? 'ক্লিপবোর্ড / টেক্সট' : 'Clipboard / Text'}</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6">
          {activeTab === 'files' ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                id="airdrop-file-picker"
              />

              {filesList.length === 0 ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-sky-400 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-950/80 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3.5 group-hover:scale-110 transition-transform">
                    <Upload size={28} />
                  </div>
                  <p className="text-base font-bold text-white">
                    {t.selectFiles}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === 'bn' ? 'একত্রে একাধিক ফটো, ভিডিও বা ফাইল বেছে নিন' : 'Choose multiple photos or files at once'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Image size={13} className="text-pink-400" /> High-Res Photos (RAW, HEIC, JPG)
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Film size={13} className="text-amber-400" /> 4K Ultra HD Videos (MOV, MP4)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected files summary */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-300 font-semibold">
                      <span>{filesList.length} {lang === 'bn' ? 'টি ফাইল প্রস্তুত' : 'files selected'}</span>
                      <span aria-hidden="true" className="mx-2 text-slate-600">·</span>
                      <span className="font-mono text-sky-400">{formatFileSize(totalSize)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>{lang === 'bn' ? 'আরো যোগ করুন' : 'Add more'}</span>
                    </button>
                  </div>

                  {/* File items list */}
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {filesList.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt="Thumbnail"
                              className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-sky-400 shrink-0">
                              {item.category === 'video' ? <Film size={20} /> : <FileText size={20} />}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {item.file.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {formatFileSize(item.file.size)} · {item.file.type || item.category}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                          aria-label="Remove file"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="quick-send-text" className="text-xs font-bold text-slate-200">
                  {t.quickText}
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {textInput.length} chars
                </span>
              </div>
              <textarea
                id="quick-send-text"
                rows={4}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t.quickTextPlaceholder}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono resize-none shadow-inner"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                {lang === 'bn'
                  ? 'এই লেখাটি সরাসরি টার্গেট ফোনের ক্লিপবোর্ডে কপি করার জন্য পাঠানো হবে।'
                  : 'This text will be instantly delivered for 1-tap clipboard copying.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/60 border-t border-white/5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={activeTab === 'files' ? filesList.length === 0 : !textInput.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-sky-600/30 active:scale-95 transition-all"
          >
            <span>{activeTab === 'files' ? t.sendFileBtn : t.sendTextBtn}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
