import { useAuthStore } from "../stores/authStore";

// 获取认证头 - 智能判断是否需要认证
export const getAuthHeaders = (options: { 
  requireAuth?: boolean;
  contentType?: string;
} = {}) => {
  const { 
    requireAuth = true, 
    contentType = 'application/json' 
  } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': contentType,
  };
  
  if (requireAuth) {
    const { token, systemInfo } = useAuthStore.getState();
    
    if (token) {
      // 使用用户token认证
      headers['Authorization'] = `Bearer ${token}`;
      
      // 如果有内置API Key，添加特殊标识告诉后端使用内置API Key
      if (systemInfo?.builtInApiKey) {
        headers['X-Built-In-API-Key'] = 'true';
      }
    }
  }
  
  return headers;
};

// 检查API配置是否就绪
export const isApiConfigReady = (): boolean => {
  const { systemInfo, apiKey } = useAuthStore.getState();
  
  // 如果有内置API Key，直接就绪
  if (systemInfo?.builtInApiKey) {
    return true;
  }
  
  // 否则需要用户配置API Key
  return !!(apiKey && apiKey.trim().length > 0);
};

// 检查API调用是否需要认证
export const shouldRequireApiAuth = (): boolean => {
  const { systemInfo, isAuthenticated } = useAuthStore.getState();
  
  // 如果有内置API Key，不需要传统认证
  if (systemInfo?.builtInApiKey) {
    return false;
  }
  
  // 否则需要用户认证
  return isAuthenticated;
};

// 通用的fetch包装器，自动处理认证
export const authenticatedFetch = async (
  url: string, 
  options: RequestInit & { requireAuth?: boolean } = {}
): Promise<Response> => {
  const { requireAuth = true, ...fetchOptions } = options;
  
  const headers = {
    ...getAuthHeaders({ requireAuth }),
    ...fetchOptions.headers,
  };
  
  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}; 