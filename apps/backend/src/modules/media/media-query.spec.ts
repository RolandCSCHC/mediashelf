import { MediaSortBy } from '@mediashelf/shared-types';
import { buildMediaItemOrderBy } from './media-query';

describe('buildMediaItemOrderBy', () => {
  it('defaults to title A–Z', () => {
    expect(buildMediaItemOrderBy()).toEqual([{ title: 'asc' }, { id: 'asc' }]);
  });

  it('sorts by title A–Z', () => {
    expect(buildMediaItemOrderBy(MediaSortBy.TITLE)).toEqual([
      { title: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('sorts by date added newest first', () => {
    expect(buildMediaItemOrderBy(MediaSortBy.DATE_ADDED)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });
});
