import { authenticatedFetch } from '../utils/apiUtils';

// 获取API基础URL
const getApiBaseUrl = () => {
  return '/api/v1';
};

// 获取所有可用模型
export const getModels = async (): Promise<string[]> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/models`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};
  