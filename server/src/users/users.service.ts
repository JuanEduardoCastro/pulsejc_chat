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
}
