import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User as PrismaUser } from '@prisma/client';
import { AuthService } from './auth.service';
import type { OAuthProfile } from './oauth-profile';
import { PrismaService } from '../prisma/prisma.service';

function buildUser(overrides: Partial<PrismaUser> = {}): PrismaUser {
  return {
    id: 'user_1',
    googleId: 'google_1',
    microsoftId: null,
    email: 'ada@example.com',
    name: 'Ada',
    picture: 'https://example.com/ada.png',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService.upsertFromOAuth', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      { sign: jest.fn() } as unknown as JwtService,
    );
  });

  it('creates a Google user when the provider id and email are new', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue(null);
    const created = buildUser();
    prisma.user.create.mockResolvedValue(created);

    const result = await service.upsertFromOAuth(googleProfile());

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        googleId: 'google_1',
        email: 'ada@example.com',
        name: 'Ada',
        picture: 'https://example.com/ada.png',
      },
    });
    expect(result.id).toBe('user_1');
    expect(result.email).toBe('ada@example.com');
  });

  it('updates an existing Google user found by googleId', async () => {
    const existing = buildUser({ name: 'Old Ada' });
    prisma.user.findUnique.mockResolvedValue(existing);
    const updated = buildUser({ name: 'Ada' });
    prisma.user.update.mockResolvedValue(updated);

    await service.upsertFromOAuth(googleProfile());

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: {
        email: 'ada@example.com',
        name: 'Ada',
        picture: 'https://example.com/ada.png',
      },
    });
  });

  it('creates a Microsoft user when the provider id and email are new', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(
      buildUser({ googleId: null, microsoftId: 'ms_1' }),
    );

    await service.upsertFromOAuth(microsoftProfile());

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        microsoftId: 'ms_1',
        email: 'ada@example.com',
        name: 'Ada',
        picture: null,
      },
    });
  });

  it('links Microsoft login to an existing Google user with the same email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const existing = buildUser();
    prisma.user.findFirst.mockResolvedValue(existing);
    prisma.user.update.mockResolvedValue(buildUser({ microsoftId: 'ms_1' }));

    await service.upsertFromOAuth(microsoftProfile());

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'ada@example.com', mode: 'insensitive' } },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: {
        microsoftId: 'ms_1',
        email: 'ada@example.com',
        name: 'Ada',
        picture: 'https://example.com/ada.png',
      },
    });
  });

  it('links Google login to an existing Microsoft user with the same email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const existing = buildUser({
      googleId: null,
      microsoftId: 'ms_1',
    });
    prisma.user.findFirst.mockResolvedValue(existing);
    prisma.user.update.mockResolvedValue(
      buildUser({ googleId: 'google_1', microsoftId: 'ms_1' }),
    );

    await service.upsertFromOAuth(googleProfile());

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: {
        googleId: 'google_1',
        email: 'ada@example.com',
        name: 'Ada',
        picture: 'https://example.com/ada.png',
      },
    });
  });

  it('matches email case-insensitively when linking providers', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue(
      buildUser({ email: 'Ada@Example.com' }),
    );
    prisma.user.update.mockResolvedValue(buildUser({ microsoftId: 'ms_1' }));

    await service.upsertFromOAuth({
      ...microsoftProfile(),
      email: 'ADA@example.com',
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'ada@example.com', mode: 'insensitive' } },
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'ada@example.com' }),
      }),
    );
  });

  it('keeps the existing photo when Microsoft does not provide one', async () => {
    const existing = buildUser();
    prisma.user.findUnique.mockResolvedValue(existing);
    prisma.user.update.mockResolvedValue(existing);

    await service.upsertFromOAuth({
      provider: 'microsoft',
      providerId: 'ms_1',
      email: 'ada@example.com',
      name: null,
      picture: null,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: {
        email: 'ada@example.com',
        name: 'Ada',
        picture: 'https://example.com/ada.png',
      },
    });
  });

  it('rejects a profile with no email', async () => {
    await expect(
      service.upsertFromOAuth({ ...googleProfile(), email: '  ' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

function googleProfile(): OAuthProfile {
  return {
    provider: 'google',
    providerId: 'google_1',
    email: 'ada@example.com',
    name: 'Ada',
    picture: 'https://example.com/ada.png',
  };
}

function microsoftProfile(): OAuthProfile {
  return {
    provider: 'microsoft',
    providerId: 'ms_1',
    email: 'ada@example.com',
    name: 'Ada',
    picture: null,
  };
}
