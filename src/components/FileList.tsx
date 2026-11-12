import React from 'react';
import {
  FileText,
  FileImage,
  Layers,
  Archive,
  File,
  Eye,
  Download,
  Trash2,
  User,
  FolderOpen,
} from 'lucide-react';
import { VaultFile, ViewMode, FileStatus } from '../types';
import { formatDate } from '../utils/fileUtils';

interface FileListProps {
  files: VaultFile[];
  viewMode: ViewMode;
  onPreview: (file: VaultFile) => void;
  onDownload: (file: VaultFile) => void;
  onDelete: (file: VaultFile) => void;
  onOpenUpload: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  viewMode,
  onPreview,
  onDownload,
  onDelete,
  onOpenUpload,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <FileImage className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]" />;
      case 'document':
        return <FileText className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />;
      case 'design':
        return <Layers className="w-4 h-4 text-fuchsia-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: FileStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-xs shadow-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            Approved
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-xs shadow-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]" />
            In Review
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-xs shadow-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
            Delivered
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-purple-950/80 text-purple-300 border border-purple-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Draft
          </span>
        );
    }
  };

  if (files.length === 0) {
    return (
      <div className="cyber-card rounded-2xl border border-dashed border-fuchsia-800/50 p-12 text-center my-4">
        <div className="w-14 h-14 rounded-2xl bg-[#140a28] text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
          <FolderOpen className="w-7 h-7" />
        </div>
        <h3 className="font-cyber text-lg font-bold text-slate-100 tracking-wider">No files detected in node</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-5">
          Deploy and organize deliverables, telemetry, and design assets for your clients.
        </p>
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-slate-950 font-cyber text-base font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/25 border border-cyan-300/40 transition-transform active:scale-95"
        >
          Upload First File
        </button>
      </div>
    );
  }

  // Table View
  if (viewMode === 'table') {
    return (
      <div className="cyber-card rounded-2xl overflow-hidden border border-fuchsia-900/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0b0518] border-b border-fuchsia-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                <th scope="col" className="py-3.5 pl-6 pr-3">File Descriptor</th>
                <th scope="col" className="py-3.5 px-3">Client Sector</th>
                <th scope="col" className="py-3.5 px-3">Payload Size</th>
                <th scope="col" className="py-3.5 px-3">Timestamp</th>
                <th scope="col" className="py-3.5 px-3">Review Status</th>
                <th scope="col" className="py-3.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fuchsia-950/70 text-sm">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-cyan-950/20 transition-colors group"
                >
                  {/* File Name */}
                  <td className="py-3.5 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#140a28] flex items-center justify-center shrink-0 border border-fuchsia-900/60 shadow-xs">
                        {getCategoryIcon(file.category)}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => onPreview(file)}
                          className="font-cyber text-base font-bold text-slate-100 hover:text-cyan-300 text-left truncate block max-w-xs md:max-w-md transition-colors tracking-wide"
                          title={file.name}
                        >
                          {file.name}
                        </button>
                        {file.notes && (
                          <p className="text-xs text-slate-400 truncate max-w-xs font-mono">
                            {file.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium font-mono text-cyan-300 bg-[#160a2c] border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                      <User className="w-3 h-3 text-cyan-400" />
                      {file.clientName || 'General'}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-xs font-mono text-fuchsia-300 font-semibold">
                    {file.sizeFormatted}
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                    {formatDate(file.createdAt)}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getStatusBadge(file.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pl-3 pr-6 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/60 border border-transparent hover:border-cyan-500/40 transition-all"
                        title="View details & preview"
                        aria-label={`Preview ${file.name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownload(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-transparent hover:border-emerald-500/40 transition-all"
                        title="Download file"
                        aria-label={`Download ${file.name}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-500/40 transition-all"
                        title="Delete file"
                        aria-label={`Delete ${file.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="cyber-card rounded-2xl hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/10 transition-all p-4.5 flex flex-col justify-between group"
        >
          <div>
            {/* Top row: Category icon & Status badge */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#140a28] border border-fuchsia-900/60 flex items-center justify-center shadow-xs">
                {getCategoryIcon(file.category)}
              </div>
              {getStatusBadge(file.status)}
            </div>

            {/* Thumbnail preview if image */}
            {file.category === 'image' && file.dataUrl ? (
              <div
                onClick={() => onPreview(file)}
                className="w-full h-32 rounded-xl bg-[#090414] mb-3 overflow-hidden cursor-pointer flex items-center justify-center border border-fuchsia-900/40 group-hover:border-cyan-500/40 transition-colors"
              >
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : null}

            {/* File Name */}
            <button
              onClick={() => onPreview(file)}
              className="text-left font-cyber text-lg font-bold text-slate-100 hover:text-cyan-300 truncate block w-full mb-1 transition-colors tracking-wide"
              title={file.name}
            >
              {file.name}
            </button>

            {/* Client tag */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-mono">
              <User className="w-3 h-3 text-cyan-400" />
              <span className="truncate text-cyan-300">{file.clientName || 'General Project'}</span>
            </div>
          </div>

          {/* Footer metadata & actions */}
          <div className="pt-3 border-t border-fuchsia-950/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-fuchsia-300 font-bold">{file.sizeFormatted}</span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPreview(file)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/60 transition-colors"
                title="Preview"
                aria-label={`Preview ${file.name}`}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDownload(file)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 transition-colors"
                title="Download"
                aria-label={`Download ${file.name}`}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(file)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 transition-colors"
                title="Delete"
                aria-label={`Delete ${file.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
