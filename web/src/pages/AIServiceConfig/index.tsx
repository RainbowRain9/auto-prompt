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
  GlobalOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  searchAIServiceConfigs,
  createAIServiceConfig,
  updateAIServiceConfig,
  deleteAIServiceConfig,
  setDefaultAIServiceConfig,
  setGlobalDefaultAIServiceConfig,
  getGlobalDefaultAIServiceConfig,
  clearGlobalDefaultAIServiceConfig,
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

  // 全局默认配置状态
  const [globalDefaultConfig, setGlobalDefaultConfig] = useState<AIServiceConfigListDto | null>(null);

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

  // 加载全局默认配置
  const loadGlobalDefaultConfig = async () => {
    try {
      const response = await getGlobalDefaultAIServiceConfig();
      if (response.success && response.data) {
        setGlobalDefaultConfig(response.data);
      } else {
        setGlobalDefaultConfig(null);
      }
    } catch (error) {
      console.error('加载全局默认配置失败:', error);
      setGlobalDefaultConfig(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, searchText, providerFilter, enabledFilter, statusFilter]);

  useEffect(() => {
    loadProviders();
    loadGlobalDefaultConfig();
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

  // 设置全局默认配置
  const handleSetGlobalDefault = async (id: string) => {
    try {
      const response = await setGlobalDefaultAIServiceConfig(id);
      if (response.success) {
        message.success('设置全局默认配置成功，工作台聊天功能现在可以使用了');
        loadData();
        loadGlobalDefaultConfig();
      } else {
        message.error(response.message || '设置全局默认配置失败');
      }
    } catch (error) {
      message.error('设置全局默认配置失败: ' + (error as Error).message);
    }
  };

  // 清除全局默认配置
  const handleClearGlobalDefault = async () => {
    try {
      const response = await clearGlobalDefaultAIServiceConfig();
      if (response.success) {
        message.success('已清除全局默认配置');
        loadData();
        loadGlobalDefaultConfig();
      } else {
        message.error(response.message || '清除全局默认配置失败');
      }
    } catch (error) {
      message.error('清除全局默认配置失败: ' + (error as Error).message);
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

  // 获取提供商标签颜色
  const getProviderColor = (provider: string) => {
    const colors = {
      OpenAI: 'blue',
      DeepSeek: 'purple',
      GoogleAI: 'red',
      Ollama: 'green',
      VolcEngine: 'orange',
    };
    return colors[provider as keyof typeof colors] || 'default';
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
      width: 280,
      render: (_, record) => {
        const isGlobalDefault = globalDefaultConfig?.id === record.id;
        const canSetGlobalDefault = record.connectionStatus === 'Connected' && record.isEnabled;

        return (
          <Space size="small">
            <Tooltip title="测试连接">
              <Button
                type="text"
                icon={<ThunderboltOutlined />}
                onClick={() => handleTestConnection(record)}
                size="small"
              />
            </Tooltip>

            <Tooltip title={record.isDefault ? '已是用户默认' : '设为用户默认'}>
              <Button
                type="text"
                icon={record.isDefault ? <StarFilled /> : <StarOutlined />}
                onClick={() => handleSetDefault(record.id)}
                disabled={record.isDefault}
                size="small"
              />
            </Tooltip>

            <Tooltip title={
              isGlobalDefault
                ? '已是全局默认配置'
                : canSetGlobalDefault
                  ? '设为全局默认（工作台可用）'
                  : '需要连接成功且启用才能设为全局默认'
            }>
              <Button
                type="text"
                icon={isGlobalDefault ? <CrownOutlined /> : <GlobalOutlined />}
                onClick={() => handleSetGlobalDefault(record.id)}
                disabled={isGlobalDefault || !canSetGlobalDefault}
                size="small"
                style={isGlobalDefault ? { color: '#faad14' } : {}}
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
        );
      },
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

        {/* 全局配置状态显示 */}
        {globalDefaultConfig ? (
          <Alert
            message={
              <Space>
                <CrownOutlined style={{ color: '#faad14' }} />
                <span>当前全局默认配置: <strong>{globalDefaultConfig.name}</strong></span>
                <Tag color={getProviderColor(globalDefaultConfig.provider)}>
                  {globalDefaultConfig.provider}
                </Tag>
                <Button
                  type="link"
                  size="small"
                  onClick={handleClearGlobalDefault}
                  style={{ padding: 0 }}
                >
                  清除
                </Button>
              </Space>
            }
            description="工作台聊天功能正在使用此配置，您可以随时切换到其他配置"
            type="success"
            showIcon={false}
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <Alert
            message="未设置全局默认配置"
            description="请选择一个连接成功的配置设为全局默认，以便在工作台中使用聊天功能"
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

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
