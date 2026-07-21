import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeUser } from '@/users/users.util';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateDirect(userIdA: string, userIdB: string) {
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: userIdA } } },
          { participants: { some: { userId: userIdB } } },
        ],
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    return this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [{ userId: userIdA }, { userId: userIdB }],
        },
      },
    });
  }

  async listForUser(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId, hiddenAt: null },
      include: {
        conversation: {
          include: {
            participants: { include: { user: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });
    return participations.map(({ conversation }) => {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== userId,
      );
      const lastMessage = conversation.messages[0];

      return {
        id: conversation.id,
        type: conversation.type,
        otherUser: otherParticipant
          ? sanitizeUser(otherParticipant.user)
          : null,
        lastMessage: lastMessage,
      };
    });
  }

  async hideForUser(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { hiddenAt: new Date() },
    });
  }
}
