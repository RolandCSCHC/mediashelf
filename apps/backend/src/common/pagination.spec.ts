import { PAGE_SIZE_ALL } from '@mediashelf/shared-types';
import { resolvePagination, uniqueSortedGenres } from './pagination';

describe('resolvePagination', () => {
  it('returns a single page when pageSize is omitted', () => {
    expect(resolvePagination(3, undefined, 40)).toEqual({
      page: 1,
      pageSize: 40,
      totalPages: 1,
    });
  });

  it('returns a single page when pageSize is all', () => {
    expect(resolvePagination(2, PAGE_SIZE_ALL, 12)).toEqual({
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });
  });

  it('returns zero pages for an empty result', () => {
    expect(resolvePagination(1, 15, 0)).toEqual({
      page: 1,
      pageSize: 15,
      totalPages: 0,
      skip: 0,
      take: 15,
    });
  });

  it('clamps the page to the last available page', () => {
    expect(resolvePagination(9, 10, 25)).toEqual({
      page: 3,
      pageSize: 10,
      totalPages: 3,
      skip: 20,
      take: 10,
    });
  });

  it('computes skip and take for a middle page', () => {
    expect(resolvePagination(2, 15, 40)).toEqual({
      page: 2,
      pageSize: 15,
      totalPages: 3,
      skip: 15,
      take: 15,
    });
  });
});

describe('uniqueSortedGenres', () => {
  it('deduplicates and sorts genres', () => {
    expect(
      uniqueSortedGenres([['Drama', 'Horror'], ['Action'], ['Drama']]),
    ).toEqual(['Action', 'Drama', 'Horror']);
  });
});
