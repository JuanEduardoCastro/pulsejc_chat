import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { api } from '@/lib/axios';
import { useAuthStore, type AuthResponse } from '@/stores/authStore';
import AuthCard from '@/components/auth/AuthCard';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'auth:login.validation.emailRequired')
    .email('auth:login.validation.emailInvalid'),
  password: z.string().min(1, 'auth:login.validation.passwordRequired'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      api.post<AuthResponse>('/auth/login', values).then((res) => res.data),
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user);
      navigate('/chat', { replace: true });
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        toast.error(t('auth:login.invalidCredentials'));
        return;
      }
      toast.error(t('auth:login.genericError'));
    },
  });

  return (
    <AuthCard
      title={t('auth:login.title')}
      footer={
        <>
          <Link to="/forgot-password">{t('auth:login.forgotPassword')}</Link>
          <p className="mt-2">
            {t('auth:login.noAccount')}{' '}
            <Link to="/register">{t('auth:login.registerLink')}</Link>
          </p>
        </>
      }
    >
      <form
        action=""
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        className="flex flex-col gap-4"
      >
        <div className="">
          <label htmlFor="email" className="mb-1 block text-sm">
            {t('auth:login.emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            disabled={loginMutation.isPending}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--border)' }}
            {...register('email')}
          />
          {errors.email?.message && (
            <p className="mt-1 text-sm text-red-500">
              {t(errors.email.message)}
            </p>
          )}
        </div>

        <div className="">
          <label htmlFor="password" className="mb-1 block text-sm">
            {t('auth:login.passwordLabel')}
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={loginMutation.isPending}
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

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-2 flex items-center justify-center rounded-md px-4 py-2 font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {loginMutation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            t('auth:login.submit')
          )}
        </button>
      </form>

      <div
        className="my-4 flex items-center gap-3 text-sm"
        style={{ color: 'var(--text)' }}
      >
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
        {t('auth:login.or')}
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>
      <a
        href={`${import.meta.env.VITE_API_URL}/auth/google`}
        className="flex items-center justify-center gap-2 rounded-md border px-4 
  py-2 text-sm"
        style={{ borderColor: 'var(--border)' }}
      >
        {t('auth:login.googleButton')}
      </a>
    </AuthCard>
  );
}

export default LoginScreen;
