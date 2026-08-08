import { ConflictException, Injectable, Logger } from '@nestjs/common';
import type {
  ImportConfirmResponse,
  ImportConfirmResultItem,
  ImportMatchConfidence,
  ImportPreviewItem,
  ImportPreviewResponse,
  TmdbSearchResult,
} from '@mediashelf/shared-types';
import { MediaType } from '@mediashelf/shared-types';
import { MediaService } from '../media/media.service';
import { TmdbService } from '../tmdb/tmdb.service';
import type { ImportConfirmEntryDto } from './dto/import.dto';
import { parseLibraryTxt, scoreTitleMatch } from './library-txt.parser';

const CANDIDATE_LIMIT = 5;
const SEARCH_CONCURRENCY = 4;

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly tmdbService: TmdbService,
    private readonly mediaService: MediaService,
  ) {}

  async preview(userId: string, text: string): Promise<ImportPreviewResponse> {
    const { items: parsed, skippedEmptyLines } = parseLibraryTxt(text);
    const library = await this.mediaService.listForUser(userId);
    const libraryKeys = new Set(
      library.map((item) => `${item.type}:${item.tmdbId}`),
    );

    const matched = await mapWithConcurrency(
      parsed,
      SEARCH_CONCURRENCY,
      async (entry, index): Promise<ImportPreviewItem> => {
        const searchType = entry.type === MediaType.MOVIE ? 'MOVIE' : 'SERIES';
        let candidates: TmdbSearchResult[] = [];

        try {
          candidates = (
            await this.tmdbService.search(entry.searchQuery, searchType)
          ).slice(0, CANDIDATE_LIMIT);
        } catch (error) {
          this.logger.warn(
            `TMDB search failed for "${entry.searchQuery}"`,
            error instanceof Error ? error.message : error,
          );
        }

        const selected = candidates[0] ?? null;
        const confidence = this.resolveConfidence(
          entry.searchQuery,
          selected,
          candidates,
        );
        const alreadyInLibrary = selected
          ? libraryKeys.has(`${selected.type}:${selected.tmdbId}`)
          : false;

        return {
          key: `${index}-${entry.lineNumber}`,
          lineNumber: entry.lineNumber,
          rawLine: entry.rawLine,
          searchQuery: entry.searchQuery,
          type: entry.type,
          status: entry.status,
          downloaded: entry.downloaded,
          notes: entry.notes,
          confidence,
          selected,
          candidates,
          alreadyInLibrary,
        };
      },
    );

    return { items: matched, skippedEmptyLines };
  }

  async confirm(
    userId: string,
    items: ImportConfirmEntryDto[],
  ): Promise<ImportConfirmResponse> {
    const results: ImportConfirmResultItem[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Sequential to avoid hammering TMDB details + DB writes.
    for (const item of items) {
      const notes =
        item.notes === undefined
          ? null
          : item.notes === null
            ? null
            : item.notes.trim() || null;

      try {
        const mediaItem = await this.mediaService.importFromTmdb(
          userId,
          item.tmdbId,
          item.type,
          {
            status: item.status,
            downloaded: item.downloaded,
            notes,
          },
        );

        importedCount += 1;
        results.push({
          tmdbId: item.tmdbId,
          type: item.type,
          status: 'imported',
          mediaItem,
        });
      } catch (error) {
        if (error instanceof ConflictException) {
          skippedCount += 1;
          results.push({
            tmdbId: item.tmdbId,
            type: item.type,
            status: 'skipped_existing',
            error: 'This title is already in your library',
          });
          continue;
        }

        errorCount += 1;
        results.push({
          tmdbId: item.tmdbId,
          type: item.type,
          status: 'error',
          error: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }

    return { results, importedCount, skippedCount, errorCount };
  }

  private resolveConfidence(
    searchQuery: string,
    selected: TmdbSearchResult | null,
    candidates: TmdbSearchResult[],
  ): ImportMatchConfidence {
    if (!selected) {
      return 'none';
    }

    const topScore = scoreTitleMatch(searchQuery, selected.title);
    if (topScore === 'high') {
      return 'high';
    }

    if (candidates.length === 1 && topScore === 'medium') {
      return 'medium';
    }

    if (topScore === 'medium') {
      const second = candidates[1];
      if (!second) {
        return 'medium';
      }
      const secondScore = scoreTitleMatch(searchQuery, second.title);
      // Ambiguous when the runner-up is also a decent match.
      if (secondScore === 'high' || secondScore === 'medium') {
        return 'low';
      }
      return 'medium';
    }

    return 'low';
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current] as T, current);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
