import { useAuthStore } from "../stores/authStore";

// 获取API基础URL
const getApiBaseUrl = () => {
  return '/v1/evaluation';
};

// 获取认证头
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    'api-key': token || '',
  };
};

// 评估结果接口
export interface EvaluationResult {
  comment: string;
  description: string;
  score: number;
  tags?: string[];  // 提示词分类标签
  originalPrompt: string;
  originalPromptOutput: string;
  prompt: string;
  promptOutput: string;
  executionCount?: number;  // 执行次数
  executionResults?: Array<{
    comment: string;
    description: string;
    score: number;
    tags: string[];
    executionIndex: number;
    originalPrompt: string;  // 每次执行的优化提示词
    originalPromptOutput: string;  // 每次执行的优化输出
    prompt: string;  // 每次执行的原始提示词
    promptOutput: string;  // 每次执行的原始输出
  }>;  // 多次执行的详细结果
}

// 评估输入接口
export interface EvaluationInput {
  models: string[];
  prompt: string;
  request: string;
  apiKey: string;
  executionCount?: number;  // 每个模型的执行次数，默认为1
  enableOptimization?: boolean;  // 是否启用提示词优化，默认为true
  requirements?: string;  // 提示词优化的需求参数（可选）
}

// SSE事件类型
export type SSEEventType = 
  | 'start'
  | 'model-start'
  | 'optimize-start'
  | 'optimize-complete'
  | 'execute-original'
  | 'execute-optimized'
  | 'scoring'
  | 'model-complete'
  | 'model-error'
  | 'complete';

// SSE事件数据
export interface SSEEventData {
  eventType: SSEEventType;
  data: any;
}

// SSE事件回调函数类型
export type SSEEventCallback = (eventData: SSEEventData) => void;

// 流式控制接口
export interface StreamController {
  abort: () => void;
}

// 流式模型评估
export const streamEvaluateModels = (
  input: EvaluationInput,
  onEvent: SSEEventCallback,
  onError?: (error: Error) => void,
  onComplete?: () => void
): StreamController => {
  const url = `${getApiBaseUrl()}/execute-model-task-stream`;
  const abortController = new AbortController();

  // 使用fetch实现SSE
  const fetchSSE = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';
      let currentEventType: SSEEventType = 'start';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.substring(7).trim() as SSEEventType;
            continue;
          }
          
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]' || dataStr === '') {
              continue;
            }
            
            try {
              const data = JSON.parse(dataStr);
              onEvent({ eventType: currentEventType, data });
            } catch (e) {
              console.warn('解析SSE数据失败:', e, dataStr);
            }
          }
        }
      }
      
      onComplete?.();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('请求已取消');
        return;
      }
      onError?.(error instanceof Error ? error : new Error('未知错误'));
    }
  };

  // 立即开始获取
  fetchSSE();

  // 返回控制对象
  return {
    abort: () => {
      abortController.abort();
    },
  };
};

// 同步模型评估（备用方案）
export const evaluateModels = async (input: EvaluationInput): Promise<Record<string, EvaluationResult>> => {
  const response = await fetch(`${getApiBaseUrl()}/execute-model-task`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export interface EvaluationExample {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  request: string;
}

/**
 * 获取评估示例数据
 */
export const getEvaluationExamples = async (): Promise<EvaluationExample[]> => {
  const response = await fetch('/v1/evaluation/examples', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取示例数据失败');
  }

  return response.json();
}; 