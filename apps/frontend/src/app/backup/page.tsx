'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type {
  LibraryBackupImportResponse,
  LibraryBackupPayload,
} from '@mediashelf/shared-types';
import { LIBRARY_BACKUP_VERSION } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { exportLibraryBackup, importLibraryBackup } from '@/lib/api';

function downloadJson(filename: string, payload: LibraryBackupPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isBackupPayload(value: unknown): value is LibraryBackupPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    record.version === LIBRARY_BACKUP_VERSION &&
    Array.isArray(record.media) &&
    Array.isArray(record.lists)
  );
}

function BackupContent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] =
    useState<LibraryBackupImportResponse | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setExportError(null);

    try {
      const payload = await exportLibraryBackup();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(`mediashelf-backup-${stamp}.json`, payload);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportFile(file: File) {
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    setSelectedFileName(file.name);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        throw new Error('File is not valid JSON');
      }

      if (!isBackupPayload(parsed)) {
        throw new Error(
          `Unsupported backup format (expected version ${LIBRARY_BACKUP_VERSION})`,
        );
      }

      const response = await importLibraryBackup(parsed);
      setImportResult(response);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <AppShell>
      <div>
        <p className="ms-animate-fade-up mb-2 text-sm uppercase tracking-[0.2em] text-muted">
          Backup
        </p>
        <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Export &amp; import
        </h1>
        <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 max-w-xl text-muted">
          Download your library and lists as JSON, or merge a backup into this
          account. TMDB titles keep their IDs, so ambiguous names stay exact.
        </p>
      </div>

      <section className="ms-animate-fade-up ms-animate-delay-3 mt-10 space-y-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Export
        </h2>
        <p className="max-w-xl text-sm text-muted">
          Includes every media item (status, notes, posters), custom lists, and
          per-list series progress.
        </p>
        <Button
          type="button"
          onClick={() => void handleExport()}
          disabled={isExporting}
        >
          {isExporting ? 'Preparing…' : 'Download JSON'}
        </Button>
        {exportError ? (
          <p className="text-sm text-danger" role="alert">
            {exportError}
          </p>
        ) : null}
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Import (merge)
        </h2>
        <p className="max-w-xl text-sm text-muted">
          Existing titles are skipped (TMDB by ID, manuals by title). Missing
          lists and memberships are added. Existing series progress is left
          alone.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleImportFile(file);
            }
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
          >
            {isImporting ? 'Importing…' : 'Choose JSON file'}
          </Button>
          {selectedFileName ? (
            <span className="text-sm text-muted">{selectedFileName}</span>
          ) : null}
        </div>

        {importError ? (
          <p className="text-sm text-danger" role="alert">
            {importError}
          </p>
        ) : null}

        {importResult ? (
          <div className="rounded-lg border border-border bg-surface/60 px-4 py-4 text-sm text-foreground">
            <p className="font-medium">Import complete</p>
            <ul className="mt-2 space-y-1 text-muted">
              <li>
                Media: {importResult.mediaImported} added,{' '}
                {importResult.mediaSkipped} skipped
              </li>
              <li>
                Lists: {importResult.listsCreated} created,{' '}
                {importResult.listsReused} reused
              </li>
              <li>
                Memberships: {importResult.membershipsAdded} added,{' '}
                {importResult.membershipsSkipped} skipped
              </li>
              {importResult.errorCount > 0 ? (
                <li className="text-danger">
                  {importResult.errorCount} error
                  {importResult.errorCount === 1 ? '' : 's'}
                </li>
              ) : null}
            </ul>
            {importResult.errors.length > 0 ? (
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-danger">
                {importResult.errors.slice(0, 20).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3">
              <Link
                href="/library"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                Open library
              </Link>
            </p>
          </div>
        ) : null}
      </section>

      <p className="mt-12 text-sm text-muted">
        Looking for the old text import?{' '}
        <Link href="/import" className="text-accent hover:underline">
          Use .txt import
        </Link>
      </p>
    </AppShell>
  );
}

export default function BackupPage() {
  return (
    <AuthGuard>
      <BackupContent />
    </AuthGuard>
  );
}
