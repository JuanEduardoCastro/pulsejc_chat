import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import AuthCard from '@/components/auth/AuthCard';
import { api } from '@/lib/axios';
import FormInputField from '@/components/common/FormInputField';
import ButtonFull from '@/components/common/ButtonFull';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'auth:resetPassword.validation.passwordMinLength')
      .regex(/\d/, 'auth:resetPassword.validation.passwordNeedsNumber'),
    confirmPassword: z
      .string()
      .min(1, 'auth:resetPassword.validation.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth:resetPassword.validation.passwordsMismatch',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      api.post('/auth/reset-password', {
        token,
        newPassword: values.password,
      }),
    onSuccess: () => {
      toast.success(t('auth:resetPassword.successToast'));
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 400) {
        setError('root', {
          message: t('auth:resetPassword.invalidTokenDescription'),
        });
        return;
      }
      toast.error(t('auth:resetPassword.genericError'));
    },
  });

  if (!token || errors.root) {
    return (
      <AuthCard title={t('auth:resetPassword.invalidTokenTitle')}>
        <p className="text-center text-sm">
          {t('auth:resetPassword.invalidTokenDescription')}
        </p>
        <Link
          to="/forgot-password"
          className="mt-6 block text-center text-sm underline"
        >
          {t('auth:resetPassword.requestNewLink')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('auth:resetPassword.title')}>
      <form
        onSubmit={handleSubmit((values) =>
          resetPasswordMutation.mutate(values),
        )}
        className="flex flex-col gap-4"
      >
        <FormInputField
          label={t('auth:resetPassword.passwordLabel')}
          id="password"
          type="password"
          autoComplete="new-password"
          disabled={resetPasswordMutation.isPending}
          errorMessage={t(errors.password?.message || '')}
          error={!!errors.password?.message}
          register={register}
        />

        <FormInputField
          label={t('auth:resetPassword.confirmPasswordLabel')}
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          disabled={resetPasswordMutation.isPending}
          errorMessage={t(errors.confirmPassword?.message || '')}
          error={!!errors.confirmPassword?.message}
          register={register}
        />

        <ButtonFull
          type="submit"
          disabled={resetPasswordMutation.isPending}
          buttonStyle={{ backgroundColor: 'var(--accent)' }}
        >
          {resetPasswordMutation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2   border-white/40 border-t-white" />
          ) : (
            t('auth:resetPassword.submit')
          )}
        </ButtonFull>
      </form>
    </AuthCard>
  );
}

export default ResetPasswordScreen;
