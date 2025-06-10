import { useAuthStore } from "../stores/authStore";

// 获取API基础URL
const getApiBaseUrl = () => {
    return '/v1/models';
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
  export const getModels = async (): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return response.json();
  };
  