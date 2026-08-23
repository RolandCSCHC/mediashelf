import { ForbiddenException } from '@nestjs/common';
import { FeedbackKind } from '@mediashelf/shared-types';
import { FeedbackRepository } from './feedback.repository';
import { FeedbackService } from './feedback.service';

function buildRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'feedback_1',
    kind: FeedbackKind.BUG,
    summary: 'Broken filter',
    details: 'Clear filters does nothing.',
    email: 'ada@example.com',
    userId: 'user_1',
    createdAt: new Date('2026-08-23T15:00:00.000Z'),
    ...overrides,
  };
}

describe('FeedbackService', () => {
  const originalAdminEmail = process.env.FEEDBACK_ADMIN_EMAIL;
  let repository: {
    create: jest.Mock;
    findRecent: jest.Mock;
  };
  let service: FeedbackService;

  beforeEach(() => {
    process.env.FEEDBACK_ADMIN_EMAIL = 'ada@example.com';
    repository = {
      create: jest.fn(),
      findRecent: jest.fn(),
    };
    service = new FeedbackService(repository as unknown as FeedbackRepository);
  });

  afterEach(() => {
    process.env.FEEDBACK_ADMIN_EMAIL = originalAdminEmail;
  });

  it('stores trimmed fields and the account email when none is submitted', async () => {
    repository.create.mockResolvedValue(buildRow());

    const result = await service.create(
      {
        kind: FeedbackKind.BUG,
        summary: '  Broken filter  ',
        details: '  Clear filters does nothing.  ',
      },
      {
        id: 'user_1',
        email: 'ada@example.com',
        name: 'Ada',
        picture: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    );

    expect(repository.create).toHaveBeenCalledWith({
      kind: FeedbackKind.BUG,
      summary: 'Broken filter',
      details: 'Clear filters does nothing.',
      email: 'ada@example.com',
      userId: 'user_1',
    });
    expect(result.createdAt).toBe('2026-08-23T15:00:00.000Z');
  });

  it('lists recent submissions for the inbox owner', async () => {
    repository.findRecent.mockResolvedValue([buildRow()]);

    const result = await service.listForAdmin('Ada@Example.com');

    expect(result).toHaveLength(1);
    expect(result[0]?.summary).toBe('Broken filter');
  });

  it('forbids listing for anyone else', async () => {
    await expect(
      service.listForAdmin('other@example.com'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.findRecent).not.toHaveBeenCalled();
  });
});
