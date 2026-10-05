import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { Server } from 'socket.io';
import * as Sentry from '@sentry/nestjs';
import { ChatGateway } from './chat.gateway';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';
import { PresenceService } from './presence.service';
import { ConversationsService } from './conversations.service';
import { AiService } from '../ai/ai.service';
import { AiUsageService } from '../ai/ai-usage.service';
import { AiProviderError } from '../ai/ai-provider.interface';
import type { AiReplyCallbacks } from '../ai/ai-provider.interface';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
  SentryExceptionCaptured: () => () => undefined,
}));

type GatewaySocket = Parameters<ChatGateway['handleSendMessage']>[0];

const CONVERSATION_ID = 'conv-1';
const USER_ID = 'user-1';

const flushAsync = () => new Promise((resolve) => setImmediate(resolve));

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let emit: jest.Mock;
  let to: jest.Mock;
  let socket: GatewaySocket & { emit: jest.Mock };
  let messagesService: {
    create: jest.Mock;
    createAiMessage: jest.Mock;
    listForConversation: jest.Mock;
  };
  let conversationsService: {
    getType: jest.Mock;
    getParticipantIds: jest.Mock;
  };
  let aiUsageService: { getUsage: jest.Mock };
  let aiService: { generateReplay: jest.Mock };

  const usage = (used: number, limit = 10) => ({
    plan: 'FREE',
    used,
    limit,
    resetsAt: null,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    emit = jest.fn();
    to = jest.fn(() => ({ emit }));

    messagesService = {
      create: jest.fn().mockResolvedValue({ id: 'msg-1', content: 'hi' }),
      createAiMessage: jest
        .fn()
        .mockResolvedValue({ id: 'ai-1', content: 'Hello!' }),
      listForConversation: jest.fn().mockResolvedValue({ messages: [] }),
    };
    conversationsService = {
      getType: jest.fn().mockResolvedValue('AI'),
      getParticipantIds: jest.fn().mockResolvedValue([USER_ID]),
    };

    aiUsageService = { getUsage: jest.fn().mockResolvedValue(usage(3)) };
    aiService = { generateReplay: jest.fn().mockResolvedValue('Hello!') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: {} },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue({ locale: 'es' }),
          },
        },
        { provide: PrismaService, useValue: {} },
        { provide: MessagesService, useValue: messagesService },
        { provide: PresenceService, useValue: {} },
        { provide: ConversationsService, useValue: conversationsService },
        { provide: ConversationsService, useValue: conversationsService },
        { provide: AiService, useValue: aiService },
        { provide: AiUsageService, useValue: aiUsageService },
        { provide: AiUsageService, useValue: aiUsageService },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
    gateway.server = { to } as unknown as Server;
    socket = {
      data: { user: { id: USER_ID } },
      emit: jest.fn(),
    } as unknown as GatewaySocket & { emit: jest.Mock };
  });

  const send = () =>
    gateway.handleSendMessage(socket, {
      conversationId: CONVERSATION_ID,
      content: 'hi',
    });

  const emitted = (event: string): unknown[] =>
    (emit.mock.calls as [string, unknown][])
      .filter(([name]) => name === event)
      .map(([, data]) => data);

  describe('AI message limit', () => {
    it('blocks the message at the limit without saving it or calling the AI', async () => {
      aiUsageService.getUsage.mockResolvedValue(usage(10));

      await send();
      await flushAsync();

      expect(socket.emit).toHaveBeenCalledWith('ai-limit-reached', {
        conversationId: CONVERSATION_ID,
        ...usage(10),
      });

      expect(messagesService.create).not.toHaveBeenCalled();
      expect(aiService.generateReplay).not.toHaveBeenCalled();
    });

    it('also blocks users left over the limit by a downgrade', async () => {
      aiUsageService.getUsage.mockResolvedValue(usage(12));

      await send();

      expect(socket.emit).toHaveBeenCalledWith(
        'ai-limit-reached',
        expect.objectContaining({ used: 12, limit: 10 }),
      );
      expect(messagesService.create).not.toHaveBeenCalled();
    });

    it('saves, broadcasts, emits usage and triggers the reply under the limit', async () => {
      aiUsageService.getUsage
        .mockResolvedValueOnce(usage(3))
        .mockResolvedValueOnce(usage(4));

      await send();
      await flushAsync();

      expect(messagesService.create).toHaveBeenCalledWith(
        CONVERSATION_ID,
        USER_ID,
        'hi',
      );
      expect(emitted('ai-usage')).toEqual([usage(4)]);
      expect(aiService.generateReplay).toHaveBeenCalledWith(
        [],
        'es',
        expect.any(Object),
      );
      expect(messagesService.createAiMessage).toHaveBeenCalledWith(
        CONVERSATION_ID,
        'Hello!',
      );
      expect(emitted('new-message')).toEqual([
        { id: 'msg-1', content: 'hi' },
        { id: 'ai-1', content: 'Hello!' },
      ]);
    });

    it('skips the limit check for DIRECT conversations', async () => {
      conversationsService.getType.mockResolvedValue('DIRECT');

      await send();
      await flushAsync();

      expect(aiUsageService.getUsage).not.toHaveBeenCalled();
      expect(messagesService.create).toHaveBeenCalled();
      expect(aiService.generateReplay).not.toHaveBeenCalled();
    });
  });

  describe('AI reply', () => {
    it('forwards streaming and retry progress to the user room', async () => {
      aiService.generateReplay.mockImplementation(
        (_messages: unknown, _locale: string, callbacks: AiReplyCallbacks) => {
          callbacks.onRetry?.(1, 2);
          callbacks.onProgress?.('Hel');
          callbacks.onProgress?.('Hello!');
          return Promise.resolve('Hello!');
        },
      );

      await send();
      await flushAsync();

      expect(to).toHaveBeenCalledWith(`user:${USER_ID}`);
      expect(emitted('ai-retrying')).toEqual([
        { conversationId: CONVERSATION_ID, retry: 1, maxRetries: 2 },
      ]);
      expect(emitted('ai-stream')).toEqual([
        { conversationId: CONVERSATION_ID, text: 'Hel' },
        { conversationId: CONVERSATION_ID, text: 'Hello!' },
      ]);
    });

    it('emits the provider error code without reporting it to Sentry', async () => {
      aiService.generateReplay.mockRejectedValue(
        new AiProviderError('QUOTA', 'quota exceeded'),
      );

      await send();
      await flushAsync();

      expect(emitted('ai-error')).toEqual([
        { conversationId: CONVERSATION_ID, code: 'QUOTA' },
      ]);
      expect(messagesService.createAiMessage).not.toHaveBeenCalled();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('reports unexpected errors to Sentry as UNAVAILABLE', async () => {
      const boom = new Error('db down');
      messagesService.createAiMessage.mockRejectedValue(boom);

      await send();
      await flushAsync();

      expect(emitted('ai-error')).toEqual([
        { conversationId: CONVERSATION_ID, code: 'UNAVAILABLE' },
      ]);
      expect(Sentry.captureException).toHaveBeenCalledWith(boom);
    });
  });

  it('reports a failed send-message to Sentry', async () => {
    const boom = new Error('db down');
    messagesService.create.mockRejectedValue(boom);

    await send();

    expect(Sentry.captureException).toHaveBeenCalledWith(boom);
  });
});
