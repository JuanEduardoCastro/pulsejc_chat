import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AuthCard from '@/components/auth/AuthCard';
import { api } from '@/lib/axios';
import ButtonFull from '@/components/common/ButtonFull';
import FormInputField from '@/components/common/FormInputField';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'auth:forgotPassword.validation.emailRequired')
    .email('auth:forgotPassword.validation.emailInvalid'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordScreen() {
  const { t } = useTranslation(['auth', 'common']);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      api.post('/auth/forgot-password', values),
    onError: () => {
      toast.error(t('auth:forgotPassword.genericError'));
    },
  });

  return (
    <AuthCard
      title={t('auth:forgotPassword.title')}
      footer={
        <Link
          to="/login"
          className="underline underline-offset-4"
          style={{ color: 'var(--accent)' }}
        >
          {t('auth:forgotPassword.backToLogin')}
        </Link>
      }
    >
      {forgotPasswordMutation.isSuccess ? (
        <p className="text-center text-sm">
          {t('auth:forgotPassword.successMessage')}
        </p>
      ) : (
        <form
          onSubmit={handleSubmit((values) =>
            forgotPasswordMutation.mutate(values),
          )}
          className="flex flex-col gap-4"
        >
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            {t('auth:forgotPassword.description')}
          </p>

          <FormInputField
            label={t('auth:forgotPassword.emailLabel')}
            id="email"
            type="email"
            autoComplete="email"
            disabled={forgotPasswordMutation.isPending}
            errorMessage={t(errors.email?.message || '')}
            error={!!errors.email?.message}
            register={register}
          />

          <ButtonFull
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            buttonStyle={{ backgroundColor: 'var(--accent)' }}
            children={
              forgotPasswordMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2   border-white/40 border-t-white" />
              ) : (
                t('auth:forgotPassword.submit')
              )
            }
          />
        </form>
      )}
    </AuthCard>
  );
}

export default ForgotPasswordScreen;
