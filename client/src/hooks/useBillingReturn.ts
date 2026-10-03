import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { AI_USAGE_QUERY_KEY } from '@/queries/useAiUsageQuery';

const MAX_ATTEMPS = 5;
const RETRY_DELAY_MS = 1500;

export function useBillingReturn() {
  const { t } = useTranslation('chat');
  const [searchParams, setSearchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const handledRef = useRef(false);

  useEffect(() => {
    const billing = searchParams.get('billing');
    if (!billing || handledRef.current) return;
    handledRef.current = true;
    setSearchParams({}, { replace: true });

    if (billing === 'cancel') {
      toast(t('plan.checkoutCanceled'));
      return;
    }

    async function refresUser() {
      for (let attempt = 1; attempt <= MAX_ATTEMPS; attempt++) {
        const { data } = await api.get<AuthUser>('/users/me');
        setUser(data);
        void queryClient.invalidateQueries({ queryKey: AI_USAGE_QUERY_KEY });
        if (billing !== 'success' || data.plan === 'PRO') {
          if (billing === 'success') toast(t('plan.upgradeSuccess'));
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
      toast(t('plan.upgradeProcessing'));
    }
    void refresUser().catch(() => toast.error(t('plan.genericError')));
  }, [searchParams, setSearchParams, setUser, t, queryClient]);
}
