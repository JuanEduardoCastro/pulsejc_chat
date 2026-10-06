import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { User } from '../../../generated/prisma/client';
import { DEMO_READ_ONLY_MESSAGE, isDemoEmail } from '../demo';

@Injectable()
export class DemoRestrictedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user?: User }>();
    if (user && isDemoEmail(user.email)) {
      throw new ForbiddenException(DEMO_READ_ONLY_MESSAGE);
    }
    return true;
  }
}
