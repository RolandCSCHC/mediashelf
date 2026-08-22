import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type {
  LibraryBackupImportRequest,
  LibraryBackupImportResponse,
  LibraryBackupPayload,
  MediaType,
} from '@mediashelf/shared-types';
import {
  LIBRARY_BACKUP_VERSION,
  MediaStatus,
  MediaType as MediaTypeEnum,
} from '@mediashelf/shared-types';
import { ListsService } from '../lists/lists.service';
import { MediaService } from '../media/media.service';

type ResolvedMedia = {
  id: string;
  type: MediaType;
  status: MediaStatus;
  downloaded: boolean;
};

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly listsService: ListsService,
  ) {}

  async exportForUser(userId: string): Promise<LibraryBackupPayload> {
    const [media, lists] = await Promise.all([
      this.mediaService.listForUser(userId),
      this.listsService.listDetailsForUser(userId),
    ]);

    return {
      version: LIBRARY_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      media: media.map((item) => ({
        ref: item.id,
        tmdbId: item.tmdbId,
        type: item.type,
        title: item.title,
        description: item.description,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        releaseDate: item.releaseDate,
        lastAirDate: item.lastAirDate,
        genres: item.genres,
        runtime: item.runtime,
        status: item.status,
        downloaded: item.downloaded,
        notes: item.notes,
        dateWatched: item.dateWatched,
      })),
      lists: lists.map((list) => ({
        name: list.name,
        description: list.description,
        defaultStatus: list.defaultStatus,
        defaultDownloaded: list.defaultDownloaded,
        items: list.items.map((entry) => ({
          mediaRef: entry.mediaItemId,
          status: entry.status,
          downloaded: entry.downloaded,
          currentSeason: entry.currentSeason,
          currentEpisode: entry.currentEpisode,
        })),
      })),
    };
  }

  async importForUser(
    userId: string,
    payload: LibraryBackupImportRequest,
  ): Promise<LibraryBackupImportResponse> {
    this.assertValidPayload(payload);

    const result: LibraryBackupImportResponse = {
      mediaImported: 0,
      mediaSkipped: 0,
      listsCreated: 0,
      listsReused: 0,
      membershipsAdded: 0,
      membershipsSkipped: 0,
      errorCount: 0,
      errors: [],
    };

    const refToMedia = new Map<string, ResolvedMedia>();

    for (const item of payload.media) {
      try {
        let existing = null;

        if (item.tmdbId !== null) {
          existing = await this.mediaService.findByTmdbForUser(
            userId,
            item.tmdbId,
            item.type,
          );
        } else {
          existing = await this.mediaService.findManualByTitleForUser(
            userId,
            item.title.trim(),
            item.type,
          );
        }

        if (existing) {
          refToMedia.set(item.ref, {
            id: existing.id,
            type: existing.type,
            status: item.status,
            downloaded: item.downloaded,
          });
          result.mediaSkipped += 1;
          continue;
        }

        const created = await this.mediaService.createFromSnapshot(userId, {
          tmdbId: item.tmdbId,
          type: item.type,
          title: item.title,
          description: item.description,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          releaseDate: item.releaseDate,
          lastAirDate: item.lastAirDate ?? null,
          genres: item.genres,
          runtime: item.runtime,
          status: item.status,
          downloaded: item.downloaded,
          notes: item.notes,
          dateWatched: item.dateWatched,
        });

        refToMedia.set(item.ref, {
          id: created.id,
          type: created.type,
          status: item.status,
          downloaded: item.downloaded,
        });
        result.mediaImported += 1;
      } catch (error) {
        result.errorCount += 1;
        result.errors.push(
          `Media "${item.title}": ${
            error instanceof Error ? error.message : 'import failed'
          }`,
        );
        this.logger.warn(
          `Failed to import media ref=${item.ref}`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    const existingLists = await this.listsService.listForUser(userId);
    const existingListNames = new Set(existingLists.map((list) => list.name));

    for (const list of payload.lists) {
      try {
        const name = list.name.trim();
        const existed = existingListNames.has(name);

        const ensured = await this.listsService.ensureByName(userId, name, {
          description: list.description,
          defaultStatus: list.defaultStatus,
          defaultDownloaded: list.defaultDownloaded,
        });

        if (existed) {
          result.listsReused += 1;
        } else {
          result.listsCreated += 1;
          existingListNames.add(name);
        }

        for (const entry of list.items) {
          const resolved = refToMedia.get(entry.mediaRef);
          if (!resolved) {
            result.errorCount += 1;
            result.errors.push(
              `List "${name}": unknown mediaRef "${entry.mediaRef}"`,
            );
            continue;
          }

          const membership = {
            status: entry.status ?? resolved.status,
            downloaded: entry.downloaded ?? resolved.downloaded,
            ...(resolved.type === MediaTypeEnum.SERIES
              ? {
                  currentSeason: entry.currentSeason,
                  currentEpisode: entry.currentEpisode,
                }
              : {}),
          };

          const outcome = await this.listsService.addItemIfMissing(
            userId,
            ensured.id,
            resolved.id,
            membership,
          );

          if (outcome === 'added') {
            result.membershipsAdded += 1;
          } else {
            result.membershipsSkipped += 1;
          }
        }
      } catch (error) {
        result.errorCount += 1;
        result.errors.push(
          `List "${list.name}": ${
            error instanceof Error ? error.message : 'import failed'
          }`,
        );
        this.logger.warn(
          `Failed to import list "${list.name}"`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    return result;
  }

  private assertValidPayload(payload: LibraryBackupImportRequest): void {
    if (payload.version !== LIBRARY_BACKUP_VERSION) {
      throw new BadRequestException(
        `Unsupported backup version ${String(payload.version)}`,
      );
    }

    const refs = new Set<string>();
    for (const item of payload.media) {
      if (refs.has(item.ref)) {
        throw new BadRequestException(`Duplicate media ref "${item.ref}"`);
      }
      refs.add(item.ref);
    }
  }
}
