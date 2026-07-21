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

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async createContact(currentUserId: string, contactEmail: string) {
    const targetUser = await this.usersService.findByEmail(contactEmail);
    if (!targetUser) {
      throw new NotFoundException('No user found with this email');
    }

    if (targetUser.id === currentUserId) {
      throw new BadRequestException('You cannot add yourself as a contact');
    }

    const existingContact = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { userId: currentUserId, contactId: targetUser.id },
          { userId: targetUser.id, contactId: currentUserId },
        ],
      },
    });

    if (existingContact) {
      throw new ConflictException('Contact already exists or is pending');
    }
    return this.prisma.contact.create({
      data: {
        userId: currentUserId,
        contactId: targetUser.id,
        status: 'PENDING',
      },
    });
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

  async acceptContact(currentUserId: string, contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.contactId !== currentUserId) {
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

    return update;
  }

  async removeContact(currentUserId: string, contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const isParticpant =
      contact.userId === currentUserId || contact.contactId === currentUserId;

    if (!isParticpant) {
      throw new ForbiddenException();
    }

    await this.prisma.contact.delete({ where: { id: contactId } });
  }
}
