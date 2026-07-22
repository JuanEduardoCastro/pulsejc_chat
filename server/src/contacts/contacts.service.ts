import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { sanitizeUser } from '@/users/users.util';
import { ConversationsService } from '@/chat/conversations.service';
import { ChatGateway } from '@/chat/chat.gateway';
import type { User } from '../../generated/prisma/client';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly conversationsService: ConversationsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createContact(currentUser: User, contactEmail: string) {
    const targetUser = await this.usersService.findByEmail(contactEmail);
    if (!targetUser) {
      throw new NotFoundException('No user found with this email');
    }

    if (targetUser.id === currentUser.id) {
      throw new BadRequestException('You cannot add yourself as a contact');
    }

    const existingContact = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { userId: currentUser.id, contactId: targetUser.id },
          { userId: targetUser.id, contactId: currentUser.id },
        ],
      },
    });

    if (existingContact) {
      throw new ConflictException('Contact already exists or is pending');
    }

    const contact = await this.prisma.contact.create({
      data: {
        userId: currentUser.id,
        contactId: targetUser.id,
        status: 'PENDING',
      },
    });

    this.chatGateway.server
      .to(`user:${targetUser.id}`)
      .emit('contact-request', {
        id: contact.id,
        requestedAt: contact.createdAt,
        user: sanitizeUser(currentUser),
      });

    return contact;
  }

  async findMany(currentUserId: string, status: 'accepted' | 'pending') {
    if (status === 'accepted') {
      const contacts = await this.prisma.contact.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ userId: currentUserId }, { contactId: currentUserId }],
        },
        include: { user: true, contact: true },
      });

      return contacts.map((contact) => {
        const otherUser =
          contact.userId === currentUserId ? contact.contact : contact.user;
        return {
          id: contact.id,
          contactSince: contact.createdAt,
          user: sanitizeUser(otherUser),
        };
      });
    }

    const contacts = await this.prisma.contact.findMany({
      where: {
        status: 'PENDING',
        contactId: currentUserId,
      },
      include: { user: true },
    });

    return contacts.map((contact) => ({
      id: contact.id,
      requestedAt: contact.createdAt,
      user: sanitizeUser(contact.user),
    }));
  }

  async findOne(currentUserId: string, contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      include: { user: true, contact: true },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const isParticpant =
      contact.userId === currentUserId || contact.contactId === currentUserId;

    if (!isParticpant) {
      throw new ForbiddenException();
    }

    const otherUser =
      contact.userId === currentUserId ? contact.contact : contact.user;

    return {
      id: contact.id,
      contactSince: contact.createdAt,
      user: sanitizeUser(otherUser),
    };
  }

  async acceptContact(currentUser: User, contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.contactId !== currentUser.id) {
      throw new ForbiddenException();
    }

    if (contact.status !== 'PENDING') {
      throw new ConflictException('Contact is not pending');
    }

    const update = await this.prisma.contact.update({
      where: { id: contactId },
      data: { status: 'ACCEPTED' },
    });

    await this.conversationsService.findOrCreateDirect(
      contact.userId,
      contact.contactId,
    );

    this.chatGateway.server
      .to(`user:${contact.userId}`)
      .emit('contact-request-response', {
        id: contact.id,
        status: 'accepted',
        contactSince: contact.createdAt,
        user: sanitizeUser(currentUser),
      });

    return update;
  }

  async removeContact(currentUser: User, contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const isParticpant =
      contact.userId === currentUser.id || contact.contactId === currentUser.id;

    if (!isParticpant) {
      throw new ForbiddenException();
    }

    await this.prisma.contact.delete({ where: { id: contactId } });

    if (contact.status === 'PENDING') {
      const otherUserId =
        contact.userId === currentUser.id ? contact.contactId : contact.userId;

      this.chatGateway.server
        .to(`user:${otherUserId}`)
        .emit('contact-request-response', {
          id: contact.id,
          status: 'rejected',
          user: sanitizeUser(currentUser),
        });
    }
  }
}
