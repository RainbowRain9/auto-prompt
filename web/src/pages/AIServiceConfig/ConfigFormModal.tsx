import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Divider,
  Typography,
  Alert,
  Tag,
  Tooltip,
  Row,
  Col,
  InputNumber,
  message,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  testConnection,
  type CreateAIServiceConfigInput,
  type UpdateAIServiceConfigInput,
  type AIServiceConfigListDto,
  type AIProviderInfo,
  type TestConnectionInput,
} from '../../api/aiServiceConfig';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface ConfigFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  providers: AIProviderInfo[];
  initialValues?: AIServiceConfigListDto | null;
  onCancel: () => void;
  onSubmit: (values: CreateAIServiceConfigInput | UpdateAIServiceConfigInput) => void;
}

const ConfigFormModal: React.FC<ConfigFormModalProps> = ({
  visible,
  mode,
  providers,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [chatModels, setChatModels] = useState<string[]>([]);
  const [imageModels, setImageModels] = useState<string[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setSelectedProvider('');
    setChatModels([]);
    setImageModels([]);
    setTestResult(null);
  };

  // 当模态框打开时初始化表单
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialValues) {
        // 编辑模式，填充现有数据
        setSelectedProvider(initialValues.provider);
        setChatModels(initialValues.chatModels || []);
        setImageModels(initialValues.imageModels || []);
        
        form.setFieldsValue({
          name: initialValues.name,
          provider: initialValues.provider,
          apiEndpoint: initialValues.apiEndpoint,
          chatModels: initialValues.chatModels || [],
          imageModels: initialValues.imageModels || [],
          defaultChatModel: initialValues.defaultChatModel,
          defaultImageModel: initialValues.defaultImageModel,
          isEnabled: initialValues.isEnabled,
          isDefault: initialValues.isDefault,
          description: initialValues.description,
          sortOrder: initialValues.sortOrder,
        });
      } else {
        // 创建模式，重置表单
        resetForm();
      }
    }
  }, [visible, mode, initialValues, form]);

  // 处理提供商选择
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const providerInfo = providers.find(p => p.name === provider);
    if (providerInfo) {
      form.setFieldValue('apiEndpoint', providerInfo.defaultEndpoint);
      
      // 设置常用模型
      const commonModels = providerInfo.configTemplate?.commonModels as string[] || [];
      if (commonModels.length > 0) {
        // 区分聊天模型和图像模型
        const chatModelList = commonModels.filter(model =>
          !model.includes('dall-e') &&
          !model.includes('embedding') &&
          !model.includes('whisper')
        );
        const imageModelList = commonModels.filter(model =>
          model.includes('dall-e') ||
          model.includes('image')
        );

        setChatModels(chatModelList);
        setImageModels(imageModelList);
        form.setFieldValue('chatModels', chatModelList);
        form.setFieldValue('imageModels', imageModelList);

        if (chatModelList.length > 0) {
          form.setFieldValue('defaultChatModel', chatModelList[0]);
        }
        if (imageModelList.length > 0) {
          form.setFieldValue('defaultImageModel', imageModelList[0]);
        }
      }
    }
  };

  // 添加聊天模型
  const addChatModel = (model: string) => {
    if (model && !chatModels.includes(model)) {
      const newModels = [...chatModels, model];
      setChatModels(newModels);
      form.setFieldValue('chatModels', newModels);
    }
  };

  // 删除聊天模型
  const removeChatModel = (model: string) => {
    const newModels = chatModels.filter(m => m !== model);
    setChatModels(newModels);
    form.setFieldValue('chatModels', newModels);
    
    // 如果删除的是默认模型，清空默认模型
    if (form.getFieldValue('defaultChatModel') === model) {
      form.setFieldValue('defaultChatModel', newModels[0] || '');
    }
  };

  // 添加图像模型
  const addImageModel = (model: string) => {
    if (model && !imageModels.includes(model)) {
      const newModels = [...imageModels, model];
      setImageModels(newModels);
      form.setFieldValue('imageModels', newModels);
    }
  };

  // 删除图像模型
  const removeImageModel = (model: string) => {
    const newModels = imageModels.filter(m => m !== model);
    setImageModels(newModels);
    form.setFieldValue('imageModels', newModels);
    
    // 如果删除的是默认模型，清空默认模型
    if (form.getFieldValue('defaultImageModel') === model) {
      form.setFieldValue('defaultImageModel', newModels[0] || '');
    }
  };

  // 测试连接
  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields(['provider', 'apiEndpoint', 'apiKey']);
      
      setTestLoading(true);
      const testInput: TestConnectionInput = {
        provider: values.provider,
        apiEndpoint: values.apiEndpoint,
        apiKey: values.apiKey,
        testModel: values.defaultChatModel,
      };

      const response = await testConnection(testInput);
      if (response.success) {
        setTestResult(response.data);
        
        // 如果测试成功且返回了模型列表，自动填充
        if (response.data?.success && response.data.availableModels) {
          const models = response.data.availableModels;
          setChatModels(models);
          form.setFieldValue('chatModels', models);
          if (models.length > 0 && !form.getFieldValue('defaultChatModel')) {
            form.setFieldValue('defaultChatModel', models[0]);
          }
        }
        
        message.success(response.data?.success ? '连接测试成功' : '连接测试失败');
      } else {
        message.error(response.message || '连接测试失败');
      }
    } catch (error) {
      message.error('连接测试失败: ' + (error as Error).message);
    } finally {
      setTestLoading(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const submitData = {
        ...values,
        chatModels,
        imageModels,
      };

      if (mode === 'edit' && initialValues) {
        onSubmit({
          id: initialValues.id,
          ...submitData,
        } as UpdateAIServiceConfigInput);
      } else {
        onSubmit(submitData as CreateAIServiceConfigInput);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 获取当前选择的提供商信息
  const currentProvider = providers.find(p => p.name === selectedProvider);

  return (
    <Modal
      title={mode === 'create' ? '添加AI服务配置' : '编辑AI服务配置'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="test" icon={<ThunderboltOutlined />} onClick={handleTestConnection} loading={testLoading}>
          测试连接
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {mode === 'create' ? '创建' : '更新'}
        </Button>,
      ]}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isEnabled: true,
          isDefault: false,
          sortOrder: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="配置名称"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="例如：我的OpenAI配置" />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>

        {currentProvider && (
          <Alert
            message={`${currentProvider.displayName} 配置说明`}
            description={
              <div>
                <p>{currentProvider.description}</p>
                <p>
                  <strong>支持功能：</strong>
                  {currentProvider.supportedFeatures.map(feature => (
                    <Tag key={feature} style={{ marginLeft: 4 }}>
                      {feature}
                    </Tag>
                  ))}
                </p>
                {currentProvider.configTemplate?.apiKeyFormat && (
                  <p>
                    <strong>API密钥格式：</strong>
                    <Text code>{currentProvider.configTemplate.apiKeyFormat}</Text>
                  </p>
                )}
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

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
          rules={[
            { required: mode === 'create', message: '请输入API密钥' },
          ]}
        >
          <Input.Password
            placeholder={mode === 'edit' ? '留空则不更新API密钥' : '请输入API密钥'}
          />
        </Form.Item>

        {/* 连接测试结果 */}
        {testResult && (
          <Alert
            message={testResult.success ? '连接测试成功' : '连接测试失败'}
            description={
              <div>
                <p>{testResult.message}</p>
                {testResult.availableModels && testResult.availableModels.length > 0 && (
                  <p>
                    <strong>可用模型：</strong>
                    {testResult.availableModels.slice(0, 5).map((model: string) => (
                      <Tag key={model} style={{ marginLeft: 4 }}>
                        {model}
                      </Tag>
                    ))}
                    {testResult.availableModels.length > 5 && (
                      <Text type="secondary">等 {testResult.availableModels.length} 个模型</Text>
                    )}
                  </p>
                )}
              </div>
            }
            type={testResult.success ? 'success' : 'error'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider>模型配置</Divider>

        {/* 聊天模型配置 */}
        <Form.Item label="聊天模型">
          <div style={{ marginBottom: 8 }}>
            <Input.Search
              placeholder="添加聊天模型，如：gpt-4"
              enterButton={<PlusOutlined />}
              onSearch={addChatModel}
            />
          </div>
          <div>
            {chatModels.map(model => (
              <Tag
                key={model}
                closable
                onClose={() => removeChatModel(model)}
                style={{ marginBottom: 4 }}
              >
                {model}
              </Tag>
            ))}
          </div>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="defaultChatModel"
              label="默认聊天模型"
            >
              <Select placeholder="选择默认聊天模型" allowClear>
                {chatModels.map(model => (
                  <Option key={model} value={model}>
                    {model}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="defaultImageModel"
              label="默认图像模型"
            >
              <Select placeholder="选择默认图像模型" allowClear>
                {imageModels.map(model => (
                  <Option key={model} value={model}>
                    {model}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 图像模型配置 */}
        <Form.Item label="图像生成模型">
          <div style={{ marginBottom: 8 }}>
            <Input.Search
              placeholder="添加图像模型，如：dall-e-3"
              enterButton={<PlusOutlined />}
              onSearch={addImageModel}
            />
          </div>
          <div>
            {imageModels.map(model => (
              <Tag
                key={model}
                closable
                onClose={() => removeImageModel(model)}
                style={{ marginBottom: 4 }}
              >
                {model}
              </Tag>
            ))}
          </div>
        </Form.Item>

        <Divider>其他设置</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="isEnabled" label="启用状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="isDefault" label="设为默认" valuePropName="checked">
              <Switch
                checkedChildren="默认"
                unCheckedChildren="非默认"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={18}>
            <Form.Item
              name="description"
              label="配置描述"
            >
              <TextArea
                placeholder="描述这个配置的用途和特点"
                rows={3}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="sortOrder"
              label="排序权重"
              tooltip="数值越小排序越靠前"
            >
              <InputNumber
                min={0}
                max={999}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ConfigFormModal;
