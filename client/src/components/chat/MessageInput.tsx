import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonFull from '../common/ButtonFull';
import CustomInputField from '../common/CustomInputField';
import SmileIcon from '@/assets/icons/smile.svg?react';
import { COMMON_EMOJIS } from '@/assets/commonEmojis';
import ButtonMenu from '../common/ButtonMenu';

type MessageInputProps = {
  onSend: (content: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
};

const TYPING_DEBOUNCE_MS = 3000;

function MessageInput({ onSend, onTypingChange, disabled }: MessageInputProps) {
  const { t } = useTranslation('chat');
  const [value, setValue] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  function handleEmojiSelect(emoji: string) {
    handleChange(value + emoji);
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
      <div className="relative" ref={pickerRef}>
        <ButtonMenu
          type="button"
          disabled={disabled}
          onClick={() => setPickerOpen((prev) => !prev)}
          buttonClassName="flex h-10 w-10 items-center justify-center rounded-md hover:opacity-80 disabled:opacity-60"
          buttonStyle={{ color: 'var(--text-h)' }}
        >
          <SmileIcon className="h-5 w-5" />
        </ButtonMenu>

        {pickerOpen && (
          <div
            className="absolute bottom-full left-0 z-10 mb-2 grid w-74 p-3 grid-cols-8 gap-1 rounded-md border shadow-lg"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
            }}
          >
            {COMMON_EMOJIS.map((emoji) => (
              <ButtonMenu
                key={emoji}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
                buttonClassName="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:opacity-70"
              >
                <span className="text-2xl">{emoji}</span>
              </ButtonMenu>
            ))}
          </div>
        )}
      </div>
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
