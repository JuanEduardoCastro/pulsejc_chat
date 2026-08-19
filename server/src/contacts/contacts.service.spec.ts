import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ConversationsService } from '../chat/conversations.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import type { User } from '../../generated/prisma/client';

describe('ContactsService', () => {
  let contactsService: ContactsService;
  let prisma: {
    contact: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let usersService: jest.Mocked<UsersService>;
  let conversationsService: jest.Mocked<ConversationsService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let emit: jest.Mock;

  const currentUser = {
    id: 'user-1',
    email: 'me@example.com',
  } as unknown as User;
  const targetUser = {
    id: 'user-2',
    email: 'target@example.com',
  } as unknown as User;

  beforeEach(async () => {
    prisma = {
      contact: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    emit = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: { findByEmail: jest.fn() } },
        {
          provide: ConversationsService,
          useValue: {
            findOrCreateDirect: jest.fn(),
            deleteDirectConversation: jest.fn(),
          },
        },
        {
          provide: ChatGateway,
          useValue: { server: { to: jest.fn().mockReturnValue({ emit }) } },
        },
        {
          provide: NotificationsService,
          useValue: { notifyUser: jest.fn() },
        },
      ],
    }).compile();

    contactsService = module.get(ContactsService);
    usersService = module.get(UsersService);
    conversationsService = module.get(ConversationsService);
    notificationsService = module.get(NotificationsService);
  });

  describe('createContact', () => {
    it('throws NotFoundException when no user has that email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        contactsService.createContact(currentUser, 'nobody@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when adding yourself', async () => {
      usersService.findByEmail.mockResolvedValue(currentUser);

      await expect(
        contactsService.createContact(currentUser, currentUser.email),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when a contact relation already exists in either direction', async () => {
      usersService.findByEmail.mockResolvedValue(targetUser);
      prisma.contact.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        contactsService.createContact(currentUser, targetUser.email),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a pending contact and notifies the target user', async () => {
      usersService.findByEmail.mockResolvedValue(targetUser);
      prisma.contact.findFirst.mockResolvedValue(null);
      prisma.contact.create.mockResolvedValue({
        id: 'contact-1',
        userId: currentUser.id,
        contactId: targetUser.id,
        status: 'PENDING',
        createdAt: new Date(),
      });

      const result = await contactsService.createContact(
        currentUser,
        targetUser.email,
      );

      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: {
          userId: currentUser.id,
          contactId: targetUser.id,
          status: 'PENDING',
        },
      });
      expect(emit).toHaveBeenCalledWith(
        'contact-request',
        expect.objectContaining({ id: 'contact-1' }),
      );
      expect(result.status).toBe('PENDING');
    });
  });

  describe('findMany', () => {
    it('resolves the other user correctly for accepted contacts on either side', async () => {
      prisma.contact.findMany.mockResolvedValue([
        {
          id: 'c1',
          userId: currentUser.id,
          contactId: targetUser.id,
          createdAt: new Date(),
          user: currentUser,
          contact: targetUser,
        },
        {
          id: 'c2',
          userId: targetUser.id,
          contactId: currentUser.id,
          createdAt: new Date(),
          user: targetUser,
          contact: currentUser,
        },
      ]);

      const result = await contactsService.findMany(currentUser.id, 'accepted');

      expect(result).toHaveLength(2);
      expect(result[0].user.id).toBe(targetUser.id);
      expect(result[1].user.id).toBe(targetUser.id);
    });

    it('queries only requests addressed to the current user for pending', async () => {
      prisma.contact.findMany.mockResolvedValue([
        { id: 'c1', createdAt: new Date(), user: targetUser },
      ]);

      await contactsService.findMany(currentUser.id, 'pending');

      expect(prisma.contact.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING', contactId: currentUser.id },
        include: { user: true },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the contact does not exist', async () => {
      prisma.contact.findUnique.mockResolvedValue(null);

      await expect(
        contactsService.findOne(currentUser.id, 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the current user is not a participant', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: 'c1',
        userId: 'someone-else',
        contactId: 'someone-else-2',
        user: targetUser,
        contact: currentUser,
      });

      await expect(
        contactsService.findOne(currentUser.id, 'c1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('acceptContact', () => {
    it('throws NotFoundException when the contact does not exist', async () => {
      prisma.contact.findUnique.mockResolvedValue(null);

      await expect(
        contactsService.acceptContact(currentUser, 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the current user is not the recipient', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: 'c1',
        contactId: 'someone-else',
        status: 'PENDING',
      });

      await expect(
        contactsService.acceptContact(currentUser, 'c1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when the contact is not pending', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: 'c1',
        contactId: currentUser.id,
        status: 'ACCEPTED',
      });

      await expect(
        contactsService.acceptContact(currentUser, 'c1'),
      ).rejects.toThrow(ConflictException);
    });

    it('accepts the contact, creates the conversation and notifies the requester', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: 'c1',
        userId: targetUser.id,
        contactId: currentUser.id,
        status: 'PENDING',
        createdAt: new Date(),
      });
      prisma.contact.update.mockResolvedValue({ id: 'c1', status: 'ACCEPTED' });
      conversationsService.findOrCreateDirect.mockResolvedValue({} as any);

      await contactsService.acceptContact(currentUser, 'c1');

      expect(conversationsService.findOrCreateDirect).toHaveBeenCalledWith(
        targetUser.id,
        currentUser.id,
      );
      expect(emit).toHaveBeenCalledWith(
        'contact-request-response',
        expect.objectContaining({ status: 'accepted' }),
      );
    });
  });

  describe('removeContact', () => {
    it('throws NotFoundException when the contact does not exist', async () => {
      prisma.contact.findUnique.mockResolvedValue(null);

      await expect(
        contactsService.removeContact(currentUser, 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the current user is not a participant', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: 'c1',
        userId: 'a',
        contactId: 'b',
        status: 'ACCEPTED',
      });

      await expect(
        contactsService.removeContact(currentUser, 'c1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('notifies the other user when a pending request is withdrawn/rejected', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: 'c1',
        userId: currentUser.id,
        contactId: targetUser.id,
        status: 'PENDING',
      });

      await contactsService.removeContact(currentUser, 'c1');

      expect(prisma.contact.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(emit).toHaveBeenCalledWith(
        'contact-request-response',
        expect.objectContaining({ status: 'rejected' }),
      );
    });

    it('deletes the conversation and notifies the other user when removing an accepted contact', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: 'c1',
        userId: currentUser.id,
        contactId: targetUser.id,
        status: 'ACCEPTED',
      });

      await contactsService.removeContact(currentUser, 'c1');

      expect(
        conversationsService.deleteDirectConversation,
      ).toHaveBeenCalledWith(currentUser.id, targetUser.id);
      expect(prisma.contact.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(emit).toHaveBeenCalledWith('contact-removed', { contactId: 'c1' });
    });
  });
});
