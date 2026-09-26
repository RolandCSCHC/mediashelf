import { MediaSortBy } from '@mediashelf/shared-types';
import { buildListItemOrderBy } from './list-query';

describe('buildListItemOrderBy', () => {
  it('defaults to title A–Z on the media item', () => {
    expect(buildListItemOrderBy()).toEqual([
      { mediaItem: { title: 'asc' } },
      { mediaItem: { id: 'asc' } },
    ]);
  });

  it('sorts date added by when the title joined this list, newest first', () => {
    expect(buildListItemOrderBy(MediaSortBy.DATE_ADDED)).toEqual([
      { addedAt: 'desc' },
      { mediaItemId: 'asc' },
    ]);
  });

  it('sorts release date and date watched on the media item', () => {
    expect(buildListItemOrderBy(MediaSortBy.RELEASE_DATE)).toEqual([
      { mediaItem: { releaseDate: 'desc' } },
      { mediaItem: { id: 'asc' } },
    ]);
    expect(buildListItemOrderBy(MediaSortBy.DATE_WATCHED)).toEqual([
      { mediaItem: { dateWatched: 'desc' } },
      { mediaItem: { id: 'asc' } },
    ]);
  });
});
