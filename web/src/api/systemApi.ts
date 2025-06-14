import { authenticatedFetch } from "../utils/apiUtils";

interface SystemInfo{
    builtInApiKey:boolean;
    version:string;
}

// 获取API基础URL
const getApiBaseUrl = () => {
    return '/v1/system';
  };

// 获取系统信息 - 不需要认证
export const getSystemInfo = async (): Promise<SystemInfo> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/info`, {
    method: 'GET',
    requireAuth: false, // 获取系统信息不需要认证
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};