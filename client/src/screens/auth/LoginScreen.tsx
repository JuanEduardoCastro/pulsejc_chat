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
import FormInputField from '@/components/common/FormInputField';
import ButtonFull from '@/components/common/ButtonFull';
import GoogleAuthButton from '@/components/common/GoogleAuthButton';

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
            <Link
              className="underline underline-offset-4 "
              to="/register"
              style={{ color: 'var(--accent)' }}
            >
              {t('auth:login.registerLink')}
            </Link>
          </p>
        </>
      }
    >
      <form
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        className="flex flex-col"
      >
        <FormInputField
          label={t('auth:login.emailLabel')}
          id="email"
          type="email"
          autoComplete="email"
          disabled={loginMutation.isPending}
          register={register}
          errorMessage={t(errors.email?.message || '')}
          error={!!errors.email?.message}
        />

        <FormInputField
          label={t('auth:login.passwordLabel')}
          id="password"
          type="password"
          autoComplete="current-password"
          disabled={loginMutation.isPending}
          register={register}
          errorMessage={t(errors.password?.message || '')}
          error={!!errors.password?.message}
        />

        <ButtonFull
          type="submit"
          disabled={loginMutation.isPending}
          buttonStyle={{ backgroundColor: 'var(--accent)' }}
        >
          {loginMutation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            t('auth:login.submit')
          )}
        </ButtonFull>
      </form>

      <div
        className="my-4 flex items-center gap-3 text-sm"
        style={{ color: 'var(--text)' }}
      >
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
        {t('auth:login.or')}
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>

      <GoogleAuthButton />
    </AuthCard>
  );
}

export default LoginScreen;
