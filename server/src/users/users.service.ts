import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { S3Service } from '../uploads/s3.service';
import { User } from '../../generated/prisma/client';

export interface CreateUserInput {
  email: string;
  passwordHash?: string;
  googleId?: string;
  firstName?: string;
  lastName?: string;
  avatarURL?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  create(data: CreateUserInput) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserDto) {
    const existingUser =
      data.avatarURL !== undefined
        ? await this.prisma.user.findUnique({ where: { id } })
        : null;

    const udateUser = await this.prisma.user.update({ where: { id }, data });

    if (existingUser?.avatarURL && existingUser.avatarURL !== data.avatarURL) {
      await this.s3Service.deleteObjectByUrl(existingUser.avatarURL);
    }

    return udateUser;
  }

  createAvatarUploadUrl(userId: string, contentType: string) {
    return this.s3Service.createAvatarUploadUrl(userId, contentType);
  }

  async removeAvatar(user: User) {
    if (user.avatarURL) {
      await this.s3Service.deleteObjectByUrl(user.avatarURL);
    }
    return this.prisma.user.update({
      where: { id: user.id },
      data: { avatarURL: null },
    });
  }

  linkGoogleAccount(id: string, googleId: string) {
    return this.prisma.user.update({ where: { id }, data: { googleId } });
  }

  updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async remove(id: string) {
    const directConversations =
      await this.prisma.conversationParticipant.findMany({
        where: { userId: id, conversation: { type: 'DIRECT' } },
        select: { conversationId: true },
      });
    const directConversationIds = directConversations.map(
      (c) => c.conversationId,
    );

    await this.prisma.$transaction([
      this.prisma.message.updateMany({
        where: { senderId: id },
        data: { senderId: null },
      }),
      this.prisma.message.deleteMany({
        where: { conversationId: { in: directConversationIds } },
      }),
      this.prisma.conversationParticipant.deleteMany({
        where: { conversationId: { in: directConversationIds } },
      }),
      this.prisma.conversation.deleteMany({
        where: { id: { in: directConversationIds } },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
      this.prisma.conversationParticipant.deleteMany({ where: { userId: id } }),
      this.prisma.contact.deleteMany({
        where: { OR: [{ userId: id }, { contactId: id }] },
      }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }
}
