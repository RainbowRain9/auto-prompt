import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  message,
  Tag,
  Tooltip,
  Popconfirm,
  Switch,
  Select,
  Row,
  Col,
  Typography,
  Alert,
  Badge,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  StarFilled,
  ApiOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  searchAIServiceConfigs,
  createAIServiceConfig,
  updateAIServiceConfig,
  deleteAIServiceConfig,
  setDefaultAIServiceConfig,
  testSavedConfigConnection,
  getAIProviders,
  type AIServiceConfigListDto,
  type CreateAIServiceConfigInput,
  type UpdateAIServiceConfigInput,
  type AIServiceConfigSearchInput,
  type AIProviderInfo,
} from '../../api/aiServiceConfig';
import ConfigFormModal from './ConfigFormModal';
import TestConnectionModal from './TestConnectionModal';

const { Search } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const AIServiceConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<AIServiceConfigListDto[]>([]);
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [providerFilter, setProviderFilter] = useState<string | undefined>();
  const [enabledFilter, setEnabledFilter] = useState<boolean | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AIServiceConfigListDto | null>(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const params: AIServiceConfigSearchInput = {
        searchText,
        provider: providerFilter,
        isEnabled: enabledFilter,
        connectionStatus: statusFilter,
        page,
        pageSize,
        sortBy: 'CreatedTime',
        sortOrder: 'desc',
      };
      
      const response = await searchAIServiceConfigs(params);
      if (response.success) {
        setConfigs(response.data?.items || []);
        setTotal(response.data?.total || 0);
      } else {
        message.error(response.message || '加载配置失败');
      }
    } catch (error) {
      message.error('加载配置失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 加载提供商信息
  const loadProviders = async () => {
    try {
      console.log('开始加载AI服务提供商信息...');
      const response = await getAIProviders();
      console.log('API响应:', response);

      if (response.success) {
        const providersData = response.data || [];
        console.log('提供商数据:', providersData);
        setProviders(providersData);

        if (providersData.length === 0) {
          message.warning('未获取到AI服务提供商信息，请检查后端服务');
        } else {
          console.log(`成功加载 ${providersData.length} 个AI服务提供商`);
        }
      } else {
        console.error('API调用失败:', response.message);
        message.error(`加载提供商信息失败: ${response.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('加载提供商信息失败:', error);
      message.error(`网络请求失败: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, searchText, providerFilter, enabledFilter, statusFilter]);

  useEffect(() => {
    loadProviders();
  }, []);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  // 处理筛选
  const handleFilterChange = () => {
    setPage(1);
    loadData();
  };

  // 创建配置
  const handleCreate = async (values: CreateAIServiceConfigInput) => {
    try {
      const response = await createAIServiceConfig(values);
      if (response.success) {
        message.success('创建成功');
        setCreateModalVisible(false);
        loadData();
      } else {
        message.error(response.message || '创建失败');
      }
    } catch (error) {
      message.error('创建失败: ' + (error as Error).message);
    }
  };

  // 更新配置
  const handleUpdate = async (values: UpdateAIServiceConfigInput) => {
    try {
      const response = await updateAIServiceConfig(values);
      if (response.success) {
        message.success('更新成功');
        setEditModalVisible(false);
        setCurrentConfig(null);
        loadData();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败: ' + (error as Error).message);
    }
  };

  // 删除配置
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteAIServiceConfig(id);
      if (response.success) {
        message.success('删除成功');
        loadData();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败: ' + (error as Error).message);
    }
  };

  // 设置默认配置
  const handleSetDefault = async (id: string) => {
    try {
      const response = await setDefaultAIServiceConfig(id);
      if (response.success) {
        message.success('设置默认配置成功');
        loadData();
      } else {
        message.error(response.message || '设置默认配置失败');
      }
    } catch (error) {
      message.error('设置默认配置失败: ' + (error as Error).message);
    }
  };

  // 测试连接
  const handleTestConnection = async (config: AIServiceConfigListDto) => {
    try {
      const response = await testSavedConfigConnection(config.id);
      if (response.success) {
        const result = response.data;
        if (result?.success) {
          message.success('连接测试成功');
        } else {
          message.error(`连接测试失败: ${result?.message}`);
        }
        loadData(); // 刷新状态
      } else {
        message.error(response.message || '连接测试失败');
      }
    } catch (error) {
      message.error('连接测试失败: ' + (error as Error).message);
    }
  };

  // 获取连接状态标签
  const getConnectionStatusTag = (status: string, lastTestTime?: string) => {
    const statusConfig = {
      Connected: { color: 'success', icon: <CheckCircleOutlined />, text: '已连接' },
      Failed: { color: 'error', icon: <CloseCircleOutlined />, text: '连接失败' },
      Unknown: { color: 'default', icon: <ExclamationCircleOutlined />, text: '未测试' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Unknown;
    
    return (
      <Tooltip title={lastTestTime ? `最后测试: ${dayjs(lastTestTime).format('YYYY-MM-DD HH:mm:ss')}` : '未进行过连接测试'}>
        <Tag color={config.color} icon={config.icon}>
          {config.text}
        </Tag>
      </Tooltip>
    );
  };

  // 获取提供商标签
  const getProviderTag = (provider: string) => {
    const providerConfig = {
      OpenAI: { color: 'blue', text: 'OpenAI' },
      DeepSeek: { color: 'purple', text: 'DeepSeek' },
      GoogleAI: { color: 'red', text: 'Google AI' },
      Ollama: { color: 'green', text: 'Ollama' },
      VolcEngine: { color: 'orange', text: '火山引擎' },
    };

    const config = providerConfig[provider as keyof typeof providerConfig] || { color: 'default', text: provider };
    
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<AIServiceConfigListDto> = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.isDefault && (
            <Tooltip title="默认配置">
              <StarFilled style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '服务提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider) => getProviderTag(provider),
      filters: providers.map(p => ({ text: p.displayName, value: p.name })),
      filteredValue: providerFilter ? [providerFilter] : null,
    },
    {
      title: 'API端点',
      dataIndex: 'apiEndpoint',
      key: 'apiEndpoint',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text code>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'API密钥',
      dataIndex: 'maskedApiKey',
      key: 'maskedApiKey',
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: '连接状态',
      dataIndex: 'connectionStatus',
      key: 'connectionStatus',
      render: (status, record) => getConnectionStatusTag(status, record.lastTestTime),
      filters: [
        { text: '已连接', value: 'Connected' },
        { text: '连接失败', value: 'Failed' },
        { text: '未测试', value: 'Unknown' },
      ],
      filteredValue: statusFilter ? [statusFilter] : null,
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      render: (enabled) => (
        <Badge 
          status={enabled ? 'success' : 'default'} 
          text={enabled ? '启用' : '禁用'} 
        />
      ),
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      filteredValue: enabledFilter !== undefined ? [enabledFilter] : null,
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      sorter: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="测试连接">
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              onClick={() => handleTestConnection(record)}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title={record.isDefault ? '已是默认配置' : '设为默认'}>
            <Button
              type="text"
              icon={record.isDefault ? <StarFilled /> : <StarOutlined />}
              onClick={() => handleSetDefault(record.id)}
              disabled={record.isDefault}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentConfig(record);
                setEditModalVisible(true);
              }}
              size="small"
            />
          </Tooltip>
          
          <Popconfirm
            title="确定要删除这个配置吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                <ApiOutlined /> AI服务配置管理
              </Title>
              <Text type="secondary">
                管理您的AI服务提供商配置，支持OpenAI、DeepSeek、Google AI等多种服务
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                添加配置
              </Button>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 搜索和筛选 */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Search
              placeholder="搜索配置名称、描述或提供商"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="服务提供商"
              allowClear
              style={{ width: '100%' }}
              value={providerFilter}
              onChange={(value) => {
                setProviderFilter(value);
                handleFilterChange();
              }}
            >
              {providers.map(provider => (
                <Option key={provider.name} value={provider.name}>
                  {provider.displayName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="连接状态"
              allowClear
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                handleFilterChange();
              }}
            >
              <Option value="Connected">已连接</Option>
              <Option value="Failed">连接失败</Option>
              <Option value="Unknown">未测试</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="启用状态"
              allowClear
              style={{ width: '100%' }}
              value={enabledFilter}
              onChange={(value) => {
                setEnabledFilter(value);
                handleFilterChange();
              }}
            >
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
        </Row>

        {/* 提示信息 */}
        {configs.length === 0 && !loading && (
          <Alert
            message="还没有AI服务配置"
            description="点击添加配置按钮创建您的第一个AI服务配置，开始使用个性化的AI服务。"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* 配置表格 */}
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize !== pageSize) {
                setPageSize(newPageSize);
              }
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 创建配置模态框 */}
      <ConfigFormModal
        visible={createModalVisible}
        mode="create"
        providers={providers}
        onCancel={() => setCreateModalVisible(false)}
        onSubmit={handleCreate}
      />

      {/* 编辑配置模态框 */}
      <ConfigFormModal
        visible={editModalVisible}
        mode="edit"
        providers={providers}
        initialValues={currentConfig}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentConfig(null);
        }}
        onSubmit={handleUpdate}
      />

      {/* 测试连接模态框 */}
      <TestConnectionModal
        visible={testModalVisible}
        providers={providers}
        onCancel={() => setTestModalVisible(false)}
      />
    </div>
  );
};

export default AIServiceConfigPage;
