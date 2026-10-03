import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { AiUsage } from '@/types/chat';

export const AI_USAGE_QUERY_KEY = ['ai-usage'] as const;

export function useAiUsageQuery(enabled: boolean) {
  return useQuery({
    queryKey: AI_USAGE_QUERY_KEY,
    queryFn: async () => (await api.get<AiUsage>('/ai-usage')).data,
    enabled,
  });
}
