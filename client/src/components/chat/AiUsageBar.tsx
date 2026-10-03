import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '@/stores/uiStore';
import { AI_USAGE_QUERY_KEY } from '@/queries/useAiUsageQuery';
import type { AiUsage } from '@/types/chat';
import ButtonFull from '../common/ButtonFull';

type AiUsageBarProps = {
  usage: AiUsage;
};

function AiUsageBar({ usage }: AiUsageBarProps) {
  const { t, i18n } = useTranslation('chat');
  const queryClient = useQueryClient();
  const openModal = useUiStore((state) => state.openModal);
  const limitReached = usage.used >= usage.limit;

  useEffect(() => {
    if (!usage.resetsAt) return;
    const delay = new Date(usage.resetsAt).getTime() - Date.now();
    const timeout = setTimeout(
      () =>
        void queryClient.invalidateQueries({ queryKey: AI_USAGE_QUERY_KEY }),
      Math.max(delay, 0) + 100,
    );

    return () => clearTimeout(timeout);
  }, [usage.resetsAt, queryClient]);

  if (!limitReached) {
    return (
      <p
        className="border-t px-4 pt-2 text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        {t('aiUsage.counter', { used: usage.used, limit: usage.limit })}
      </p>
    );
  }

  const nextAt = usage.resetsAt
    ? new Date(usage.resetsAt).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-sm"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--accent-bg)',
        color: 'var(--text-h)',
      }}
    >
      <span className="">
        {usage.plan === 'FREE'
          ? t('aiUsage.limitReachedFree', { limit: usage.limit })
          : t('aiUsage.limitReachedPro', { limit: usage.limit })}{' '}
        {nextAt && t('aiUsage.nextAt', { time: nextAt })}
      </span>

      {usage.plan === 'FREE' && (
        <div className="">
          <ButtonFull
            type="button"
            text={t('aiUsage.upgrade')}
            onClick={() => openModal({ type: 'plan' })}
            buttonStyle={{ backgroundColor: 'var(--accent)' }}
          />
        </div>
      )}
    </div>
  );
}

export default AiUsageBar;
