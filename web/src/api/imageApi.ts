import { authenticatedFetch } from '../utils/apiUtils';

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

export interface GenerateImageInput {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
  numberOfImages?: number;
}

export interface UpdateGeneratedImageInput {
  id: string;
  isFavorite?: boolean;
  tags?: string[];
}

// 获取API基础URL
const getApiBaseUrl = () => {
  return '/v1/image';
};

export const saveGeneratedImage = async (input: SaveGeneratedImageInput[]): Promise<{ success: boolean; data?: GeneratedImageDto[]; message?: string }> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/save`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

export const getGeneratedImages = async (): Promise<{ success: boolean; data?: GeneratedImageDto[]; message?: string }> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/list`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

export const deleteGeneratedImage = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/delete/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

export const generateImage = async (input: GenerateImageInput): Promise<{ success: boolean; data?: GeneratedImageDto; message?: string }> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/generate`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

export const getImageHistory = async (): Promise<{ success: boolean; data?: GeneratedImageDto[]; message?: string }> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/history`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

export const downloadImage = async (url: string): Promise<Blob> => {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.blob();
};

export const updateGeneratedImage = async (input: UpdateGeneratedImageInput): Promise<{ success: boolean; data?: GeneratedImageDto; message?: string }> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/update`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

export const searchImages = async (input: ImageSearchInput): Promise<ImageSearchResponse> => {
  try {
    const response = await authenticatedFetch(`${getApiBaseUrl()}/search`, {
      method: 'POST',
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
    const response = await authenticatedFetch(`${getApiBaseUrl()}/update`, {
      method: 'POST',
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
    const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '删除图片失败' };
  }
};

export const getImage = async (id: string): Promise<{ success: boolean; data?: GeneratedImageDto; message?: string }> => {
  try {
    const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}`, {
      method: 'GET',
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '获取图片失败' };
  }
};

export const toggleImageFavorite = async (id: string): Promise<{ success: boolean; data?: { isFavorite: boolean }; message?: string }> => {
  try {
    const response = await authenticatedFetch(`${getApiBaseUrl()}/${id}/toggle-favorite`, {
      method: 'POST',
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message || '切换收藏状态失败' };
  }
}; 