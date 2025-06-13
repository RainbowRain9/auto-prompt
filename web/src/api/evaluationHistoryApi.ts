import { getToken } from '../utils/auth';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = '/v1/evaluation-history';

// 评估记录数据结构（与 IndexedDB 保持兼容）
export interface EvaluationRecord {
  id: string;
  timestamp: number;
  date: string;
  title: string;
  config: {
    models: string[];
    prompt: string;
    request: string;
    executionCount: number;
    enableOptimization: boolean;
    exampleId?: string;
    exampleTitle?: string;
    exampleCategory?: string;
  };
  results: {
    [model: string]: {
      score: number;
      description: string;
      comment: string;
      tags: string[];
      executionCount: number;
      startTime: number;
      endTime: number;
      duration: number;
    };
  };
  statistics: {
    totalModels: number;
    completedModels: number;
    avgScore: number;
    totalTime: number;
    scoreDistribution: { [range: string]: number };
    tagDistribution: { [tag: string]: number };
  };
  createdTime?: string;
  updatedTime?: string;
  creatorName?: string;
}

export interface EvaluationRecordSearchInput {
  searchText?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateEvaluationRecordInput {
  title: string;
  config: EvaluationRecord['config'];
  results: EvaluationRecord['results'];
  statistics: EvaluationRecord['statistics'];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 获取请求头
const getHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// 处理认证错误
const handleAuthError = (response: Response) => {
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }
};

// 获取所有评估记录
export const getAllEvaluationRecords = async (): Promise<EvaluationRecord[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/all`, {
      method: 'GET',
      headers: getHeaders(),
    });

    handleAuthError(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<EvaluationRecord[]> = await response.json();
    
    if (result.success) {
      return result.data || [];
    } else {
      throw new Error(result.message || '获取评估记录失败');
    }
  } catch (error: any) {
    console.error('获取评估记录失败:', error);
    throw new Error(error.message || '获取评估记录失败');
  }
};

// 搜索评估记录
export const searchEvaluationRecords = async (input: EvaluationRecordSearchInput) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(input),
    });

    handleAuthError(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || '搜索评估记录失败');
    }
  } catch (error: any) {
    console.error('搜索评估记录失败:', error);
    throw new Error(error.message || '搜索评估记录失败');
  }
};

// 创建评估记录
export const createEvaluationRecord = async (input: CreateEvaluationRecordInput): Promise<EvaluationRecord> => {
  try {
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(input),
    });

    handleAuthError(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<EvaluationRecord> = await response.json();
    
    if (result.success) {
      return result.data!;
    } else {
      throw new Error(result.message || '创建评估记录失败');
    }
  } catch (error: any) {
    console.error('创建评估记录失败:', error);
    throw new Error(error.message || '创建评估记录失败');
  }
};

// 获取单个评估记录
export const getEvaluationRecord = async (id: string): Promise<EvaluationRecord> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    handleAuthError(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<EvaluationRecord> = await response.json();
    
    if (result.success) {
      return result.data!;
    } else {
      throw new Error(result.message || '获取评估记录失败');
    }
  } catch (error: any) {
    console.error('获取评估记录失败:', error);
    throw new Error(error.message || '获取评估记录失败');
  }
};

// 删除评估记录
export const deleteEvaluationRecord = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });

    handleAuthError(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '删除评估记录失败');
    }
  } catch (error: any) {
    console.error('删除评估记录失败:', error);
    throw new Error(error.message || '删除评估记录失败');
  }
};

// 清空所有评估记录
export const clearAllEvaluationRecords = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/clear-all`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });

    handleAuthError(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '清空评估记录失败');
    }
  } catch (error: any) {
    console.error('清空评估记录失败:', error);
    throw new Error(error.message || '清空评估记录失败');
  }
};

// 获取评估统计信息
export const getEvaluationStatistics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      method: 'GET',
      headers: getHeaders(),
    });

    handleAuthError(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || '获取统计信息失败');
    }
  } catch (error: any) {
    console.error('获取统计信息失败:', error);
    throw new Error(error.message || '获取统计信息失败');
  }
};

// 评估数据库类（兼容原有的 IndexedDB 接口）
export class EvaluationDB {
  async init(): Promise<void> {
    // 服务器端存储，不需要初始化
    return Promise.resolve();
  }

  async saveEvaluation(record: EvaluationRecord): Promise<void> {
    await createEvaluationRecord({
      title: record.title,
      config: record.config,
      results: record.results,
      statistics: record.statistics,
    });
  }

  async getAllEvaluations(): Promise<EvaluationRecord[]> {
    return await getAllEvaluationRecords();
  }

  async getEvaluationById(id: string): Promise<EvaluationRecord | null> {
    try {
      return await getEvaluationRecord(id);
    } catch (error) {
      return null;
    }
  }

  async deleteEvaluation(id: string): Promise<void> {
    await deleteEvaluationRecord(id);
  }

  async clearAllEvaluations(): Promise<void> {
    await clearAllEvaluationRecords();
  }

  async getStatistics() {
    return await getEvaluationStatistics();
  }
}

// 导出单例实例以保持兼容性
export const evaluationDB = new EvaluationDB(); 