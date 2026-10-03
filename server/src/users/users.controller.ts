import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { BillingService } from '@/billing/billing.service';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '../../generated/prisma/browser';
import { sanitizeSelf } from './users.util';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AvatarUploadUrlDto } from './dto/avatar-upload-url.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly billingService: BillingService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return sanitizeSelf(user);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(user.id, dto);
    return sanitizeSelf(updatedUser);
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
    return sanitizeSelf(updatedUser);
  }

  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  @Delete('me')
  async deleteMe(
    @CurrentUser() user: User,
    @Body() dto: DeleteAccountDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (dto.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      throw new BadRequestException('Email confirmation does not match');
    }

    await this.billingService.deleteCustomer(user);
    await this.usersService.remove(user.id);

    const secure = req.protocol === 'https';
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/auth',
    });
    return { message: 'Account successfully deleted' };
  }
}
