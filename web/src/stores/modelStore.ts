import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  imageModels: Model[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number;
  fetchModels: () => Promise<void>;
  getChatModelOptions: () => { value: string; label: string }[];
  getImageModelOptions: () => { value: string; label: string }[];
}

// 缓存时间（毫秒）- 5分钟
const CACHE_DURATION = 5 * 60 * 1000;

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      chatModels: [],
      imageModels: [],
      isLoading: false,
      error: null,
      lastFetched: 0,

      fetchModels: async () => {
        const { lastFetched, isLoading } = get();
        const now = Date.now();

        // 如果正在加载或缓存未过期，则跳过
        if (isLoading || (now - lastFetched < CACHE_DURATION && lastFetched > 0)) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await getModels();
          
          if (response && response.chatModels && response.imageModels) {
            set({
              chatModels: response.chatModels,
              imageModels: response.imageModels,
              lastFetched: now,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error('获取模型列表失败:', error);
          set({
            error: error instanceof Error ? error.message : '获取模型列表失败',
            isLoading: false,
          });
          
          // 如果API调用失败，使用默认模型列表
          const defaultChatModels: Model[] = [
            { id: 'gpt-4o', objectType: 'model', created: Date.now() },
            { id: 'gpt-4o-mini', objectType: 'model', created: Date.now() },
            { id: 'gpt-4-turbo', objectType: 'model', created: Date.now() },
            { id: 'gpt-3.5-turbo', objectType: 'model', created: Date.now() },
            { id: 'claude-3-5-sonnet-20241022', objectType: 'model', created: Date.now() },
            { id: 'claude-3-5-haiku-20241022', objectType: 'model', created: Date.now() },
            { id: 'claude-3-opus-20240229', objectType: 'model', created: Date.now() },
            { id: 'gemini-pro', objectType: 'model', created: Date.now() },
            { id: 'gemini-1.5-pro', objectType: 'model', created: Date.now() },
            { id: 'deepseek-chat', objectType: 'model', created: Date.now() },
            { id: 'qwen-max', objectType: 'model', created: Date.now() },
            { id: 'glm-4', objectType: 'model', created: Date.now() },
          ];

          const defaultImageModels: Model[] = [
            { id: 'gpt-image-1', objectType: 'model', created: Date.now() },
            { id: 'dall-e-3', objectType: 'model', created: Date.now() },
            { id: 'gpt-image-1', objectType: 'model', created: Date.now() },
          ];

          set({
            chatModels: defaultChatModels,
            imageModels: defaultImageModels,
            lastFetched: now,
          });
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
    }),
    {
      name: 'model-storage',
      // 只持久化模型数据，不持久化 loading 和 error 状态
      partialize: (state) => ({
        chatModels: state.chatModels,
        imageModels: state.imageModels,
        lastFetched: state.lastFetched,
      }),
    }
  )
); 