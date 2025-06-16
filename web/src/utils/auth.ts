import { useAuthStore } from '../stores/authStore';

/**
 * 获取当前用户的认证 token
 * @returns token string or null
 */
export const getToken = (): string | null => {
  return useAuthStore.getState().token;
};

/**
 * 检查用户是否已认证
 * @returns boolean
 */
export const isAuthenticated = (): boolean => {
  return useAuthStore.getState().isAuthenticated;
};

/**
 * 获取 API 配置
 * @returns apiKey string or null
 */
export const getApiKey = (): string | null => {
  return useAuthStore.getState().apiKey;
}; 