import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { FileStatus } from '../types';
import { formatBytes } from '../utils/fileUtils';

interface FileUploaderProps {
  onUpload: (
    file: File,
    clientName: string,
    notes: string,
    status: FileStatus,
    onProgress: (percent: number) => void
  ) => Promise<void>;
  existingClients: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  existingClients,
  isOpen,
  onClose,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState(existingClients[0] || 'Acme Corp');
  const [customClient, setCustomClient] = useState('');
  const [isCustomClient, setIsCustomClient] = useState(false);
  const [status, setStatus] = useState<FileStatus>('in_review');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMessage(null);
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Payload exceeds 25 MB node bandwidth limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    const finalClient = isCustomClient ? customClient.trim() : clientName.trim();
    if (!finalClient) {
      setErrorMessage('Please specify target client sector.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);

    try {
      await onUpload(selectedFile, finalClient, notes, status, (p) => setUploadProgress(p));
      setSelectedFile(null);
      setNotes('');
      setUploading(false);
      onClose();
    } catch (err: unknown) {
      setUploading(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Transmission failed. Verify node status.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#0e071e] rounded-2xl shadow-2xl border border-fuchsia-500/40 max-w-lg w-full overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-fuchsia-950 flex items-center justify-between bg-[#080312]">
          <div>
            <h2 className="font-cyber text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-400 tracking-wide uppercase">
              Upload Client Payload
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Assets are encrypted and isolated in client vault storage.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-[#1a0c36] transition-colors"
            aria-label="Close upload modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Drag & drop dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-950/30'
                : 'border-fuchsia-900/60 bg-[#120826] hover:border-cyan-400/70 hover:bg-[#150a2e]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-cyber text-base font-bold text-slate-100 truncate max-w-xs tracking-wide">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-cyan-300 font-mono">
                    {formatBytes(selectedFile.size)} • Click to switch file
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1a0a38] text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
                  <UploadCloud className="w-6 h-6 stroke-[2]" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  <span className="text-cyan-400 font-bold underline decoration-cyan-500/50 underline-offset-2">
                    Click to browse
                  </span>{' '}
                  or drag and drop payload here
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Images, PDFs, Vector Designs (PSD, AI, Figma), Documents, & ZIPs (up to 25 MB)
                </p>
              </div>
            )}
          </div>

          {/* Client Selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono">
              Target Client Sector
            </label>
            {!isCustomClient && existingClients.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-[#140a2c] border border-fuchsia-900/60 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 font-mono"
                >
                  {existingClients.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomClient(true)}
                  className="px-3.5 py-2 text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl transition-colors whitespace-nowrap font-mono"
                >
                  + New Client
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customClient}
                  onChange={(e) => setCustomClient(e.target.value)}
                  placeholder="Enter client sector name (e.g. Neo Tokyo Arts)"
                  className="flex-1 px-3 py-2 text-sm bg-[#140a2c] border border-fuchsia-900/60 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 font-mono"
                />
                {existingClients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomClient(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-300 bg-[#140a28] hover:bg-[#1f0f3d] border border-fuchsia-900/50 rounded-xl transition-colors font-mono"
                  >
                    Select Existing
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono">
              Review Status Channel
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'draft', label: 'Draft', color: 'border-purple-500/40' },
                { id: 'in_review', label: 'In Review', color: 'border-amber-500/40' },
                { id: 'approved', label: 'Approved', color: 'border-emerald-500/40' },
                { id: 'delivered', label: 'Delivered', color: 'border-cyan-500/40' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as FileStatus)}
                  className={`py-1.5 text-xs font-semibold rounded-xl border text-center transition-all font-mono ${
                    status === s.id
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-950 to-fuchsia-950 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'border-fuchsia-950 bg-[#120826] text-slate-400 hover:border-fuchsia-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client Notes / Instructions */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono">
              Instructions & Version Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add revision specs, color codes, or feedback guidelines..."
              rows={2}
              className="w-full px-3 py-2 text-sm bg-[#140a2c] border border-fuchsia-900/60 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 font-mono placeholder-slate-500"
            />
          </div>

          {/* Progress bar when uploading */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-cyan-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Encrypting and deploying payload...
                </span>
                <span className="font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#180a32] h-2 rounded-full overflow-hidden border border-fuchsia-950">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,240,255,0.7)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-fuchsia-950">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-[#180a32] rounded-xl transition-colors font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-5 py-2 text-sm font-cyber font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 hover:from-cyan-300 hover:to-pink-400 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 transition-all flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <span>Confirm & Upload</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
