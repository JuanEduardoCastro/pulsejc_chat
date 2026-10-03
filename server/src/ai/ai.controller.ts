import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '../../generated/prisma/client';
import { AiUsageService } from './ai-usage.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiUsageService: AiUsageService) {}

  @Get('usage')
  getUsage(@CurrentUser() user: User) {
    return this.aiUsageService.getUsage(user.id);
  }
}
