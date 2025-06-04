import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Typography, Button, Input } from 'antd';
import styled from 'styled-components';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MessageContent, MessageRole, Parameter } from '../stores/chatStore';
import { extractParameters } from '../utils/messageHelper';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Mark, mergeAttributes } from '@tiptap/core';

const { Text } = Typography;

// 创建一个自定义参数标记扩展
const ParameterMark = Mark.create({
  name: 'parameter',
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'parameter-tag',
      },
    };
  },

  // 定义参数属性
  addAttributes() {
    return {
      paramKey: {
        default: null,
        parseHTML: element => element.getAttribute('data-param'),
        renderHTML: attributes => {
          if (!attributes.paramKey) {
            return {};
          }

          return {
            'data-param': attributes.paramKey,
          };
        },
      },
    };
  },

  // 从HTML解析标记
  parseHTML() {
    return [
      {
        tag: 'span.parameter-tag',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {

    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  // 添加专门处理参数格式的命令
  addCommands() {
    return {
      formatParameters: () => ({ editor }: { editor: any }) => {
        const text = editor.getText();
        const regex = /\{\{([^{}]+)\}\}/g;

        // 如果没有匹配的参数格式，则不执行操作
        if (!text.includes('{{') || !text.includes('}}')) {
          return false;
        }

        // 获取所有参数及其位置
        let matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            fullMatch: match[0],
            paramKey: match[1].trim(),
            index: match.index,
            length: match[0].length
          });
        }

        if (matches.length === 0) return false;

        // 获取当前HTML内容
        let html = editor.getHTML();
        
        // 先移除所有现有的标记，然后重新添加
        if (html.includes('class="parameter-tag"')) {
          // 移除所有已有的parameter-tag标记但保留内容
          html = html.replace(/<span class="parameter-tag"[^>]*>(\{\{[^{}]+\}\})<\/span>/g, '$1');
        }

        // 保存当前选择位置
        const selection = editor.state.selection;
        const { from, to } = selection;

        // 从后向前应用替换，这样不会影响之前替换的位置
        matches.reverse().forEach(item => {
          // 在HTML中找到参数位置 - 这里使用简单匹配，可能需要根据实际情况调整
          const paramRegex = new RegExp(item.fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          html = html.replace(paramRegex, `<span class="parameter-tag" data-param="${item.paramKey}">${item.fullMatch}</span>`);
        });

        // 设置HTML内容
        editor.commands.setContent(html, false);

        // 尝试恢复选择位置
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (e) {
          // 忽略选择恢复错误
        }

        return true;
      },
    } as any; // 使用类型断言解决类型不匹配问题
  },
});

interface MessageCardProps {
  role: MessageRole;
  content: MessageContent[] | string;
  theme?: 'dark' | 'light';
  onParametersChange?: (parameters: Parameter[]) => void;
  parameters?: Parameter[];
  onContentChange?: (content: MessageContent[] | string) => void;
  onDelete?: () => void;
}

const StyledCard = styled(Card) <{ $role: MessageRole; $theme: 'dark' | 'light' }>`
  &.ant-card {
    border-radius: 12px;
    margin-bottom: 16px;
    background: ${props => {
    if (props.$theme === 'dark') {
      return props.$role === 'assistant' ? '#1f1f1f' : '#2a2a2a';
    } else {
      return props.$role === 'assistant' ? '#ffffff' : '#f5f5f5';
    }
  }};
    border: 1px solid ${props => props.$theme === 'dark' ? '#424242' : '#f0f0f0'};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    position: relative;
  }
  
  .ant-card-body {
    padding: 16px;
  }
  
  .edit-buttons {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 8px;
  }
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const RoleInfo = styled.div`
  display: flex;
  align-items: center;
`;

const RoleLabel = styled(Text) <{ $role: MessageRole; $theme: 'dark' | 'light' }>`
  font-weight: 600;
  font-size: 14px;
  margin-left: 8px;
  color: ${props => {
    if (props.$theme === 'dark') {
      return props.$role === 'assistant' ? '#4facfe' : '#667eea';
    } else {
      return props.$role === 'assistant' ? '#1677ff' : '#764ba2';
    }
  }};
`;

// 参数设置面板组件
const ParameterPanel = styled.div<{ $theme: 'dark' | 'light', $isVisible: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.$isVisible ? '0' : '-320px'};
  width: 320px;
  height: 100vh;
  background: ${props => props.$theme === 'dark' ? '#1f1f1f' : '#ffffff'};
  border-left: 1px solid ${props => props.$theme === 'dark' ? '#424242' : '#e6e6e6'};
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PanelHeader = styled.div<{ $theme: 'dark' | 'light' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid ${props => props.$theme === 'dark' ? '#424242' : '#e6e6e6'};
`;

const PanelTitle = styled.h3<{ $theme: 'dark' | 'light' }>`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$theme === 'dark' ? '#ffffffd9' : '#000000d9'};
`;

const CloseButton = styled.button<{ $theme: 'dark' | 'light' }>`
  background: none;
  border: none;
  color: ${props => props.$theme === 'dark' ? '#ffffffa6' : '#00000073'};
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.$theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
  }
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`;

const ParameterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const ParameterItem = styled.div<{ $theme: 'dark' | 'light' }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .param-key {
    min-width: 120px;
    font-weight: 500;
    color: ${props => props.$theme === 'dark' ? '#ffffffd9' : '#000000d9'};
  }
  
  .param-value {
    flex: 1;
  }
`;

const PanelFooter = styled.div<{ $theme: 'dark' | 'light' }>`
  padding: 16px;
  border-top: 1px solid ${props => props.$theme === 'dark' ? '#424242' : '#e6e6e6'};
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ApplyButton = styled(Button)`
  background: #1677ff;
  color: white;
  
  &:hover {
    background: #4096ff;
  }
`;

// 自定义Tiptap编辑器样式
const StyledEditorContent = styled(EditorContent) <{ $theme: 'dark' | 'light' }>`
  .ProseMirror {
    background: transparent;
    color: ${props => props.$theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    padding: 12px;
    margin: 6px 0;
    min-height: 80px;
    max-width: 100%;
    overflow-y: auto;
    outline: none;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.6;
    
    p {
      margin: 0;
    }

    &:focus {
      outline: none;
    }

    .parameter-tag {
      display: inline-block;
      background: ${props => props.$theme === 'dark' ? '#1677ff1a' : '#e6f4ff'};
      color: ${props => props.$theme === 'dark' ? '#4facfe' : '#1677ff'};
      border: 1px solid ${props => props.$theme === 'dark' ? '#1677ff40' : '#1677ff40'};
      border-radius: 4px;
      padding: 2px 6px;
      margin: 0 2px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        background: ${props => props.$theme === 'dark' ? '#1677ff33' : '#bae0ff'};
      }
    }
  }
`;


const MessageCard: React.FC<MessageCardProps> = ({
  role,
  content,
  theme = 'light',
  parameters = [],
  onParametersChange,
  onContentChange,
  onDelete
}) => {
  const { t } = useTranslation();
  
  // 状态定义
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [currentParamKey, setCurrentParamKey] = useState('');
  const [allParameters, setAllParameters] = useState<Parameter[]>([]);
  const [rawContent, setRawContent] = useState('');

  // 提取消息ID，用于标识定时器
  const messageId = typeof content === 'object' && Array.isArray(content)
    ? undefined
    : (content as any)?.id;

  // 重要的状态引用，用于避免循环依赖
  const contentRef = useRef(content);
  const parametersRef = useRef(parameters);
  const isProcessingContent = useRef(false);
  const formatParametersTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化allParameters，确保从数据库加载的参数能正确显示
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      setAllParameters(parameters);
    }
  }, [parameters]);

  // 保存内容函数
  const saveContent = useCallback(() => {
    if (!editor || !onContentChange) return;

    const text = editor.getText();

    // 根据内容类型处理
    if (typeof content === 'string' && role !== 'user') {
      onContentChange(text);
    } else {
      // 用户角色始终使用数组格式，或者保持现有数组格式
      const newContent = Array.isArray(content) ? [...content] : [];
      const textIndex = newContent.findIndex(item => item.type === 'text');

      if (textIndex >= 0) {
        newContent[textIndex] = {
          ...newContent[textIndex],
          text
        };
      } else {
        // 如果没有文本内容，添加一个
        newContent.unshift({
          type: 'text',
          text
        });
      }

      onContentChange(newContent);
    }
  }, [content, onContentChange, role]);

  // 保存saveContent引用
  const saveContentRef = useRef(saveContent);
  useEffect(() => {
    saveContentRef.current = saveContent;
  }, [saveContent]);

  // 更新参数函数
  const updateParameters = useCallback((extractedParams: Parameter[]) => {
    console.log('🔄 updateParameters called with:', extractedParams);
    // 立即更新参数列表
    setAllParameters(prevParams => {
      console.log('📋 Previous parameters:', prevParams);
      // 创建新的参数数组，保留现有的值
      const updatedParams = [...prevParams];

      // 为了保持已有参数的值，先创建一个映射
      const existingParamMap = new Map(prevParams.map(p => [p.key, p.value]));

      // 合并提取的参数，保持已有的值
      const mergedParams = extractedParams.map(param => {
        const existingValue = existingParamMap.get(param.key) || '';
        return { key: param.key, value: existingValue };
      });

      // 确保所有提取的参数都在最终列表中
      mergedParams.forEach(param => {
        if (!updatedParams.some(p => p.key === param.key)) {
          updatedParams.push(param);
        }
      });

      // 确保最终列表中只包含文本中存在的参数和已经设置了值的参数
      const finalParams = updatedParams
        .filter(param =>
          extractedParams.some(p => p.key === param.key) || param.value.trim() !== ''
        )
        .filter((param, index, self) =>
          index === self.findIndex(p => p.key === param.key)
        );
      
      console.log('✨ Final parameters:', finalParams);
      return finalParams;
    });
  }, []);

  // 初始化editor引用以避免错误
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  // 初始化编辑器
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: t('messageCard.placeholder'),
      }),
      ParameterMark,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      if (text !== rawContent) {
        setRawContent(text);

        // 始终提取参数，不受isProcessingContent影响
        const extractedParams = extractParameters(text);
        console.log('📝 Extracted parameters:', extractedParams);
        updateParameters(extractedParams);

        // 只有在不是程序化处理内容时才进行格式化
        if (!isProcessingContent.current && text.includes('{{') && text.includes('}}')) {
          console.log('⏰ Scheduling parameter formatting...');
          // 清除之前的定时器
          if (formatParametersTimeoutRef.current) {
            clearTimeout(formatParametersTimeoutRef.current);
          }
          
          // 减少延迟时间，让用户能更快看到格式化效果
          formatParametersTimeoutRef.current = setTimeout(() => {
            if (!isProcessingContent.current && editor && !editor.isDestroyed) {
              console.log('🎨 Executing parameter formatting...');
              isProcessingContent.current = true;
              try {
                // @ts-ignore - 我们知道命令存在
                const result = editor.commands.formatParameters();
                console.log('✅ Format parameters result:', result);
              } finally {
                isProcessingContent.current = false;
              }
            } else {
              console.log('❌ Skipping formatting - conditions not met');
            }
          }, 100); // 减少到100ms，让格式化更及时
        } else {
          console.log('⚠️ Skipping formatting - isProcessingContent:', isProcessingContent.current, 'hasParams:', text.includes('{{') && text.includes('}}'));
        }

        // 延迟自动保存，避免频繁保存
        if (onContentChange) {
          // 清除之前的保存定时器
          const timerId = `autoSaveTimer_${messageId || Math.random()}`;
          if ((window as any)[timerId]) {
            clearTimeout((window as any)[timerId]);
          }
          
          // 延迟保存
          (window as any)[timerId] = setTimeout(() => {
            if (!isProcessingContent.current) {
              saveContent();
            }
            delete (window as any)[timerId];
          }, 500); // 延迟保存，避免频繁触发
        }
      }
    },
    onBlur: ({ editor }) => {
      // 在编辑器失去焦点时保存内容，但需避免重复保存
      if (!isProcessingContent.current && onContentChange) {
        // 检查是否有挂起的自动保存，如果有则不再手动保存
        const timerId = `autoSaveTimer_${messageId || Math.random()}`;
        if (!(window as any)[timerId]) {
          saveContent();
        }
      }

      // 在编辑器失去焦点时格式化参数
      if (!isProcessingContent.current && editor.getText().includes('{{') && editor.getText().includes('}}')) {
        // 清除之前的定时器
        if (formatParametersTimeoutRef.current) {
          clearTimeout(formatParametersTimeoutRef.current);
        }
        
        // 使用setTimeout避免在React渲染周期中触发状态更新
        formatParametersTimeoutRef.current = setTimeout(() => {
          if (!isProcessingContent.current && editor && !editor.isDestroyed) {
            isProcessingContent.current = true;
            try {
              // @ts-ignore - 我们知道命令存在
              editor.commands.formatParameters();
            } finally {
              isProcessingContent.current = false;
            }
          }
        }, 100);
      }
    },
  });

  // 设置editor引用
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // 初始化内容 - 只在编辑器创建和内容首次加载时执行一次
  useEffect(() => {
    if (!editor || !content || !editor.isEmpty) return;

    let initialText = '';
    if (typeof content === 'string') {
      initialText = content;
    } else {
      const textItem = content.find(item => item.type === 'text');
      if (textItem && textItem.text) {
        initialText = textItem.text;
      }
    }

    if (initialText) {
      isProcessingContent.current = true;
      
      // 使用 setContent 时不触发 onUpdate
      editor.commands.setContent(initialText, false);
      setRawContent(initialText);

      // 设置内容后，格式化参数
      setTimeout(() => {
        // 提取并更新参数列表
        const extractedParams = extractParameters(initialText);
        updateParameters(extractedParams);

        if (initialText.includes('{{') && initialText.includes('}}')) {
          try {
            // @ts-ignore - 我们知道命令存在
            editor.commands.formatParameters();
          } catch (e) {
            console.warn('Failed to format parameters during initialization:', e);
          }
        }
        isProcessingContent.current = false;
      }, 50);
    }
  }, [editor, content]);

  // 监听内容变化 - 修改逻辑避免不必要的更新
  useEffect(() => {
    if (!editor) return;

    // 只有当内容引用变化时才更新，避免循环更新
    const contentChanged = content !== contentRef.current;
    const parametersChanged = parameters !== parametersRef.current;

    if (contentChanged || parametersChanged) {
      contentRef.current = content;
      parametersRef.current = parameters;

      // 如果正在编辑中，避免更新内容
      if (!isProcessingContent.current && contentChanged) {
        let newText = '';
        if (typeof content === 'string') {
          newText = content;
        } else {
          const textItem = content.find(item => item.type === 'text');
          if (textItem && textItem.text) {
            newText = textItem.text;
          }
        }

        // 只有当文本确实不同时才更新编辑器内容
        const currentText = editor.getText();
        if (newText !== currentText && newText !== '') {
          isProcessingContent.current = true;
          
          // 使用 setContent 时不触发 onUpdate
          editor.commands.setContent(newText, false);
          setRawContent(newText);

          // 设置内容后，确保格式化所有参数
          setTimeout(() => {
            if (newText.includes('{{') && newText.includes('}}')) {
              try {
                // @ts-ignore - 我们知道命令存在
                editor.commands.formatParameters();
              } catch (e) {
                console.warn('Failed to format parameters during content change:', e);
              }
            }

            // 确保更新参数列表
            const extractedParams = extractParameters(newText);
            updateParameters(extractedParams);

            isProcessingContent.current = false;
          }, 50);
        }
      }

      // 只有在参数变化时才更新参数列表
      if (parametersChanged) {
        const extractedParams = extractParameters(editor.getText());
        setAllParameters(prevParams => {
          // 用户角色时始终使用数组格式
          const mergedParams = [...(role === 'user' ? [] : parameters)];

          // 为了保持已有参数的值，先创建一个映射
          const existingParamMap = new Map(prevParams.map(p => [p.key, p.value]));

          // 创建传入参数的映射，优先使用数据库中的参数值
          const incomingParamMap = new Map(parameters.map(p => [p.key, p.value]));

          // 确保提取的参数都在最终列表中，但优先使用数据库参数值
          extractedParams.forEach(param => {
            const existingValue = incomingParamMap.get(param.key) || existingParamMap.get(param.key) || '';
            if (!mergedParams.some(p => p.key === param.key)) {
              mergedParams.push({ key: param.key, value: existingValue });
            }
          });

          // 确保最终列表中只包含文本中存在的参数和已经设置了值的参数
          return mergedParams
            .filter(param =>
              extractedParams.some(p => p.key === param.key) || param.value.trim() !== ''
            )
            .filter((param, index, self) =>
              index === self.findIndex(p => p.key === param.key)
            );
        });
      }
    }
  }, [content, editor, role]);

  // 自动保存 - 修改为使用节流方式避免频繁更新
  useEffect(() => {
    // 移除这个useEffect，防止在内容变化时的重复保存
    // 自动保存已移至编辑器的onUpdate事件中处理
    return () => {
      // 清理所有可能的定时器
      const timerId = `autoSaveTimer_${messageId || Math.random()}`;
      clearTimeout((window as any)[timerId]);
      
      // 清理格式化参数的定时器
      if (formatParametersTimeoutRef.current) {
        clearTimeout(formatParametersTimeoutRef.current);
      }
    };
  }, []); // 依赖为空，只在组件挂载和卸载时执行

  // 添加参数点击处理
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('parameter-tag') || (target.parentElement && target.parentElement.classList.contains('parameter-tag'))) {
        event.preventDefault();
        event.stopPropagation();

        const paramElement = target.classList.contains('parameter-tag') ? target : target.parentElement;
        const paramKey = paramElement?.getAttribute('data-param');

        if (paramKey) {
          handleParameterClick(paramKey);
        }
      }
    };

    const editorElement = editor.options.element;
    if (editorElement) {
      editorElement.addEventListener('click', handleClick);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('click', handleClick);
      }
    };
  }, [editor]);

  // 创建参数容器
  useEffect(() => {
    const panelContainer = document.createElement('div');
    panelContainer.id = 'parameter-panel-container';
    document.body.appendChild(panelContainer);

    return () => {
      if (document.body.contains(panelContainer)) {
        document.body.removeChild(panelContainer);
      }
    };
  }, []);

  // 获取角色标签
  const getRoleLabel = () => {
    switch (role) {
      case 'user': return t('messageCard.user');
      case 'assistant': return t('messageCard.assistant');
      case 'system': return t('messageCard.system');
      default: return '';
    }
  };

  // 处理参数点击
  const handleParameterClick = (key: string) => {
    setCurrentParamKey(key);

    // 修改条件检查，确保不重复添加参数
    if (!allParameters.some(p => p.key === key)) {
      setAllParameters(prev => {
        // 再次检查是否已存在该key，避免并发状态更新导致重复添加
        if (prev.some(p => p.key === key)) {
          return prev;
        }
        return [...prev, { key, value: '' }];
      });
    }

    setIsPanelVisible(true);
  };

  // 处理参数值变化
  const handleValueChange = (key: string, value: string) => {
    setAllParameters(prev => {
      // 确保只更新已存在的参数，不重复添加
      const paramExists = prev.some(p => p.key === key);
      if (paramExists) {
        return prev.map(param => param.key === key ? { ...param, value } : param);
      } else {
        // 参数不存在时，添加新参数（通常不会走到这里，但保险起见）
        return [...prev, { key, value }];
      }
    });
  };

  // 关闭参数面板
  const handlePanelClose = () => {
    setIsPanelVisible(false);
  };

  // 应用参数变更
  const handleApplyParameters = () => {
    if (onParametersChange) {
      // 确保深拷贝参数对象，避免引用问题
      const paramsCopy = JSON.parse(JSON.stringify(allParameters));
      console.log('Applying parameters:', paramsCopy);
      onParametersChange(paramsCopy);

      // 强制保存当前内容，确保参数与内容同步更新到Store
      if (editor && onContentChange) {

        const text = editor.getText();

        // 根据内容类型处理
        if (typeof content === 'string' && role !== 'user') {
          onContentChange(text);
        } else {
          // 用户角色始终使用数组格式，或者保持现有数组格式
          const newContent = Array.isArray(content) ? [...content] : [];
          const textIndex = newContent.findIndex(item => item.type === 'text');

          if (textIndex >= 0) {
            newContent[textIndex] = {
              ...newContent[textIndex],
              text
            };
          } else {
            // 如果没有文本内容，添加一个
            newContent.unshift({
              type: 'text',
              text
            });
          }

          onContentChange(newContent);
        }
      }
    }
    setIsPanelVisible(false);
  };

  // 按下回车保存
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveContent();
    }
  };

  return (
    <>
      <StyledCard
        style={{
          maxHeight: 380
        }}
        bodyStyle={{ padding: 8 }}
        $role={role}
        $theme={theme}
      >
        <MessageHeader>
          <RoleInfo>
            <RoleLabel $role={role} $theme={theme}>{getRoleLabel()}</RoleLabel>
          </RoleInfo>

          {onDelete && (
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              onClick={onDelete}
              danger
            />
          )}
        </MessageHeader>
        <StyledEditorContent
          $theme={theme}
          editor={editor}
          style={{
            height: 'calc(350px - 25px)',
            overflow: 'auto'
          }}
          onEnded={() => {
            saveContent();
          }}
          onKeyDown={handleKeyDown}
        />
      </StyledCard>

      <ParameterPanel $theme={theme} $isVisible={isPanelVisible}>
        <PanelHeader $theme={theme}>
          <PanelTitle $theme={theme}>{t('messageCard.parameterSettings')}</PanelTitle>
          <CloseButton $theme={theme} onClick={handlePanelClose}>
            <CloseOutlined />
          </CloseButton>
        </PanelHeader>

        <PanelContent>
          <ParameterList>
            {allParameters.map((param, index) => (
              <ParameterItem style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }} key={index} $theme={theme}>
                <div className="param-key">
                  <span style={{
                    background: '#0059ff',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                  }}>{'{{'}{param.key}{'}}'}</span>
                  :</div>
                <Input.TextArea
                  className="param-value"
                  value={param.value}
                  onChange={(e) => handleValueChange(param.key, e.target.value)}
                  placeholder={t('messageCard.enterValueFor', { key: param.key })}
                  autoFocus={param.key === currentParamKey}
                  autoSize={{ minRows: 8, maxRows: 8 }}
                />
              </ParameterItem>
            ))}
          </ParameterList>
        </PanelContent>

        <PanelFooter $theme={theme}>
          <Button onClick={handlePanelClose}>{t('messageCard.cancel')}</Button>
          <ApplyButton type="primary" onClick={handleApplyParameters}>{t('messageCard.apply')}</ApplyButton>
        </PanelFooter>
      </ParameterPanel>
    </>
  );
};

export default MessageCard;