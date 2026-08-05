import { useState } from 'react';
import ErrorMessage from './ErrorMessage';
import type { UseFormRegister, Path, FieldValues } from 'react-hook-form';
import EyeIcon from '@/assets/icons/eye.svg?react';
import EyeOffIcon from '@/assets/icons/eye-off.svg?react';

type FormInputFieldProps<TFieldValues extends FieldValues> = {
  label: string;
  id: Path<TFieldValues>;
  type: string;
  labelClassName?: string;
  inputClassName?: string;
  value?: string;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  errorMessage?: string;
  error?: boolean;
  register: UseFormRegister<TFieldValues>;
};

function FormInputField<TFieldValues extends FieldValues>({
  label,
  labelClassName,
  id,
  type,
  autoComplete,
  placeholder,
  autoFocus,
  inputClassName,
  disabled,
  errorMessage,
  error,
  register,
  value,
}: FormInputFieldProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div>
      <label htmlFor={id} className={labelClassName || 'mb-1 block text-sm'}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`${inputClassName} w-full h-10 rounded-md border px-3 py-2`}
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--bg)',
            color: disabled ? 'var(--text-d)' : 'var(--text-h)',
          }}
          placeholder={placeholder ?? (isPassword ? '••••••••' : undefined)}
          {...register(id)}
          value={value}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
            style={{ color: 'var(--text-h)' }}
          >
            {showPassword ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeOffIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <ErrorMessage
        message={errorMessage || ''}
        errorVisible={error || false}
      />
    </div>
  );
}

export default FormInputField;
