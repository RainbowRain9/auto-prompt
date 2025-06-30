import { authenticatedFetch } from '../utils/apiUtils';

export interface AIServiceConfigDto {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  apiKey: string;
  chatModels: string[];
  imageModels: string[];
  defaultChatModel?: string;
  defaultImageModel?: string;
  isEnabled: boolean;
  isDefault: boolean;
  description?: string;
  extraConfig?: Record<string, any>;
  connectionStatus: string;
  lastTestTime?: string;
  lastTestError?: string;
  usageCount: number;
  lastUsedTime?: string;
  createdTime: string;
  updatedTime: string;
  sortOrder: number;
}

export interface AIServiceConfigListDto {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  maskedApiKey: string;
  chatModels: string[];
  imageModels: string[];
  defaultChatModel?: string;
  defaultImageModel?: string;
  isEnabled: boolean;
  isDefault: boolean;
  description?: string;
  connectionStatus: string;
  lastTestTime?: string;
  lastTestError?: string;
  usageCount: number;
  lastUsedTime?: string;
  createdTime: string;
  updatedTime: string;
  sortOrder: number;
}

export interface CreateAIServiceConfigInput {
  name: string;
  provider: string;
  apiEndpoint: string;
  apiKey: string;
  chatModels: string[];
  imageModels: string[];
  defaultChatModel?: string;
  defaultImageModel?: string;
  isEnabled: boolean;
  isDefault: boolean;
  description?: string;
  extraConfig?: Record<string, any>;
  sortOrder: number;
}

export interface UpdateAIServiceConfigInput {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  apiKey?: string;
  chatModels: string[];
  imageModels: string[];
  defaultChatModel?: string;
  defaultImageModel?: string;
  isEnabled: boolean;
  isDefault: boolean;
  description?: string;
  extraConfig?: Record<string, any>;
  sortOrder: number;
}

export interface AIServiceConfigSearchInput {
  searchText?: string;
  provider?: string;
  isEnabled?: boolean;
  connectionStatus?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: string;
}

export interface AIServiceConfigSearchResponse {
  items: AIServiceConfigListDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TestConnectionInput {
  provider: string;
  apiEndpoint: string;
  apiKey: string;
  testModel?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  availableModels?: string[];
  details?: Record<string, any>;
}

export interface AIProviderInfo {
  name: string;
  displayName: string;
  description: string;
  defaultEndpoint: string;
  supportedFeatures: string[];
  configTemplate?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 获取API基础URL
const getApiBaseUrl = () => {
  return '/api/v1/ai-service-configs';
};

// 搜索AI服务配置
export const searchAIServiceConfigs = async (
  params: AIServiceConfigSearchInput
): Promise<ApiResponse<AIServiceConfigSearchResponse>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/search`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response.json();
};

// 获取AI服务配置详情
export const getAIServiceConfig = async (id: string): Promise<ApiResponse<AIServiceConfigDto>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}`, {
    method: 'GET',
  });
  return response.json();
};

// 创建AI服务配置
export const createAIServiceConfig = async (
  input: CreateAIServiceConfigInput
): Promise<ApiResponse<AIServiceConfigDto>> => {
  const response = await authenticatedFetch(getApiBaseUrl(), {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.json();
};

// 更新AI服务配置
export const updateAIServiceConfig = async (
  input: UpdateAIServiceConfigInput
): Promise<ApiResponse<AIServiceConfigDto>> => {
  const response = await authenticatedFetch(getApiBaseUrl(), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return response.json();
};

// 删除AI服务配置
export const deleteAIServiceConfig = async (id: string): Promise<ApiResponse> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

// 设置默认配置
export const setDefaultAIServiceConfig = async (id: string): Promise<ApiResponse> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}/set-default`, {
    method: 'POST',
  });
  return response.json();
};

// 测试连接
export const testConnection = async (
  input: TestConnectionInput
): Promise<ApiResponse<TestConnectionResponse>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/test-connection`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.json();
};

// 测试已保存配置的连接
export const testSavedConfigConnection = async (
  id: string
): Promise<ApiResponse<TestConnectionResponse>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}/test-connection`, {
    method: 'POST',
  });
  return response.json();
};

// 获取AI服务提供商信息
export const getAIProviders = async (): Promise<ApiResponse<AIProviderInfo[]>> => {
  try {
    const url = `${getApiBaseUrl()}/providers`;
    console.log('调用AI提供商API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API返回数据:', data);

    return data;
  } catch (error) {
    console.error('getAIProviders API调用失败:', error);
    return {
      success: false,
      message: `API调用失败: ${(error as Error).message}`,
      data: []
    };
  }
};

// 获取用户配置列表（用于增强提示词服务）
export const getUserConfigs = async (): Promise<ApiResponse<any[]>> => {
  const response = await authenticatedFetch('/api/v1/enhanced-prompt/user-configs', {
    method: 'GET',
  });
  return response.json();
};

// 获取用户默认配置
export const getUserDefaultConfig = async (): Promise<ApiResponse<any>> => {
  const response = await authenticatedFetch('/api/v1/enhanced-prompt/default-config', {
    method: 'GET',
  });
  return response.json();
};

// 设置AI服务配置为全局默认
export const setGlobalDefaultAIServiceConfig = async (
  id: string
): Promise<ApiResponse> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}/set-global-default`, {
    method: 'POST',
  });
  return response.json();
};

// 获取当前全局默认配置
export const getGlobalDefaultAIServiceConfig = async (): Promise<ApiResponse<AIServiceConfigListDto>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/global-default`, {
    method: 'GET',
  });
  return response.json();
};

// 清除全局默认配置
export const clearGlobalDefaultAIServiceConfig = async (): Promise<ApiResponse> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/global-default`, {
    method: 'DELETE',
  });
  return response.json();
};

// 获取全局配置状态
export const getGlobalConfigStatus = async (): Promise<ApiResponse> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/global-status`, {
    method: 'GET',
  });
  return response.json();
};

// 获取会话级别配置（包含解密后的API密钥）
export const getSessionConfig = async (id: string): Promise<ApiResponse<AIServiceConfigListDto>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}/session-config`, {
    method: 'GET',
  });
  return response.json();
};
