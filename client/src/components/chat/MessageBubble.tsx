import type { CSSProperties } from 'react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import type { ConversationType, Message } from '@/types/chat';

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  conversationType: ConversationType;
};

function MessageBubble({
  message,
  isOwn,
  conversationType,
}: MessageBubbleProps) {
  const { i18n } = useTranslation();
  const isAi = message.senderType === 'AI';
  const time = format(new Date(message.createdAt), 'p', {
    locale: i18n.language === 'es' ? es : enUS,
  });
  const showReadReceipt = isOwn && conversationType !== 'AI';

  const bubbleStyle: CSSProperties = isOwn
    ? { backgroundColor: 'var(--accent-bg)', color: '#fff' }
    : isAi
      ? { backgroundColor: 'var(--accent-bg)', color: 'var(--text-h)' }
      : { backgroundColor: 'var(--border)', color: 'var(--text-h)' };

  return (
    <div
      className={`flex px-4 py-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className="max-w-[60%] rounded-2xl px-4 py-2" style={bubbleStyle}>
        <p className="text-sm wrap-break-word whitespace-pre-wrap">
          {message.content}
          <span className="float-right mt-1 ml-3 flex translate-y-1 items-center gap-1 text-[11px] opacity-70">
            <span className="whitespace-nowrap">{time}</span>
            {showReadReceipt && (
              <span
                className="tracking-[-6px] font-semibold text-[13px]"
                style={{ color: message.readAt ? '#38bdf8' : 'inherit' }}
              >
                ✓✓
              </span>
            )}
          </span>
        </p>
        {/* <div
          className={`flex-1 bg-amber-400 mt-1 flex items-end gap-1 text-[11px] opacity-70 ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{time}</span>
          {showReadReceipt && (
            <span
              className="tracking-[-6px] font-semibold text-[13px]"
              style={{ color: message.readAt ? '#38bdf8' : 'inherit' }}
            >
              ✓✓
            </span>
          )}
        </div> */}
      </div>
    </div>
  );
}

export default MessageBubble;
