import { useTranslation } from 'react-i18next';

function EmptyState() {
  const { t } = useTranslation('chat');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-h)' }}>
        {t('emptyState.title')}
      </h2>
      <p className="text-sm">{t('emptyState.subtitle')}</p>
    </div>
  );
}

export default EmptyState;
