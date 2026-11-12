import { VaultFile, FileCategory, StorageMetrics, SortField, SortOrder } from '../types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`;
}

export function categorizeFile(mimeType: string, filename: string): FileCategory {
  const mime = mimeType.toLowerCase();
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Check design and vector formats first
  if (
    ['fig', 'sketch', 'psd', 'ai', 'xd', 'eps', 'indd', 'blend'].includes(ext) ||
    mime.includes('photoshop') ||
    mime.includes('illustrator') ||
    mime.includes('figma')
  ) {
    return 'design';
  }

  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif', 'bmp', 'ico'].includes(ext)
  ) {
    return 'image';
  }

  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('text') ||
    mime.includes('csv') ||
    mime.includes('sheet') ||
    mime.includes('presentation') ||
    ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'xls', 'ppt', 'pptx'].includes(ext)
  ) {
    return 'document';
  }

  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('rar') ||
    mime.includes('7z') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'archive';
  }

  return 'other';
}

export function filterAndSortFiles(
  files: VaultFile[],
  query: string,
  category: string,
  clientFilter: string,
  sortBy: SortField,
  sortOrder: SortOrder
): VaultFile[] {
  const q = query.trim().toLowerCase();

  const filtered = files.filter((f) => {
    // Search query matches name or clientName or notes
    if (q) {
      const matchName = f.name.toLowerCase().includes(q);
      const matchClient = f.clientName ? f.clientName.toLowerCase().includes(q) : false;
      const matchNotes = f.notes ? f.notes.toLowerCase().includes(q) : false;
      if (!matchName && !matchClient && !matchNotes) return false;
    }

    // Category filter
    if (category !== 'all' && f.category !== category) {
      return false;
    }

    // Client filter
    if (clientFilter !== 'all' && f.clientName !== clientFilter) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    } else if (sortBy === 'size') {
      comparison = a.size - b.size;
    } else {
      // Date sort
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      comparison = dateA - dateB;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

export function calculateStorageMetrics(files: VaultFile[], quotaBytes = 50 * 1024 * 1024): StorageMetrics {
  const totalFiles = files.length;
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const formattedBytes = formatBytes(totalBytes);
  const percentageUsed = Math.min(100, Math.round((totalBytes / quotaBytes) * 100));

  const uniqueClients = new Set(
    files.map((f) => f.clientName?.trim()).filter((name): name is string => Boolean(name && name.length > 0))
  );

  return {
    totalFiles,
    totalBytes,
    formattedBytes,
    percentageUsed,
    clientCount: uniqueClients.size,
  };
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Recently';
  }
}
