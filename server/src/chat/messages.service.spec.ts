import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let prisma: {
    conversationParticipant: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    message: {
      create: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const conversationId = 'conversation-1';
  const userId = 'user-1';

  beforeEach(async () => {
    prisma = {
      conversationParticipant: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    messagesService = module.get(MessagesService);
  });

  describe('create', () => {
    it('throws ForbiddenException when the sender is not a participant', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        messagesService.create(conversationId, userId, 'hi'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates the message and un-hides the conversation for any participant who had hidden it', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({ id: 'p1' });
      const createdMessage = { id: 'm1', content: 'hi' };
      prisma.$transaction.mockResolvedValue([createdMessage, {}]);

      const result = await messagesService.create(conversationId, userId, 'hi');

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId,
          senderId: userId,
          senderType: 'USER',
          content: 'hi',
        },
      });
      expect(prisma.conversationParticipant.updateMany).toHaveBeenCalledWith({
        where: { conversationId, hiddenAt: { not: null } },
        data: { hiddenAt: null },
      });
      expect(result).toBe(createdMessage);
    });
  });

  describe('listForConversation', () => {
    beforeEach(() => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({ id: 'p1' });
    });

    it('returns hasMore=false and no cursor when there are fewer messages than the limit', async () => {
      const messages = [
        { id: 'm3', createdAt: new Date(3) },
        { id: 'm2', createdAt: new Date(2) },
        { id: 'm1', createdAt: new Date(1) },
      ];
      prisma.message.findMany.mockResolvedValue(messages);

      const result = await messagesService.listForConversation(
        conversationId,
        userId,
        undefined,
        30,
      );

      expect(result.nextCursor).toBeNull();
      expect(result.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    });

    it('returns hasMore=true with the oldest-in-page id as nextCursor, and chronological order', async () => {
      const messages = [
        { id: 'm4', createdAt: new Date(4) },
        { id: 'm3', createdAt: new Date(3) },
        { id: 'm2', createdAt: new Date(2) },
        { id: 'm1', createdAt: new Date(1) },
      ];
      prisma.message.findMany.mockResolvedValue(messages);

      const result = await messagesService.listForConversation(
        conversationId,
        userId,
        undefined,
        3,
      );

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 4,
      });
      expect(result.nextCursor).toBe('m2');
      expect(result.messages.map((m) => m.id)).toEqual(['m2', 'm3', 'm4']);
    });

    it('passes the cursor through to the Prisma query', async () => {
      prisma.message.findMany.mockResolvedValue([]);

      await messagesService.listForConversation(
        conversationId,
        userId,
        'm5',
        30,
      );

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 31,
        cursor: { id: 'm5' },
        skip: 1,
      });
    });
  });

  describe('markAsRead', () => {
    beforeEach(() => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({ id: 'p1' });
    });

    it('returns an empty result and skips the update when there is nothing unread', async () => {
      prisma.message.findMany.mockResolvedValue([]);

      const result = await messagesService.markAsRead(conversationId, userId);

      expect(result).toEqual({ messageIds: [], senderIds: [], readAt: null });
      expect(prisma.message.updateMany).not.toHaveBeenCalled();
    });

    it('marks unread messages as read and returns deduplicated sender ids', async () => {
      prisma.message.findMany.mockResolvedValue([
        { id: 'm1', senderId: 'sender-a' },
        { id: 'm2', senderId: 'sender-a' },
        { id: 'm3', senderId: 'sender-b' },
      ]);

      const result = await messagesService.markAsRead(conversationId, userId);

      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['m1', 'm2', 'm3'] } },
        data: { readAt: expect.any(Date) },
      });
      expect(result.messageIds).toEqual(['m1', 'm2', 'm3']);
      expect(result.senderIds.sort()).toEqual(['sender-a', 'sender-b']);
      expect(result.readAt).toBeInstanceOf(Date);
    });
  });
});
