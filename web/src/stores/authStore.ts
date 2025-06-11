import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resetLLMClient, clearLLMConfig } from '../utils/llmClient';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  apiKey: string | null;
  loginType: 'thor' | 'password' | null;
  login: (token: string, loginType: 'thor' | 'password') => void;
  logout: () => void;
  setApiConfig: (apiKey: string) => void;
  hasApiConfig: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      apiKey: null,
      loginType: null,
      login: (token: string, loginType: 'thor' | 'password') => {
        if (loginType === 'thor') {
          set({ 
            token, 
            isAuthenticated: true, 
            loginType,
            apiKey: token
          });
        } else {
          set({ 
            token, 
            isAuthenticated: true, 
            loginType,
            apiKey: null
          });
        }
        resetLLMClient();
      },
      logout: () => {
        set({ 
          token: null, 
          isAuthenticated: false, 
          apiKey: null,
          loginType: null
        });
        clearLLMConfig();
        resetLLMClient();
      },
      setApiConfig: (apiKey: string) => {
        set({ apiKey });
        resetLLMClient();
      },
      hasApiConfig: () => {
        const state = get();
        return !!(state.apiKey);
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