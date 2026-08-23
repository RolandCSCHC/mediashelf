import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '@mediashelf/shared-types';

export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    return request.user;
  },
);
