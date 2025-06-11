// 用户认证相关的 API 接口

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  email?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  email: string;
  createdTime: string;
  lastLoginTime?: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

const getApiBaseUrl = () => '/v1/auth';

// 用户登录
export const loginWithPassword = async (input: LoginInput): Promise<ApiResponse<LoginResponse>> => {
  const response = await fetch(`${getApiBaseUrl()}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('用户名或密码错误');
    } else if (response.status === 400) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || '请求参数错误');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  return await response.json();
};

// 用户注册
export const registerUser = async (input: RegisterInput): Promise<ApiResponse<LoginResponse>> => {
  const response = await fetch(`${getApiBaseUrl()}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    if (response.status === 409) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || '用户名或邮箱已存在');
    } else if (response.status === 400) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || '请求参数错误');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  return await response.json();
};

// 检查用户名是否可用
export const checkUsernameAvailable = async (username: string): Promise<ApiResponse<{ isAvailable: boolean }>> => {
  const response = await fetch(`${getApiBaseUrl()}/check-username/${encodeURIComponent(username)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}; 