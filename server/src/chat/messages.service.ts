import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LIMIT = 30;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(conversationId: string, senderId: string, content: string) {
    await this.assertParticipant(conversationId, senderId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          senderType: 'USER',
          content,
        },
      }),
      this.prisma.conversationParticipant.updateMany({
        where: { conversationId, hiddenAt: { not: null } },
        data: { hiddenAt: null },
      }),
    ]);

    return message;
  }

  async createAiMessage(conversationId: string, content: string) {
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: null,
        senderType: 'AI',
        content,
      },
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);

    const unreadMessages = await this.prisma.message.findMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      select: { id: true, senderId: true },
    });

    if (unreadMessages.length === 0) {
      return {
        messageIds: [] as string[],
        senderIds: [] as string[],
        readAt: null,
      };
    }

    const readAt = new Date();
    await this.prisma.message.updateMany({
      where: { id: { in: unreadMessages.map((m) => m.id) } },
      data: { readAt },
    });

    const senderIds = [
      ...new Set(
        unreadMessages
          .map((m) => m.senderId)
          .filter((id): id is string => id !== null),
      ),
    ];

    return {
      messageIds: unreadMessages.map((m) => m.id),
      senderIds,
      readAt,
    };
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
