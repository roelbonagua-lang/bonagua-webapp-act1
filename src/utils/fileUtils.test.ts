import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  categorizeFile,
  filterAndSortFiles,
  calculateStorageMetrics,
} from './fileUtils';
import { VaultFile } from '../types';

test('formatBytes formats file sizes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(2621440), '2.5 MB');
  assert.equal(formatBytes(1073741824), '1 GB');
});

test('categorizeFile accurately detects categories from mime and extension', () => {
  assert.equal(categorizeFile('image/png', 'hero-mockup.png'), 'image');
  assert.equal(categorizeFile('application/pdf', 'Brand_Guidelines.pdf'), 'document');
  assert.equal(categorizeFile('application/zip', 'assets_bundle.zip'), 'archive');
  assert.equal(categorizeFile('application/octet-stream', 'interface.fig'), 'design');
  assert.equal(categorizeFile('image/vnd.adobe.photoshop', 'homepage.psd'), 'design');
  assert.equal(categorizeFile('text/plain', 'notes.txt'), 'document');
  assert.equal(categorizeFile('unknown/type', 'data.xyz'), 'other');
});

test('filterAndSortFiles filters by search query and category', () => {
  const sampleFiles: VaultFile[] = [
    {
      id: 'f1',
      userId: 'user1',
      name: 'Logo_Final.png',
      size: 500000,
      sizeFormatted: '500 KB',
      type: 'image/png',
      category: 'image',
      status: 'approved',
      clientName: 'Acme Corp',
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'f2',
      userId: 'user1',
      name: 'Contract_Signed.pdf',
      size: 1500000,
      sizeFormatted: '1.5 MB',
      type: 'application/pdf',
      category: 'document',
      status: 'delivered',
      clientName: 'Starlight Media',
      createdAt: '2026-02-15T12:00:00Z',
    },
    {
      id: 'f3',
      userId: 'user1',
      name: 'Banner_Mockup.png',
      size: 800000,
      sizeFormatted: '800 KB',
      type: 'image/png',
      category: 'image',
      status: 'in_review',
      clientName: 'Acme Corp',
      createdAt: '2026-02-20T14:00:00Z',
    },
  ];

  // Test search query
  const searched = filterAndSortFiles(sampleFiles, 'contract', 'all', 'all', 'date', 'desc');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, 'f2');

  // Test category filter
  const images = filterAndSortFiles(sampleFiles, '', 'image', 'all', 'date', 'desc');
  assert.equal(images.length, 2);

  // Test client filter
  const acmeOnly = filterAndSortFiles(sampleFiles, '', 'all', 'Acme Corp', 'date', 'desc');
  assert.equal(acmeOnly.length, 2);

  // Test sorting by size ascending
  const sortedBySize = filterAndSortFiles(sampleFiles, '', 'all', 'all', 'size', 'asc');
  assert.equal(sortedBySize[0].id, 'f1');
  assert.equal(sortedBySize[2].id, 'f2');
});

test('calculateStorageMetrics aggregates files and client count accurately', () => {
  const sampleFiles: VaultFile[] = [
    {
      id: 'f1',
      userId: 'user1',
      name: 'Asset1.png',
      size: 1048576, // 1 MB
      sizeFormatted: '1 MB',
      type: 'image/png',
      category: 'image',
      status: 'draft',
      clientName: 'Client Alpha',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'f2',
      userId: 'user1',
      name: 'Asset2.pdf',
      size: 3145728, // 3 MB
      sizeFormatted: '3 MB',
      type: 'application/pdf',
      category: 'document',
      status: 'approved',
      clientName: 'Client Beta',
      createdAt: '2026-01-02T00:00:00Z',
    },
  ];

  const metrics = calculateStorageMetrics(sampleFiles, 10 * 1024 * 1024); // 10MB quota
  assert.equal(metrics.totalFiles, 2);
  assert.equal(metrics.totalBytes, 4194304); // 4 MB
  assert.equal(metrics.clientCount, 2);
  assert.equal(metrics.percentageUsed, 40);
});
