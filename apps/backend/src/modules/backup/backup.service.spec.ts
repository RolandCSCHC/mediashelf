import type { CustomListDetail, MediaItem } from '@mediashelf/shared-types';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';
import { ListsService } from '../lists/lists.service';
import { MailerService } from '../mail/mailer.service';
import { MediaService } from '../media/media.service';
import { BackupService } from './backup.service';

function buildDetail(): CustomListDetail {
  const media: MediaItem = {
    id: 'media_1',
    userId: 'user_1',
    tmdbId: 550,
    type: MediaType.MOVIE,
    title: 'Fight Club',
    description: 'A film',
    posterPath: '/poster.jpg',
    backdropPath: null,
    releaseDate: '1999-10-15T00:00:00.000Z',
    lastAirDate: null,
    genres: ['Drama'],
    runtime: 139,
    notes: 'private note',
    dateWatched: '2024-01-02T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };

  return {
    id: 'list_1',
    userId: 'user_1',
    name: 'Sci-fi',
    description: null,
    defaultStatus: MediaStatus.WATCHLIST,
    defaultDownloaded: true,
    itemCount: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    page: 1,
    pageSize: 1,
    total: 1,
    totalPages: 1,
    genres: ['Drama'],
    itemIds: ['media_1'],
    items: [
      {
        listId: 'list_1',
        mediaItemId: 'media_1',
        status: MediaStatus.WATCHING,
        downloaded: true,
        currentSeason: null,
        currentEpisode: null,
        addedAt: '2024-03-01T00:00:00.000Z',
        mediaItem: media,
      },
    ],
  };
}

describe('BackupService.shareListForUser', () => {
  const listsService = {
    getWithAllItemsForUser: jest.fn(),
  };
  const mailer = {
    send: jest.fn(),
  };
  const service = new BackupService(
    {} as MediaService,
    listsService as unknown as ListsService,
    mailer as unknown as MailerService,
  );

  beforeEach(() => {
    listsService.getWithAllItemsForUser.mockReset();
    mailer.send.mockReset();
  });

  it('emails the shareable list JSON without notes or date watched', async () => {
    listsService.getWithAllItemsForUser.mockResolvedValue(buildDetail());
    mailer.send.mockResolvedValue(undefined);

    const result = await service.shareListForUser(
      'user_1',
      'list_1',
      'Friend@Example.com',
      { email: 'ada@example.com', name: 'Ada' },
      'en',
    );

    expect(listsService.getWithAllItemsForUser).toHaveBeenCalledWith(
      'user_1',
      'list_1',
    );
    expect(result.sentTo).toBe('friend@example.com');
    const sent = mailer.send.mock.calls[0]?.[0] as {
      to: string;
      subject: string;
      text: string;
      attachment: { filename: string; content: string };
    };
    expect(sent.to).toBe('friend@example.com');
    expect(sent.subject).toBe('MediaShelf: Sci-fi');
    expect(sent.text).toContain('shared the MediaShelf list');
    expect(sent.text).not.toContain('compartió');
    expect(sent.attachment.filename).toMatch(
      /^mediashelf-list-sci-fi-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const payload = JSON.parse(sent.attachment.content) as {
      media: Array<{ notes: string | null; dateWatched: string | null }>;
      lists: Array<{ name: string; items: Array<{ downloaded: boolean }> }>;
    };
    expect(payload.media[0]?.notes).toBeNull();
    expect(payload.media[0]?.dateWatched).toBeNull();
    expect(payload.lists[0]?.name).toBe('Sci-fi');
    expect(payload.lists[0]?.items[0]?.downloaded).toBe(true);
  });
});
