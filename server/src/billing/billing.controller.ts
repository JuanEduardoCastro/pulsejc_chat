import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type Stripe from 'stripe';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '../../generated/prisma/client';
import { BillingService } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('checkout-session')
  createCheckoutSession(@CurrentUser() user: User) {
    return this.billingService.createCheckoutSession(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('portal-session')
  createPortalSession(@CurrentUser() user: User) {
    return this.billingService.createPortalSession(user);
  }

  @SkipThrottle()
  @HttpCode(200)
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!req.rawBody || !signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    let event: Stripe.Event;
    try {
      event = this.billingService.constructEvent(req.rawBody, signature);
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    await this.billingService.handleEvent(event);
    return { received: true };
  }
}
