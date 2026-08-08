import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthUser, LogoutResponse } from '@mediashelf/shared-types';
import { AuthService } from './auth.service';
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getClearAuthCookieOptions,
} from './auth-cookie';
import { CurrentUser } from './decorators/current-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Passport redirects to Google.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @Req() request: Request & { user: AuthUser },
    @Res() response: Response,
  ): void {
    const token = this.authService.signToken(request.user);
    response.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    response.redirect(`${frontendUrl}/library`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): LogoutResponse {
    response.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());
    return { success: true };
  }
}
