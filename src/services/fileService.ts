import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { VaultFile, FileStatus } from '../types';
import { categorizeFile, formatBytes } from '../utils/fileUtils';

const DEMO_FILES_KEY = 'welvault_demo_files_store';

export const INITIAL_SAMPLE_FILES: VaultFile[] = [
  {
    id: 'demo-f-1',
    userId: 'demo-user-welvault-101',
    name: 'Brand_Identity_Guidelines_v3.pdf',
    size: 2450000,
    sizeFormatted: '2.3 MB',
    type: 'application/pdf',
    category: 'document',
    status: 'approved',
    clientName: 'Starlight Retail',
    notes: 'Approved visual identity guide with color palettes, typography specs, and logo clear-space rules.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'demo-f-2',
    userId: 'demo-user-welvault-101',
    name: 'Homepage_Hero_Mockup_Retina.png',
    size: 1840000,
    sizeFormatted: '1.8 MB',
    type: 'image/png',
    category: 'image',
    status: 'in_review',
    clientName: 'Acme Corp',
    notes: 'Latest dark-mode hero banner mockup for client stakeholder review.',
    // A clean SVG dataUrl mockup for instant crisp preview
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230b1329"/><circle cx="400" cy="200" r="110" fill="%233b82f6" opacity="0.3"/><rect x="150" y="120" width="500" height="200" rx="16" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><text x="400" y="210" fill="%23ffffff" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle">Acme Corp - NextGen Portal</text><text x="400" y="250" fill="%2394a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">Design Mockup v2.4 (Retina)</text></svg>',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'demo-f-3',
    userId: 'demo-user-welvault-101',
    name: 'Mobile_App_Tokens_Design_System.fig',
    size: 4200000,
    sizeFormatted: '4.0 MB',
    type: 'application/octet-stream',
    category: 'design',
    status: 'delivered',
    clientName: 'Zenith Health',
    notes: 'Complete Figma design token export containing typography styles, color tokens, and spacing variables.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'demo-f-4',
    userId: 'demo-user-welvault-101',
    name: 'Marketing_Campaign_Assets_Q4.zip',
    size: 8900000,
    sizeFormatted: '8.5 MB',
    type: 'application/zip',
    category: 'archive',
    status: 'delivered',
    clientName: 'Acme Corp',
    notes: 'Compressed bundle of social media banners, newsletter headers, and print-ready vector files.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'demo-f-5',
    userId: 'demo-user-welvault-101',
    name: 'Product_Packaging_DieLine_Final.ai',
    size: 5120000,
    sizeFormatted: '4.9 MB',
    type: 'application/illustrator',
    category: 'design',
    status: 'draft',
    clientName: 'Starlight Retail',
    notes: 'Die-line vector artwork awaiting barcode verification before print approval.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

export function getLocalDemoFiles(): VaultFile[] {
  try {
    const raw = localStorage.getItem(DEMO_FILES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_FILES_KEY, JSON.stringify(INITIAL_SAMPLE_FILES));
      return INITIAL_SAMPLE_FILES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_FILES;
  }
}

export function saveLocalDemoFiles(files: VaultFile[]) {
  try {
    localStorage.setItem(DEMO_FILES_KEY, JSON.stringify(files));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

export async function uploadVaultFile(
  userId: string,
  isDemo: boolean,
  file: File,
  clientName: string,
  notes?: string,
  status: FileStatus = 'in_review',
  onProgress?: (percent: number) => void
): Promise<VaultFile> {
  onProgress?.(20);

  // Read file data URL for previews/download
  const dataUrl = await new Promise<string>((resolve) => {
    // For reasonably sized files (<2MB), convert to data URL so client can preview/download
    if (file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    } else {
      // Create a localized object URL for large files
      resolve(URL.createObjectURL(file));
    }
  });

  onProgress?.(60);

  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const category = categorizeFile(file.type, file.name);

  // Safe dataUrl for Firestore (Firestore document limit is 1MB; truncate if storing to Firestore)
  let firestoreDataUrl: string | undefined = undefined;
  if (dataUrl && dataUrl.startsWith('data:') && dataUrl.length < 750000) {
    firestoreDataUrl = dataUrl;
  }

  const newVaultFile: VaultFile = {
    id: fileId,
    userId,
    name: file.name,
    size: file.size,
    sizeFormatted: formatBytes(file.size),
    type: file.type || 'application/octet-stream',
    category,
    status,
    clientName: clientName.trim() || 'General Project',
    notes: notes?.trim() || '',
    dataUrl: isDemo ? dataUrl : firestoreDataUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  onProgress?.(85);

  if (isDemo) {
    const current = getLocalDemoFiles();
    const updated = [newVaultFile, ...current];
    saveLocalDemoFiles(updated);
    onProgress?.(100);
    return newVaultFile;
  }

  // Persist to Firestore
  const path = `users/${userId}/files/${fileId}`;
  try {
    const fileRef = doc(db, 'users', userId, 'files', fileId);
    await setDoc(fileRef, newVaultFile);
    onProgress?.(100);
    return newVaultFile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteVaultFile(
  userId: string,
  isDemo: boolean,
  fileId: string
): Promise<void> {
  if (isDemo) {
    const current = getLocalDemoFiles();
    const updated = current.filter((f) => f.id !== fileId);
    saveLocalDemoFiles(updated);
    return;
  }

  const path = `users/${userId}/files/${fileId}`;
  try {
    const fileRef = doc(db, 'users', userId, 'files', fileId);
    await deleteDoc(fileRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateVaultFileStatus(
  userId: string,
  isDemo: boolean,
  fileId: string,
  newStatus: FileStatus
): Promise<void> {
  if (isDemo) {
    const current = getLocalDemoFiles();
    const updated = current.map((f) =>
      f.id === fileId ? { ...f, status: newStatus, updatedAt: new Date().toISOString() } : f
    );
    saveLocalDemoFiles(updated);
    return;
  }

  const path = `users/${userId}/files/${fileId}`;
  try {
    const fileRef = doc(db, 'users', userId, 'files', fileId);
    await updateDoc(fileRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToVaultFiles(
  userId: string,
  isDemo: boolean,
  onFilesChanged: (files: VaultFile[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (isDemo) {
    const files = getLocalDemoFiles();
    onFilesChanged(files);
    // Listen for storage changes if multiple tabs
    const handler = (e: StorageEvent) => {
      if (e.key === DEMO_FILES_KEY) {
        onFilesChanged(getLocalDemoFiles());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  const path = `users/${userId}/files`;
  try {
    const filesCol = collection(db, 'users', userId, 'files');
    const q = query(filesCol);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const files: VaultFile[] = [];
        snapshot.forEach((docSnap) => {
          files.push(docSnap.data() as VaultFile);
        });
        // Sort newest first by default
        files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onFilesChanged(files);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (wrapped) {
          onError?.(wrapped as Error);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (wrapped) {
      onError?.(wrapped as Error);
    }
    return () => {};
  }
}
