import OpenAI from 'openai';
import { useAuthStore } from '../stores/authStore';

// LLM客户端配置接口
export interface LLMConfig {
  apiKey: string;
  baseURL: string;
}

// 游客模式配置存储key
const GUEST_CONFIG_KEY = 'guest-llm-config';

// 创建OpenAI客户端单例
let openaiInstance: OpenAI | null = null;
let currentConfig: LLMConfig | null = null;

/**
 * 获取游客模式的LLM配置
 */
export const getGuestLLMConfig = (): LLMConfig | null => {
  try {
    const stored = localStorage.getItem(GUEST_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * 设置游客模式的LLM配置
 */
export const setGuestLLMConfig = (config: LLMConfig): void => {
  localStorage.setItem(GUEST_CONFIG_KEY, JSON.stringify(config));
  resetLLMClient(); // 重置客户端以使用新配置
};

/**
 * 清除游客模式的LLM配置
 */
export const clearGuestLLMConfig = (): void => {
  localStorage.removeItem(GUEST_CONFIG_KEY);
  resetLLMClient();
};

/**
 * 获取当前有效的LLM配置
 */
export const getCurrentLLMConfig = (): LLMConfig | null => {
  const authState = useAuthStore.getState();
  
  if (authState.isAuthenticated && authState.token) {
    // 登录用户使用默认配置
    return {
      apiKey: authState.token,
      baseURL: '/openai'
    };
  } else {
    // 游客模式使用自定义配置
    return getGuestLLMConfig();
  }
};

/**
 * 获取LLM客户端实例
 * @returns OpenAI客户端实例，如果配置无效则返回null
 */
export const getLLMClient = (): OpenAI | null => {
  const config = getCurrentLLMConfig();
  
  if (!config || !config.apiKey || !config.baseURL) {
    return null;
  }
  
  // 如果配置没有变化，返回现有实例
  if (openaiInstance && currentConfig && 
      currentConfig.apiKey === config.apiKey && 
      currentConfig.baseURL === config.baseURL) {
    return openaiInstance;
  }
  
  // 创建新的客户端实例
  currentConfig = config;
  openaiInstance = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: true
  });
  
  return openaiInstance;
};

/**
 * 重置LLM客户端实例
 * 在用户登录状态变化或游客配置变化时调用
 */
export const resetLLMClient = (): void => {
  openaiInstance = null;
  currentConfig = null;
};

/**
 * 检查是否有可用的LLM配置
 */
export const hasValidLLMConfig = (): boolean => {
  const config = getCurrentLLMConfig();
  return !!(config && config.apiKey && config.baseURL);
};

/**
 * 检查当前是否为游客模式
 */
export const isGuestMode = (): boolean => {
  const authState = useAuthStore.getState();
  return !authState.isAuthenticated;
};

/**
 * 获取模型列表
 */
export const fetchModels = async (): Promise<{ value: string; label: string }[]> => {
  const config = getCurrentLLMConfig();
  if (!config) {
    throw new Error('没有可用的LLM配置');
  }
  
  try {
    const response = await fetch(`${config.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取模型列表失败: ${response.status}`);
    }
    
    const data: { data: Array<{ id: string; type: string }> } = await response.json();
    
    // 过滤出 type === 'chat' 的模型
    const chatModels = data.data
      .filter(model => model.type === 'chat')
      .map(model => ({
        value: model.id,
        label: model.id
      }));
    
    return chatModels;
  } catch (error) {
    console.error('获取模型列表失败:', error);
    // 返回默认模型列表作为备选
    return [
      { value: 'claude-sonnet-4-20250514', label: 'claude-sonnet-4-20250514' },
      { value: 'gpt-4o', label: 'gpt-4o' },
      { value: 'gpt-4.1', label: 'gpt-4.1' },
      { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
    ];
  }
}; 