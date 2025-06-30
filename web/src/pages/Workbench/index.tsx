import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Button, Select, Typography, Card, Input, message, Collapse } from 'antd';
import {
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../stores/themeStore';
import { useChatStore } from '../../stores/chatStore';
import { useModelStore } from '../../stores/modelStore';
import { useTourStore } from '../../stores/tourStore';
import type { Message as ChatStoreMessage } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import ThemeToggle from '../../components/ThemeToggle';
import MessageCard from '../../components/MessageCard';
import { Bot, User } from 'lucide-react';
// @ts-ignore
import ReactMarkdown from 'react-markdown';
import SendButton from '../../components/SendButton';
import GeneratePromptPanel from '../../components/GeneratePromptPanel';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import WorkbenchTour from '../../components/WorkbenchTour';
import AIServiceConfigSelector from '../../components/AIServiceConfigSelector';
import { useSelectedConfig } from '../../stores/aiServiceConfigStore';
import type { AIServiceConfigListDto } from '../../api/aiServiceConfig';

const { Content, Header } = Layout;
const {  Text } = Typography;
const { TextArea } = Input;

// 添加slideDown动画
const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const WorkbenchContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme === 'dark' ? '#141414' : '#f5f5f5'};
`;

const WorkbenchHeader = styled(Header)`
  &.ant-layout-header {
    background: ${props => props.theme === 'dark' ? '#1f1f1f' : '#ffffff'};
    border-bottom: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#f0f0f0'};
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ModelSelector = styled(Select)`
  &.ant-select {
    min-width: 200px;
    
    .ant-select-selector {
      background: ${props => props.theme === 'dark' ? '#262626' : '#ffffff'};
      border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#d9d9d9'};
      border-radius: 6px;
      height: 36px;
      
      &:hover {
        border-color: #1677ff;
      }
    }
    
    .ant-select-selection-item {
      color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
      font-weight: 500;
    }
  }
`;


const WorkbenchContent = styled(Content)`
  flex: 1;
  display: flex;
  padding: 24px;
  gap: 24px;
  overflow: hidden;
`;

const PromptSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TestSection = styled.div`
  flex: 1;
  padding: 24px;
  background: ${props => props.theme === 'dark' ? '#1f1f1f' : '#ffffff'};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-left: 20px;
  height: calc(100vh - 80px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;


const SystemPromptCard = styled(Card)`
  &.ant-card {
    background: ${props => props.theme === 'dark' ? '#1f1f1f' : '#ffffff'};
    border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#f0f0f0'};
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    .ant-collapse {
      background: transparent;
      border: none;
      
      .ant-collapse-item {
        border-bottom: none;
        
        .ant-collapse-header {
          font-size: 16px;
          font-weight: 600;
          color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
          background: transparent;
        }
        
        .ant-collapse-content {
          background: transparent;
          border-top: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#f0f0f0'};
          
          .ant-collapse-content-box {
            padding: 0;
          }
        }
      }
    }
  }
`;



const StyledTextArea = styled(TextArea)`
  &.ant-input {
    background: transparent;
    border: none;
    resize: none;
    font-size: 14px;
    line-height: 1.6;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    
    &:focus {
      box-shadow: none;
    }
    
    &::placeholder {
      color: ${props => props.theme === 'dark' ? '#ffffff40' : '#00000040'};
    }
  }
`;


const ModelSelectorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.theme === 'dark' ? '#1f1f1f' : '#ffffff'};
  border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#f0f0f0'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .model-label {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    min-width: 60px;
  }
`;


// 改进的模型选择器容器
const UiverseModelSelector = styled.div`
  position: relative;
  background: ${props => props.theme === 'dark' ?
    'linear-gradient(145deg, #2a2a2a, #1f1f1f)' :
    'linear-gradient(145deg, #ffffff, #f5f5f5)'};
  border-radius: 12px;
  padding: 4px;
  box-shadow: ${props => props.theme === 'dark' ?
    'inset 5px 5px 10px #1a1a1a, inset -5px -5px 10px #2e2e2e' :
    'inset 5px 5px 10px #e0e0e0, inset -5px -5px 10px #ffffff'};
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: ${props => props.theme === 'dark' ?
    'inset 3px 3px 8px #1a1a1a, inset -3px -3px 8px #2e2e2e, 0 0 20px rgba(102, 126, 234, 0.1)' :
    'inset 3px 3px 8px #e0e0e0, inset -3px -3px 8px #ffffff, 0 0 20px rgba(79, 172, 254, 0.1)'};
  }
  
  .ant-select {
    width: 100%;
    min-width: 220px;
    
    .ant-select-selector {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 8px 12px;
      
      .ant-select-selection-item {
        color: ${props => props.theme === 'dark' ? '#e0e0e0' : '#333333'};
        font-weight: 600;
        font-size: 14px;
      }
    }
    
    .ant-select-arrow {
      color: ${props => props.theme === 'dark' ? '#667eea' : '#4facfe'};
    }
  }
`;

const ErrorMessage = styled.div<{ $theme: 'dark' | 'light' }>`
  color: #ff4d4f;
  background: ${props => props.$theme === 'dark' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.05)'};
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 77, 79, 0.2);
  font-size: 14px;
`;

const StreamingMessageContainer = styled.div<{ $theme: 'dark' | 'light' }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: ${props => props.$theme === 'dark' ? '#272727' : '#f7f7f7'};
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid ${props => props.$theme === 'dark' ? '#333333' : '#e6e6e6'};
  overflow-y: auto;
  flex: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const ReasoningContent = styled.div<{ $theme: 'dark' | 'light' }>`
  background: ${props => props.$theme === 'dark' ? '#1f1f1f' : '#f0f0f0'};
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  border: 1px solid ${props => props.$theme === 'dark' ? '#3d3d3d' : '#e0e0e0'};
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

// 创建带动画的推理内容组件
const AnimatedReasoningContent = styled(ReasoningContent)<{ $theme: 'dark' | 'light' }>`
  margin-top: 0;
  border-radius: 0 0 8px 8px;
  border: 1px solid ${props => props.$theme === 'dark' ? '#3d3d3d' : '#e0e0e0'};
  border-top: none;
  max-height: 200px;
  font-size: 13px;
  line-height: 1.5;
  animation: ${slideDown} 0.2s ease-out;
`;

const MessageContent = styled.div<{ $theme: 'dark' | 'light' }>`
  font-size: 15px;
  line-height: 1.6;
  color: ${props => props.$theme === 'dark' ? '#e6e6e6' : '#333333'};
  
  p, ul, ol, h1, h2, h3, h4, h5, h6 {
    margin-bottom: 16px;
  }
  
  h1 {
    font-size: 1.8em;
    font-weight: 600;
    margin-top: 24px;
  }
  
  h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin-top: 20px;
  }
  
  h3 {
    font-size: 1.2em;
    font-weight: 600;
    margin-top: 16px;
  }
  
  ul, ol {
    padding-left: 24px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  a {
    color: ${props => props.$theme === 'dark' ? '#4096ff' : '#1677ff'};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  code {
    background: ${props => props.$theme === 'dark' ? '#333' : '#f1f1f1'};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9em;
  }
  
  pre {
    background: ${props => props.$theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid ${props => props.$theme === 'dark' ? '#333' : '#e0e0e0'};
    
    code {
      background: none;
      padding: 0;
      border-radius: 0;
      font-size: 0.9em;
      display: block;
    }
  }
  
  blockquote {
    border-left: 4px solid ${props => props.$theme === 'dark' ? '#444' : '#ddd'};
    padding-left: 16px;
    margin: 16px 0;
    font-style: italic;
    color: ${props => props.$theme === 'dark' ? '#bbb' : '#666'};
  }
  
  img {
    max-width: 100%;
    border-radius: 8px;
    margin: 16px 0;
  }
  
  hr {
    border: none;
    border-top: 1px solid ${props => props.$theme === 'dark' ? '#444' : '#ddd'};
    margin: 24px 0;
  }
  
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    
    th, td {
      border: 1px solid ${props => props.$theme === 'dark' ? '#444' : '#ddd'};
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background: ${props => props.$theme === 'dark' ? '#333' : '#f1f1f1'};
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background: ${props => props.$theme === 'dark' ? '#222' : '#f9f9f9'};
    }
  }
`;

const AddToConversationButton = styled(Button) <{ $theme: 'dark' | 'light' }>`
  position: relative;
  background: ${props => props.$theme === 'dark'
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'};
  color: white;
  border: none;
  margin-top: 16px;
  height: 44px;
  border-radius: 22px;
  padding: 0 20px;
  font-weight: 600;
  box-shadow: 0 6px 15px ${props => props.$theme === 'dark'
    ? 'rgba(118, 75, 162, 0.3)'
    : 'rgba(79, 172, 254, 0.3)'};
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg, 
      transparent, 
      rgba(255, 255, 255, 0.2), 
      transparent
    );
    transition: left 0.7s;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px ${props => props.$theme === 'dark'
    ? 'rgba(118, 75, 162, 0.4)'
    : 'rgba(79, 172, 254, 0.4)'};
    background: ${props => props.$theme === 'dark'
    ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
    : 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)'};
    color: white;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:active {
    transform: translateY(-1px);
    box-shadow: 0 5px 10px ${props => props.$theme === 'dark'
    ? 'rgba(118, 75, 162, 0.3)'
    : 'rgba(79, 172, 254, 0.3)'};
  }
  
  &:disabled {
    background: ${props => props.$theme === 'dark'
    ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)'
    : 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)'};
    color: ${props => props.$theme === 'dark' ? '#a1a1aa' : '#6b7280'};
    box-shadow: none;
    transform: none;
    cursor: not-allowed;
  }
  
  span {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
`;

// 流式消息组件
const StreamingMessage: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const { t } = useTranslation();
  const {
    streamingContent,
    streamingReasoningContent,
    isLoading,
    addTempToMessages,
  } = useChatStore();

  // 添加推理内容展开/收缩状态
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  // 判断是否有内容显示
  const hasContent = !!streamingContent || isLoading;

  // 添加调试日志
  console.log('StreamingMessage render:', { 
    streamingContent: !!streamingContent, 
    streamingReasoningContent: !!streamingReasoningContent,
    reasoningContentLength: streamingReasoningContent?.length || 0,
    isLoading 
  });

  // 如果没有内容和不在加载中，不渲染组件
  if (!hasContent) return null;

  return (
    <StreamingMessageContainer $theme={theme}>
      {/* 推理内容区域 - 显示在主要内容上方 */}
      {streamingReasoningContent && (
        <div style={{ marginBottom: '16px' }}>
          {/* 推理内容标题栏，可点击展开/收缩 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px 12px',
              background: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
              borderRadius: '8px 8px 0 0',
              border: `1px solid ${theme === 'dark' ? '#3d3d3d' : '#e0e0e0'}`,
              borderBottom: isReasoningExpanded ? 'none' : `1px solid ${theme === 'dark' ? '#3d3d3d' : '#e0e0e0'}`,
              transition: 'all 0.2s ease-in-out',
            }}
            onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
          >
            <div
              style={{
                marginRight: '8px',
                transition: 'transform 0.2s ease-in-out',
                transform: isReasoningExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              ▶
            </div>
            <Text
              strong
              style={{
                color: theme === 'dark' ? '#4facfe' : '#1677ff',
                fontSize: '14px',
                flex: 1
              }}
            >
              {t('workbench.reasoningProcess')}
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: '12px',
                color: theme === 'dark' ? '#999' : '#666',
              }}
            >
              {isReasoningExpanded ? '收起' : '展开'}
            </Text>
          </div>

          {/* 推理内容区域 */}
          {isReasoningExpanded && (
            <AnimatedReasoningContent 
              $theme={theme}
            >
              {streamingReasoningContent}
            </AnimatedReasoningContent>
          )}
        </div>
      )}

      {/* 主要内容区域 */}
      <MessageContent style={{
        overflow: 'auto',
      }} $theme={theme}>
        {isLoading && !streamingContent ? (
          <div>{t('workbench.thinking')}</div>
        ) : (
          <ReactMarkdown>
            {streamingContent}
          </ReactMarkdown>
        )}
      </MessageContent>

      {streamingContent && !isLoading && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <AddToConversationButton
            $theme={theme}
            type="primary"
            onClick={() => {
              // 使用函数方式调用，避免可能的无限渲染
              addTempToMessages();
            }}
            disabled={isLoading}
            icon={<PlusOutlined />}
          >
            {t('workbench.addToConversation')}
          </AddToConversationButton>
        </div>
      )}
    </StreamingMessageContainer>
  );
};

// 添加模型接口类型定义
// interface ModelData {
//   id: string;
//   object: string;
//   created: number;
//   owned_by: string;
//   type: string;
// }

// interface ModelsResponse {
//   data: ModelData[];
// }

const TourButton = styled(Button)<{ $theme: 'dark' | 'light' }>`
  position: relative;
  background: ${props => props.$theme === 'dark'
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'};
  color: white;
  border: none;
  height: 36px;
  border-radius: 18px;
  padding: 0 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px ${props => props.$theme === 'dark'
    ? 'rgba(118, 75, 162, 0.3)'
    : 'rgba(79, 172, 254, 0.3)'};
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${props => props.$theme === 'dark'
      ? 'rgba(118, 75, 162, 0.4)'
      : 'rgba(79, 172, 254, 0.4)'};
    background: ${props => props.$theme === 'dark'
      ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
      : 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)'};
    color: white;
  }
  
  &:active {
    transform: translateY(0px);
  }
`;

const Workbench: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const { shouldShowWorkbenchTour, setWorkbenchTourCompleted } = useTourStore();
  const [showTour, setShowTour] = useState(false);

  const {
    messages,
    systemPrompt,
    selectedModel,
    isLoading,
    error,
    loadFromDB,
    setSystemPrompt,
    setSelectedModel,
    addUserMessage,
    addAssistantMessage,
    sendMessages,
    deleteMessage,
    updateMessageContent,
    updateMessageParameters,
  } = useChatStore();

  // 使用模型 store
  const {
    fetchModels,
    getChatModelOptions,
    isLoading: modelsLoading,
    error: modelsError,
  } = useModelStore();

  // 使用AI服务配置 store
  const { selectedConfig } = useSelectedConfig();

  // 获取聊天模型选项 - 优先使用选择的AI服务配置中的模型
  const modelOptions = useMemo(() => {
    console.log('🔍 [Workbench] 计算模型选项:', {
      selectedConfig,
      chatModels: selectedConfig?.chatModels,
      chatModelsLength: selectedConfig?.chatModels?.length,
      chatModelsType: typeof selectedConfig?.chatModels,
      isArray: Array.isArray(selectedConfig?.chatModels),
    });

    // 确保有有效的模型数据
    if (selectedConfig && Array.isArray(selectedConfig.chatModels) && selectedConfig.chatModels.length > 0) {
      // 使用选择的AI服务配置中的模型
      const options = selectedConfig.chatModels.map(model => ({
        value: model,
        label: model,
      }));
      console.log('✅ [Workbench] 使用AI服务配置模型:', options);
      return options;
    }

    // 回退到系统默认模型
    const defaultOptions = getChatModelOptions();
    console.log('⚠️ [Workbench] 使用系统默认模型:', defaultOptions);
    return defaultOptions;
  }, [selectedConfig, getChatModelOptions]);

  // 确保选中的模型在可用选项中 - 只在modelOptions变化时检查
  useEffect(() => {
    if (modelOptions.length > 0 && selectedModel) {
      const currentModelExists = modelOptions.some(option => option.value === selectedModel);

      if (!currentModelExists) {
        // 如果当前选中的模型不在选项中，选择第一个可用模型
        const firstModel = modelOptions[0]?.value;
        if (firstModel) {
          setSelectedModel(firstModel);
        }
      }
    } else if (modelOptions.length > 0 && !selectedModel) {
      // 如果没有选中模型，选择第一个
      const firstModel = modelOptions[0]?.value;
      if (firstModel) {
        setSelectedModel(firstModel);
      }
    }
  }, [modelOptions, setSelectedModel]);



  // 获取模型列表
  useEffect(() => {
    loadFromDB();
    fetchModels(); // 获取模型列表
  }, [loadFromDB, fetchModels]);

  // 如果获取模型失败，显示错误信息
  useEffect(() => {
    if (modelsError) {
      message.warning(`模型列表获取失败，使用默认模型: ${modelsError}`);
    }
  }, [modelsError]);

  // 当AI服务配置变化时，自动选择该配置的默认模型
  useEffect(() => {
    if (selectedConfig && selectedConfig.defaultChatModel) {
      // 如果选择的配置有默认聊天模型，使用它
      setSelectedModel(selectedConfig.defaultChatModel);
    }
  }, [selectedConfig, setSelectedModel]);

  // 检查是否是首次使用，如果是则自动显示引导
  useEffect(() => {
    if (shouldShowWorkbenchTour()) {
      // 延迟一点时间让页面完全加载
      setTimeout(() => {
        setShowTour(true);
      }, 1000);
    }
  }, [shouldShowWorkbenchTour]);

  const handleRun = async () => {
    if (!isAuthenticated) {
      message.error(t('auth.pleaseLogin'));
      return;
    }

    // 检查是否有有效的API配置
    const { hasValidLLMConfig } = await import('../../utils/llmClient');
    if (!hasValidLLMConfig()) {
      message.error('请先在侧边栏配置API设置');
      return;
    }

    await sendMessages();
  };

  const handleTourClose = () => {
    setShowTour(false);
    setWorkbenchTourCompleted(true);
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  // 处理AI服务配置变化
  const handleAIConfigChange = (configId: string | null, config: AIServiceConfigListDto | null) => {
    // 配置变化时，如果新配置有默认聊天模型，自动选择它
    if (config && config.defaultChatModel) {
      setSelectedModel(config.defaultChatModel);
    }
  };

  return (
    <WorkbenchContainer theme={theme}>
      <WorkbenchHeader theme={theme}>
        <HeaderLeft>
          <Text type="secondary">
            {t('workbench.title')}
          </Text>
        </HeaderLeft>
        <HeaderRight>
          <TourButton
            $theme={theme}
            icon={<QuestionCircleOutlined />}
            onClick={handleStartTour}
            size="small"
          >
            新人引导
          </TourButton>
          <LanguageSwitcher />
          <ThemeToggle />
          <SendButton
            data-tour="run-button"
            onClick={handleRun}
            disabled={isLoading}
            theme={theme}
          >
            {t('workbench.run')}
          </SendButton>
        </HeaderRight>
      </WorkbenchHeader>

      <WorkbenchContent>
        <PromptSection>
          {/* AI服务配置选择器 */}
          <ModelSelectorSection theme={theme} className="ai-config-selector-section">
            <div className="model-label">AI服务配置:</div>
            <UiverseModelSelector theme={theme}>
              <AIServiceConfigSelector
                placeholder="选择AI服务配置"
                size="middle"
                showManageButton={true}
                style={{ width: '100%' }}
                onChange={handleAIConfigChange}
              />
            </UiverseModelSelector>
          </ModelSelectorSection>

          <ModelSelectorSection theme={theme} className="model-selector-section">
            <div className="model-label">{t('workbench.model')}:</div>

            {/* 调试信息显示 */}
            <div className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded mb-2">
              模型数量: {modelOptions.length} | 当前: {selectedModel || '未选择'} | 配置: {selectedConfig?.name || '无'}
            </div>



            <UiverseModelSelector theme={theme}>
              <ModelSelector
                theme={theme}
                value={selectedModel}
                onChange={(value) => {
                  setSelectedModel(value as string);
                }}
                loading={modelsLoading}
                placeholder={
                  modelsLoading
                    ? t('workbench.loadingModels')
                    : selectedConfig
                      ? `选择${selectedConfig.provider}模型`
                      : '选择聊天模型'
                }
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                showSearch
                options={modelOptions}
              />
            </UiverseModelSelector>
            <GeneratePromptPanel />
          </ModelSelectorSection>

          <SystemPromptCard
            bodyStyle={{
              padding: 8
            }}
            theme={theme}
            data-tour="system-prompt"
          >
            <Collapse
              ghost
              items={[
                {
                  key: '1',
                  label: t('workbench.systemPrompt'),
                  children: (
                    <StyledTextArea
                      theme={theme}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder={t('workbench.systemPromptPlaceholder')}
                      style={{ height: '200px' }}
                    />
                  )
                },
              ]}
            />
          </SystemPromptCard>

          <div 
            style={{
              overflow: 'auto',
            }}
            data-tour="messages"
          >
            {messages.map((msg: ChatStoreMessage, index) => (
              <MessageCard
                key={index}
                role={msg.role}
                content={msg.content}
                theme={theme}
                parameters={msg.parameters}
                onDelete={() => {
                  deleteMessage(msg.id as string);
                }}
                onParametersChange={(newParams: any) => {
                  if (msg.id && newParams && newParams.length > 0) {
                    // 使用深拷贝避免引用问题
                    const paramsCopy = JSON.parse(JSON.stringify(newParams));
                    console.log('Workbench: 更新消息参数', msg.id, paramsCopy);
                    // 确保延迟调用，避免React状态更新冲突
                    setTimeout(() => {
                      updateMessageParameters(msg.id as string, paramsCopy);
                    }, 0);
                  }
                }}
                onContentChange={(newContent: any) => {
                  console.log('Workbench: 更新消息内容', newContent);
                  if (msg.id) {
                    let textContent: string;
                    if (typeof newContent === 'string') {
                      textContent = newContent;
                    } else {
                      const textItem = newContent.find((item: any) => item.type === 'text');
                      textContent = textItem?.text || '';
                    }

                    if (textContent) {
                      updateMessageContent(msg.id, textContent);
                    }
                  }
                }}
              />
            ))}
          </div>
          <div data-tour="add-messages">
            <Button
              icon={<User />}
              type="text" 
              onClick={() => {
                addUserMessage(t('workbench.userMessageDefault'));
              }}
            >
              {t('workbench.addUserMessage')}
            </Button>
            <Button
              icon={<Bot />}
              type="text" 
              onClick={() => {
                addAssistantMessage(t('workbench.assistantMessageDefault'));
              }}
            >
              {t('workbench.addAssistantMessage')}
            </Button>
          </div>
        </PromptSection>

        <TestSection theme={theme} data-tour="test-section">
          {error && (
            <ErrorMessage $theme={theme}>
              {error}
            </ErrorMessage>
          )}

          <StreamingMessage theme={theme} />
        </TestSection>
      </WorkbenchContent>

      <WorkbenchTour
        open={showTour}
        onClose={handleTourClose}
      />
    </WorkbenchContainer>
  );
};

export default Workbench; 