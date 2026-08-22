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
          lastAirDate: null,
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

describe('MediaService.refreshLastAirDates', () => {
  const userId = 'user_1';
  const series = {
    id: 'media_1',
    userId,
    tmdbId: 2710,
    type: MediaType.SERIES,
    title: "It's Always Sunny in Philadelphia",
    description: null,
    posterPath: null,
    backdropPath: null,
    releaseDate: new Date('2005-08-04T00:00:00.000Z'),
    lastAirDate: null,
    genres: ['Comedy'],
    runtime: null,
    status: MediaStatus.WATCHED,
    downloaded: false,
    notes: null,
    dateWatched: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
  };

  let mediaRepository: {
    findTmdbSeriesMissingLastAirDate: jest.Mock;
    updateOwned: jest.Mock;
  };
  let tmdbService: {
    getDetails: jest.Mock;
  };
  let service: MediaService;

  beforeEach(() => {
    mediaRepository = {
      findTmdbSeriesMissingLastAirDate: jest.fn(),
      updateOwned: jest.fn(),
    };
    tmdbService = {
      getDetails: jest.fn(),
    };
    service = new MediaService(
      mediaRepository as unknown as MediaRepository,
      tmdbService as unknown as TmdbService,
    );
  });

  it('returns an empty list when nothing needs a refresh', async () => {
    mediaRepository.findTmdbSeriesMissingLastAirDate.mockResolvedValue([]);

    const result = await service.refreshLastAirDates(userId, ['media_1']);

    expect(result).toEqual([]);
    expect(tmdbService.getDetails).not.toHaveBeenCalled();
  });

  it('stores lastAirDate from TMDB', async () => {
    const lastAirDate = new Date('2025-12-10T00:00:00.000Z');
    mediaRepository.findTmdbSeriesMissingLastAirDate.mockResolvedValue([
      series,
    ]);
    tmdbService.getDetails.mockResolvedValue({ lastAirDate });
    mediaRepository.updateOwned.mockResolvedValue({
      ...series,
      lastAirDate,
    });

    const result = await service.refreshLastAirDates(userId, [
      'media_1',
      'media_1',
    ]);

    expect(
      mediaRepository.findTmdbSeriesMissingLastAirDate,
    ).toHaveBeenCalledWith(userId, ['media_1']);
    expect(tmdbService.getDetails).toHaveBeenCalledWith(2710, MediaType.SERIES);
    expect(mediaRepository.updateOwned).toHaveBeenCalledWith(
      'media_1',
      userId,
      { lastAirDate },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.lastAirDate).toBe(lastAirDate.toISOString());
  });

  it('skips series when TMDB has no last air date', async () => {
    mediaRepository.findTmdbSeriesMissingLastAirDate.mockResolvedValue([
      series,
    ]);
    tmdbService.getDetails.mockResolvedValue({ lastAirDate: null });

    const result = await service.refreshLastAirDates(userId, ['media_1']);

    expect(result).toEqual([]);
    expect(mediaRepository.updateOwned).not.toHaveBeenCalled();
  });

  it('continues when one TMDB lookup fails', async () => {
    const lastAirDate = new Date('2013-09-29T00:00:00.000Z');
    mediaRepository.findTmdbSeriesMissingLastAirDate.mockResolvedValue([
      series,
      { ...series, id: 'media_2', tmdbId: 1396 },
    ]);
    tmdbService.getDetails
      .mockRejectedValueOnce(new Error('TMDB request failed'))
      .mockResolvedValueOnce({ lastAirDate });
    mediaRepository.updateOwned.mockResolvedValue({
      ...series,
      id: 'media_2',
      tmdbId: 1396,
      lastAirDate,
    });

    const result = await service.refreshLastAirDates(userId, [
      'media_1',
      'media_2',
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('media_2');
  });
});
