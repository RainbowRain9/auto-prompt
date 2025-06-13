import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const DB_NAME = 'workbenchDB';
const DB_VERSION = 2; // 版本升级为2，以便触发数据库升级
const CONFIG_STORE_NAME = 'workbenchConfig';
const MESSAGES_STORE_NAME = 'workbenchMessages';
const DEFAULT_WORKSPACE_ID = 'default';

interface WorkbenchConfig {
  workspaceId: string;
  selectedModel?: string;
  systemPrompt?: string;
  temperature?: number; // 示例：未来可以添加温度等参数
  // 其他配置参数...
}

interface WorkbenchMessage {
  id: string; // 消息唯一ID
  workspaceId: string; // 所属工作区
  timestamp: number; // 时间戳，用于排序
  role: 'user' | 'assistant' | 'system';
  content: string;
  arguments?: string; // 存储JSON序列化的参数数组
}

interface MyDB extends DBSchema {
  [CONFIG_STORE_NAME]: {
    key: string;
    value: WorkbenchConfig;
    indexes: { workspaceId: string };
  };
  [MESSAGES_STORE_NAME]: {
    key: string; // 消息ID
    value: WorkbenchMessage;
    indexes: { 
      workspaceId: string, // 按工作区索引
      'workspaceId_timestamp': [string, number] // 复合索引，按工作区+时间戳排序
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>>;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1 || !db.objectStoreNames.contains(CONFIG_STORE_NAME)) {
          const configStore = db.createObjectStore(CONFIG_STORE_NAME, {
            keyPath: 'workspaceId',
          });
          configStore.createIndex('workspaceId', 'workspaceId', { unique: true });
        }
        
        // 处理消息存储的升级
        if (oldVersion < 2) {
          // 如果存在旧的消息存储，需要迁移数据
          if (db.objectStoreNames.contains(MESSAGES_STORE_NAME)) {
            db.deleteObjectStore(MESSAGES_STORE_NAME);
          }
          
          // 创建新的消息存储，使用id作为主键
          const messagesStore = db.createObjectStore(MESSAGES_STORE_NAME, {
            keyPath: 'id'
          });
          messagesStore.createIndex('workspaceId', 'workspaceId', { unique: false });
          messagesStore.createIndex('workspaceId_timestamp', ['workspaceId', 'timestamp'], { unique: false });
        }
      },
    });
  }
  return dbPromise;
};

// --- 配置读写 ---
export const getConfig = async (workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<WorkbenchConfig | undefined> => {
  const db = await initDB();
  return db.get(CONFIG_STORE_NAME, workspaceId);
};

export const saveConfig = async (config: WorkbenchConfig): Promise<string> => {
  const db = await initDB();
  return db.put(CONFIG_STORE_NAME, config);
};

// --- 消息读写 ---
// 获取特定工作区的所有消息，按时间排序
export const getMessages = async (workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<WorkbenchMessage[]> => {
  const db = await initDB();
  const tx = db.transaction(MESSAGES_STORE_NAME, 'readonly');
  const index = tx.store.index('workspaceId_timestamp');
  const messages = await index.getAll(IDBKeyRange.bound(
    [workspaceId, 0],
    [workspaceId, Date.now()]
  ));
  return messages;
};

// 添加单条消息
export const addMessage = async (message: Omit<WorkbenchMessage, 'id' | 'timestamp'>): Promise<string> => {
  const db = await initDB();
  const id = crypto.randomUUID(); // 生成唯一ID
  const timestamp = Date.now();
  const newMessage: WorkbenchMessage = {
    ...message,
    id,
    timestamp
  };
  await db.add(MESSAGES_STORE_NAME, newMessage);
  return id;
};

// 更新单条消息
export const updateMessage = async (message: WorkbenchMessage): Promise<string> => {
  console.log('DB.updateMessage called with:', message); // 添加调试日志
  
  try {
    const db = await initDB();
    await db.put(MESSAGES_STORE_NAME, message);
    console.log('DB.updateMessage success'); // 添加调试日志
    return message.id;
  } catch (error) {
    console.error('DB.updateMessage error:', error); // 添加调试日志
    throw error;
  }
};

// 删除单条消息
export const deleteMessage = async (messageId: string): Promise<void> => {
  const db = await initDB();
  await db.delete(MESSAGES_STORE_NAME, messageId);
};

// 批量保存消息（向后兼容，但内部实现是单独存储）
export const saveMessages = async (workspaceId: string = DEFAULT_WORKSPACE_ID, messages: Omit<WorkbenchMessage, 'id' | 'timestamp' | 'workspaceId'>[]): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
  
  // 先删除该工作区的所有消息
  const index = tx.store.index('workspaceId');
  let cursor = await index.openCursor(workspaceId);
  const deletePromises: Promise<void>[] = [];
  
  while (cursor) {
    deletePromises.push(cursor.delete());
    cursor = await cursor.continue();
  }
  
  await Promise.all(deletePromises);
  
  // 添加新消息
  const addPromises = messages.map((msg, idx) => {
    const id = crypto.randomUUID();
    const timestamp = Date.now() + idx; // 确保顺序
    return tx.store.add({
      ...msg,
      id,
      timestamp,
      workspaceId
    });
  });
  
  await Promise.all(addPromises);
  await tx.done;
};

// 清除工作区的所有消息
export const clearMessages = async (workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
  const index = tx.store.index('workspaceId');
  let cursor = await index.openCursor(workspaceId);
  
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  
  await tx.done;
};

// --- 初始化默认数据（如果不存在） ---
export const initializeDefaultData = async () => {
  const db = await initDB();
  const defaultConfig = await db.get(CONFIG_STORE_NAME, DEFAULT_WORKSPACE_ID);
  if (!defaultConfig) {
    await db.put(CONFIG_STORE_NAME, {
      workspaceId: DEFAULT_WORKSPACE_ID,
      selectedModel: 'gpt-4.1', // 默认模型
      systemPrompt: '',       // 默认系统提示
    });
  }
  
  // 检查默认工作区是否有消息
  const index = db.transaction(MESSAGES_STORE_NAME).store.index('workspaceId');
  const count = await index.count(DEFAULT_WORKSPACE_ID);
  if (count === 0) {
    // 默认工作区没有消息，可以添加欢迎消息
    // await addMessage({
    //   workspaceId: DEFAULT_WORKSPACE_ID,
    //   role: 'assistant',
    //   content: '欢迎使用聊天工作台！请输入您的问题。'
    // });
  }
};

// 在应用启动时调用一次初始化
initializeDefaultData().catch(console.error);

// 可选：提供一个清除特定工作空间数据的方法
export const clearWorkspaceData = async (workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction([CONFIG_STORE_NAME, MESSAGES_STORE_NAME], 'readwrite');
  
  // 删除配置
  await tx.objectStore(CONFIG_STORE_NAME).delete(workspaceId);
  
  // 删除消息
  const index = tx.objectStore(MESSAGES_STORE_NAME).index('workspaceId');
  let cursor = await index.openCursor(workspaceId);
  
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  
  await tx.done;
  
  // 删除后重新初始化默认数据，确保默认工作区始终存在基础配置
  await initializeDefaultData();
}; 