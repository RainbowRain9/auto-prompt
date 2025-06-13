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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        message.error(response.message || t('apiKeys.messages.loadFailed'));
      }
    } catch (error) {
      message.error(t('apiKeys.messages.loadFailed') + ': ' + (error as Error).message);
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
        message.success(t('apiKeys.messages.createSuccess'));
        setCreateModalVisible(false);
        setNewApiKeyData(response.data);
        setViewModalVisible(true);
        form.resetFields();
        loadData();
      } else {
        message.error(response.message || t('apiKeys.messages.createFailed'));
      }
    } catch (error) {
      message.error(t('apiKeys.messages.createFailed') + ': ' + (error as Error).message);
    }
  };

  // 编辑API Key
  const handleEdit = async (values: UpdateApiKeyInput) => {
    try {
      const response = await updateApiKey(values);
      if (response.success) {
        message.success(t('apiKeys.messages.updateSuccess'));
        setEditModalVisible(false);
        editForm.resetFields();
        loadData();
      } else {
        message.error(response.message || t('apiKeys.messages.updateFailed'));
      }
    } catch (error) {
      message.error(t('apiKeys.messages.updateFailed') + ': ' + (error as Error).message);
    }
  };

  // 删除API Key
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteApiKey(id);
      if (response.success) {
        message.success(t('apiKeys.messages.deleteSuccess'));
        loadData();
      } else {
        message.error(response.message || t('apiKeys.messages.deleteFailed'));
      }
    } catch (error) {
      message.error(t('apiKeys.messages.deleteFailed') + ': ' + (error as Error).message);
    }
  };

  // 切换启用状态
  const handleToggleEnabled = async (id: string) => {
    try {
      const response = await toggleApiKeyEnabled(id);
      if (response.success) {
        message.success(response.message || t('apiKeys.messages.operationSuccess'));
        loadData();
      } else {
        message.error(response.message || t('apiKeys.messages.operationFailed'));
      }
    } catch (error) {
      message.error(t('apiKeys.messages.operationFailed') + ': ' + (error as Error).message);
    }
  };

  // 重新生成API Key
  const handleRegenerate = async (id: string) => {
    try {
      const response = await regenerateApiKey(id);
      if (response.success) {
        message.success(t('apiKeys.messages.regenerateSuccess'));
        setNewApiKeyData(response.data);
        setViewModalVisible(true);
        loadData();
      } else {
        message.error(response.message || t('apiKeys.messages.regenerateFailed'));
      }
    } catch (error) {
      message.error(t('apiKeys.messages.regenerateFailed') + ': ' + (error as Error).message);
    }
  };

  // 复制到剪贴板
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t('apiKeys.messages.copySuccess'));
    } catch (error) {
      message.error(t('apiKeys.messages.copyFailed'));
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
      title: t('apiKeys.table.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('apiKeys.table.apiKey'),
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
      title: t('apiKeys.table.status'),
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 100,
      render: (enabled: boolean, record: ApiKeyListDto) => (
        <Space direction="vertical" size="small">
          <Tag color={enabled ? 'green' : 'red'}>
            {enabled ? t('apiKeys.enabled') : t('apiKeys.disabled')}
          </Tag>
          {record.isExpired && (
            <Tag color="orange">{t('apiKeys.expired')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('apiKeys.table.usageCount'),
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
    },
    {
      title: t('apiKeys.table.lastUsedTime'),
      dataIndex: 'lastUsedTime',
      key: 'lastUsedTime',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : t('apiKeys.table.noData'),
    },
    {
      title: t('apiKeys.table.createdTime'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('apiKeys.table.actions'),
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record: ApiKeyListDto) => (
        <Space>
          <Tooltip title={t('apiKeys.actions.edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title={record.isEnabled ? t('apiKeys.actions.disable') : t('apiKeys.actions.enable')}>
            <Switch
              size="small"
              checked={record.isEnabled}
              onChange={() => handleToggleEnabled(record.id)}
            />
          </Tooltip>
          <Tooltip title={t('apiKeys.actions.regenerate')}>
            <Popconfirm
              title={t('apiKeys.confirm.regenerateTitle')}
              description={t('apiKeys.confirm.regenerateDescription')}
              onConfirm={() => handleRegenerate(record.id)}
              okText={t('apiKeys.confirm.ok')}
              cancelText={t('apiKeys.confirm.cancel')}
            >
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title={t('apiKeys.actions.delete')}>
            <Popconfirm
              title={t('apiKeys.confirm.deleteTitle')}
              description={t('apiKeys.confirm.deleteDescription')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('apiKeys.confirm.ok')}
              cancelText={t('apiKeys.confirm.cancel')}
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
                {t('apiKeys.title')}
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                {t('apiKeys.createApiKey')}
              </Button>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder={t('apiKeys.searchPlaceholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder={t('apiKeys.statusFilter')}
                value={enabledFilter}
                onChange={setEnabledFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value={true}>{t('apiKeys.enabled')}</Option>
                <Option value={false}>{t('apiKeys.disabled')}</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder={t('apiKeys.expiredFilter')}
                value={expiredFilter}
                onChange={setExpiredFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value={false}>{t('apiKeys.notExpired')}</Option>
                <Option value={true}>{t('apiKeys.expired')}</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button onClick={handleReset}>{t('apiKeys.reset')}</Button>
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
            showTotal: (total) => t('apiKeys.pagination.total', { total }),
            onChange: (page, size) => {
              setPage(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      {/* 创建模态框 */}
      <Modal
        title={t('apiKeys.modal.createTitle')}
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
            label={t('apiKeys.modal.nameLabel')}
            rules={[
              { required: true, message: t('apiKeys.modal.nameRequired') },
              { max: 100, message: t('apiKeys.modal.nameMaxLength') },
            ]}
          >
            <Input placeholder={t('apiKeys.modal.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="openAiApiKey"
            label={t('apiKeys.modal.openAiApiKeyLabel')}
            rules={[
              { required: true, message: t('apiKeys.modal.openAiApiKeyRequired') },
              { max: 200, message: t('apiKeys.modal.openAiApiKeyMaxLength') },
            ]}
          >
            <Input.Password placeholder={t('apiKeys.modal.openAiApiKeyPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('apiKeys.modal.descriptionLabel')}
            rules={[
              { max: 500, message: t('apiKeys.modal.descriptionMaxLength') },
            ]}
          >
            <TextArea 
              rows={3} 
              placeholder={t('apiKeys.modal.descriptionPlaceholder')} 
            />
          </Form.Item>

          <Form.Item
            name="expiresAt"
            label={t('apiKeys.modal.expiresAtLabel')}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder={t('apiKeys.modal.expiresAtPlaceholder')}
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
                {t('apiKeys.modal.cancel')}
              </Button>
              <Button type="primary" htmlType="submit">
                {t('apiKeys.modal.create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title={t('apiKeys.modal.editTitle')}
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
            label={t('apiKeys.modal.nameLabel')}
            rules={[
              { required: true, message: t('apiKeys.modal.nameRequired') },
              { max: 100, message: t('apiKeys.modal.nameMaxLength') },
            ]}
          >
            <Input placeholder={t('apiKeys.modal.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="openAiApiKey"
            label={t('apiKeys.modal.openAiApiKeyLabel')}
            rules={[
              { required: true, message: t('apiKeys.modal.openAiApiKeyRequired') },
              { max: 200, message: t('apiKeys.modal.openAiApiKeyMaxLength') },
            ]}
          >
            <Input.Password placeholder={t('apiKeys.modal.openAiApiKeyPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('apiKeys.modal.descriptionLabel')}
            rules={[
              { max: 500, message: t('apiKeys.modal.descriptionMaxLength') },
            ]}
          >
            <TextArea 
              rows={3} 
              placeholder={t('apiKeys.modal.descriptionPlaceholder')} 
            />
          </Form.Item>

          <Form.Item
            name="isEnabled"
            label={t('apiKeys.modal.isEnabledLabel')}
            valuePropName="checked"
          >
            <Switch checkedChildren={t('apiKeys.modal.enabledText')} unCheckedChildren={t('apiKeys.modal.disabledText')} />
          </Form.Item>

          <Form.Item
            name="expiresAt"
            label={t('apiKeys.modal.expiresAtLabel')}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder={t('apiKeys.modal.expiresAtPlaceholder')}
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
                {t('apiKeys.modal.cancel')}
              </Button>
              <Button type="primary" htmlType="submit">
                {t('apiKeys.modal.save')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看新创建的API Key模态框 */}
      <Modal
        title={t('apiKeys.viewModal.title')}
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
            {t('apiKeys.viewModal.copyApiKey')}
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setViewModalVisible(false);
              setNewApiKeyData(null);
            }}
          >
            {t('apiKeys.viewModal.close')}
          </Button>,
        ]}
        width={600}
      >
        {newApiKeyData && (
          <div>
            <Alert
              message={t('apiKeys.viewModal.securityWarning')}
              description={t('apiKeys.viewModal.securityDescription')}
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>{t('apiKeys.viewModal.nameLabel')}</Text>
              <Text>{newApiKeyData.name}</Text>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>{t('apiKeys.viewModal.apiKeyLabel')}</Text>
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
                <Text strong>{t('apiKeys.viewModal.descriptionLabel')}</Text>
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