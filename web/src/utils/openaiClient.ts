import OpenAI from 'openai';
import { useAuthStore } from '../stores/authStore';

// 创建OpenAI客户端单例
let openaiInstance: OpenAI | null = null;

/**
 * 获取OpenAI客户端实例
 * @returns OpenAI客户端实例，如果未登录则返回null
 */
export const getOpenAIClient = (): OpenAI | null => {
  const token = useAuthStore.getState().token;
  
  if (!token) {
    return null;
  }
  
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: token,
      baseURL: 'https://api.token-ai.cn/v1',
      dangerouslyAllowBrowser: true  // 允许在浏览器中使用API KEY
    });
  }
  
  return openaiInstance;
};

/**
 * 重置OpenAI客户端实例
 * 在用户登录状态变化时调用
 */
export const resetOpenAIClient = (): void => {
  openaiInstance = null;
};

/**
 * 检查用户是否已登录
 * @returns 用户登录状态
 */
export const isAuthenticated = (): boolean => {
  return !!useAuthStore.getState().token;
}; 