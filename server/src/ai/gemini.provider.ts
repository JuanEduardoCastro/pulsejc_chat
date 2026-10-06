import { Injectable, Logger } from '@nestjs/common';
import {
  AiProviderError,
  AIProvider,
  type AiReplyCallbacks,
} from './ai-provider.interface';
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai';

import { ConfigService } from '@nestjs/config';
import { Message } from '../../generated/prisma/client';

const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAYS_MS = [1000, 3000];
const MAX_RETRY_WAIT_MS = 60_000;
const SYSTEM_INSTRUCTION =
  "You are Pulse, the AI assistant built into the Pulse.Jc chat app. Keep replies short, friendly and conversational. Write plain text only: the chat doesn't render Markdown, so never use asterisks, underscores or # for formatting. For lists, start each line with '• '.";
const LANGUAGE_NAMES: Record<string, string> = { en: 'English', es: 'Spanish' };

function getRetryAfterMs(
  error: GoogleGenerativeAIFetchError,
): number | undefined {
  const retryInfo = error.errorDetails?.find((detail) =>
    detail['@type']?.endsWith('RetryInfo'),
  );
  const retryDelay = retryInfo?.retryDelay;
  const match =
    typeof retryDelay === 'string'
      ? /^(\d+(?:\.\d+)?)s$/.exec(retryDelay)
      : null;

  return match ? Number(match[1]) * 1000 : undefined;
}

function buildSystemInstruction(locale: string) {
  const language = LANGUAGE_NAMES[locale] ?? 'English';
  return `${SYSTEM_INSTRUCTION} The user's app is set to ${language}: reply in ${language}, unless the user clearly writes to you in a different language, in which case reply in theirs.`;
}

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenerativeAI(
      this.configService.getOrThrow<string>('AI_API_KEY'),
    );
    this.modelName = this.configService.get<string>(
      'AI_MODEL',
      'gemini-3.1-flash-lite',
    );
  }

  async generateResponse(
    messages: Message[],
    locale: string,
    callbacks?: AiReplyCallbacks,
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: buildSystemInstruction(locale),
    });

    const history = messages.slice(0, -1).map((message) => ({
      role: message.senderType === 'AI' ? 'model' : 'user',
      parts: [{ text: message.content ?? '' }],
    }));

    const lastMessage = messages[messages.length - 1];

    for (let attempt = 0; ; attempt++) {
      let text = '';
      try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage.content ?? '');
        for await (const chunk of result.stream) {
          text += chunk.text();
          callbacks?.onProgress?.(text);
        }
        return text;
      } catch (error) {
        const fetchError =
          error instanceof GoogleGenerativeAIFetchError ? error : undefined;
        const status = fetchError?.status;
        const retryAfterMs = fetchError
          ? getRetryAfterMs(fetchError)
          : undefined;
        const isQuotaExceeded =
          status === 429 &&
          retryAfterMs !== undefined &&
          retryAfterMs > MAX_RETRY_WAIT_MS;
        const isRetryable =
          !!status && RETRYABLE_STATUSES.has(status) && !isQuotaExceeded;
        const delay = RETRY_DELAYS_MS[attempt];

        if (isQuotaExceeded) {
          this.logger.warn(
            `Gemini quota exceeded, next request allowed in ~${Math.ceil(retryAfterMs / 60_000)} min`,
          );
          throw new AiProviderError('QUOTA', (error as Error).message);
        }

        if (isRetryable && delay !== undefined) {
          this.logger.warn(
            `Gemini returned ${status}, retrying in ${delay}ms (retry ${attempt + 1}/${RETRY_DELAYS_MS.length})`,
          );
          callbacks?.onRetry?.(attempt + 1, RETRY_DELAYS_MS.length);
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
