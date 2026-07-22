import { Message } from '../../generated/prisma/client';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AIProvider {
  generateResponse(messages: Message[]): Promise<string>;
}
