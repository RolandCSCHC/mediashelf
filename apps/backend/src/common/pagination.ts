import { PAGE_SIZE_ALL, type PageSizeParam } from '@mediashelf/shared-types';

export const MAX_PAGE_SIZE = 100;

export type ResolvedPagination = {
  page: number;
  pageSize: number;
  totalPages: number;
  skip?: number;
  take?: number;
};

export function resolvePagination(
  page: number | undefined,
  pageSize: PageSizeParam | undefined,
  total: number,
): ResolvedPagination {
  if (pageSize === undefined || pageSize === PAGE_SIZE_ALL) {
    return {
      page: 1,
      pageSize: total,
      totalPages: total === 0 ? 0 : 1,
    };
  }

  const size = pageSize;
  const totalPages = total === 0 ? 0 : Math.ceil(total / size);
  const safePage =
    totalPages === 0 ? 1 : Math.min(Math.max(page ?? 1, 1), totalPages);

  return {
    page: safePage,
    pageSize: size,
    totalPages,
    skip: (safePage - 1) * size,
    take: size,
  };
}

export function uniqueSortedGenres(genreLists: string[][]): string[] {
  return Array.from(new Set(genreLists.flat())).sort((a, b) =>
    a.localeCompare(b),
  );
}
