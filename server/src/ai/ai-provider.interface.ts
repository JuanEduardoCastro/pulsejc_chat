import { Message } from '../../generated/prisma/client';

export type AiErrorCode = 'BUSY' | 'UNAVAILABLE';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AIProvider {
  generateResponse(messages: Message[], locale: string): Promise<string>;
}

export class AiProviderError extends Error {
  constructor(
    readonly code: AiErrorCode,
    message: string,
  ) {
    super(message);
  }
}
