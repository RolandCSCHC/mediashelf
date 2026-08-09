import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly authService: AuthService) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:3000/api/auth/google/callback';

    if (!clientID || !clientSecret) {
      // Allow the app to boot without OAuth configured (e.g. health checks).
      // /auth/google will fail until real credentials are provided.
      new Logger(GoogleStrategy.name).warn(
        'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set — Google login is disabled until configured.',
      );
    }

    super({
      clientID: clientID || 'google-oauth-not-configured',
      clientSecret: clientSecret || 'google-oauth-not-configured',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const user = await this.authService.validateGoogleProfile(profile);
      done(null, user);
    } catch (error) {
      this.logger.error('Google profile validation failed', error);
      done(error as Error, undefined);
    }
  }
}
