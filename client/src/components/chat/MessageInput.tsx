import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonFull from '../common/ButtonFull';
import CustomInputField from '../common/CustomInputField';

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
      <CustomInputField
        id="messageInput"
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={t('messages.inputPlaceholder')}
      />

      <div className="w-24">
        <ButtonFull
          type="submit"
          disabled={disabled || !value.trim()}
          buttonStyle={{ backgroundColor: 'var(--accent)' }}
        >
          {t('messages.send')}
        </ButtonFull>
      </div>
    </form>
  );
}

export default MessageInput;
