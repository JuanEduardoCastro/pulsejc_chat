import ErrorMessage from './ErrorMessage';

type CustomInputFieldProps = {
  id: string;
  type: string;
  value?: string;
  onChange?: (value: string) => void;
  inputClassName?: string;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  errorMessage?: string;
  error?: boolean;
};

function CustomInputField({
  id,
  type,
  autoComplete,
  placeholder,
  autoFocus,
  inputClassName,
  disabled,
  errorMessage,
  error,
  value,
  onChange,
}: CustomInputFieldProps) {
  return (
    <>
      <input
        id={id}
        type={type}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        disabled={disabled}
        className={
          inputClassName || 'flex-1 h-10 rounded-md border px-3 py-2 text-sm'
        }
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg)',
          color: 'var(--text-h)',
        }}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        value={value}
      />

      <ErrorMessage
        message={errorMessage || ''}
        errorVisible={error || false}
      />
    </>
  );
}

export default CustomInputField;
