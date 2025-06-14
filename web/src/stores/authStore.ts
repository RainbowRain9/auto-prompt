import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resetLLMClient, clearLLMConfig } from '../utils/llmClient';
import { getSystemInfo } from '../api/systemApi';

interface SystemInfo {
  builtInApiKey: boolean;
  version: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  apiKey: string | null;
  loginType: 'thor' | 'password' | 'builtin' | null;
  systemInfo: SystemInfo | null;
  systemInfoLoaded: boolean;
  login: (token: string, loginType: 'thor' | 'password') => void;
  logout: () => void;
  setApiConfig: (apiKey: string) => void;
  hasApiConfig: () => boolean;
  loadSystemInfo: () => Promise<void>;
  isSystemReady: () => boolean;
  shouldRequireLogin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      apiKey: null,
      loginType: null,
      systemInfo: null,
      systemInfoLoaded: false,
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
      loadSystemInfo: async () => {
        try {
          const systemInfo = await getSystemInfo();
          set({ 
            systemInfo, 
            systemInfoLoaded: true 
          });
          
          // 注意：即使有内置API Key，用户仍需要登录
          // 只是不需要配置API Key
        } catch (error) {
          console.error('Failed to load system info:', error);
          set({ 
            systemInfo: null, 
            systemInfoLoaded: true 
          });
        }
      },
      isSystemReady: () => {
        const state = get();
        if (!state.systemInfoLoaded) return false;
        
        // 需要用户登录
        if (!state.isAuthenticated) return false;
        
        // 如果有内置API Key，不需要用户配置API Key
        if (state.systemInfo?.builtInApiKey) return true;
        
        // 否则需要用户配置API Key
        return state.hasApiConfig();
      },
      shouldRequireLogin: () => {
        const state = get();
        // 无论是否有内置API Key，都需要用户登录
        return !state.isAuthenticated;
      }
    }),
    {
      name: 'auth-storage',
      // 不持久化systemInfo，每次启动都重新获取
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        apiKey: state.apiKey,
        loginType: state.loginType,
      }),
    }
  )
);

export const getLoginUrl = (redirectUri: string) => {
  return `https://api.token-ai.cn/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}; 