import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  language: 'zh' | 'en';
  setLanguage: (language: 'zh' | 'en') => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'zh', // 默认中文
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
);

export const initializeLanguage = () => {
  const stored = localStorage.getItem('language-storage');
  if (!stored) {
    // 如果没有存储的语言偏好，检测浏览器语言
    const browserLang = navigator.language.toLowerCase();
    const language = browserLang.startsWith('zh') ? 'zh' : 'en';
    useLanguageStore.getState().setLanguage(language);
  }
}; 