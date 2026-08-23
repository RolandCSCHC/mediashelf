import type { FeedbackSubmission as PrismaFeedbackSubmission } from '@prisma/client';
import {
  FeedbackKind,
  type FeedbackSubmission,
} from '@mediashelf/shared-types';

export function toFeedbackSubmission(
  item: PrismaFeedbackSubmission,
): FeedbackSubmission {
  return {
    id: item.id,
    kind: item.kind as FeedbackKind,
    summary: item.summary,
    details: item.details,
    email: item.email,
    userId: item.userId,
    createdAt: item.createdAt.toISOString(),
  };
}
