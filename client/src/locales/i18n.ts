import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './en/common.json';
import commonEs from './es/common.json';
import authEn from './en/auth.json';
import authEs from './es/auth.json';
import chatEn from './en/chat.json';
import chatEs from './es/chat.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: commonEn, auth: authEn, chat: chatEn },
      es: { common: commonEs, auth: authEs, chat: chatEs },
    },
    ns: ['common', 'auth', 'chat'],
    defaultNS: 'common',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
