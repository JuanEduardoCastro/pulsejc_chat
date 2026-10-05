import { type ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class SentryWsExceptionFilter extends BaseWsExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
