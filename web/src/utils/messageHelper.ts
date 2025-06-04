import type { Message, MessageContent, Parameter } from '../stores/chatStore';

/**
 * 将完整消息转换为纯文本
 * @param message 消息对象
 * @returns 消息的纯文本内容
 */
export const messageToText = (message: Message): string => {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  return (message.content as MessageContent[])
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n');
};

/**
 * 从文本和图片URL创建用户消息内容
 * @param text 文本内容
 * @param imageUrls 图片URL数组
 * @returns 消息内容数组
 */
export const createUserMessageContent = (text: string, imageUrls: string[] = []): MessageContent[] => {
  const content: MessageContent[] = [];
  
  if (text.trim()) {
    content.push({
      type: 'text',
      text: text.trim()
    });
  }
  
  imageUrls.forEach(url => {
    if (url) {
      content.push({
        type: 'image_url',
        image_url: {
          url
        }
      });
    }
  });
  
  return content;
};

/**
 * 提取消息中的所有图片URL
 * @param message 消息对象
 * @returns 图片URL数组
 */
export const extractImageUrls = (message: Message): string[] => {
  if (typeof message.content === 'string') {
    return [];
  }
  
  return (message.content as MessageContent[]).filter(item => item.type === 'image_url' && item.image_url?.url)
    .map(item => item.image_url?.url || '');
};

/**
 * 检查消息是否包含图片
 * @param message 消息对象
 * @returns 是否包含图片
 */
export const hasImages = (message: Message): boolean => {
  if (typeof message.content === 'string') {
    return false;
  }
  
  return (message.content as MessageContent[]).some(item => item.type === 'image_url' && item.image_url?.url);
};

/**
 * 格式化对话消息为可复制的文本
 * @param messages 消息数组
 * @returns 格式化后的文本
 */
export const formatMessagesForCopy = (messages: Message[]): string => {
  return messages.map(msg => {
    const role = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : '系统';
    const content = messageToText(msg);
    return `${role}: ${content}`;
  }).join('\n\n');
};

/**
 * 解析文本中的参数
 * @param text 文本内容
 * @returns 提取的参数数组
 */
export const extractParameters = (text: string): Parameter[] => {
  const regex = /\{\{([^{}]+)\}\}/g;
  const parameters: Parameter[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const key = match[1].trim();
    // 避免重复添加相同的key
    if (!parameters.some(param => param.key === key)) {
      parameters.push({ key, value: '' });
    }
  }
  
  return parameters;
};

/**
 * 替换文本中的参数为实际值
 * @param text 包含参数的文本
 * @param parameters 参数数组
 * @returns 替换后的文本
 */
export const replaceParameters = (text: string, parameters: Parameter[]): string => {
  let result = text;
  
  parameters.forEach(param => {
    if (param.value) { // 只有当参数值存在时才替换
      const regex = new RegExp(`{{${param.key}}}`, 'g');
      result = result.replace(regex, param.value);
    }
  });
  
  return result;
}; 