import { Test, TestingModule } from '@nestjs/testing';
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

  describe('listForUser', () => {
    it('returns the AI conversation plus one entry per accepted contact', async () => {
      prisma.conversation.findFirst.mockResolvedValue({
        id: 'ai-conv',
        type: 'AI',
      });
      prisma.contact.findMany.mockResolvedValue([
        {
          id: 'contact-1',
          userId: 'user-1',
          contactId: 'user-2',
          updatedAt: new Date('2026-08-01'),
          user: { id: 'user-1' },
          contact: { id: 'user-2', email: 'other@example.com' },
        },
      ]);
      const lastMessage = {
        id: 'm1',
        content: 'hey',
        createdAt: new Date('2026-08-10'),
      };
      prisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversationId: 'ai-conv',
          hiddenAt: null,
          conversation: {
            id: 'ai-conv',
            type: 'AI',
            participants: [],
            messages: [],
          },
        },
        {
          conversationId: 'conv-1',
          hiddenAt: null,
          conversation: {
            id: 'conv-1',
            type: 'DIRECT',
            participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
            messages: [lastMessage],
          },
        },
      ]);

      const result = await conversationsService.listForUser('user-1');

      expect(result).toEqual([
        { id: 'ai-conv', type: 'AI', otherUser: null, lastMessage: null },
        {
          id: 'conv-1',
          type: 'DIRECT',
          otherUser: { id: 'user-2', email: 'other@example.com' },
          lastMessage,
        },
      ]);
    });

    it('shows a placeholder instead of the last message once hiddenAt is set', async () => {
      prisma.conversation.findFirst.mockResolvedValue({
        id: 'ai-conv',
        type: 'AI',
      });
      prisma.contact.findMany.mockResolvedValue([
        {
          id: 'contact-1',
          userId: 'user-1',
          contactId: 'user-2',
          updatedAt: new Date('2026-08-01'),
          user: { id: 'user-1' },
          contact: { id: 'user-2', email: 'other@example.com' },
        },
      ]);
      prisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversationId: 'ai-conv',
          hiddenAt: null,
          conversation: {
            id: 'ai-conv',
            type: 'AI',
            participants: [],
            messages: [],
          },
        },
        {
          conversationId: 'conv-1',
          hiddenAt: new Date('2026-08-15'),
          conversation: {
            id: 'conv-1',
            type: 'DIRECT',
            participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
            messages: [
              { id: 'm1', content: 'hey', createdAt: new Date('2026-08-10') },
            ],
          },
        },
      ]);

      const result = await conversationsService.listForUser('user-1');

      expect(result[1]).toEqual({
        id: 'conv-1',
        type: 'DIRECT',
        otherUser: { id: 'user-2', email: 'other@example.com' },
        lastMessage: null,
      });
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
