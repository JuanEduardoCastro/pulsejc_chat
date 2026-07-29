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
    ? { backgroundColor: 'var(--accent)', color: '#fff' }
    : isAi
      ? { backgroundColor: 'var(--accent-bg)', color: 'var(--text-h)' }
      : { backgroundColor: 'var(--border)', color: 'var(--text-h)' };

  return (
    <div
      className={`flex px-4 py-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className="max-w-[75%] rounded-2xl px-4 py-2" style={bubbleStyle}>
        <p className="text-sm wrap-break-word whitespace-pre-wrap">
          {message.content}
        </p>
        <div
          className={`mt-1 flex items-center gap-1 text-[10px] opacity-70 ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{time}</span>
          {showReadReceipt && (
            <span style={{ color: message.readAt ? '#38bdf8' : 'inherit' }}>
              ✓✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
