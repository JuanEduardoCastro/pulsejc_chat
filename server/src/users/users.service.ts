import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

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
  constructor(private readonly prisma: PrismaService) {}

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

  update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data });
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
    await this.prisma.$transaction([
      this.prisma.message.updateMany({
        where: { senderId: id },
        data: { senderId: null },
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
