import { Injectable } from '@nestjs/common';
import type { FeedbackKind } from '@mediashelf/shared-types';
import type { FeedbackSubmission as PrismaFeedbackSubmission } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const INBOX_LIMIT = 100;

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    kind: FeedbackKind;
    summary: string;
    details: string;
    email: string | null;
    userId: string | null;
  }): Promise<PrismaFeedbackSubmission> {
    return this.prisma.feedbackSubmission.create({ data });
  }

  findRecent(): Promise<PrismaFeedbackSubmission[]> {
    return this.prisma.feedbackSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: INBOX_LIMIT,
    });
  }
}
