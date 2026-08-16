import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '@mediashelf/shared-types';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JWT_EXPIRES_IN } from './auth.constants';
import {
  normalizeEmail,
  providerDisplayName,
  type OAuthProfile,
  type OAuthProvider,
} from './oauth-profile';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async upsertFromOAuth(profile: OAuthProfile): Promise<AuthUser> {
    const email = normalizeEmail(profile.email);
    const providerLabel = providerDisplayName(profile.provider);

    if (!profile.providerId) {
      throw new UnauthorizedException(
        `${providerLabel} account did not provide an id`,
      );
    }

    if (!email) {
      throw new UnauthorizedException(
        `${providerLabel} account did not provide an email`,
      );
    }

    const existingByProvider = await this.findByProvider(
      profile.provider,
      profile.providerId,
    );

    if (existingByProvider) {
      const updated = await this.prisma.user.update({
        where: { id: existingByProvider.id },
        data: {
          email,
          name: profile.name ?? existingByProvider.name,
          picture: profile.picture ?? existingByProvider.picture,
        },
      });
      return this.toAuthUser(updated);
    }

    const existingByEmail = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingByEmail) {
      const updated = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          ...this.providerIdData(profile),
          email,
          name: profile.name ?? existingByEmail.name,
          picture: profile.picture ?? existingByEmail.picture,
        },
      });
      return this.toAuthUser(updated);
    }

    const created = await this.prisma.user.create({
      data: {
        ...this.providerIdData(profile),
        email,
        name: profile.name,
        picture: profile.picture,
      },
    });

    return this.toAuthUser(created);
  }

  async findAuthUserById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toAuthUser(user) : null;
  }

  signToken(user: AuthUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  toAuthUser(user: PrismaUser): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async findByProvider(
    provider: OAuthProvider,
    providerId: string,
  ): Promise<PrismaUser | null> {
    if (provider === 'google') {
      return this.prisma.user.findUnique({ where: { googleId: providerId } });
    }

    return this.prisma.user.findUnique({
      where: { microsoftId: providerId },
    });
  }

  private providerIdData(
    profile: OAuthProfile,
  ): { googleId: string } | { microsoftId: string } {
    if (profile.provider === 'google') {
      return { googleId: profile.providerId };
    }

    return { microsoftId: profile.providerId };
  }
}
