import { MediaSortBy, MediaStatus, MediaType } from '@mediashelf/shared-types';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';
import { TmdbService } from '../tmdb/tmdb.service';

describe('MediaService.listPageForUser', () => {
  const userId = 'user_1';
  let mediaRepository: {
    findPageByUser: jest.Mock;
  };
  let service: MediaService;

  beforeEach(() => {
    mediaRepository = {
      findPageByUser: jest.fn(),
    };
    service = new MediaService(
      mediaRepository as unknown as MediaRepository,
      {} as TmdbService,
    );
  });

  it('maps a paginated repository result', async () => {
    mediaRepository.findPageByUser.mockResolvedValue({
      items: [
        {
          id: 'media_1',
          userId,
          tmdbId: 10,
          type: MediaType.MOVIE,
          title: 'Example',
          description: null,
          posterPath: null,
          backdropPath: null,
          releaseDate: null,
          genres: ['Drama'],
          runtime: null,
          status: MediaStatus.WATCHLIST,
          downloaded: false,
          notes: null,
          dateWatched: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
      ],
      total: 25,
      page: 2,
      pageSize: 10,
      totalPages: 3,
      genres: ['Drama', 'Horror'],
    });

    const result = await service.listPageForUser(userId, {
      page: 2,
      pageSize: 10,
      sortBy: MediaSortBy.TITLE,
    });

    expect(mediaRepository.findPageByUser).toHaveBeenCalledWith(userId, {
      page: 2,
      pageSize: 10,
      sortBy: MediaSortBy.TITLE,
    });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.genres).toEqual(['Drama', 'Horror']);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Example');
    expect(result.items[0]?.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });
});
