import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import Modal from './Modal';
import ButtonFull from '@/components/common/ButtonFull';

type RedirectResponse = { url: string };

function PlanModal() {
  const { t, i18n } = useTranslation('chat');
  const user = useAuthStore((state) => state.user);

  const redirect = ({ data }: { data: RedirectResponse }) => {
    window.location.href = data.url;
  };

  const onError = () => toast.error(t('plan.genericError'));

  const checkoutMutation = useMutation({
    mutationFn: () => api.post<RedirectResponse>('/billing/checkout-session'),
    onSuccess: redirect,
    onError,
  });

  const portalMutation = useMutation({
    mutationFn: () => api.post<RedirectResponse>('/billing/portal-session'),
    onSuccess: redirect,
    onError,
  });

  if (!user) return null;

  const isPro = user.plan === 'PRO';
  const isRedirecting =
    checkoutMutation.isPending ||
    checkoutMutation.isSuccess ||
    portalMutation.isPending ||
    portalMutation.isSuccess;
  const periodEnd = user.currentPeriodEnd
    ? new Date(user.currentPeriodEnd).toLocaleDateString(i18n.language)
    : null;

  return (
    <Modal title={t('plan.title')}>
      <p className="text-sm" style={{ color: 'var(--text)' }}>
        {t('plan.current')}:{' '}
        <span className="font-semibold" style={{ color: 'var(--text-h)' }}>
          {isPro ? 'Pro' : 'Free'}
        </span>
      </p>

      {isPro ? (
        <>
          {periodEnd && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
              {user.cancelAtPeriodEnd
                ? t('plan.endsOn', { date: periodEnd })
                : t('plan.renewsOn', { date: periodEnd })}
            </p>
          )}
          {user.subscriptionStatus === 'past_due' && (
            <p className="mt-2 text-sm text-red-500">{t('plan.pastDue')}</p>
          )}
          <ButtonFull
            type="button"
            text={t('plan.manage')}
            disabled={isRedirecting}
            onClick={() => portalMutation.mutate()}
            buttonClassName="mt-6 w-full"
          />
        </>
      ) : (
        <>
          <ul
            className="mt-4 list-disc space-y-1 pl-5 text-sm"
            style={{ color: 'var(--text)' }}
          >
            <li>{t('plan.proFeatureAi')}</li>
            <li>{t('plan.proFeatureSupport')}</li>
          </ul>
          <p
            className="mt-4 rounded-md border p-3 text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            {t('plan.testModeHint')}
          </p>
          <ButtonFull
            type="button"
            text={t('plan.upgrade')}
            disabled={isRedirecting}
            onClick={() => checkoutMutation.mutate()}
            buttonClassName="mt-6 w-full"
          />
        </>
      )}
    </Modal>
  );
}

export default PlanModal;
