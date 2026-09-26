import type {
  CustomListEntry,
  LibraryBackupList,
  LibraryBackupMediaItem,
  LibraryBackupPayload,
  MediaItem,
} from '@mediashelf/shared-types';
import { LIBRARY_BACKUP_VERSION } from '@mediashelf/shared-types';

export type BackupListSource = {
  name: string;
  description: string | null;
  defaultStatus: LibraryBackupList['defaultStatus'];
  defaultDownloaded: LibraryBackupList['defaultDownloaded'];
  items: Array<
    Pick<
      CustomListEntry,
      | 'mediaItemId'
      | 'status'
      | 'downloaded'
      | 'currentSeason'
      | 'currentEpisode'
    >
  >;
};

export function toBackupMediaItem(
  item: MediaItem,
  options?: { omitPersonal?: boolean },
): LibraryBackupMediaItem {
  return {
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
    notes: options?.omitPersonal ? null : item.notes,
    dateWatched: options?.omitPersonal ? null : item.dateWatched,
  };
}

export function toBackupList(list: BackupListSource): LibraryBackupList {
  return {
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
  };
}

export type ListShareSource = {
  name: string;
  description: string | null;
  defaultStatus: LibraryBackupList['defaultStatus'];
  defaultDownloaded: LibraryBackupList['defaultDownloaded'];
  items: CustomListEntry[];
};

/** One list in the library-backup shape the merge importer already accepts. */
export function toListSharePayload(
  list: ListShareSource,
  exportedAt: string,
): LibraryBackupPayload {
  return {
    version: LIBRARY_BACKUP_VERSION,
    exportedAt,
    media: list.items.map((entry) =>
      toBackupMediaItem(entry.mediaItem, { omitPersonal: true }),
    ),
    lists: [toBackupList(list)],
  };
}
