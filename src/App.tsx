/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StorageStats } from './components/StorageStats';
import { FileList } from './components/FileList';
import { FileUploader } from './components/FileUploader';
import { FilePreviewModal } from './components/FilePreviewModal';
import { DeleteModal } from './components/DeleteModal';
import { VaultFile, ViewMode, SortField, SortOrder, FileStatus } from './types';
import {
  calculateStorageMetrics,
  filterAndSortFiles,
} from './utils/fileUtils';
import {
  subscribeToVaultFiles,
  uploadVaultFile,
  deleteVaultFile,
  updateVaultFileStatus,
} from './services/fileService';
import {
  ShieldCheck,
  FolderPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { currentUser, userProfile, isDemoUser } = useAuth();

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [deleteTargetFile, setDeleteTargetFile] = useState<VaultFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Subscribe to files
  useEffect(() => {
    if (!currentUser) return;

    setLoadingFiles(true);
    const unsubscribe = subscribeToVaultFiles(
      currentUser.uid,
      isDemoUser,
      (fetchedFiles) => {
        setFiles(fetchedFiles);
        setLoadingFiles(false);
      },
      (err) => {
        console.warn('Subscription warning:', err);
        setLoadingFiles(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isDemoUser]);

  // Extract unique clients
  const availableClients = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      if (f.clientName?.trim()) {
        set.add(f.clientName.trim());
      }
    });
    return Array.from(set).sort();
  }, [files]);

  // Tab-filtered files
  const tabFilteredFiles = useMemo(() => {
    if (currentTab === 'recent') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return files.filter((f) => new Date(f.createdAt).getTime() > sevenDaysAgo);
    }
    if (currentTab === 'approvals') {
      return files.filter((f) => f.status === 'in_review' || f.status === 'approved');
    }
    return files;
  }, [files, currentTab]);

  // Filter & sort files
  const displayFiles = useMemo(() => {
    return filterAndSortFiles(
      tabFilteredFiles,
      searchQuery,
      selectedCategory,
      clientFilter,
      sortBy,
      sortOrder
    );
  }, [tabFilteredFiles, searchQuery, selectedCategory, clientFilter, sortBy, sortOrder]);

  // Storage metrics
  const storageMetrics = useMemo(() => {
    return calculateStorageMetrics(files);
  }, [files]);

  // Handlers
  const handleUploadFile = async (
    file: File,
    clientName: string,
    notes: string,
    status: FileStatus,
    onProgress: (percent: number) => void
  ) => {
    if (!currentUser) return;
    try {
      const newFile = await uploadVaultFile(
        currentUser.uid,
        isDemoUser,
        file,
        clientName,
        notes,
        status,
        onProgress
      );
      if (isDemoUser) {
        setFiles((prev) => [newFile, ...prev.filter((f) => f.id !== newFile.id)]);
      }
      showToast(`Uploaded "${file.name}" to vault.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteTargetFile || !currentUser) return;
    setDeleting(true);
    try {
      await deleteVaultFile(currentUser.uid, isDemoUser, deleteTargetFile.id);
      if (isDemoUser) {
        setFiles((prev) => prev.filter((f) => f.id !== deleteTargetFile.id));
      }
      showToast(`Purged "${deleteTargetFile.name}" from vault.`);
      setDeleteTargetFile(null);
      if (previewFile?.id === deleteTargetFile.id) {
        setPreviewFile(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (fileId: string, newStatus: FileStatus) => {
    if (!currentUser) return;
    try {
      await updateVaultFileStatus(currentUser.uid, isDemoUser, fileId, newStatus);
      if (isDemoUser) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: newStatus } : f))
        );
      }
      if (previewFile && previewFile.id === fileId) {
        setPreviewFile({ ...previewFile, status: newStatus });
      }
      showToast(`Status updated to ${newStatus.replace('_', ' ')}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      showToast(msg, 'error');
    }
  };

  const handleDownloadFile = (file: VaultFile) => {
    try {
      if (file.dataUrl && file.dataUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Downloading "${file.name}"...`);
      } else {
        const blob = new Blob(
          [`WelVault Cyberpunk Asset Delivery Node\nFile: ${file.name}\nSize: ${file.sizeFormatted}\nClient: ${file.clientName}\nStatus: ${file.status}\nUploaded: ${file.createdAt}\nNotes: ${file.notes || 'None'}\n`],
          { type: 'text/plain;charset=utf-8' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name.endsWith('.txt') ? file.name : `${file.name}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Downloaded security certificate for "${file.name}".`);
      }
    } catch (err) {
      showToast('Could not initiate file download.', 'error');
    }
  };

  return (
    <div className="min-h-screen cyber-grid text-slate-200 flex">
      {/* Cyberpunk & Vaporwave Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'clients') {
            if (availableClients.length > 0 && clientFilter === 'all') {
              setClientFilter(availableClients[0]);
            }
          } else {
            setClientFilter('all');
          }
        }}
        metrics={storageMetrics}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          clientFilter={clientFilter}
          onClientFilterChange={setClientFilter}
          availableClients={availableClients}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(f, o) => {
            setSortBy(f);
            setSortOrder(o);
          }}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {/* Toast alert */}
          {toastMessage && (
            <div
              className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-mono font-bold animate-fade-in ${
                toastMessage.type === 'success'
                  ? 'bg-[#0f071f] text-cyan-300 border-cyan-400 shadow-cyan-500/20'
                  : 'bg-rose-950 text-rose-300 border-rose-500 shadow-rose-500/20'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-cyan-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* Page Greeting & Quick Action Banner */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cyber-card p-5 sm:p-6 rounded-2xl border border-fuchsia-900/40 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-cyber text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-pink-400 tracking-wider uppercase">
                  {currentTab === 'recent'
                    ? 'Recent Deliverables'
                    : currentTab === 'clients'
                    ? `Client Sectors: ${clientFilter === 'all' ? 'All Clients' : clientFilter}`
                    : currentTab === 'approvals'
                    ? 'Client Approvals & Reviews'
                    : 'Client Portal Vault'}
                </h1>
                {currentTab !== 'all' && (
                  <button
                    onClick={() => {
                      setCurrentTab('all');
                      setClientFilter('all');
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-bold underline underline-offset-2 ml-2"
                  >
                    View All
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                Welcome, <span className="text-cyan-300 font-semibold">{userProfile?.displayName || 'User'}</span>. Deliver design assets, feedback telemetry, and invoices through encrypted channels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 hover:from-cyan-300 hover:to-pink-400 text-slate-950 font-cyber text-base font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/25 border border-cyan-300/40 transition-transform active:scale-95"
              >
                <FolderPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Upload Payload</span>
              </button>
            </div>
          </div>

          {/* Storage stats overview */}
          <StorageStats
            metrics={storageMetrics}
            files={files}
            onFilterStatus={(s) => {
              setCurrentTab('approvals');
            }}
          />

          {/* Files section */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-cyber text-base font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <span className="text-cyan-400">Vault Payloads</span>
              <span className="text-xs font-mono font-semibold text-fuchsia-400">
                ({displayFiles.length} of {files.length})
              </span>
            </h2>

            {searchQuery && (
              <span className="text-xs text-slate-400 font-mono">
                Telemetry search: <strong className="text-cyan-300">"{searchQuery}"</strong>
              </span>
            )}
          </div>

          {loadingFiles ? (
            <div className="p-16 text-center cyber-card rounded-2xl border border-fuchsia-900/40">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-mono">Decrypting file telemetry...</p>
            </div>
          ) : (
            <FileList
              files={displayFiles}
              viewMode={viewMode}
              onPreview={(f) => setPreviewFile(f)}
              onDownload={handleDownloadFile}
              onDelete={(f) => setDeleteTargetFile(f)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <FileUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        existingClients={availableClients}
        onUpload={handleUploadFile}
      />

      {/* File Preview & Details Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
        onDelete={(f) => setDeleteTargetFile(f)}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        file={deleteTargetFile}
        isOpen={Boolean(deleteTargetFile)}
        onClose={() => setDeleteTargetFile(null)}
        onConfirm={handleDeleteFile}
        deleting={deleting}
      />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { currentUser, loading, signInWithDemo } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !currentUser && !loading) {
      signInWithDemo('freelancer');
    }
  }, [currentUser, loading, signInWithDemo]);

  if (loading) {
    return (
      <div className="min-h-screen cyber-grid bg-[#07040d] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-pink-500 p-0.5 shadow-2xl shadow-cyan-500/30 mb-4 animate-pulse">
          <div className="w-full h-full bg-[#090414] rounded-[14px] flex items-center justify-center text-cyan-300">
            <ShieldCheck className="w-9 h-9 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.7)]" />
          </div>
        </div>
        <h2 className="font-cyber text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-pink-400 uppercase">
          WelVault
        </h2>
        <p className="text-xs text-fuchsia-300 mt-1 font-mono flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          Connecting to encrypted node...
        </p>
      </div>
    );
  }

  return currentUser ? <DashboardContent /> : <AuthPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
