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
  DatePicker,
  Select,
  Row,
  Col,
  Typography,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  searchApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  toggleApiKeyEnabled,
  regenerateApiKey,
  type ApiKeyListDto,
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
  type ApiKeySearchInput,
} from '../../api/apiKey';

const { Search } = Input;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const ApiKeysPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<boolean | undefined>();
  const [expiredFilter, setExpiredFilter] = useState<boolean | undefined>();
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [newApiKeyData, setNewApiKeyData] = useState<any>(null);
  
  // 密码显示状态
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const params: ApiKeySearchInput = {
        searchText,
        isEnabled: enabledFilter,
        isExpired: expiredFilter,
        page,
        pageSize,
        sortBy: 'CreatedTime',
        sortOrder: 'desc',
      };
      
      const response = await searchApiKeys(params);
      if (response.success) {
        setApiKeys(response.data.items);
        setTotal(response.data.total);
      } else {
        message.error(response.message || '加载失败');
      }
    } catch (error) {
      message.error('加载失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, searchText, enabledFilter, expiredFilter]);

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchText('');
    setEnabledFilter(undefined);
    setExpiredFilter(undefined);
    setPage(1);
  };

  // 创建API Key
  const handleCreate = async (values: CreateApiKeyInput) => {
    try {
      const response = await createApiKey(values);
      if (response.success) {
        message.success('创建成功');
        setCreateModalVisible(false);
        setNewApiKeyData(response.data);
        setViewModalVisible(true);
        form.resetFields();
        loadData();
      } else {
        message.error(response.message || '创建失败');
      }
    } catch (error) {
      message.error('创建失败: ' + (error as Error).message);
    }
  };

  // 编辑API Key
  const handleEdit = async (values: UpdateApiKeyInput) => {
    try {
      const response = await updateApiKey(values);
      if (response.success) {
        message.success('更新成功');
        setEditModalVisible(false);
        editForm.resetFields();
        loadData();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败: ' + (error as Error).message);
    }
  };

  // 删除API Key
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteApiKey(id);
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

  // 切换启用状态
  const handleToggleEnabled = async (id: string) => {
    try {
      const response = await toggleApiKeyEnabled(id);
      if (response.success) {
        message.success(response.message || '操作成功');
        loadData();
      } else {
        message.error(response.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败: ' + (error as Error).message);
    }
  };

  // 重新生成API Key
  const handleRegenerate = async (id: string) => {
    try {
      const response = await regenerateApiKey(id);
      if (response.success) {
        message.success('重新生成成功');
        setNewApiKeyData(response.data);
        setViewModalVisible(true);
        loadData();
      } else {
        message.error(response.message || '重新生成失败');
      }
    } catch (error) {
      message.error('重新生成失败: ' + (error as Error).message);
    }
  };

  // 复制到剪贴板
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 切换密钥显示
  const toggleKeyVisibility = (id: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(id)) {
      newVisibleKeys.delete(id);
    } else {
      newVisibleKeys.add(id);
    }
    setVisibleKeys(newVisibleKeys);
  };

  // 打开编辑模态框
  const openEditModal = (record: ApiKeyListDto) => {
    editForm.setFieldsValue({
      id: record.id,
      name: record.name,
      description: record.description,
      isEnabled: record.isEnabled,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null,
    });
    setEditModalVisible(true);
  };

  const columns: ColumnsType<ApiKeyListDto> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'API Key',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (key: string, record: ApiKeyListDto) => (
        <Space>
          <Text code style={{ fontFamily: 'monospace' }}>
            {visibleKeys.has(record.id) ? key : key}
          </Text>
          <Button
            type="text"
            size="small"
            icon={visibleKeys.has(record.id) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => toggleKeyVisibility(record.id)}
          />
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(key)}
          />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 100,
      render: (enabled: boolean, record: ApiKeyListDto) => (
        <Space direction="vertical" size="small">
          <Tag color={enabled ? 'green' : 'red'}>
            {enabled ? '已启用' : '已禁用'}
          </Tag>
          {record.isExpired && (
            <Tag color="orange">已过期</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedTime',
      key: 'lastUsedTime',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record: ApiKeyListDto) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title={record.isEnabled ? '禁用' : '启用'}>
            <Switch
              size="small"
              checked={record.isEnabled}
              onChange={() => handleToggleEnabled(record.id)}
            />
          </Tooltip>
          <Tooltip title="重新生成">
            <Popconfirm
              title="确定要重新生成此API Key吗？"
              description="重新生成后，原有的API Key将无法使用。"
              onConfirm={() => handleRegenerate(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除此API Key吗？"
              description="删除后无法恢复，请谨慎操作。"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
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
                <KeyOutlined style={{ marginRight: '8px' }} />
                API Key 管理
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                创建 API Key
              </Button>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="搜索名称或描述"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态筛选"
                value={enabledFilter}
                onChange={setEnabledFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value={true}>已启用</Option>
                <Option value={false}>已禁用</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="过期筛选"
                value={expiredFilter}
                onChange={setExpiredFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value={false}>未过期</Option>
                <Option value={true}>已过期</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button onClick={handleReset}>重置</Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={apiKeys}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setPage(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      {/* 创建模态框 */}
      <Modal
        title="创建 API Key"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 100, message: '名称长度不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入API Key名称" />
          </Form.Item>

          <Form.Item
            name="openAiApiKey"
            label="OpenAI API Key"
            rules={[
              { required: true, message: '请输入OpenAI API Key' },
              { max: 200, message: 'API Key长度不能超过200个字符' },
            ]}
          >
            <Input.Password placeholder="请输入要绑定的OpenAI API Key" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[
              { max: 500, message: '描述长度不能超过500个字符' },
            ]}
          >
            <TextArea 
              rows={3} 
              placeholder="请输入描述信息（可选）" 
            />
          </Form.Item>

          <Form.Item
            name="expiresAt"
            label="过期时间"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择过期时间（可选）"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title="编辑 API Key"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 100, message: '名称长度不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入API Key名称" />
          </Form.Item>

          <Form.Item
            name="openAiApiKey"
            label="OpenAI API Key"
            rules={[
              { required: true, message: '请输入OpenAI API Key' },
              { max: 200, message: 'API Key长度不能超过200个字符' },
            ]}
          >
            <Input.Password placeholder="请输入要绑定的OpenAI API Key" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[
              { max: 500, message: '描述长度不能超过500个字符' },
            ]}
          >
            <TextArea 
              rows={3} 
              placeholder="请输入描述信息（可选）" 
            />
          </Form.Item>

          <Form.Item
            name="isEnabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            name="expiresAt"
            label="过期时间"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择过期时间（可选）"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  editForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看新创建的API Key模态框 */}
      <Modal
        title="API Key 创建成功"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setNewApiKeyData(null);
        }}
        footer={[
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(newApiKeyData?.key || '')}
          >
            复制 API Key
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setViewModalVisible(false);
              setNewApiKeyData(null);
            }}
          >
            关闭
          </Button>,
        ]}
        width={600}
      >
        {newApiKeyData && (
          <div>
            <Alert
              message="请妥善保存您的API Key"
              description="出于安全考虑，此API Key只会显示一次，请立即复制并妥善保存。"
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>名称：</Text>
              <Text>{newApiKeyData.name}</Text>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>API Key：</Text>
              <div style={{ 
                padding: '12px', 
                borderRadius: '6px',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {newApiKeyData.key}
              </div>
            </div>
            
            {newApiKeyData.description && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>描述：</Text>
                <Text>{newApiKeyData.description}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApiKeysPage; 