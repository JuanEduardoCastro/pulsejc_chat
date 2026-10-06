import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';

function DemoBanner() {
  const { t } = useTranslation('chat');
  const isDemo = useAuthStore((state) => state.user?.isDemo);
  const [dismissed, setDismissed] = useState(false);

  if (!isDemo || dismissed) return null;

  return (
    <div
      className="flex items-center justify-center gap-3 border-b px-4 py-1.5  text-xs"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--accent-bg)',
        color: 'var(--text-h)',
      }}
    >
      <span>{t('demo.banner')}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-base leading-none hover:opacity-70"
        aria-label={t('demo.dismiss')}
      >
        ×
      </button>
    </div>
  );
}

export default DemoBanner;
