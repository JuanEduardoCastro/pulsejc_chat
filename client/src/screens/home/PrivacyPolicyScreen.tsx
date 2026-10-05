import NavBar from '@/components/home/NavBar';
import Footer from '@/components/home/Footer';
import { useTranslation } from 'react-i18next';
import LegalDocument, { type LegalContent } from './LegalDocument';
import privacyEn from '@/locales/en/privacy.json';
import privacyEs from '@/locales/es/privacy.json';

function PrivacyPolicyScreen() {
  const { i18n } = useTranslation();
  const content = (
    i18n.resolvedLanguage === 'es' ? privacyEs : privacyEn
  ) as LegalContent;

  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <NavBar actions="both" />
      <main className="flex-1">
        <LegalDocument content={content} />
      </main>
      <Footer />
    </div>
  );
}

export default PrivacyPolicyScreen;
