import type { CSSProperties } from 'react';
import Bubble from './Bubble';
import { useTranslation } from 'react-i18next';

function ChatMockup() {
  const { t } = useTranslation('home');
  const surface: CSSProperties = {
    backgroundColor: 'var(--bg)',
    borderColor: 'var(--border)',
  };

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div
        className="overflow-hidden rounded-2xl border shadow-2xl"
        style={surface}
      >
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full font-semibold text-white"
            style={{ backgroundColor: 'var(--avatar-AI)' }}
          >
            P
          </div>
          <div className="text-left">
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-h)' }}
            >
              {t('mockup.aiName')}
            </p>
            <p className="text-xs">{t('mockup.aiStatus')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 py-5 text-left text-sm">
          <Bubble own>{t('mockup.user1')}</Bubble>
          <Bubble>{t('mockup.ai1')}</Bubble>
          <Bubble own>{t('mockup.user2')}</Bubble>
          <Bubble streaming>{t('mockup.ai2')}</Bubble>
        </div>

        <div
          className="flex items-center gap-2 border-t px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="h-9 flex-1 rounded-md border px-3 text-left text-xs  leading-9"
            style={surface}
          >
            {t('mockup.input')}
          </div>
          <div
            className="h-9 rounded-md px-4 text-xs font-semibold leading-9 text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {t('mockup.send')}
          </div>
        </div>
      </div>

      <div
        className="absolute top-20 -left-6 hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-lg sm:flex"
        style={{ ...surface, color: 'var(--text-h)' }}
      >
        <span
          className="h-2 w-2 animate-pulse rounded-full"
          style={{ backgroundColor: 'var(--accent)' }}
        />
        {t('mockup.typing')}
      </div>
      <div
        className="absolute -right-4 bottom-24 hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs shadow-lg sm:flex"
        style={{ ...surface, color: 'var(--text-h)' }}
      >
        <span
          className="font-semibold tracking-[-4px]"
          style={{ color: 'var(--check-icon)' }}
        >
          ✓✓
        </span>
        <span className="ml-1">{t('mockup.read')}</span>
      </div>
    </div>
  );
}

export default ChatMockup;
