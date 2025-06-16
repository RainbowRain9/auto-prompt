import { useAuthStore } from '../stores/authStore';

export interface GeneratedImageDto {
  id: string;
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
  type: string;
  model: string;
  size: string;
  quality?: string;
  style?: string;
  isFavorite: boolean;
  createdTime: string;
  userId: string;
  userName?: string;
  tags: string[];
  generationParams?: any;
}

export interface SaveGeneratedImageInput {
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
  type: string;
  model: string;
  size: string;
  quality?: string;
  style?: string;
  tags?: string[];
  generationParams?: any;
}

export interface ImageSearchInput {
  searchText?: string;
  type?: string;
  model?: string;
  isFavorite?: boolean;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface UpdateImageInput {
  id: string;
  isFavorite?: boolean;
  tags?: string[];
}

export interface ImageSearchResponse {
  success: boolean;
  data: {
    items: GeneratedImageDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  message?: string;
}

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const API_BASE_URL = '/v1/images';

export const saveGeneratedImage = async (input: SaveGeneratedImageInput): Promise<{ success: boolean; data?: GeneratedImageDto; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '保存图片失败' };
  }
};

export const saveGeneratedImages = async (inputs: SaveGeneratedImageInput[]): Promise<{ success: boolean; data?: GeneratedImageDto[]; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(inputs),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '批量保存图片失败' };
  }
};

export const searchImages = async (input: ImageSearchInput): Promise<ImageSearchResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    });
    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, data: { items: [], total: 0, page: 1, pageSize: 20 }, message: error.message || '搜索图片失败' };
  }
};

export const updateImage = async (input: UpdateImageInput): Promise<{ success: boolean; data?: GeneratedImageDto; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '更新图片失败' };
  }
};

export const deleteImage = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '删除图片失败' };
  }
};

export const getImage = async (id: string): Promise<{ success: boolean; data?: GeneratedImageDto; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '获取图片失败' };
  }
};

export const toggleImageFavorite = async (id: string): Promise<{ success: boolean; data?: { isFavorite: boolean }; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/toggle-favorite`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '切换收藏状态失败' };
  }
}; 