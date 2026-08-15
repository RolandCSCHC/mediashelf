import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';
import { Prisma } from '@prisma/client';
import { MediaService } from '../media/media.service';
import { ListsRepository } from './lists.repository';
import { ListsService } from './lists.service';

function buildList(id: string, name: string) {
  return {
    id,
    userId: 'user_1',
    name,
    description: null,
    createdAt: new Date('2024-03-01T00:00:00.000Z'),
    updatedAt: new Date('2024-03-02T00:00:00.000Z'),
    _count: { items: 1 },
  };
}

function buildListItem(
  listId: string,
  overrides: {
    currentSeason?: number | null;
    currentEpisode?: number | null;
  } = {},
) {
  return {
    listId,
    mediaItemId: 'media_1',
    currentSeason: overrides.currentSeason ?? 2,
    currentEpisode: overrides.currentEpisode ?? 5,
    addedAt: new Date('2024-03-05T12:00:00.000Z'),
  };
}

describe('ListsService.moveItemForUser', () => {
  const sourceListId = 'list_source';
  const targetListId = 'list_target';
  const mediaItemId = 'media_1';
  const userId = 'user_1';

  let listsRepository: {
    findByIdForUser: jest.Mock;
    findListItem: jest.Mock;
    moveItem: jest.Mock;
    findMembershipsForMedia: jest.Mock;
  };
  let mediaService: { getForUser: jest.Mock };
  let service: ListsService;

  beforeEach(() => {
    listsRepository = {
      findByIdForUser: jest.fn(),
      findListItem: jest.fn(),
      moveItem: jest.fn(),
      findMembershipsForMedia: jest.fn(),
    };
    mediaService = {
      getForUser: jest.fn().mockResolvedValue({
        id: mediaItemId,
        userId,
        tmdbId: 10,
        type: MediaType.SERIES,
        title: 'Show',
        description: null,
        posterPath: null,
        backdropPath: null,
        releaseDate: null,
        genres: [],
        runtime: null,
        status: MediaStatus.WATCHING,
        downloaded: false,
        notes: null,
        dateWatched: null,
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
      }),
    };

    service = new ListsService(
      listsRepository as unknown as ListsRepository,
      mediaService as unknown as MediaService,
    );
  });

  it('moves the item and preserves series progress', async () => {
    listsRepository.findByIdForUser
      .mockResolvedValueOnce(buildList(sourceListId, 'Watched Movies'))
      .mockResolvedValueOnce(buildList(targetListId, 'Downloaded Movies'));
    listsRepository.findListItem
      .mockResolvedValueOnce(buildListItem(sourceListId))
      .mockResolvedValueOnce(null);
    listsRepository.moveItem.mockResolvedValue(undefined);
    listsRepository.findMembershipsForMedia.mockResolvedValue([
      {
        ...buildListItem(targetListId),
        list: { id: targetListId, name: 'Downloaded Movies' },
      },
    ]);

    const result = await service.moveItemForUser(
      userId,
      sourceListId,
      mediaItemId,
      { targetListId },
    );

    expect(listsRepository.moveItem).toHaveBeenCalledWith(
      sourceListId,
      targetListId,
      mediaItemId,
      { currentSeason: 2, currentEpisode: 5 },
    );
    expect(result).toEqual([
      {
        listId: targetListId,
        listName: 'Downloaded Movies',
        currentSeason: 2,
        currentEpisode: 5,
        addedAt: '2024-03-05T12:00:00.000Z',
      },
    ]);
  });

  it('rejects moving to the same list', async () => {
    await expect(
      service.moveItemForUser(userId, sourceListId, mediaItemId, {
        targetListId: sourceListId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(listsRepository.moveItem).not.toHaveBeenCalled();
  });

  it('rejects a missing source list', async () => {
    listsRepository.findByIdForUser.mockResolvedValueOnce(null);

    await expect(
      service.moveItemForUser(userId, sourceListId, mediaItemId, {
        targetListId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a missing target list', async () => {
    listsRepository.findByIdForUser
      .mockResolvedValueOnce(buildList(sourceListId, 'Watched Movies'))
      .mockResolvedValueOnce(null);

    await expect(
      service.moveItemForUser(userId, sourceListId, mediaItemId, {
        targetListId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when the title is not in the source list', async () => {
    listsRepository.findByIdForUser
      .mockResolvedValueOnce(buildList(sourceListId, 'Watched Movies'))
      .mockResolvedValueOnce(buildList(targetListId, 'Downloaded Movies'));
    listsRepository.findListItem.mockResolvedValueOnce(null);

    await expect(
      service.moveItemForUser(userId, sourceListId, mediaItemId, {
        targetListId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(listsRepository.moveItem).not.toHaveBeenCalled();
  });

  it('rejects when the title is already in the target list', async () => {
    listsRepository.findByIdForUser
      .mockResolvedValueOnce(buildList(sourceListId, 'Watched Movies'))
      .mockResolvedValueOnce(buildList(targetListId, 'Downloaded Movies'));
    listsRepository.findListItem
      .mockResolvedValueOnce(buildListItem(sourceListId))
      .mockResolvedValueOnce(buildListItem(targetListId));

    await expect(
      service.moveItemForUser(userId, sourceListId, mediaItemId, {
        targetListId,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(listsRepository.moveItem).not.toHaveBeenCalled();
  });

  it('maps a unique-constraint race to a conflict', async () => {
    listsRepository.findByIdForUser
      .mockResolvedValueOnce(buildList(sourceListId, 'Watched Movies'))
      .mockResolvedValueOnce(buildList(targetListId, 'Downloaded Movies'));
    listsRepository.findListItem
      .mockResolvedValueOnce(buildListItem(sourceListId))
      .mockResolvedValueOnce(null);
    listsRepository.moveItem.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.moveItemForUser(userId, sourceListId, mediaItemId, {
        targetListId,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
