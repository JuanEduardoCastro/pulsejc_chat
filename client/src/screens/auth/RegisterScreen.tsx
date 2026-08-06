import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import AuthCard from '@/components/auth/AuthCard';
import { api } from '@/lib/axios';
import { useAuthStore, type AuthResponse } from '@/stores/authStore';
import FormInputField from '@/components/common/FormInputField';
import ButtonFull from '@/components/common/ButtonFull';
import ButtonBorder from '@/components/common/ButtonBorder';
import Separator from '@/components/common/Separator';

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'auth:register.validation.emailRequired')
    .email('auth:register.validation.emailInvalid'),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'auth:register.validation.passwordMinLength')
      .regex(/\d/, 'auth:register.validation.passwordNeedsNumber'),
    confirmPassword: z
      .string()
      .min(1, 'auth:register.validation.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth:register.validation.passwordsMismatch',
    path: ['confirmPassword'],
  });

type EmailFormValues = z.infer<typeof emailSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

function RegisterScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const checkEmailMutation = useMutation({
    mutationFn: (values: EmailFormValues) =>
      api
        .post<{ available: boolean }>('/auth/check-email', values)
        .then((res) => res.data),
    onSuccess: () => setStep(2),
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        emailForm.setError('email', {
          message: t('auth:register.validation.emailTaken'),
        });
        return;
      }
      toast.error(t('auth:register.genericError'));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      api
        .post<AuthResponse>('/auth/register', {
          email: emailForm.getValues('email'),
          password: values.password,
        })
        .then((res) => res.data),
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user);
      navigate('/chat', { replace: true });
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        setStep(1);
        emailForm.setError('email', {
          message: t('auth:register.validation.emailTaken'),
        });
        return;
      }
      toast.error(t('auth:register.genericError'));
    },
  });

  const isPending =
    step === 1 ? checkEmailMutation.isPending : registerMutation.isPending;

  return (
    <AuthCard
      title={
        step === 1
          ? t('auth:register.step1Title')
          : t('auth:register.step2Title')
      }
      footer={
        step === 1 ? (
          <p>
            {t('auth:register.hasAccount')}{' '}
            <Link
              to="/login"
              className="underline underline-offset-4 "
              style={{ color: 'var(--accent)' }}
            >
              {t('auth:register.loginLink')}
            </Link>
          </p>
        ) : undefined
      }
    >
      {step === 1 ? (
        <form
          onSubmit={emailForm.handleSubmit((values) =>
            checkEmailMutation.mutate(values),
          )}
          className="flex flex-col"
        >
          <FormInputField
            label={t('auth:register.emailLabel')}
            id="email"
            type="email"
            autoComplete="email"
            disabled={checkEmailMutation.isPending}
            errorMessage={t(emailForm.formState.errors.email?.message || '')}
            error={!!emailForm.formState.errors.email?.message}
            register={emailForm.register}
          />

          <ButtonFull
            type="submit"
            disabled={isPending}
            buttonStyle={{ backgroundColor: 'var(--accent)' }}
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              t('auth:register.continueButton')
            )}
          </ButtonFull>
        </form>
      ) : (
        <form
          onSubmit={passwordForm.handleSubmit((values) =>
            registerMutation.mutate(values),
          )}
          className="flex flex-col"
        >
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={emailForm.getValues('email')}
            readOnly
            aria-hidden="true"
            tabIndex={-1}
            className="sr-only"
          />

          <FormInputField
            label={t('auth:register.passwordLabel')}
            id="password"
            type="password"
            autoComplete="new-password"
            disabled={registerMutation.isPending}
            errorMessage={t(
              passwordForm.formState.errors.password?.message || '',
            )}
            error={!!passwordForm.formState.errors.password?.message}
            register={passwordForm.register}
          />

          <FormInputField
            label={t('auth:register.confirmPasswordLabel')}
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled={registerMutation.isPending}
            errorMessage={t(
              passwordForm.formState.errors.confirmPassword?.message || '',
            )}
            error={!!passwordForm.formState.errors.confirmPassword?.message}
            register={passwordForm.register}
          />

          <Separator />
          <ButtonFull
            type="submit"
            disabled={isPending}
            buttonStyle={{ backgroundColor: 'var(--accent)' }}
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              t('auth:register.submit')
            )}
          </ButtonFull>

          <Separator height="h-2" />

          <ButtonBorder
            type="button"
            onClick={() => setStep(1)}
            disabled={isPending}
            buttonStyle={{ color: 'var(--text)' }}
            text={t('auth:register.backButton')}
          />
        </form>
      )}
    </AuthCard>
  );
}

export default RegisterScreen;
