import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '../../generated/prisma/browser';
import { sanitizeUser } from './users.util';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return sanitizeUser(user);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(user.id, dto);
    return sanitizeUser(updatedUser);
  }
}
