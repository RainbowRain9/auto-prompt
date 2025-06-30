import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getUserConfigs,
  getUserDefaultConfig,
  type AIServiceConfigListDto,
} from '../api/aiServiceConfig';

interface AIServiceConfigState {
  // 用户配置列表
  userConfigs: AIServiceConfigListDto[];
  // 默认配置
  defaultConfig: AIServiceConfigListDto | null;
  // 当前选择的配置
  selectedConfig: AIServiceConfigListDto | null;
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  
  // Actions
  loadUserConfigs: () => Promise<void>;
  loadDefaultConfig: () => Promise<void>;
  setSelectedConfig: (config: AIServiceConfigListDto | null) => void;
  refreshConfigs: () => Promise<void>;
  clearError: () => void;
}

export const useAIServiceConfigStore = create<AIServiceConfigState>()(
  persist(
    (set, get) => ({
      userConfigs: [],
      defaultConfig: null,
      selectedConfig: null,
      loading: false,
      error: null,

      // 加载用户配置列表
      loadUserConfigs: async () => {
        set({ loading: true, error: null });
        try {
          const response = await getUserConfigs();
          if (response.success) {
            const configs = response.data || [];
            set({ 
              userConfigs: configs,
              loading: false 
            });
            
            // 如果没有选择的配置，自动选择默认配置
            const { selectedConfig } = get();
            if (!selectedConfig && configs.length > 0) {
              const defaultConfig = configs.find(c => c.isDefault) || configs[0];
              set({ selectedConfig: defaultConfig });
            }
          } else {
            set({ 
              error: response.message || '加载用户配置失败',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: '加载用户配置失败: ' + (error as Error).message,
            loading: false 
          });
        }
      },

      // 加载默认配置
      loadDefaultConfig: async () => {
        try {
          const response = await getUserDefaultConfig();
          if (response.success) {
            set({ defaultConfig: response.data });
          }
        } catch (error) {
          console.error('加载默认配置失败:', error);
        }
      },

      // 设置选择的配置
      setSelectedConfig: (config) => {
        set({ selectedConfig: config });
      },

      // 刷新所有配置
      refreshConfigs: async () => {
        await Promise.all([
          get().loadUserConfigs(),
          get().loadDefaultConfig(),
        ]);
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'ai-service-config-storage',
      // 只持久化选择的配置，其他数据每次重新加载
      partialize: (state) => ({
        selectedConfig: state.selectedConfig,
      }),
    }
  )
);

// 便捷的hooks
export const useUserConfigs = () => {
  const { userConfigs, loading, error, loadUserConfigs } = useAIServiceConfigStore();
  return { userConfigs, loading, error, loadUserConfigs };
};

export const useDefaultConfig = () => {
  const { defaultConfig, loadDefaultConfig } = useAIServiceConfigStore();
  return { defaultConfig, loadDefaultConfig };
};

export const useSelectedConfig = () => {
  const { selectedConfig, setSelectedConfig } = useAIServiceConfigStore();
  return { selectedConfig, setSelectedConfig };
};

// 初始化配置数据
export const initializeAIServiceConfig = async () => {
  const store = useAIServiceConfigStore.getState();
  await store.refreshConfigs();
};
