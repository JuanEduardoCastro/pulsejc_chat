import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

  async openDirectWithContact(currentUserId: string, otherUserId: string) {
    const isAcceptedContact = await this.prisma.contact.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { userId: currentUserId, contactId: otherUserId },
          { userId: otherUserId, contactId: currentUserId },
        ],
      },
    });

    if (!isAcceptedContact) {
      throw new ForbiddenException('Not an accepted contact');
    }

    const conversation = await this.findOrCreateDirect(
      currentUserId,
      otherUserId,
    );

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId: conversation.id, userId: currentUserId },
      data: { hiddenAt: null },
    });

    const full = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const otherParticipant = full.participants.find(
      (p) => p.userId !== currentUserId,
    );

    return {
      id: full.id,
      type: full.type,
      otherUser: otherParticipant ? sanitizeUser(otherParticipant.user) : null,
      lastMessage: full.messages[0] ?? null,
    };
  }

  async findOrCreateAI(userId: string) {
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        type: 'AI',
        participants: { some: { userId } },
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    return this.prisma.conversation.create({
      data: {
        type: 'AI',
        participants: { create: [{ userId }] },
      },
    });
  }

  async getType(conversationId: string) {
    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      select: { type: true },
    });
    return conversation.type;
  }

  async getParticipantIds(conversationId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    return participants.map((p) => p.userId);
  }

  async listForUser(userId: string) {
    const iaConversation = await this.findOrCreateAI(userId);

    const [acceptedContacts, participations] = await Promise.all([
      this.prisma.contact.findMany({
        where: { status: 'ACCEPTED', OR: [{ userId }, { contactId: userId }] },
        include: { user: true, contact: true },
      }),
      this.prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              participants: true,
              messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
      }),
    ]);

    const participationByOtherUserId = new Map<
      string,
      (typeof participations)[number]
    >();
    for (const participation of participations) {
      if (participation.conversation.type !== 'DIRECT') continue;
      const otherParticipant = participation.conversation.participants.find(
        (p) => p.userId !== userId,
      );
      if (otherParticipant) {
        participationByOtherUserId.set(otherParticipant.userId, participation);
      }
    }

    const contactItems = acceptedContacts
      .map((contact) => {
        const otherUser =
          contact.userId === userId ? contact.contact : contact.user;

        const participation = participationByOtherUserId.get(otherUser.id);
        if (!participation) return null;

        const lastMessage = participation.hiddenAt
          ? null
          : (participation.conversation.messages[0] ?? null);

        return {
          activityAt: lastMessage?.createdAt ?? contact.updatedAt,
          item: {
            id: participation.conversation.id,
            type: 'DIRECT' as const,
            otherUser: sanitizeUser(otherUser),
            lastMessage,
          },
        };
      })
      .filter((entry) => entry !== null)
      .sort((a, b) => b.activityAt.getTime() - a.activityAt.getTime())
      .map((entry) => entry.item);

    const aiParticipation = participations.find(
      (p) => p.conversationId === iaConversation.id,
    );

    return [
      {
        id: iaConversation.id,
        type: 'AI' as const,
        otherUser: null,
        lastMessage: aiParticipation?.conversation.messages[0] ?? null,
      },
      ...contactItems,
    ];
  }

  async deleteDirectConversation(userIdA: string, userIdB: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: userIdA } } },
          { participants: { some: { userId: userIdB } } },
        ],
      },
    });

    if (!conversation) return;

    await this.prisma.$transaction([
      this.prisma.message.deleteMany({
        where: { conversationId: conversation.id },
      }),
      this.prisma.conversationParticipant.deleteMany({
        where: { conversationId: conversation.id },
      }),
      this.prisma.conversation.delete({
        where: { id: conversation.id },
      }),
    ]);
  }

  async hideForBothParticipants(conversationId: string, userId: string) {
    const participants = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participants) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId },
      data: { hiddenAt: new Date() },
    });
  }
}
