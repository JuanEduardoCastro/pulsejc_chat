import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConversationsService', () => {
  let conversationsService: ConversationsService;
  let prisma: {
    $transaction: jest.Mock;
    contact: { findMany: jest.Mock };
    conversation: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      delete: jest.Mock;
    };
    conversationParticipant: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
    message: {
      deleteMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      contact: { findMany: jest.fn() },
      conversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        delete: jest.fn(),
      },
      conversationParticipant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      message: {
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    conversationsService = module.get(ConversationsService);
  });

  describe('findOrCreateDirect', () => {
    it('returns the existing DIRECT conversation between the two users, without creating one', async () => {
      const existing = { id: 'conv-1', type: 'DIRECT' };
      prisma.conversation.findFirst.mockResolvedValue(existing);

      const result = await conversationsService.findOrCreateDirect('a', 'b');

      expect(result).toBe(existing);
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it('creates a new DIRECT conversation with both participants when none exists', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue({ id: 'conv-2' });

      await conversationsService.findOrCreateDirect('a', 'b');

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          type: 'DIRECT',
          participants: { create: [{ userId: 'a' }, { userId: 'b' }] },
        },
      });
    });
  });

  describe('hideForUser', () => {
    it('throws NotFoundException when the user is not a participant', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        conversationsService.hideForUser('conv-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets hiddenAt on the participant row', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        id: 'participant-1',
      });

      await conversationsService.hideForUser('conv-1', 'user-1');

      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith({
        where: { id: 'participant-1' },
        data: { hiddenAt: expect.any(Date) },
      });
    });
  });

  describe('listForUser', () => {
    it('excludes hidden conversations and resolves the other participant / last message', async () => {
      prisma.conversation.findFirst.mockResolvedValue({ id: 'ai-conv' }); // short-circuits findOrCreateAI
      const otherUser = { id: 'user-2', email: 'other@example.com' };
      const lastMessage = { id: 'm1', content: 'hey' };
      prisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversation: {
            id: 'conv-1',
            type: 'DIRECT',
            participants: [
              { userId: 'user-1', user: { id: 'user-1' } },
              { userId: 'user-2', user: otherUser },
            ],
            messages: [lastMessage],
          },
        },
      ]);

      const result = await conversationsService.listForUser('user-1');

      expect(prisma.conversationParticipant.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', hiddenAt: null },

        include: {
          conversation: {
            include: {
              participants: { include: { user: true } },
              messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
      });
      expect(result).toEqual([
        {
          id: 'conv-1',
          type: 'DIRECT',
          otherUser: { id: 'user-2', email: 'other@example.com' },
          lastMessage,
        },
      ]);
    });
  });
  describe('deleteDirectConversation', () => {
    it('deletes messages, participants and the conversation when one exists', async () => {
      prisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1' });
      prisma.$transaction.mockImplementation((ops: unknown[]) =>
        Promise.all(ops),
      );

      await conversationsService.deleteDirectConversation('user-1', 'user-2');

      expect(prisma.message.deleteMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-1' },
      });
      expect(prisma.conversationParticipant.deleteMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-1' },
      });
      expect(prisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
      });
    });

    it('does nothing when no DIRECT conversation exists between the two users', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);

      await conversationsService.deleteDirectConversation('user-1', 'user-2');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
