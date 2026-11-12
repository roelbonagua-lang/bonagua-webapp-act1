export type FileCategory = 'document' | 'image' | 'design' | 'archive' | 'other';
export type FileStatus = 'draft' | 'in_review' | 'approved' | 'delivered';

export interface VaultFile {
  id: string;
  userId: string;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  category: FileCategory;
  status: FileStatus;
  clientName?: string;
  notes?: string;
  dataUrl?: string; // base64 or blob URL for direct preview & download
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'freelancer' | 'client';
  company?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StorageMetrics {
  totalFiles: number;
  totalBytes: number;
  formattedBytes: string;
  percentageUsed: number;
  clientCount: number;
}

export type ViewMode = 'table' | 'grid';
export type SortField = 'date' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';
