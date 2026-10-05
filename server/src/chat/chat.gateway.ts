import type { User } from '../../generated/prisma/client';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { parse as parseCookie } from 'cookie';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseFilters } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { SentryWsExceptionFilter } from '@/common/filters/ws-exception.filter';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { PresenceService } from './presence.service';
import { MessagesService } from './messages.service';
import { ConversationsService } from './conversations.service';
import { AiService } from '@/ai/ai.service';
import { AiUsageService } from '@/ai/ai-usage.service';
import { AiProviderError } from '@/ai/ai-provider.interface';

interface JwtPayload {
  sub: string;
  email: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user: User;
  };
}

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_URL, credentials: true },
})
@UseFilters(new SentryWsExceptionFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly aiRepliesInFlight = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
    private readonly presenceService: PresenceService,
    private readonly conversationsService: ConversationsService,
    private readonly aiService: AiService,
    private readonly aiUsageService: AiUsageService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const token = cookieHeader
        ? parseCookie(cookieHeader).accessToken
        : undefined;
      if (!token) {
        throw new Error('No token provided');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new Error('User not found');
      }

      socket.data.user = user;
      await socket.join(`user:${user.id}`);

      const wasOffline = this.presenceService.addConnection(user.id, socket.id);
      const contactIds = await this.getContactUserIds(user.id);

      if (wasOffline) {
        for (const contactId of contactIds) {
          this.server
            .to(`user:${contactId}`)
            .emit('user-status', { userId: user.id, online: true });
        }
      }

      const onlineContactIds = contactIds.filter((contactId) =>
        this.presenceService.isOnline(contactId),
      );

      socket.emit('presence-snapshot', { onlineUserIds: onlineContactIds });
    } catch (error) {
      this.logger.warn(
        `Rejected socket connection: ${(error as Error).message}`,
      );
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    const user = socket.data?.user;
    if (!user) return;

    this.presenceService.removeConnection(user.id, socket.id, () => {
      void this.broadcastOffline(user.id);
    });
  }

  /* -------- */

  private async broadcastOffline(userId: string) {
    const contactIds = await this.getContactUserIds(userId);
    for (const contactId of contactIds) {
      this.server.to(`user:${contactId}`).emit('user-status', {
        userId,
        online: false,
      });
    }
  }

  private async getContactUserIds(userId: string): Promise<string[]> {
    const contacts = await this.prisma.contact.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ userId }, { contactId: userId }],
      },
    });
    return contacts.map((contact) =>
      contact.userId === userId ? contact.contactId : contact.userId,
    );
  }

  /* -------- */

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId: socket.data.user.id,
        },
      },
    });

    if (!participant) {
      this.logger.warn(
        `join-conversation rejected: user ${socket.data.user.id} is not a participant of ${data.conversationId}`,
      );
      return;
    }

    await socket.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `user ${socket.data.user.id} joined conversation:${data.conversationId}`,
    );
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    try {
      const userId = socket.data.user.id;
      this.logger.log(
        `send-message received from ${socket.data.user.id} for conversation ${data.conversationId}`,
      );

      const conversationType = await this.conversationsService.getType(
        data.conversationId,
      );

      if (conversationType === 'AI') {
        const usage = await this.aiUsageService.getUsage(userId);
        if (usage.used >= usage.limit) {
          socket.emit('ai-limit-reached', {
            conversationId: data.conversationId,
            ...usage,
          });
          return;
        }
      }

      const message = await this.messagesService.create(
        data.conversationId,
        userId,
        data.content,
      );
      await this.broadcastToParticipants(data.conversationId, message);

      if (conversationType === 'AI') {
        const usage = await this.aiUsageService.getUsage(userId);
        this.server.to(`user:${userId}`).emit('ai-usage', usage);
        void this.handleAiReply(socket.data.user.id, data.conversationId);
      }
    } catch (error) {
      this.logger.error(
        `send-message failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      Sentry.captureException(error);
    }
  }

  @SubscribeMessage('retry-ai-reply')
  async handleRetryAiReply(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: string;
    },
  ) {
    try {
      const userId = socket.data.user.id;
      const [conversationType, participantsId, lastMessage] = await Promise.all(
        [
          this.conversationsService.getType(data.conversationId),
          this.conversationsService.getParticipantIds(data.conversationId),
          this.prisma.message.findFirst({
            where: { conversationId: data.conversationId },
            orderBy: { createdAt: 'desc' },
            select: { senderType: true },
          }),
        ],
      );

      if (
        conversationType !== 'AI' ||
        !participantsId.includes(userId) ||
        lastMessage?.senderType !== 'AI'
      ) {
        return;
      }

      void this.handleAiReply(userId, data.conversationId);
    } catch (error) {
      this.logger.error(
        `retry-ai-reply failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      Sentry.captureException(error);
    }
  }

  /* -------- */

  private async broadcastToParticipants(
    conversationId: string,
    message: unknown,
  ) {
    const participantIds =
      await this.conversationsService.getParticipantIds(conversationId);

    for (const participantId of participantIds) {
      this.server.to(`user:${participantId}`).emit('new-message', message);
    }
  }

  private async handleAiReply(userId: string, conversationId: string) {
    if (this.aiRepliesInFlight.has(conversationId)) return;
    this.aiRepliesInFlight.add(conversationId);

    try {
      const { messages } = await this.messagesService.listForConversation(
        conversationId,
        userId,
      );

      const user = await this.usersService.findById(userId);
      const userRoom = `user:${userId}`;
      const replayContent = await this.aiService.generateReplay(
        messages,
        user?.locale ?? 'en',
        {
          onProgress: (text) =>
            this.server
              .to(userRoom)
              .emit('ai-stream', { conversationId, text }),
          onRetry: (retry, maxRetries) =>
            this.server
              .to(userRoom)
              .emit('ai-retrying', { conversationId, retry, maxRetries }),
        },
      );
      const aiMessage = await this.messagesService.createAiMessage(
        conversationId,
        replayContent,
      );

      await this.broadcastToParticipants(conversationId, aiMessage);
    } catch (error) {
      this.logger.error(
        `AI reply failed for conversation ${conversationId}: ${
          (error as Error).message
        }`,
      );
      if (!(error instanceof AiProviderError)) Sentry.captureException(error);
      this.server.to(`user:${userId}`).emit('ai-error', {
        conversationId,
        code: error instanceof AiProviderError ? error.code : 'UNAVAILABLE',
      });
    } finally {
      this.aiRepliesInFlight.delete(conversationId);
    }
  }

  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const { messageIds, senderIds, readAt } =
        await this.messagesService.markAsRead(
          data.conversationId,
          socket.data.user.id,
        );

      if (messageIds.length === 0) return;

      for (const senderId of senderIds) {
        this.server.to(`user:${senderId}`).emit('messages-read', {
          conversationId: data.conversationId,
          messageIds,
          readAt,
        });
      }
    } catch (error) {
      this.logger.warn(
        `mark-as-read failed for user ${socket.data.user.id}: ${(error as Error).message}`,
      );
      Sentry.captureException(error);
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const others = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId: data.conversationId,
        userId: { not: socket.data.user.id },
      },
    });

    for (const other of others) {
      this.server.to(`user:${other.userId}`).emit('typing', {
        conversationId: data.conversationId,
        userId: socket.data.user.id,
        isTyping: data.isTyping,
      });
    }
  }
}
