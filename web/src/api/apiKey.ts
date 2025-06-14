import { useAuthStore } from "../stores/authStore";
import { authenticatedFetch } from '../utils/apiUtils';

export interface ApiKeyDto {
  id: string;
  name: string;
  key: string;
  openAiApiKey: string;
  createdTime: string;
  lastUsedTime?: string;
  isEnabled: boolean;
  usageCount: number;
  description?: string;
  expiresAt?: string;
}

export interface ApiKeyListDto {
  id: string;
  name: string;
  key: string; // 已隐藏敏感信息
  createdTime: string;
  lastUsedTime?: string;
  isEnabled: boolean;
  usageCount: number;
  description?: string;
  expiresAt?: string;
  isExpired: boolean;
}

export interface CreateApiKeyInput {
  name: string;
  openAiApiKey: string;
  description?: string;
  expiresAt?: string;
}

export interface UpdateApiKeyInput {
  id: string;
  name: string;
  openAiApiKey: string;
  description?: string;
  isEnabled: boolean;
  expiresAt?: string;
}

export interface ApiKeySearchInput {
  searchText?: string;
  isEnabled?: boolean;
  isExpired?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ApiKeySearchResponse {
  items: ApiKeyListDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 获取API基础URL
const getApiBaseUrl = () => {
  return '/v1/apikeys';
};

// 搜索API Key
export const searchApiKeys = async (params: ApiKeySearchInput = {}): Promise<{
  success: boolean;
  data: ApiKeySearchResponse;
  message?: string;
}> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/search`, {
    method: 'POST',
    body: JSON.stringify({
      ...params,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
    }),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 创建API Key
export const createApiKey = async (params: CreateApiKeyInput): Promise<ApiResponse<ApiKeyDto>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/create`, {
    method: 'POST',
    body: JSON.stringify(params),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 更新API Key
export const updateApiKey = async (params: UpdateApiKeyInput): Promise<ApiResponse<ApiKeyDto>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/update`, {
    method: 'POST',
    body: JSON.stringify(params),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 删除API Key
export const deleteApiKey = async (id: string): Promise<ApiResponse> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/delete/${id}`, {
    method: 'POST',
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 获取单个API Key
export const getApiKey = async (id: string): Promise<ApiResponse<ApiKeyDto>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}`, {
    method: 'GET',
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 切换API Key启用状态
export const toggleApiKeyEnabled = async (id: string): Promise<ApiResponse<{ isEnabled: boolean }>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/toggle-enabled/${id}`, {
    method: 'POST',
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 重新生成API Key
export const regenerateApiKey = async (id: string): Promise<ApiResponse<ApiKeyDto>> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/regenerate/${id}`, {
    method: 'POST',
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}; 