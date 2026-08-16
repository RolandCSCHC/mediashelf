import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
import { MicrosoftAuthGuard } from './guards/microsoft-auth.guard';
import {
  AuthUserSchema,
  LogoutResponseSchema,
} from '../../swagger/api-schemas';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Start Google OAuth',
    description:
      'Redirects the browser to Google. Open this URL in a browser tab — not via Swagger Try it out.',
  })
  googleAuth(): void {
    // Passport redirects to Google.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Sets the auth cookie and redirects to the frontend library. Invoked by Google after consent.',
  })
  googleCallback(
    @Req() request: Request & { user: AuthUser },
    @Res() response: Response,
  ): void {
    this.completeOAuth(request, response);
  }

  @Get('microsoft')
  @UseGuards(MicrosoftAuthGuard)
  @ApiOperation({
    summary: 'Start Microsoft OAuth',
    description:
      'Redirects the browser to Microsoft. Open this URL in a browser tab — not via Swagger Try it out.',
  })
  microsoftAuth(): void {
    // Passport redirects to Microsoft.
  }

  @Get('microsoft/callback')
  @UseGuards(MicrosoftAuthGuard)
  @ApiOperation({
    summary: 'Microsoft OAuth callback',
    description:
      'Sets the auth cookie and redirects to the frontend library. Invoked by Microsoft after consent.',
  })
  microsoftCallback(
    @Req() request: Request & { user: AuthUser },
    @Res() response: Response,
  ): void {
    this.completeOAuth(request, response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiOkResponse({ type: AuthUserSchema })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth cookie' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear auth cookie' })
  @ApiOkResponse({ type: LogoutResponseSchema })
  logout(@Res({ passthrough: true }) response: Response): LogoutResponse {
    response.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());
    return { success: true };
  }

  private completeOAuth(
    request: Request & { user: AuthUser },
    response: Response,
  ): void {
    const token = this.authService.signToken(request.user);
    response.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    response.redirect(`${frontendUrl}/library`);
  }
}
