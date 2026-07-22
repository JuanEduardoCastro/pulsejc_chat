import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LIMIT = 30;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(conversationId: string, senderId: string, content: string) {
    await this.assertParticipant(conversationId, senderId);

    return this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderType: 'USER',
        content,
      },
    });
  }

  async listForConversation(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit: number = DEFAULT_LIMIT,
  ) {
    await this.assertParticipant(conversationId, userId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { messages: page.reverse(), nextCursor };
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException();
    }
  }
}
