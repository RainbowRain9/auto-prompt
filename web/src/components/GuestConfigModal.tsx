import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Space, Typography, Alert } from 'antd';
import { ApiOutlined, KeyOutlined, InfoCircleOutlined } from '@ant-design/icons';
// import { useTranslation } from 'react-i18next';
import { setGuestLLMConfig, getGuestLLMConfig, type LLMConfig } from '../utils/llmClient';

const { Text, Link } = Typography;

interface GuestConfigModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (config: LLMConfig) => void;
  title?: string;
  description?: string;
}

const GuestConfigModal: React.FC<GuestConfigModalProps> = ({
  open,
  onCancel,
  onOk,
  title,
  description
}) => {
  // const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // 打开弹窗时，加载已保存的配置
      const savedConfig = getGuestLLMConfig();
      if (savedConfig) {
        form.setFieldsValue(savedConfig);
      } else {
        // 设置默认值
        form.setFieldsValue({
          baseURL: 'https://api.openai.com/v1',
          apiKey: ''
        });
      }
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const config: LLMConfig = {
        apiKey: values.apiKey.trim(),
        baseURL: values.baseURL.trim()
      };

      // 验证配置是否有效
      if (!config.apiKey || !config.baseURL) {
        message.error('请填写完整的API配置信息');
        return;
      }

      // 保存配置
      setGuestLLMConfig(config);
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

  return (
    <Modal
      title={title || '配置API设置'}
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
          message="游客模式说明"
          description={
            description || 
            "作为游客，您需要提供自己的API配置才能使用AI功能。您的API密钥将安全地存储在本地浏览器中，不会上传到服务器。"
          }
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
            name="baseURL"
            label={
              <Space>
                <ApiOutlined />
                <Text strong>API 基础地址</Text>
              </Space>
            }
            rules={[
              { required: true, message: '请输入API基础地址' },
              { type: 'url', message: '请输入有效的URL地址' }
            ]}
            extra={
              <Text type="secondary">
                例如: https://api.openai.com/v1 或您的代理地址
              </Text>
            }
          >
            <Input
              placeholder="https://api.openai.com/v1"
              prefix={<ApiOutlined />}
            />
          </Form.Item>

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
                您的OpenAI API密钥，以 sk- 开头。
                <Link href="https://platform.openai.com/api-keys" target="_blank">
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

export default GuestConfigModal; 