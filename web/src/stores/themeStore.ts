import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        // 更新body类名
        document.body.className = newTheme;
      },
      setTheme: (theme: Theme) => {
        set({ theme });
        document.body.className = theme;
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// 初始化主题
export const initializeTheme = () => {
  const theme = useThemeStore.getState().theme;
  document.body.className = theme;
}; 