import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER } from './ai-provider.interface';
import type { AIProvider } from './ai-provider.interface';
import { Message } from '../../generated/prisma/client';

@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AIProvider) {}

  generateReplay(messages: Message[]): Promise<string> {
    return this.provider.generateResponse(messages);
  }
}
