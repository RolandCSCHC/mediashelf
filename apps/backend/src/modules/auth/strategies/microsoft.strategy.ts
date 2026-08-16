import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { VerifyCallback } from 'passport-google-oauth20';
import { Strategy, type MicrosoftStrategyOptions } from 'passport-microsoft';
import { AuthService } from '../auth.service';
import {
  emailFromMicrosoftProfile,
  type MicrosoftOAuthProfile,
} from '../oauth-profile';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  private readonly logger = new Logger(MicrosoftStrategy.name);

  constructor(private readonly authService: AuthService) {
    const clientID = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const callbackURL =
      process.env.MICROSOFT_CALLBACK_URL ??
      'http://localhost:3000/api/auth/microsoft/callback';
    const tenant = process.env.MICROSOFT_TENANT ?? 'common';

    if (!clientID || !clientSecret) {
      new Logger(MicrosoftStrategy.name).warn(
        'MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET are not set — Microsoft login is disabled until configured.',
      );
    }

    const options: MicrosoftStrategyOptions & { addUPNAsEmail: boolean } = {
      clientID: clientID || 'microsoft-oauth-not-configured',
      clientSecret: clientSecret || 'microsoft-oauth-not-configured',
      callbackURL,
      tenant,
      scope: ['user.read'],
      addUPNAsEmail: true,
    };

    super(options);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: MicrosoftOAuthProfile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const user = await this.authService.upsertFromOAuth({
        provider: 'microsoft',
        providerId: profile.id,
        email: emailFromMicrosoftProfile(profile),
        name: profile.displayName ?? null,
        picture: profile.photos?.[0]?.value ?? null,
      });
      done(null, user);
    } catch (error) {
      this.logger.error('Microsoft profile validation failed', error);
      done(error as Error, undefined);
    }
  }
}
