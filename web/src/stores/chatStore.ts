import { create } from 'zustand';
import { getLLMClient } from '../utils/llmClient';
import {
  getConfig,
  saveConfig,
  getMessages as getMessagesFromDB,
  addMessage,
  updateMessage,
  deleteMessage as deleteMessageFromDB,
  clearMessages,
  initializeDefaultData, // 用于确保数据库初始化
} from '../utils/db'; // 假设 db.ts 在 utils 文件夹下
import { replaceParameters } from '../utils/messageHelper';

// 定义消息类型，与 db.ts 中的 WorkbenchMessage 保持一致
export type MessageRole = 'system' | 'user' | 'assistant';

// MessageContent 保持不变，因为它用于UI展示和API请求的特定格式
export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  arguments?: Parameter[];
  image_url?: {
    url: string;
  };
}

export interface Parameter {
  key: string;
  value: string;
}

// Message 接口现在匹配 WorkbenchMessage，但增加了可选的 id 和 timestamp
export interface Message {
  id?: string; // 来自数据库的消息会有id
  timestamp: number; // 来自数据库的消息会有timestamp，但我们确保在使用时总是有值
  role: MessageRole;
  content: string; // 直接使用 string，发送到 API 时再处理 MessageContent[]
  parameters?: Parameter[]; // 存储参数对象数组
  arguments?: Parameter[]; // 与parameters相同，但用于UI展示
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  systemPrompt: string;
  selectedModel: string;
  workspaceId: string; // 工作空间ID
  streamingContent: string; // 用于存储正在流式传输的内容
  streamingReasoningContent: string | null; // 用于存储推理内容
  tempMessage: Message | null; // 用于存储临时消息（未保存到会话的消息）
  lastUpdateTime: number; // 添加最后更新时间字段

  // 操作方法
  loadFromDB: (workspaceId?: string) => Promise<void>;
  setWorkspaceId: (workspaceId: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setSelectedModel: (model: string) => void;
  addUserMessage: (content: string, parameters?: Parameter[]) => Promise<void>;
  addAssistantMessage: (content: string, parameters?: Parameter[]) => Promise<void>;
  updateMessageContent: (messageId: string, content: string) => Promise<void>;
  updateMessageParameters: (messageId: string, parameters: Parameter[]) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  clearMessages: () => Promise<void>;
  sendMessages: () => Promise<void>;
  setStreamingContent: (content: string) => void; // 设置正在流式传输的内容
  setStreamingReasoningContent: (content: string | null) => void; // 设置推理内容
  addTempToMessages: () => Promise<void>; // 将临时消息添加到会话中
  clearTemp: () => void; // 清空临时消息
}

const DEFAULT_WORKSPACE_ID = 'default';
const UPDATE_INTERVAL = 100; // 更新UI的最小时间间隔（毫秒）

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [], // 初始化为空，将从DB加载
  isLoading: false,
  error: null,
  systemPrompt: '', // 初始化为空
  selectedModel: 'gpt-4o', // 默认模型，会从DB加载覆盖
  workspaceId: DEFAULT_WORKSPACE_ID,
  streamingContent: '', // 初始化为空字符串
  streamingReasoningContent: null, // 初始化为null
  tempMessage: null, // 初始化为null
  lastUpdateTime: 0, // 初始化最后更新时间为0

  loadFromDB: async (workspaceId: string = get().workspaceId) => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      await initializeDefaultData(); // 确保数据库和默认数据已初始化
      const config = await getConfig(workspaceId);
      const dbMessages = await getMessagesFromDB(workspaceId);

      // 处理从数据库加载的消息，恢复arguments字段
      let loadedMessages: Message[] = dbMessages.map(msg => {
        const message: Message = {
          id: msg.id,
          timestamp: msg.timestamp,
          role: msg.role,
          content: msg.content
        };
        
        // 如果有arguments字段，解析为Parameter[]
        if (msg.arguments) {
          try {
            const args = JSON.parse(msg.arguments) as Parameter[];
            message.parameters = args;
            message.arguments = args;
          } catch (e) {
            console.error('Failed to parse message arguments:', e);
          }
        }
        
        return message;
      });
      if (loadedMessages.length === 0) {
        await get().addUserMessage('');
        loadedMessages = get().messages;
      }

      set({
        selectedModel: config?.selectedModel || 'gpt-4o',
        systemPrompt: config?.systemPrompt || '',
        messages: loadedMessages,
        workspaceId,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load data from DB:', error);
      set({ error: 'Failed to load data from DB', isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setWorkspaceId: (workspaceId: string) => {
    set({ workspaceId });
    get().loadFromDB(workspaceId); // 切换工作区时重新加载数据
  },

  setSystemPrompt: async (prompt: string) => {
    set({ systemPrompt: prompt });
    const { workspaceId, selectedModel } = get();
    await saveConfig({ workspaceId, systemPrompt: prompt, selectedModel });
  },

  setSelectedModel: async (model: string) => {
    set({ selectedModel: model });
    const { workspaceId, systemPrompt } = get();
    await saveConfig({ workspaceId, selectedModel: model, systemPrompt });
  },

  // 添加用户消息
  addUserMessage: async (content: string, parameters: Parameter[] = []) => {
    // if (!content.trim()) return;

    const { workspaceId } = get();
    
    // 保留原始内容，不添加参数到文本中
    const finalContent = content ?? '';

    // 先添加到数据库
    const messageId = await addMessage({
      workspaceId,
      role: 'user',
      content: finalContent,
      arguments: parameters.length > 0 ? JSON.stringify(parameters) : undefined
    });

    // 然后更新状态
    const newMessage: Message = {
      id: messageId,
      role: 'user',
      content: finalContent,
      parameters,
      arguments: parameters,
      timestamp: Date.now()
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  // 添加助手消息
  addAssistantMessage: async (content: string, parameters: Parameter[] = []) => {
    if (!content.trim()) return;

    const { workspaceId } = get();
    
    // 保留原始内容，不添加参数到文本中
    let finalContent = content;

    // 先添加到数据库
    const messageId = await addMessage({
      workspaceId,
      role: 'assistant',
      content: finalContent,
      arguments: parameters.length > 0 ? JSON.stringify(parameters) : undefined
    });

    // 然后更新状态
    const newMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: finalContent,
      parameters,
      arguments: parameters,
      timestamp: Date.now()
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  // 更新消息内容
  updateMessageContent: async (messageId: string, content: string) => {
    const { messages, workspaceId } = get();
    const messageIndex = messages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) return;

    
    const existingMessage = messages[messageIndex];
    const parameters = existingMessage.parameters || [];
    
    // 保留原始内容，不添加参数到文本中
    let finalContent = content;

    const updatedMessage = {
      ...existingMessage,
      content: finalContent
    };

    // 确保消息有所有必需的字段
    if (updatedMessage.id) {
      await updateMessage({
        id: updatedMessage.id,
        workspaceId,
        role: updatedMessage.role,
        content: updatedMessage.content,
        arguments: parameters.length > 0 ? JSON.stringify(parameters) : undefined,
        timestamp: updatedMessage.timestamp || Date.now()
      });
    }

    // 更新本地状态
    set((state) => ({
      messages: state.messages.map((m, i) =>
        i === messageIndex ? updatedMessage : m
      ),
    }));
  },

  // 更新消息参数
  updateMessageParameters: async (messageId: string, parameters: Parameter[]) => {
    console.log('Store.updateMessageParameters called with:', { messageId, parameters }); // 添加调试日志
    
    const { messages, workspaceId } = get();
    const messageIndex = messages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      console.error('Message not found in store:', messageId); // 添加调试日志
      return;
    }

    // 获取现有消息
    const existingMessage = messages[messageIndex];
    console.log('Existing message:', existingMessage); // 添加调试日志
    
    // 深拷贝参数以避免引用问题
    const parametersCopy = JSON.parse(JSON.stringify(parameters));
    
    // 创建更新后的消息对象
    const updatedMessage = {
      ...existingMessage,
      parameters: parametersCopy,
      arguments: parametersCopy
    };
    console.log('Updated message object:', updatedMessage); // 添加调试日志

    // 更新数据库
    if (updatedMessage.id) {
      try {
        // 确保JSON字符串化是新的，不复用之前的
        const jsonArguments = parameters.length > 0 ? JSON.stringify(parametersCopy) : undefined;
        console.log('JSON arguments to save:', jsonArguments); // 添加调试日志
        
        const dbUpdate = {
          id: updatedMessage.id,
          workspaceId,
          role: updatedMessage.role,
          content: updatedMessage.content,
          arguments: jsonArguments,
          timestamp: updatedMessage.timestamp || Date.now()
        };
        console.log('Updating in database:', dbUpdate); // 添加调试日志
        
        await updateMessage(dbUpdate);
        console.log('Database update successful'); // 添加调试日志
        
        // 更新状态 - 使用新的更新模式
        set(state => {
          // 创建消息的新副本
          const newMessages = [...state.messages];
          // 直接替换更新的消息
          newMessages[messageIndex] = updatedMessage;
          console.log('New messages array:', newMessages);
          return { messages: newMessages };
        });
      } catch (error) {
        console.error('Failed to update message in database:', error); // 添加调试日志
      }
    }
  },

  // 删除单条消息
  deleteMessage: async (messageId: string) => {
    // 从数据库删除
    await deleteMessageFromDB(messageId);

    // 更新本地状态
    set((state) => ({
      messages: state.messages.filter(m => m.id !== messageId),
    }));
  },

  // 清空所有消息
  clearMessages: async () => {
    const { workspaceId } = get();

    // 从数据库清空
    await clearMessages(workspaceId);

    // 更新本地状态
    set({ messages: [] });
  },

  // 设置流式内容
  setStreamingContent: (content: string) => {
    set({ streamingContent: content });
  },

  // 设置推理内容
  setStreamingReasoningContent: (content: string | null) => {
    set({ streamingReasoningContent: content });
  },

  // 将临时消息添加到会话中
  addTempToMessages: async () => {
    const { tempMessage, workspaceId } = get();
    if (!tempMessage) return;

    try {
      // 先添加到数据库
      const messageId = await addMessage({
        workspaceId,
        role: tempMessage.role,
        content: tempMessage.content,
        arguments: tempMessage.parameters && tempMessage.parameters.length > 0 
          ? JSON.stringify(tempMessage.parameters) 
          : undefined
      });

      // 然后更新状态 - 创建一个新消息对象，确保有ID
      const newMessage: Message = {
        ...tempMessage,
        id: messageId
      };

      // 一次性更新所有状态，减少重新渲染次数
      set((state) => ({
        messages: [...state.messages, newMessage],
        tempMessage: null,
        streamingContent: '',
        streamingReasoningContent: null
      }));
    } catch (error) {
      console.error('Failed to add temp message to conversation:', error);
      // 即使出错也清空临时消息状态
      set({ 
        tempMessage: null,
        streamingContent: '',
        streamingReasoningContent: null
      });
    }
  },

  // 清空临时消息
  clearTemp: () => {
    set({ 
      tempMessage: null,
      streamingContent: '',
      streamingReasoningContent: null
    });
  },

  sendMessages: async () => {
    const state = get();
    const openai = getLLMClient();
    if (!openai) {
      set({ error: '请先配置API设置' });
      return;
    }

    // 确保至少有一条用户消息或系统提示
    const hasUserMessages = state.messages.some(m => m.role === 'user' && m.content.trim() !== '');
    if (!hasUserMessages && !state.systemPrompt.trim()) {
      set({ error: '请输入消息内容或系统提示' });
      return;
    }

    set({ 
      isLoading: true, 
      error: null,
      streamingContent: '',
      streamingReasoningContent: null,
      lastUpdateTime: Date.now() // 重置最后更新时间
    });

    try {
      const messagesToSend: { role: MessageRole, content: string }[] = [];

      if (state.systemPrompt) {
        messagesToSend.push({
          role: 'system',
          content: state.systemPrompt,
        });
      }

      // 将 store 中的 messages 转换为 API 格式，并替换参数
      state.messages.forEach(msg => {
        // 假设这里的 content 已经是 string 了
        if (typeof msg.content === 'string') {
          // 使用messageHelper中的replaceParameters函数替换参数
          let processedContent = msg.content;
          
          // 只有当消息有参数且参数有值时才进行替换
          if (msg.parameters && msg.parameters.length > 0) {
            // 使用参数值替换文本中的参数占位符
            processedContent = replaceParameters(msg.content, msg.parameters);
          }
          
          messagesToSend.push({ 
            role: msg.role, 
            content: processedContent 
          });
        } else {
          console.warn("Message content is not a string, skipping:", msg);
        }
      });

      if (messagesToSend.length === 0 || (messagesToSend.length === 1 && messagesToSend[0].role === 'system')) {
        set({ error: '没有有效的用户消息可发送', isLoading: false });
        return;
      }

      console.log('Sending messages to API:', messagesToSend);

      // 使用流式API
      const stream = await openai.chat.completions.create({
        model: state.selectedModel,
        messages: messagesToSend,
        temperature: 0.5,
        stream: true, // 启用流式传输
      });

      let assistantContent = '';
      let reasoningContent: string | null = null;
      let pendingUpdate = false;
      
      // 处理流式响应
      for await (const chunk of stream) {
        // 更新内容
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          assistantContent += content;
          
          // 检查是否存在reasoning_content字段
          const reasoningContentDelta = (chunk.choices[0]?.delta as any)?.reasoning_content;
          if (reasoningContentDelta) {
            reasoningContent = reasoningContent || '';
            reasoningContent += reasoningContentDelta;
          }
          
          // 创建新的临时消息对象，避免直接修改引用
          const newTempMessage: Message = {
            role: 'assistant' as MessageRole,
            content: assistantContent,
            timestamp: Date.now(),
            parameters: []
          };
          
          // 节流更新：检查距离上次更新的时间是否超过了设定的间隔
          const now = Date.now();
          const { lastUpdateTime } = get();
          
          if (now - lastUpdateTime >= UPDATE_INTERVAL) {
            // 如果超过了更新间隔，则更新UI
            set({ 
              streamingContent: assistantContent,
              streamingReasoningContent: reasoningContent,
              tempMessage: newTempMessage,
              lastUpdateTime: now
            });
            pendingUpdate = false;
          } else if (!pendingUpdate) {
            // 如果未超过更新间隔且没有待更新的内容，设置一个定时器
            pendingUpdate = true;
            
            setTimeout(() => {
              // 获取最新的状态
              const currentState = get();
              // 只有在仍在流式传输且有内容更新时才更新
              if (currentState.isLoading && (currentState.streamingContent !== assistantContent || 
                  currentState.streamingReasoningContent !== reasoningContent)) {
                set({ 
                  streamingContent: assistantContent,
                  streamingReasoningContent: reasoningContent,
                  tempMessage: newTempMessage,
                  lastUpdateTime: Date.now()
                });
              }
              pendingUpdate = false;
            }, UPDATE_INTERVAL - (now - lastUpdateTime));
          }
        }
      }

      // 流式传输完成后，确保最后一次更新被应用
      const finalTempMessage: Message = {
        role: 'assistant' as MessageRole,
        content: assistantContent,
        timestamp: Date.now(),
        parameters: []
      };
      
      set({ 
        streamingContent: assistantContent,
        streamingReasoningContent: reasoningContent,
        tempMessage: finalTempMessage,
        lastUpdateTime: Date.now()
      });

      // 流式传输完成后，不自动添加到消息中，等待用户确认
    } catch (error) {
      console.error('API请求失败:', error);
      set({
        error: error instanceof Error ? error.message : '请求失败，请稍后再试',
        streamingContent: '',
        streamingReasoningContent: null,
        tempMessage: null
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
