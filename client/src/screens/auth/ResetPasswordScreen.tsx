import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import AuthCard from '@/components/AuthCard';
import { api } from '@/lib/axios';

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
        <div>
          <label htmlFor="password" className="mb-1 block text-sm">
            {t('auth:resetPassword.passwordLabel')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            disabled={resetPasswordMutation.isPending}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--border)' }}
            {...register('password')}
          />
          {errors.password?.message && (
            <p className="mt-1 text-sm text-red-500">
              {t(errors.password.message)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm">
            {t('auth:resetPassword.confirmPasswordLabel')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled={resetPasswordMutation.isPending}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--border)' }}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword?.message && (
            <p className="mt-1 text-sm text-red-500">
              {t(errors.confirmPassword.message)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={resetPasswordMutation.isPending}
          className="mt-2 flex items-center justify-center rounded-md px-4 py-2 font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {resetPasswordMutation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2   border-white/40 border-t-white" />
          ) : (
            t('auth:resetPassword.submit')
          )}
        </button>
      </form>
    </AuthCard>
  );
}

export default ResetPasswordScreen;
