import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Space, Typography, Alert } from 'antd';
import { KeyOutlined, InfoCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuthStore, getLoginUrl } from '../stores/authStore';
import type { LLMConfig } from '../utils/llmClient';

const { Text, Link } = Typography;

interface ApiConfigModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (config: LLMConfig) => void;
  title?: string;
  description?: string;
}

const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  open,
  onCancel,
  onOk,
  title,
  description
}) => {
  const [loading, setLoading] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const { apiKey, loginType, setApiConfig, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (open) {
      // 打开弹窗时，加载已保存的配置
      if (apiKey) {
        setApiKeyValue(apiKey);
      } else {
        // 设置默认值
        setApiKeyValue('');
      }
      // 清除错误状态
      setApiKeyError('');
    }
  }, [open, apiKey]);

  const validateApiKey = (value: string): boolean => {
    if (!value || value.trim() === '') {
      setApiKeyError('请输入API密钥');
      return false;
    }
    if (value.trim().length < 10) {
      setApiKeyError('API密钥长度不能少于10个字符');
      return false;
    }
    setApiKeyError('');
    return true;
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKeyValue(value);
    // 清除之前的错误信息
    if (apiKeyError) {
      setApiKeyError('');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const trimmedApiKey = apiKeyValue.trim();
      
      // 验证输入
      if (!validateApiKey(trimmedApiKey)) {
        return;
      }

      const config: LLMConfig = {
        apiKey: trimmedApiKey,
      };

      // 保存到 authStore
      setApiConfig(config.apiKey);
      
      message.success('API配置已保存');
      onOk(config);
    } catch (error) {
      console.error('保存配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setApiKeyValue('');
    setApiKeyError('');
    onCancel();
  };

  const handleLogin = () => {
    // 跳转到登录页面，刷新整个页面以触发App.tsx中的登录检查
    window.location.reload();
  };

  const handleThorLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const currentUrl = window.location.href;
      const loginUrl = getLoginUrl(currentUrl);
      window.location.href = loginUrl;
    }, 800);
  };

  const getModalTitle = () => {
    if (title) return title;
    if (!isAuthenticated) return '需要登录';
    return loginType === 'password' ? '配置API密钥' : '修改API设置';
  };

  const getDescription = () => {
    if (description) return description;
    
    if (!isAuthenticated) {
      return "您需要先登录才能使用AI功能。请选择登录方式。";
    }
    
    if (loginType === 'password') {
      return "您需要配置API密钥才能使用AI功能。您的API密钥将安全地存储在本地浏览器中。";
    } else {
      return "您可以修改API配置来使用不同的AI服务。您的API密钥将安全地存储在本地浏览器中。";
    }
  };

  // 如果用户未登录，显示登录选项
  if (!isAuthenticated) {
    return (
      <Modal
        title={getModalTitle()}
        open={open}
        closable={false}
        onCancel={handleCancel}
        width={500}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
        ]}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="需要登录"
            description={getDescription()}
            type="warning"
            icon={<InfoCircleOutlined />}
            showIcon
          />

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={handleThorLogin}
              block
              loading={loading}
            >
              使用 Thor 平台登录
            </Button>
            
            <Button
              type="default"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              block
            >
              使用账户密码登录
            </Button>
          </Space>

          <Alert
            message="登录说明"
            description="登录后您将能够使用所有AI功能，包括提示词优化、图片生成等。"
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    );
  }

  // 已登录用户的API配置界面
  return (
    <Modal
      title={getModalTitle()}
      open={open}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          保存配置
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="API配置说明"
          description={getDescription()}
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
        />
        
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8 }}>
            <Space>
              <KeyOutlined />
              <Text strong>API 密钥</Text>
            </Space>
          </div>
          
          <Input.Password
            value={apiKeyValue}
            onChange={handleApiKeyChange}
            placeholder="sk-..."
            prefix={<KeyOutlined />}
            status={apiKeyError ? 'error' : ''}
          />
          
          {apiKeyError && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {apiKeyError}
            </div>
          )}
          
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              您的Token AI API密钥，以 sk- 开头。
              <Link href="https://api.token-ai.cn/token" target="_blank">
                获取API密钥
              </Link>
            </Text>
          </div>
        </div>

        <Alert
          message="隐私保护"
          description="您的API密钥仅存储在本地浏览器中，我们不会收集或存储您的API密钥信息。"
          type="success"
          showIcon
        />
      </Space>
    </Modal>
  );
};

export default ApiConfigModal; 