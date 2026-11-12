import React from 'react';
import { Trash2 } from 'lucide-react';
import { VaultFile } from '../types';

interface DeleteModalProps {
  file: VaultFile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  file,
  isOpen,
  onClose,
  onConfirm,
  deleting,
}) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0e071e] rounded-2xl shadow-2xl border border-rose-500/50 max-w-md w-full overflow-hidden p-6 text-center text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-rose-950/80 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/50 shadow-lg shadow-rose-500/20">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="font-cyber text-2xl font-bold text-slate-100 uppercase tracking-wide">
          Purge File from Vault?
        </h3>
        <p className="text-sm text-slate-300 mt-2 font-mono">
          Permanently delete{' '}
          <span className="font-bold text-cyan-300 font-cyber text-base">"{file.name}"</span>?
        </p>
        <p className="text-xs text-rose-400 mt-1 font-mono">
          This operation is irreversible. File will be excised from all nodes.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-bold font-mono text-slate-300 bg-[#140a28] hover:bg-[#1f0f3d] border border-fuchsia-900/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 rounded-xl shadow-lg shadow-rose-600/30 border border-rose-400/40 transition-colors flex items-center gap-2"
          >
            {deleting ? 'Purging...' : 'Confirm Purge'}
          </button>
        </div>
      </div>
    </div>
  );
};
