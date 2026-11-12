import React from 'react';
import {
  X,
  Download,
  Trash2,
  Calendar,
  HardDrive,
  User,
  FileText,
  FileImage,
  Layers,
  Archive,
  File,
} from 'lucide-react';
import { VaultFile, FileStatus } from '../types';
import { formatDate } from '../utils/fileUtils';

interface FilePreviewModalProps {
  file: VaultFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: VaultFile) => void;
  onDelete: (file: VaultFile) => void;
  onStatusChange: (fileId: string, status: FileStatus) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onDelete,
  onStatusChange,
}) => {
  if (!isOpen || !file) return null;

  const isImage = file.category === 'image' && Boolean(file.dataUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#0e071e] rounded-2xl shadow-2xl border border-fuchsia-500/40 max-w-2xl w-full overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fuchsia-950 flex items-center justify-between bg-[#080312]">
          <div className="min-w-0 pr-4">
            <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest font-mono">
              Payload Telemetry & Preview
            </span>
            <h2 className="font-cyber text-xl font-bold text-slate-100 truncate tracking-wide" title={file.name}>
              {file.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-[#1a0c36] transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Visual Preview */}
          {isImage ? (
            <div className="rounded-2xl overflow-hidden bg-[#070310] border border-cyan-500/30 flex items-center justify-center max-h-80 shadow-inner">
              <img
                src={file.dataUrl}
                alt={file.name}
                className="max-h-80 w-auto object-contain mx-auto"
              />
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#120826] border border-fuchsia-900/40 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1a0a38] shadow-md border border-fuchsia-700/50 flex items-center justify-center text-slate-300 mb-3">
                {file.category === 'document' ? (
                  <FileText className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                ) : file.category === 'design' ? (
                  <Layers className="w-8 h-8 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
                ) : file.category === 'archive' ? (
                  <Archive className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                ) : (
                  <File className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                )}
              </div>
              <p className="font-cyber text-lg font-bold text-slate-100">{file.name}</p>
              <p className="text-xs text-fuchsia-400 mt-1 uppercase font-mono">{file.type}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#120826] border border-fuchsia-950">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-fuchsia-400" /> Byte Size
              </span>
              <p className="text-sm font-bold text-fuchsia-300 mt-1 font-mono">
                {file.sizeFormatted}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#120826] border border-fuchsia-950">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Upload Time
              </span>
              <p className="text-sm font-semibold text-slate-200 mt-1 font-mono">
                {formatDate(file.createdAt)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#120826] border border-fuchsia-950 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Client Sector
              </span>
              <p className="text-sm font-semibold text-cyan-300 mt-1 truncate font-mono">
                {file.clientName || 'General Project'}
              </p>
            </div>
          </div>

          {/* Status Switcher */}
          <div className="p-4 rounded-2xl bg-[#120826] border border-fuchsia-900/40">
            <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono mb-2.5">
              Update Client Review Status Channel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['draft', 'in_review', 'approved', 'delivered'] as FileStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(file.id, s)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider font-mono border transition-all text-center ${
                    file.status === s
                      ? 'bg-gradient-to-r from-cyan-950 to-fuchsia-950 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-[#0a0416] text-slate-400 border-fuchsia-950 hover:border-fuchsia-800'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {file.notes && (
            <div className="p-4 rounded-2xl bg-[#120826] border border-fuchsia-900/40">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono block mb-1">
                Client Notes & Instructions
              </span>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono">
                {file.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-fuchsia-950 bg-[#080312] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onDelete(file);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge File</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold font-mono text-slate-400 hover:text-white hover:bg-[#180a32] transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-slate-950 font-cyber text-base font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/25 border border-cyan-300/40 transition-all hover:from-cyan-400 hover:to-fuchsia-500"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
