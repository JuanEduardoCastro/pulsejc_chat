import { useTranslation } from 'react-i18next';

function GoogleAuthButton() {
  const { t } = useTranslation();
  return (
    <a
      href={`${import.meta.env.VITE_API_URL}/auth/google`}
      className="flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm"
      style={{ borderColor: 'var(--border)' }}
    >
      {t('auth:login.googleButton')}
    </a>
  );
}

export default GoogleAuthButton;
