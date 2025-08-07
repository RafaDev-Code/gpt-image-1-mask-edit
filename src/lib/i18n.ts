import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../../public/locales/en/common.json';
import enEditor from '../../public/locales/en/editor.json';
import esCommon from '../../public/locales/es/common.json';
import esEditor from '../../public/locales/es/editor.json';

const resources = {
  en: {
    common: enCommon,
    editor: enEditor,
  },
  es: {
    common: esCommon,
    editor: esEditor,
  },
};

// Only use language detector on client side
if (typeof window !== 'undefined') {
  i18n.use(LanguageDetector);
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: typeof window !== 'undefined' ? undefined : 'en', // Use 'en' on server, auto-detect on client
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Namespace configuration
    defaultNS: 'common',
    ns: ['common', 'editor'],
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;