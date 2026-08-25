import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-admin-api-key'];
    const expectedKey = this.config.getOrThrow<string>('ADMIN_API_KEY');

    if (
      typeof providedKey !== 'string' ||
      providedKey.length !== expectedKey.length ||
      !timingSafeEqual(Buffer.from(providedKey), Buffer.from(expectedKey))
    ) {
      throw new UnauthorizedException('Invalid admin API key');
    }
    return true;
  }
}
