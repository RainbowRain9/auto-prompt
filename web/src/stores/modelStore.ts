import { create } from 'zustand';
import { getModels } from '../api/modelApi';

export interface Model {
  id: string;
  objectType: string;
  created: number;
}

export interface ModelResponse {
  imageModels: Model[];
  chatModels: Model[];
}

interface ModelState {
  chatModels: Model[];
  defaultChatModel: string;
  defaultImageGenerationModel: string;
  imageModels: Model[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number;
  fetchModels: () => Promise<{
    defaultChatModel: string;
    defaultImageGenerationModel: string;
    imageModels: Model[];
    chatModels: Model[];
  }>;
  getChatModelOptions: () => { value: string; label: string }[];
  getImageModelOptions: () => { value: string; label: string }[];
}

// 缓存时间（毫秒）- 5分钟
const CACHE_DURATION = 5 * 60 * 1000;

export const useModelStore = create<ModelState>((set, get) => ({
  chatModels: [],
  imageModels: [],
  isLoading: false,
  error: null,
  lastFetched: 0,
  defaultImageGenerationModel: '',
  defaultChatModel: '',
  fetchModels: async () => {
    const { lastFetched, isLoading, defaultChatModel, defaultImageGenerationModel } = get();
    const now = Date.now();

    // 如果正在加载或缓存未过期，则返回当前默认值
    if (isLoading || (now - lastFetched < CACHE_DURATION && lastFetched > 0)) {
      return {
        defaultChatModel,
        defaultImageGenerationModel,
        imageModels: [],
        chatModels: [],
      };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await getModels();

      if (response && response.chatModels && response.imageModels) {
        set({
          chatModels: response.chatModels,
          imageModels: response.imageModels,
          defaultChatModel: response.defaultChatModel,
          defaultImageGenerationModel: response.defaultImageGenerationModel,
          lastFetched: now,
          isLoading: false,
          error: null,
        });

        return {
          defaultChatModel: response.defaultChatModel,
          defaultImageGenerationModel: response.defaultImageGenerationModel,
          imageModels: response.imageModels,
          chatModels: response.chatModels
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      set({
        error: error instanceof Error ? error.message : '获取模型列表失败',
        isLoading: false,
      });

      const defaultChatModels: Model[] = [
        { id: 'gpt-4o', objectType: 'model', created: Date.now() },
        { id: 'gpt-4o-mini', objectType: 'model', created: Date.now() },
        { id: 'gpt-4-turbo', objectType: 'model', created: Date.now() },
      ];

      const defaultImageModels: Model[] = [
        { id: 'gpt-image-1', objectType: 'model', created: Date.now() },
        { id: 'dall-e-3', objectType: 'model', created: Date.now() },
        { id: 'gpt-image-1', objectType: 'model', created: Date.now() },
      ];

      set({
        chatModels: defaultChatModels,
        imageModels: defaultImageModels,
        defaultChatModel: defaultChatModels[0].id,
        defaultImageGenerationModel: defaultImageModels[0].id,
        lastFetched: now,
      });

      return {
        defaultChatModel: defaultChatModels[0].id,
        defaultImageGenerationModel: defaultImageModels[0].id,
        imageModels: defaultImageModels,
        chatModels: defaultChatModels,
      };
    }
  },

  getChatModelOptions: () => {
    const { chatModels } = get();
    return chatModels.map(model => ({
      value: model.id,
      label: model.id,
    }));
  },

  getImageModelOptions: () => {
    const { imageModels } = get();
    return imageModels.map(model => ({
      value: model.id,
      label: model.id,
    }));
  },
})); 