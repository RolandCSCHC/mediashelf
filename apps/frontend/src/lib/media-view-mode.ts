export type MediaViewMode = 'grid' | 'list';

export const MEDIA_VIEW_MODE_STORAGE_KEY = 'mediashelf-media-view';

export const DEFAULT_MEDIA_VIEW_MODE: MediaViewMode = 'grid';

export function isMediaViewMode(value: unknown): value is MediaViewMode {
  return value === 'grid' || value === 'list';
}

export function mediaCollectionClassName(mode: MediaViewMode): string {
  if (mode === 'list') {
    return 'mt-4 flex flex-col gap-3';
  }

  return 'mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';
}
