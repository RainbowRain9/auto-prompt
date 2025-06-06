import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resetLLMClient, clearGuestLLMConfig } from '../utils/llmClient';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  login: (token: string) => void;
  logout: () => void;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      isGuestMode: false,
      login: (token: string) => {
        set({ token, isAuthenticated: true, isGuestMode: false });
        resetLLMClient();
      },
      logout: () => {
        set({ token: null, isAuthenticated: false, isGuestMode: false });
        clearGuestLLMConfig();
        resetLLMClient();
      },
      enterGuestMode: () => {
        set({ token: null, isAuthenticated: false, isGuestMode: true });
        resetLLMClient();
      },
      exitGuestMode: () => {
        set({ isGuestMode: false });
        resetLLMClient();
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