import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zh from './locales/zh.json';
import en from './locales/en.json';

const resources = {
  zh: {
    translation: zh,
  },
  en: {
    translation: en,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // 不设置lng，让LanguageDetector自动检测浏览器语言
    fallbackLng: 'zh', // 如果检测不到支持的语言，则使用中文作为后备语言
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // 检测顺序：本地存储 -> 浏览器语言 -> HTML标签
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    // 支持的语言白名单
    supportedLngs: ['zh', 'en'],
    // 当检测到的语言不在支持列表中时，使用后备语言
    nonExplicitSupportedLngs: true,
  });

export default i18n; 