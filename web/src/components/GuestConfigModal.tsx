import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Space, Typography, Alert } from 'antd';
import { KeyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { apiKey, loginType, setApiConfig } = useAuthStore();

  useEffect(() => {
    if (open) {
      // 打开弹窗时，加载已保存的配置
      if (apiKey ) {
        form.setFieldsValue({ apiKey });
      } else {
        // 设置默认值
        form.setFieldsValue({
          apiKey: ''
        });
      }
    }
  }, [open, form, apiKey]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const config: LLMConfig = {
        apiKey: values.apiKey.trim(),
      };

      // 验证配置是否有效
      if (!config.apiKey) {
        message.error('请填写完整的API配置信息');
        return;
      }

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
    form.resetFields();
    onCancel();
  };

  const getModalTitle = () => {
    if (title) return title;
    return loginType === 'password' ? '配置API密钥' : '修改API设置';
  };

  const getDescription = () => {
    if (description) return description;
    
    if (loginType === 'password') {
      return "您需要配置API密钥才能使用AI功能。您的API密钥将安全地存储在本地浏览器中。";
    } else {
      return "您可以修改API配置来使用不同的AI服务。您的API密钥将安全地存储在本地浏览器中。";
    }
  };

  return (
    <Modal
      title={getModalTitle()}
      open={open}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
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

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="apiKey"
            label={
              <Space>
                <KeyOutlined />
                <Text strong>API 密钥</Text>
              </Space>
            }
            rules={[
              { required: true, message: '请输入API密钥' },
              { min: 10, message: 'API密钥长度不能少于10个字符' }
            ]}
            extra={
              <Text type="secondary">
                您的Token AI API密钥，以 sk- 开头。
                <Link href="https://api.token-ai.cn/token" target="_blank">
                  获取API密钥
                </Link>
              </Text>
            }
          >
            <Input.Password
              placeholder="sk-..."
              prefix={<KeyOutlined />}
            />
          </Form.Item>
        </Form>

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