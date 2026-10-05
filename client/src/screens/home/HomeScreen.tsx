import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import GithubIcon from '@/assets/icons/github.svg?react';
import {
  BTN_BASE,
  BUILT,
  FEATURES,
  ghostStyle,
  GITHUB_URL,
  gradientText,
  primaryStyle,
  STACK,
  STATS,
} from '@/constants/home';
import ChatMockup from '@/components/home/ChatMockup';
import SectionHeader from '@/components/home/SectionHeader';
import Card from '@/components/home/Card';
import Footer from '@/components/home/Footer';
import NavBar from '@/components/home/NavBar';

function HomeScreen() {
  const { t, i18n } = useTranslation('home');
  const user = useAuthStore((state) => state.user);
  const isEs = i18n.resolvedLanguage === 'es';
  const primaryTo = user ? '/chat' : '/register';

  return (
    <div
      className="min-h-svh"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* NAV */}
      <NavBar />

      {/* HERO */}
      <section
        className="relative overflow-hidden px-4 pt-28 pb-16 sm:px-6
  md:pt-36"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% 0%, var(--accent-border) 0%, transparent 65%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
          <div className="text-center md:text-left">
            <span
              className="mx-8 md:mx-1 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wider uppercase"
              style={{
                borderColor: 'var(--accent-border)',
                color: 'var(--accent)',
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              />
              {t('hero.badge')}
            </span>
            <h1
              className={`mb-6 leading-[1.08] tracking-tight font-extrabold ${isEs ? 'text-3xl sm:text-4xl lg:text-5xl ' : 'text-4xl sm:text-5xl lg:text-6xl'}`}
              style={{ color: 'var(--text-h)' }}
            >
              {t('hero.titleLine1')}
              <br />
              <span style={gradientText}>{t('hero.titleLine2')}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-lg text-base sm:text-lg md:mx-0">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                to={primaryTo}
                className={`${BTN_BASE} w-49 px-6 py-3 text-sm`}
                style={primaryStyle}
              >
                {user ? t('nav.openApp') : t('hero.ctaPrimary')}
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${BTN_BASE} w-49 border px-6 py-3 text-sm`}
                style={ghostStyle}
              >
                <GithubIcon className="h-4 w-4" />
                {t('hero.ctaGithub')}
              </a>
            </div>
          </div>
          <ChatMockup />
        </div>

        <div
          className="relative mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-8  border-t pt-10 text-center sm:grid-cols-4"
          style={{ borderColor: 'var(--border)' }}
        >
          {STATS.map((key) => (
            <div key={key}>
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--text-h)' }}
              >
                {t(`stats.${key}.value`)}
              </p>
              <p className="mt-1 text-xs tracking-wide">
                {t(`stats.${key}.label`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="border-t px-4 py-24 sm:px-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            label={t('features.label')}
            title={t('features.title')}
            subtitle={t('features.subtitle')}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon }) => (
              <Card
                key={key}
                icon={icon}
                title={t(`features.items.${key}.title`)}
                desc={t(`features.items.${key}.desc`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT'S BUILT */}
      <section
        className="border-t px-4 py-24 sm:px-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            label={t('built.label')}
            title={t('built.title')}
            subtitle={t('built.subtitle')}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BUILT.map(({ key, icon }) => (
              <Card
                key={key}
                icon={icon}
                title={t(`built.items.${key}.title`)}
                desc={t(`built.items.${key}.desc`)}
              />
            ))}
          </div>

          <p className="mt-16 mb-6 text-center text-xs font-semibold  tracking-widest uppercase">
            {t('built.stackLabel')}
          </p>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2.5">
            {STACK.map((tech) => (
              <span
                key={tech}
                className="rounded-full border px-4 py-1.5 text-sm transition  hover:-translate-y-px"
                style={{ borderColor: 'var(--border)' }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <div
          className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border px-6 py-14 text-center"
          style={{ borderColor: 'var(--accent-border)' }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(ellipse 70% 80% at 50% 100%, var(--accent-border) 0%, transparent 70%)',
            }}
          />
          <h2
            className="relative mb-3 text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-h)' }}
          >
            {t('cta.title')}
          </h2>
          <p className="relative mb-8">{t('cta.subtitle')}</p>
          <Link
            to={primaryTo}
            className={`${BTN_BASE} w-49 relative px-6 py-3 text-sm`}
            style={primaryStyle}
          >
            {user ? t('nav.openApp') : t('cta.button')}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default HomeScreen;
