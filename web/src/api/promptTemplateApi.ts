// 提示词模板相关的API接口

import { useAuthStore } from "../stores/authStore";

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  isShared: boolean;
  shareTime?: string;
  viewCount: number;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  creatorName?: string;
  createdTime: string;
  updatedTime: string;
}

export interface CreatePromptTemplateInput {
  title: string;
  description: string;
  content: string;
  tags: string[];
}

export interface UpdatePromptTemplateInput {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
}

export interface PromptTemplateSearchInput {
  searchText?: string;
  isFavorite?: boolean;
  isShared?: boolean;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string; // UpdatedTime, ViewCount, LikeCount, CreatedTime
  sortOrder?: string; // asc, desc
}

export interface SharedPromptTemplateSearchInput {
  searchText?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string; // ViewCount, LikeCount, ShareTime, CreatedTime
  sortOrder?: string; // asc, desc
}

export interface PromptTemplateSearchResponse {
  success: boolean;
  data: {
    items: PromptTemplate[];
    total: number;
    page: number;
    pageSize: number;
  };
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 获取API基础URL
const getApiBaseUrl = () => {
  return '/v1/prompt-templates';
};

// 获取认证头
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// 搜索提示词模板
export const searchPromptTemplates = async (
  input: PromptTemplateSearchInput = {}
): Promise<PromptTemplateSearchResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/search`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      searchText: input.searchText || '',
      isFavorite: input.isFavorite,
      isShared: input.isShared,
      tags: input.tags || [],
      page: input.page || 1,
      pageSize: input.pageSize || 20,
      sortBy: input.sortBy || 'UpdatedTime',
      sortOrder: input.sortOrder || 'desc',
    }),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 搜索分享的提示词模板
export const searchSharedPromptTemplates = async (
  input: SharedPromptTemplateSearchInput = {}
): Promise<PromptTemplateSearchResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/shared/search`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      searchText: input.searchText || '',
      tags: input.tags || [],
      page: input.page || 1,
      pageSize: input.pageSize || 20,
      sortBy: input.sortBy || 'ViewCount',
      sortOrder: input.sortOrder || 'desc',
    }),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 创建提示词模板
export const createPromptTemplate = async (
  input: CreatePromptTemplateInput
): Promise<ApiResponse<PromptTemplate>> => {
  const response = await fetch(`${getApiBaseUrl()}/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 更新提示词模板
export const updatePromptTemplate = async (
  input: UpdatePromptTemplateInput
): Promise<ApiResponse<PromptTemplate>> => {
  const response = await fetch(`${getApiBaseUrl()}/update`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 删除提示词模板
export const deletePromptTemplate = async (id: string): Promise<ApiResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/delete/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 切换收藏状态
export const toggleFavorite = async (id: string): Promise<ApiResponse<{ isFavorite: boolean }>> => {
  const response = await fetch(`${getApiBaseUrl()}/toggle-favorite/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 切换分享状态
export const toggleShare = async (id: string): Promise<ApiResponse<{ isShared: boolean; shareTime?: string }>> => {
  const response = await fetch(`${getApiBaseUrl()}/toggle-share/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 切换点赞状态
export const toggleLike = async (id: string): Promise<ApiResponse<{ likeCount: number; isLiked: boolean }>> => {
  const response = await fetch(`${getApiBaseUrl()}/toggle-like/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 增加使用次数
export const incrementUsage = async (id: string): Promise<ApiResponse<{ usageCount: number }>> => {
  const response = await fetch(`${getApiBaseUrl()}/increment-usage/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 增加查看次数
export const incrementView = async (id: string): Promise<ApiResponse<{ viewCount: number }>> => {
  const response = await fetch(`${getApiBaseUrl()}/increment-view/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 获取单个提示词模板
export const getPromptTemplate = async (id: string): Promise<ApiResponse<PromptTemplate>> => {
  const response = await fetch(`${getApiBaseUrl()}/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// 获取分享的提示词模板详情
export const getSharedPromptTemplate = async (id: string): Promise<ApiResponse<PromptTemplate>> => {
  const response = await fetch(`${getApiBaseUrl()}/shared/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  // 如果401，则提示请先登录
  if (response.status === 401) {
    // 跳转到登录页面，清空token
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}; 