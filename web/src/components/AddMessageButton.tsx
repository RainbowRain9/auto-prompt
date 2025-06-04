import React, { useState } from 'react';
import { Button, Modal, Select, Upload, Input, Space, message } from 'antd';
import styled from 'styled-components';
import { PlusOutlined, UserOutlined, RobotOutlined, FileImageOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { MessageContent, Parameter } from '../stores/chatStore';
import { extractParameters } from '../utils/messageHelper';

const { TextArea } = Input;
const { Option } = Select;

interface AddMessageButtonProps {
  onAddUserMessage: (content: MessageContent[], parameters: Parameter[]) => void;
  onAddAssistantMessage: (content: string, parameters: Parameter[]) => void;
  theme?: 'dark' | 'light';
}

const StyledButton = styled(Button)<{ $theme?: 'dark' | 'light' }>`
  &.ant-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    height: 44px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
`;

const ModalContent = styled.div<{ $theme?: 'dark' | 'light' }>`
  .role-selector {
    margin-bottom: 16px;
  }
  
  .upload-container {
    margin-top: 16px;
    display: ${props => props.$theme === 'dark' ? 'block' : 'block'};
  }
  
  .upload-text {
    font-size: 14px;
    color: ${props => props.$theme === 'dark' ? '#ffffffa6' : '#00000073'};
    margin-bottom: 8px;
  }
`;

const StyledTextArea = styled(TextArea)<{ $theme?: 'dark' | 'light' }>`
  &.ant-input {
    background: ${props => props.$theme === 'dark' ? '#1f1f1f' : '#ffffff'};
    border: 1px solid ${props => props.$theme === 'dark' ? '#424242' : '#d9d9d9'};
    color: ${props => props.$theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    
    &:focus {
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
    }
  }
`;

const AddMessageButton: React.FC<AddMessageButtonProps> = ({ 
  onAddUserMessage, 
  onAddAssistantMessage, 
  theme = 'light' 
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messageRole, setMessageRole] = useState<'user' | 'assistant'>('user');
  const [textContent, setTextContent] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setMessageRole('user');
    setTextContent('');
    setFileList([]);
  };

  const handleAdd = () => {
    if (messageRole === 'assistant') {
      if (!textContent.trim()) {
        message.error('请输入助手消息内容');
        return;
      }
      
      // 提取文本中的参数
      const parameters = extractParameters(textContent);
      
      onAddAssistantMessage(textContent, parameters);
    } else {
      // 用户消息可以包含文本和图片
      const content: MessageContent[] = [];
      
      // 提取参数
      let parameters: Parameter[] = [];
      
      // 添加文本内容
      if (textContent.trim()) {
        content.push({
          type: 'text',
          text: textContent
        });
        
        // 提取文本中的参数
        parameters = extractParameters(textContent);
      }
      
      // 添加图片内容
      fileList.forEach(file => {
        if (file.url || file.thumbUrl) {
          content.push({
            type: 'image_url',
            image_url: {
              url: file.url || file.thumbUrl || ''
            }
          });
        }
      });
      
      if (content.length === 0) {
        message.error('请添加文本或图片内容');
        return;
      }
      
      onAddUserMessage(content, parameters);
    }
    
    setIsModalVisible(false);
    resetForm();
  };

  const uploadProps: UploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
      }
      return false; // 阻止自动上传
    },
    listType: 'picture-card',
    maxCount: 5,
  };

  return (
    <>
      <StyledButton $theme={theme} icon={<PlusOutlined />} onClick={showModal}>
        添加新消息
      </StyledButton>
      
      <Modal
        title="添加新消息"
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleAdd}
        okText="添加"
        cancelText="取消"
      >
        <ModalContent $theme={theme}>
          <div className="role-selector">
            <Select
              defaultValue="user"
              style={{ width: '100%' }}
              onChange={(value: 'user' | 'assistant') => {
                setMessageRole(value);
                // 如果切换到助手，清除图片列表
                if (value === 'assistant') {
                  setFileList([]);
                }
              }}
            >
              <Option value="user">
                <Space>
                  <UserOutlined />
                  用户消息
                </Space>
              </Option>
              <Option value="assistant">
                <Space>
                  <RobotOutlined />
                  助手消息
                </Space>
              </Option>
            </Select>
          </div>
          
          <StyledTextArea
            $theme={theme}
            placeholder={messageRole === 'user' ? "输入用户消息..." : "输入助手回复..."}
            rows={4}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
          
          {messageRole === 'user' && (
            <div className="upload-container">
              <div className="upload-text">
                <FileImageOutlined /> 添加图片(可选)
              </div>
              <Upload {...uploadProps}>
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              </Upload>
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddMessageButton; 