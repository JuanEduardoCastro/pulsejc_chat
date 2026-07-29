import { useTranslation } from 'react-i18next';

function ChatSplash() {
  const { t } = useTranslation('common');

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-3">
      <span
        className="text-2xl font-semibold"
        style={{ color: 'var(--text-h)' }}
      >
        {t('appName')}
      </span>
      <div className="h-1.5 w-32 overflow-hidden rounded-full shimmer" />
    </div>
  );
}

export default ChatSplash;
