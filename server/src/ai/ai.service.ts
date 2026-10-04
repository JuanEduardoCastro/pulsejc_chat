import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER } from './ai-provider.interface';
import type { AIProvider, AiReplyCallbacks } from './ai-provider.interface';
import { Message } from '../../generated/prisma/client';

@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AIProvider) {}

  generateReplay(
    messages: Message[],
    locale: string,
    callbacks?: AiReplyCallbacks,
  ): Promise<string> {
    return this.provider.generateResponse(messages, locale, callbacks);
  }
}
