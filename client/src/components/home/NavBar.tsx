import { BTN_BASE, ghostStyle, ICONS, primaryStyle } from '@/constants/home';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useTranslation } from 'react-i18next';
import PulseIcon from '@/assets/icons/pulse.svg?react';

export type NavActions = 'both' | 'login' | 'signup' | 'none';

type NavBarProps = {
  actions?: NavActions;
};

function NavBar({ actions = 'both' }: NavBarProps) {
  const { t, i18n } = useTranslation('home');
  const user = useAuthStore((state) => state.user);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  const isEs = i18n.resolvedLanguage === 'es';
  const primaryTo = user ? '/chat' : '/register';
  const showLogin = !user && (actions === 'both' || actions === 'login');
  const showPrimary = !!user || actions === 'both' || actions === 'signup';

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'color-mix(in srgb, var(--bg) 85%, transparent)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold"
          style={{ color: 'var(--text-h)' }}
        >
          <PulseIcon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <span>
            Pulse<span style={{ color: 'var(--accent)' }}>.Jc</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => void i18n.changeLanguage(isEs ? 'en' : 'es')}
            className="h-9 rounded-md px-2 text-xs font-semibold hover:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            style={{ color: 'var(--text-h)' }}
            aria-label={t('nav.toggleLanguage')}
            title={t('nav.toggleLanguage')}
          >
            {isEs ? 'EN' : 'ES'}
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            style={{ color: 'var(--text-h)' }}
            aria-label={t('nav.toggleTheme')}
            title={t('nav.toggleTheme')}
          >
            <Icon
              d={theme === 'light' ? ICONS.moon : ICONS.sun}
              className="h-4 w-4"
            />
          </button>

          {showLogin && (
            <Link
              to="/login"
              className={`${BTN_BASE} hidden border px-4 py-2 text-sm sm:inline-flex`}
              style={ghostStyle}
            >
              {t('nav.login')}
            </Link>
          )}
          {showPrimary && (
            <Link
              to={primaryTo}
              className={`${BTN_BASE} px-4 py-2 text-sm`}
              style={primaryStyle}
            >
              {user ? t('nav.openApp') : t('nav.signup')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
