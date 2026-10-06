import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { Plan, Prisma } from '../../generated/prisma/client';
import { DEMO_AI_MESSAGE_LIMIT, isDemoEmail } from '@/common/demo';

export const AI_MESSAGE_LIMIT: Record<Plan, number> = { FREE: 10, PRO: 300 };
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface AiUsage {
  plan: Plan;
  used: number;
  limit: number;
  resetsAt: Date | null;
}

@Injectable()
export class AiUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsage(userId: string): Promise<AiUsage> {
    const where: Prisma.MessageWhereInput = {
      senderId: userId,
      senderType: 'USER',
      conversation: { type: 'AI' },
      createdAt: { gte: new Date(Date.now() - WINDOW_MS) },
    };

    const [user, used] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { plan: true, email: true },
      }),
      this.prisma.message.count({ where }),
    ]);
    const planLimit = AI_MESSAGE_LIMIT[user.plan];
    const limit = isDemoEmail(user.email)
      ? Math.max(planLimit, DEMO_AI_MESSAGE_LIMIT)
      : planLimit;

    let resetsAt: Date | null = null;
    if (used >= limit) {
      const blocking = await this.prisma.message.findFirst({
        where,
        orderBy: { createdAt: 'asc' },
        skip: used - limit,
        select: { createdAt: true },
      });
      resetsAt = blocking
        ? new Date(blocking.createdAt.getTime() + WINDOW_MS)
        : null;
    }

    return { plan: user.plan, used: used, limit, resetsAt };
  }
}
