import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?react';
import Footer from '@/components/home/Footer';
import NavBar, { type NavActions } from '@/components/home/NavBar';

type AuthCardProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  showHomeLink?: boolean;
  actions?: NavActions;
};

function AuthCard({
  title,
  children,
  footer,
  showHomeLink,
  actions,
}: AuthCardProps) {
  const { t } = useTranslation('auth');

  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <NavBar actions={actions} />
      <div
        className="flex flex-1 items-center justify-center px-4 pt-16"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div className="w-full max-w-sm">
          {showHomeLink && (
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-(--accent)"
              style={{ color: 'var(--text)' }}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {t('backToHome')}
            </Link>
          )}
          <div
            className="w-full max-w-sm rounded-2xl border-2 p-6 sm:p-8"
            style={{
              borderColor: 'var(--border)',
            }}
          >
            <h1
              className="mb-6 text-center text-2xl font-semibold"
              style={{ color: 'var(--text-h)' }}
            >
              {title}
            </h1>
            {children}
            {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AuthCard;
