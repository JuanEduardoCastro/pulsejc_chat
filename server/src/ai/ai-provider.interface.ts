import { Message } from '../../generated/prisma/client';

export type AiErrorCode = 'BUSY' | 'UNAVAILABLE' | 'QUOTA';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiReplyCallbacks {
  onProgress?: (text: string) => void;
  onRetry?: (retry: number, maxRetries: number) => void;
}

export interface AIProvider {
  generateResponse(
    messages: Message[],
    locale: string,
    callbacks?: AiReplyCallbacks,
  ): Promise<string>;
}

export class AiProviderError extends Error {
  constructor(
    readonly code: AiErrorCode,
    message: string,
  ) {
    super(message);
  }
}
