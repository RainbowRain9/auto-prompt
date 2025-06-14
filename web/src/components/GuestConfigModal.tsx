import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Space, Typography, Alert } from 'antd';
import { KeyOutlined, InfoCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const { apiKey, loginType, setApiConfig, isAuthenticated, systemInfo } = useAuthStore();

  // 如果是内置API Key模式，不显示这个弹窗
  if (systemInfo?.builtInApiKey) {
    return null;
  }

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
      setApiKeyError(t('apiConfig.errors.apiKeyRequired'));
      return false;
    }
    if (value.trim().length < 10) {
      setApiKeyError(t('apiConfig.errors.apiKeyTooShort'));
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
      
      message.success(t('apiConfig.messages.configSaved'));
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
    if (!isAuthenticated) return t('apiConfig.title.loginRequired');
    return loginType === 'password' ? t('apiConfig.title.configApiKey') : t('apiConfig.title.modifyApiSettings');
  };

  const getDescription = () => {
    if (description) return description;
    
    if (!isAuthenticated) {
      return t('apiConfig.description.loginRequired');
    }
    
    return t('apiConfig.description.apiKeyRequired');
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
            {t('apiConfig.buttons.cancel')}
          </Button>,
        ]}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message={t('apiConfig.alerts.loginRequired.title')}
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
              {t('apiConfig.buttons.thorLogin')}
            </Button>
            
            <Button
              type="default"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              block
            >
              {t('apiConfig.buttons.passwordLogin')}
            </Button>
          </Space>

          <Alert
            message={t('apiConfig.alerts.loginExplanation.title')}
            description={t('apiConfig.alerts.loginExplanation.description')}
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
          {t('apiConfig.buttons.saveConfig')}
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message={t('apiConfig.alerts.apiConfigInfo.title')}
          description={getDescription()}
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
        />
        
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8 }}>
            <Space>
              <KeyOutlined />
              <Text strong>{t('apiConfig.form.apiKeyLabel')}</Text>
            </Space>
          </div>
          
          <Input.Password
            value={apiKeyValue}
            onChange={handleApiKeyChange}
            placeholder={t('apiConfig.form.apiKeyPlaceholder')}
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
              {t('apiConfig.form.apiKeyDescription')}
              <Link href="https://api.token-ai.cn/token" target="_blank">
                {t('apiConfig.form.getApiKeyLink')}
              </Link>
            </Text>
          </div>
        </div>

        <Alert
          message={t('apiConfig.alerts.privacyProtection.title')}
          description={t('apiConfig.alerts.privacyProtection.description')}
          type="success"
          showIcon
        />
      </Space>
    </Modal>
  );
};

export default ApiConfigModal; 