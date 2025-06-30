import OpenAI from 'openai';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import type { AIServiceConfigListDto } from '../api/aiServiceConfig';

// LLM客户端配置接口
export interface LLMConfig {
  apiKey: string;
  endpoint?: string;
  provider?: string;
}

// 会话级别的AI服务配置接口
export interface SessionAIConfig {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  apiKey: string;
  chatModels: string[];
  defaultChatModel?: string;
}

// 创建OpenAI客户端单例
let openaiInstance: OpenAI | null = null;
let currentConfig: LLMConfig | null = null;

// 会话级别的配置缓存
let sessionConfig: SessionAIConfig | null = null;

/**
 * 设置会话级别的AI服务配置
 */
export const setSessionAIConfig = (config: AIServiceConfigListDto | null): void => {
  if (config) {
    sessionConfig = {
      id: config.id,
      name: config.name,
      provider: config.provider,
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey || '', // 注意：这里需要解密后的API密钥
      chatModels: config.chatModels || [],
      defaultChatModel: config.defaultChatModel,
    };
  } else {
    sessionConfig = null;
  }

  // 重置客户端实例，强制使用新配置
  resetLLMClient();
};

/**
 * 获取当前会话的AI服务配置
 */
export const getSessionAIConfig = (): SessionAIConfig | null => {
  return sessionConfig;
};

/**
 * 清除LLM配置
 */
export const clearLLMConfig = (): void => {
  resetLLMClient();
};

/**
 * 获取当前有效的LLM配置
 * 优先使用新的AI服务配置系统，然后回退到旧的会话配置，最后回退到全局配置
 */
export const getCurrentLLMConfig = (): LLMConfig | null => {
  // 1. 优先使用新的AI服务配置系统
  const chatState = useChatStore.getState();
  if (chatState.sessionAIConfig) {
    return {
      apiKey: chatState.sessionAIConfig.apiKey,
      endpoint: chatState.sessionAIConfig.apiEndpoint,
      provider: chatState.sessionAIConfig.provider,
    };
  }

  // 2. 回退到旧的会话级别配置
  if (sessionConfig) {
    return {
      apiKey: sessionConfig.apiKey,
      endpoint: sessionConfig.apiEndpoint,
      provider: sessionConfig.provider,
    };
  }

  // 3. 回退到全局配置
  const authState = useAuthStore.getState();
  const { systemInfo } = useAuthStore.getState();

  if (systemInfo?.builtInApiKey === true) {
    return {
      apiKey: 'sk-1234567890',
    };
  }

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
  const { systemInfo } = useAuthStore.getState();

  let apiKey = config?.apiKey;
  let baseURL = `${window.location.origin}/openai`;

  if (systemInfo?.builtInApiKey === true) {
    apiKey = "sk-1234567890";
  } else {
    if (!config || !config.apiKey) {
      return null;
    }
  }

  // 如果使用会话级别的配置，需要检查更多参数
  const configKey = sessionConfig
    ? `${sessionConfig.id}-${sessionConfig.apiKey}-${sessionConfig.apiEndpoint}`
    : apiKey;

  // 如果配置没有变化，返回现有实例
  if (openaiInstance && currentConfig &&
    currentConfig.apiKey === apiKey &&
    (!sessionConfig || currentConfig.endpoint === sessionConfig.apiEndpoint)) {
    return openaiInstance;
  }

  // 创建新的客户端实例
  currentConfig = config;
  openaiInstance = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
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
 * 清除会话级别的配置
 */
export const clearSessionConfig = (): void => {
  sessionConfig = null;
  resetLLMClient();
};

/**
 * 检查是否有可用的LLM配置
 */
export const hasValidLLMConfig = (): boolean => {
  // 1. 优先检查新的AI服务配置系统
  const chatState = useChatStore.getState();
  if (chatState.sessionAIConfig && chatState.sessionAIConfig.apiKey && chatState.sessionAIConfig.apiKey.trim() !== '') {
    return true;
  }

  // 2. 检查旧的会话级别配置
  if (sessionConfig && sessionConfig.apiKey && sessionConfig.apiKey.trim() !== '') {
    return true;
  }

  // 3. 检查全局配置
  const { systemInfo } = useAuthStore.getState();

  if (systemInfo?.builtInApiKey) {
    return true;
  }

  const config = getCurrentLLMConfig();
  return !!(config && config.apiKey && config.apiKey.trim() !== '');
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
        'api-key': config.apiKey,
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