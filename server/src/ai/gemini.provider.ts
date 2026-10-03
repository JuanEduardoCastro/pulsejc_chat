import { Injectable, Logger } from '@nestjs/common';
import { AiProviderError, AIProvider } from './ai-provider.interface';
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai';

import { ConfigService } from '@nestjs/config';
import { Message } from '../../generated/prisma/client';

const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAYS_MS = [1000, 3000];
const SYSTEM_INSTRUCTION =
  'You are Pulse, the AI assistant built into the Pulse.Jc chat app. Keep replies short, friendly and conversational.';
const LANGUAGE_NAMES: Record<string, string> = { en: 'English', es: 'Spanish' };

function buildSystemInstruction(locale: string) {
  const language = LANGUAGE_NAMES[locale] ?? 'English';
  return `${SYSTEM_INSTRUCTION} The user's app is set to ${language}: reply in ${language}, unless the user clearly writes to you in a different language, in which case reply in theirs.`;
}

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenerativeAI(
      this.configService.getOrThrow<string>('AI_API_KEY'),
    );
  }

  async generateResponse(messages: Message[], locale: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: buildSystemInstruction(locale),
    });

    const history = messages.slice(0, -1).map((message) => ({
      role: message.senderType === 'AI' ? 'model' : 'user',
      parts: [{ text: message.content ?? '' }],
    }));

    const lastMessage = messages[messages.length - 1];

    for (let attempt = 0; ; attempt++) {
      try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage.content ?? '');
        return result.response.text();
      } catch (error) {
        const status =
          error instanceof GoogleGenerativeAIFetchError
            ? error.status
            : undefined;
        const isRetryable = !!status && RETRYABLE_STATUSES.has(status);
        const delay = RETRY_DELAYS_MS[attempt];

        if (isRetryable && delay !== undefined) {
          this.logger.warn(
            `Gemini returned ${status}, retrying in ${delay}ms (retry ${attempt + 1}/${RETRY_DELAYS_MS.length})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        this.logger.error(
          `Gemini request failed: ${(error as Error).message}`,
          (error as Error).stack,
        );
        throw new AiProviderError(
          isRetryable ? 'BUSY' : 'UNAVAILABLE',
          (error as Error).message,
        );
      }
    }
  }
}
