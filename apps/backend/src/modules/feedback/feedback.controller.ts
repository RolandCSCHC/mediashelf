import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthUser, FeedbackSubmission } from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalCurrentUser } from '../auth/decorators/optional-current-user.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';
import { FeedbackSubmissionSchema } from '../../swagger/api-schemas';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Submit a bug report or improvement idea',
    description:
      'Anyone can submit. If a session cookie is present, the account is attached.',
  })
  @ApiCreatedResponse({ type: FeedbackSubmissionSchema })
  create(
    @Body() body: CreateFeedbackDto,
    @OptionalCurrentUser() user?: AuthUser,
  ): Promise<FeedbackSubmission> {
    return this.feedbackService.create(body, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'List recent feedback',
    description:
      'Only the inbox owner (`FEEDBACK_ADMIN_EMAIL`) can read submissions.',
  })
  @ApiOkResponse({ type: FeedbackSubmissionSchema, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth cookie' })
  @ApiForbiddenResponse({ description: 'Not the feedback inbox owner' })
  list(@CurrentUser() user: AuthUser): Promise<FeedbackSubmission[]> {
    return this.feedbackService.listForAdmin(user.email);
  }
}
