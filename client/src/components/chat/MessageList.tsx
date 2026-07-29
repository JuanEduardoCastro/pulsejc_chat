import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMessagesQuery } from '@/queries/useMessagesQuery';
import { useAuthStore } from '@/stores/authStore';
import type { ConversationType } from '@/types/chat';
import MessageBubble from './MessageBubble';

type MessageListProps = {
  conversationId: string;
  conversationType: ConversationType;
};

function MessageList({ conversationId, conversationType }: MessageListProps) {
  const { t } = useTranslation('chat');
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMessagesQuery(conversationId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const messages = data
    ? [...data.pages].reverse().flatMap((page) => page.messages)
    : [];

  useEffect(() => {
    if (!isLoading && !hasScrolledRef.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
      hasScrolledRef.current = true;
    }
  }, [isLoading, messages.length]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col justify-end gap-2 p-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-10 w-2/5 rounded-2xl shimmer ${
              i % 2 === 0 ? 'self-start' : 'self-end'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto py-2">
      {hasNextPage && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm underline disabled:opacity-60"
          >
            {t('messages.loadEarlier')}
          </button>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={
            message.senderType === 'USER' && message.senderId === currentUserId
          }
          conversationType={conversationType}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
