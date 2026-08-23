import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Authenticates when a JWT cookie is present; otherwise continues as a guest. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(
    err: Error | undefined,
    user: TUser | false,
  ): TUser | undefined {
    if (err || !user) {
      return undefined;
    }

    return user;
  }
}
