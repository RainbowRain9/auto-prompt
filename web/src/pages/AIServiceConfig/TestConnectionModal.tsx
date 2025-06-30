import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Alert,
  Typography,
  Space,
  Tag,
  Spin,
  Result,
} from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  testConnection,
  type TestConnectionInput,
  type AIProviderInfo,
} from '../../api/aiServiceConfig';

const { Option } = Select;
const { Text } = Typography;

interface TestConnectionModalProps {
  visible: boolean;
  providers: AIProviderInfo[];
  onCancel: () => void;
}

const TestConnectionModal: React.FC<TestConnectionModalProps> = ({
  visible,
  providers,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // 重置状态
  const resetState = () => {
    form.resetFields();
    setTestResult(null);
    setTesting(false);
  };

  // 处理提供商选择
  const handleProviderChange = (provider: string) => {
    const providerInfo = providers.find(p => p.name === provider);
    if (providerInfo) {
      form.setFieldValue('apiEndpoint', providerInfo.defaultEndpoint);
    }
  };

  // 测试连接
  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      
      setTesting(true);
      setTestResult(null);

      const testInput: TestConnectionInput = {
        provider: values.provider,
        apiEndpoint: values.apiEndpoint,
        apiKey: values.apiKey,
        testModel: values.testModel,
      };

      const response = await testConnection(testInput);
      if (response.success) {
        setTestResult(response.data);
      } else {
        setTestResult({
          success: false,
          message: response.message || '连接测试失败',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '连接测试失败: ' + (error as Error).message,
      });
    } finally {
      setTesting(false);
    }
  };

  // 关闭模态框
  const handleCancel = () => {
    resetState();
    onCancel();
  };

  return (
    <Modal
      title="测试AI服务连接"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          关闭
        </Button>,
        <Button
          key="test"
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleTest}
          loading={testing}
        >
          测试连接
        </Button>,
      ]}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="provider"
          label="服务提供商"
          rules={[{ required: true, message: '请选择服务提供商' }]}
        >
          <Select
            placeholder="选择AI服务提供商"
            onChange={handleProviderChange}
          >
            {providers.map(provider => (
              <Option key={provider.name} value={provider.name}>
                <Space>
                  {provider.displayName}
                  <Text type="secondary">({provider.description})</Text>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="apiEndpoint"
          label="API端点地址"
          rules={[
            { required: true, message: '请输入API端点地址' },
            { type: 'url', message: '请输入有效的URL地址' },
          ]}
        >
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label="API密钥"
          rules={[{ required: true, message: '请输入API密钥' }]}
        >
          <Input.Password placeholder="请输入API密钥" />
        </Form.Item>

        <Form.Item
          name="testModel"
          label="测试模型（可选）"
        >
          <Input placeholder="指定用于测试的模型名称" />
        </Form.Item>
      </Form>

      {/* 测试进行中 */}
      {testing && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>正在测试连接，请稍候...</Text>
          </div>
        </div>
      )}

      {/* 测试结果 */}
      {testResult && !testing && (
        <div style={{ marginTop: '16px' }}>
          {testResult.success ? (
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              title="连接测试成功"
              subTitle={testResult.message}
              extra={
                <div>
                  {testResult.availableModels && testResult.availableModels.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <Text strong>可用模型：</Text>
                      <div style={{ marginTop: '8px' }}>
                        {testResult.availableModels.slice(0, 10).map((model: string) => (
                          <Tag key={model} style={{ marginBottom: '4px' }}>
                            {model}
                          </Tag>
                        ))}
                        {testResult.availableModels.length > 10 && (
                          <Tag>
                            +{testResult.availableModels.length - 10} 更多...
                          </Tag>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {testResult.details && (
                    <div style={{ marginTop: '16px' }}>
                      <Text strong>连接详情：</Text>
                      <div style={{ marginTop: '8px' }}>
                        {Object.entries(testResult.details).map(([key, value]) => (
                          <div key={key}>
                            <Text type="secondary">{key}:</Text> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              }
            />
          ) : (
            <Result
              icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              title="连接测试失败"
              subTitle={testResult.message}
              extra={
                <Alert
                  message="连接失败可能的原因"
                  description={
                    <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                      <li>API密钥无效或已过期</li>
                      <li>API端点地址不正确</li>
                      <li>网络连接问题</li>
                      <li>服务提供商服务异常</li>
                      <li>API配额已用完</li>
                    </ul>
                  }
                  type="warning"
                  showIcon
                />
              }
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default TestConnectionModal;
