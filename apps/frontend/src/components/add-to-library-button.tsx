'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MediaType } from '@mediashelf/shared-types';
import { importMedia } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/locale-provider';

type AddToLibraryButtonProps = {
  tmdbId: number;
  type: MediaType;
  alreadyInLibrary?: boolean;
  libraryItemId?: string | null;
  onImported?: (tmdbId: number, type: MediaType, mediaItemId: string) => void;
};

export function AddToLibraryButton({
  tmdbId,
  type,
  alreadyInLibrary = false,
  libraryItemId = null,
  onImported,
}: AddToLibraryButtonProps) {
  const { t } = useI18n();
  const [isImporting, setIsImporting] = useState(false);
  const [importedId, setImportedId] = useState<string | null>(libraryItemId);
  const [imported, setImported] = useState(alreadyInLibrary);
  const [error, setError] = useState<string | null>(null);
  const openHref = importedId ? `/library/${importedId}` : null;

  useEffect(() => {
    setImported(alreadyInLibrary);
    setImportedId(libraryItemId);
  }, [alreadyInLibrary, libraryItemId]);

  async function handleImport() {
    setIsImporting(true);
    setError(null);
    try {
      const item = await importMedia({ tmdbId, type });
      setImported(true);
      setImportedId(item.id);
      onImported?.(tmdbId, type, item.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('addToLibrary.importFailed'),
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {imported ? (
        <>
          <span className="text-sm font-medium text-accent">
            {t('addToLibrary.inLibrary')}
          </span>
          {openHref ? (
            <Link
              href={openHref}
              className="text-sm text-muted transition hover:text-foreground"
            >
              {t('addToLibrary.open')}
            </Link>
          ) : null}
        </>
      ) : (
        <Button
          type="button"
          size="sm"
          disabled={isImporting}
          onClick={() => void handleImport()}
        >
          {isImporting ? t('addToLibrary.importing') : t('addToLibrary.add')}
        </Button>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
