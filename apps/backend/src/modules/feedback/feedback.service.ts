import { ForbiddenException, Injectable } from '@nestjs/common';
import type {
  AuthUser,
  CreateFeedbackRequest,
  FeedbackSubmission,
} from '@mediashelf/shared-types';
import { isFeedbackAdminEmail } from './feedback-admin';
import { toFeedbackSubmission } from './feedback.mapper';
import { FeedbackRepository } from './feedback.repository';

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async create(
    body: CreateFeedbackRequest,
    user?: AuthUser,
  ): Promise<FeedbackSubmission> {
    const created = await this.feedbackRepository.create({
      kind: body.kind,
      summary: body.summary.trim(),
      details: body.details.trim(),
      email: resolveEmail(body.email, user?.email),
      userId: user?.id ?? null,
    });

    return toFeedbackSubmission(created);
  }

  async listForAdmin(email: string): Promise<FeedbackSubmission[]> {
    if (!isFeedbackAdminEmail(email)) {
      throw new ForbiddenException('Not allowed to review feedback');
    }

    const items = await this.feedbackRepository.findRecent();
    return items.map(toFeedbackSubmission);
  }
}

function resolveEmail(
  submitted: string | undefined,
  accountEmail: string | undefined,
): string | null {
  const fromForm = submitted?.trim();
  if (fromForm) {
    return fromForm;
  }

  const fromAccount = accountEmail?.trim();
  return fromAccount ? fromAccount : null;
}
