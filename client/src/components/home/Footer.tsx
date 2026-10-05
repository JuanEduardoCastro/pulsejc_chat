import { GITHUB_URL } from '@/constants/home';
import { Link } from 'react-router-dom';
import GithubIcon from '@/assets/icons/github.svg?react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';

function Footer() {
  const { t } = useTranslation('home');
  const user = useAuthStore((state) => state.user);
  return (
    <footer
      className="border-t px-4 py-8 sm:px-6"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="mx-auto flex max-w-6xl flex-col items-center 
  justify-between gap-4 text-sm sm:flex-row"
      >
        <p className="text-xs">
          © {new Date().getFullYear()} Pulse.Jc — {t('footer.author')}
        </p>
        <div className="flex items-center gap-6">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:opacity-80"
          >
            <GithubIcon className="h-4 w-4" />
            {t('footer.github')}
          </a>
          {!user && (
            <Link to="/login" className="hover:opacity-80">
              {t('footer.login')}
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
