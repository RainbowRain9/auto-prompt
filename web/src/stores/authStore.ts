import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resetOpenAIClient } from '../utils/openaiClient';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      login: (token: string) => {
        set({ token, isAuthenticated: true });
        resetOpenAIClient();
      },
      logout: () => {
        set({ token: null, isAuthenticated: false });
        resetOpenAIClient();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const getLoginUrl = (redirectUri: string) => {
  return `https://api.token-ai.cn/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}; 