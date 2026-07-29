import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

type MessageInputProps = {
  onSend: (content: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
};

const TYPING_DEBOUNCE_MS = 3000;

function MessageInput({ onSend, onTypingChange, disabled }: MessageInputProps) {
  const { t } = useTranslation('chat');
  const [value, setValue] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  function handleChange(next: string) {
    setValue(next);
    if (!onTypingChange) return;

    if (next && !isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingChange(false);
    }, TYPING_DEBOUNCE_MS);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setValue('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t px-4 py-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <input
        type="text"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled}
        placeholder={t('messages.inputPlaceholder')}
        className="flex-1 rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border)' }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-md px-4 py-2 text-sm font-medium text-white 
  disabled:opacity-60"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        {t('messages.send')}
      </button>
    </form>
  );
}

export default MessageInput;
