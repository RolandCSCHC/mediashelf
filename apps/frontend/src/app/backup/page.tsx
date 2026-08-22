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
import { ViewTip } from '@/components/view-tip';
import { useI18n } from '@/components/locale-provider';
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
  const { t } = useI18n();
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
      setExportError(
        err instanceof Error ? err.message : t('backup.exportFailed'),
      );
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
        throw new Error(t('backup.invalidJson'));
      }

      if (!isBackupPayload(parsed)) {
        throw new Error(
          t('backup.unsupportedFormat', { version: LIBRARY_BACKUP_VERSION }),
        );
      }

      const response = await importLibraryBackup(parsed);
      setImportResult(response);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : t('backup.importFailed'),
      );
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
          {t('backup.kicker')}
        </p>
        <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('backup.heading')}
        </h1>
        <ViewTip id="backup" />
      </div>

      <section className="ms-animate-fade-up ms-animate-delay-3 mt-10 space-y-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t('backup.export')}
        </h2>
        <p className="max-w-xl text-sm text-muted">{t('backup.exportBody')}</p>
        <Button
          type="button"
          onClick={() => void handleExport()}
          disabled={isExporting}
        >
          {isExporting ? t('backup.preparing') : t('backup.downloadJson')}
        </Button>
        {exportError ? (
          <p className="text-sm text-danger" role="alert">
            {exportError}
          </p>
        ) : null}
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t('backup.import')}
        </h2>
        <p className="max-w-xl text-sm text-muted">{t('backup.importBody')}</p>

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
            {isImporting ? t('backup.importing') : t('backup.chooseFile')}
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
            <p className="font-medium">{t('backup.complete')}</p>
            <ul className="mt-2 space-y-1 text-muted">
              <li>
                {t('backup.mediaSummary', {
                  imported: importResult.mediaImported,
                  skipped: importResult.mediaSkipped,
                })}
              </li>
              <li>
                {t('backup.listsSummary', {
                  created: importResult.listsCreated,
                  reused: importResult.listsReused,
                })}
              </li>
              <li>
                {t('backup.membershipsSummary', {
                  added: importResult.membershipsAdded,
                  skipped: importResult.membershipsSkipped,
                })}
              </li>
              {importResult.errorCount > 0 ? (
                <li className="text-danger">
                  {importResult.errorCount === 1
                    ? t('backup.errorCountOne', {
                        count: importResult.errorCount,
                      })
                    : t('backup.errorCountMany', {
                        count: importResult.errorCount,
                      })}
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
                {t('backup.openLibrary')}
              </Link>
            </p>
          </div>
        ) : null}
      </section>
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
