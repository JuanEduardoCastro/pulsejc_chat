import type { User } from '../../generated/prisma/client';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { PresenceService } from './presence.service';
import { MessagesService } from './messages.service';

interface JwtPayload {
  sub: string;
  email: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user: User;
  };
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
    private readonly presenceService: PresenceService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.query?.token as string | undefined);
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
      if (wasOffline) {
        const contactIds = await this.getContactUserIds(user.id);
        for (const contactId of contactIds) {
          this.server
            .to(`user:${contactId}`)
            .emit('user-status', { userId: user.id, online: true });
        }
      }
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
      this.logger.log(
        `send-message received from ${socket.data.user.id} for conversation ${data.conversationId}`,
      );
      const message = await this.messagesService.create(
        data.conversationId,
        socket.data.user.id,
        data.content,
      );

      const room = `conversation:${data.conversationId}`;
      const socketsInRoom = await this.server.in(room).allSockets();
      this.logger.log(
        `emitting new-message to room ${room}, ${socketsInRoom.size} socket(s):[${[...socketsInRoom].join(', ')}]`,
      );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('new-message', message);
    } catch (error) {
      this.logger.error(
        `send-message failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
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
