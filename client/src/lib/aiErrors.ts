import type { AiErrorCode } from '@/types/chat';

export const AI_ERROR_KEY: Record<AiErrorCode, string> = {
  BUSY: 'ai.errorBusy',
  UNAVAILABLE: 'ai.errorUnavailable',
  QUOTA: 'ai.errorQuota',
};
