import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/stores/authStore';

function OAuthCallbackScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);
  const setUser = useAuthStore((state) => state.setUser);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    api
      .get<AuthUser>('/users/me')
      .then((res) => {
        setUser(res.data);
        navigate('/chat', { replace: true });
      })
      .catch(() => {
        useAuthStore.getState().logout();
        toast.error(t('auth:oauthCallback.error'));
        navigate('/login', { replace: true });
      });
  }, [navigate, setUser, t]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2"
        style={{
          borderColor: 'var(--border)',
          borderTopColor: 'var(--accent)',
        }}
      />
    </div>
  );
}

export default OAuthCallbackScreen;
