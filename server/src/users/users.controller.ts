import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '../../generated/prisma/browser';
import { sanitizeUser } from './users.util';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AvatarUploadUrlDto } from './dto/avatar-upload-url.dto';

@ApiTags('users')
@ApiBearerAuth()
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

  @Post('me/avatar-upload-url')
  createAvatarUploadUrl(
    @CurrentUser() user: User,
    @Body() dto: AvatarUploadUrlDto,
  ) {
    return this.usersService.createAvatarUploadUrl(user.id, dto.contentType);
  }

  @Delete('me/avatar')
  async removeAvatar(@CurrentUser() user: User) {
    const updatedUser = await this.usersService.removeAvatar(user);
    return sanitizeUser(updatedUser);
  }
}
