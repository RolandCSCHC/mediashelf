import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '@mediashelf/shared-types';
import type { Profile } from 'passport-google-oauth20';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JWT_EXPIRES_IN } from './auth.constants';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleProfile(profile: Profile): Promise<AuthUser> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName ?? null;
    const picture = profile.photos?.[0]?.value ?? null;

    if (!email) {
      throw new UnauthorizedException('Google account did not provide an email');
    }

    const user = await this.prisma.user.upsert({
      where: { googleId },
      update: {
        email,
        name,
        picture,
      },
      create: {
        googleId,
        email,
        name,
        picture,
      },
    });

    return this.toAuthUser(user);
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
}
