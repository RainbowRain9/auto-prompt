import OpenAI from 'openai';
import { useAuthStore } from '../stores/authStore';

// LLM客户端配置接口
export interface LLMConfig {
  apiKey: string;
}

// 创建OpenAI客户端单例
let openaiInstance: OpenAI | null = null;
let currentConfig: LLMConfig | null = null;

/**
 * 清除LLM配置
 */
export const clearLLMConfig = (): void => {
  resetLLMClient();
};

/**
 * 获取当前有效的LLM配置
 */
export const getCurrentLLMConfig = (): LLMConfig | null => {
  const authState = useAuthStore.getState();

  if (authState.isAuthenticated && authState.apiKey) {
    return {
      apiKey: authState.apiKey,
    };
  }

  return null;
};

/**
 * 获取LLM客户端实例
 * @returns OpenAI客户端实例，如果配置无效则返回null
 */
export const getLLMClient = (): OpenAI | null => {
  const config = getCurrentLLMConfig();

  if (!config || !config.apiKey) {
    return null;
  }

  // 如果配置没有变化，返回现有实例
  if (openaiInstance && currentConfig &&
    currentConfig.apiKey === config.apiKey) {
    return openaiInstance;
  }

  // 创建新的客户端实例
  currentConfig = config;
  openaiInstance = new OpenAI({
    apiKey: config.apiKey,
    baseURL: `${window.location.origin}/openai`,
    dangerouslyAllowBrowser: true
  });

  return openaiInstance;
};

/**
 * 重置LLM客户端实例
 * 在用户登录状态变化或配置变化时调用
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
  return !!(config && config.apiKey );
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
    const response = await fetch(`${window.location.origin}/openai`, {
      headers: {
        'prompt-key': config.apiKey,
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

    // 如果=0则不过滤
    if (chatModels.length === 0) {
      return data.data.map(model => ({
        value: model.id,
        label: model.id
      }));
    }

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