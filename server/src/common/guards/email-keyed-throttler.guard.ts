import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class EmailKeyedThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = (req.body as { email?: string | undefined })?.email;
    return Promise.resolve(
      email
        ? `email:${email.toLowerCase()}`
        : ((req.ip as string) ?? 'unknown'),
    );
  }
}
