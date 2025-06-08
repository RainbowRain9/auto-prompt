import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  Modal,
  Form,
  message,
  Spin,
  Empty,
  Tooltip,
  Pagination
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  BulbOutlined,
  StarOutlined,
  StarFilled,
  ShareAltOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../stores/themeStore';
import {
  searchPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  toggleFavorite,
  toggleShare,
  incrementUsage
} from '../api/promptTemplateApi';
import type {
  PromptTemplate,
  CreatePromptTemplateInput,
  UpdatePromptTemplateInput
} from '../api/promptTemplateApi';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PageContainer = styled.div`
  padding: 24px;
  height: 100vh;
  overflow-y: auto;
  background: ${props => props.theme === 'dark' ? '#0a0a0a' : '#f5f5f5'};
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  .page-title {
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    margin-bottom: 8px;
  }
  
  .page-description {
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    margin-bottom: 0;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  
  .search-input {
    max-width: 300px;
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
`;

const PromptCard = styled(Card)`
  &.ant-card {
    margin-bottom: 16px;
    border-radius: 12px;
    border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
    background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    transition: all 0.3s ease;
    cursor: pointer;
    height: 320px;
    display: flex;
    flex-direction: column;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, ${props => props.theme === 'dark' ? '0.3' : '0.1'});
      border-color: #1677ff;
    }
    
    .ant-card-head {
      border-bottom: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#f0f0f0'};
      
      .ant-card-head-title {
        color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
        font-weight: 600;
      }
    }
    
    .ant-card-body {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  }
`;

const PromptContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .prompt-title {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  
  .prompt-description {
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    margin-bottom: 12px;
    font-size: 14px;
    flex-shrink: 0;
    height: 40px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .prompt-text {
    background: ${props => props.theme === 'dark' ? '#262626' : '#f8f9fa'};
    border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    height: 120px;
    overflow-y: auto;
    flex-shrink: 0;
  }
  
  .prompt-tags {
    margin-bottom: 12px;
    flex-shrink: 0;
    height: 32px;
    overflow: hidden;
  }
  
  .prompt-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    flex-shrink: 0;
  }
`;

const CreateButton = styled(Button)`
  &.ant-btn {
    height: 40px;
    border-radius: 8px;
    background: #1677ff;
    border: none;
    color: white;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
      background: #4096ff !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
    }
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 16px 0;
`;

const PromptsPage: React.FC = () => {
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });

  // 加载提示词列表
  const loadPrompts = async (page = 1, search = searchText) => {
    setLoading(true);
    try {
      const response = await searchPromptTemplates({
        searchText: search,
        page: page,
        pageSize: pagination.pageSize
      });

      if (response.success) {
        setPrompts(response.data.items);
        setPagination(prev => ({
          ...prev,
          current: response.data.page,
          total: response.data.total
        }));
      } else {
        message.error(response.message || t('prompts.messages.loadFailed'));
      }
    } catch (error) {
      console.error('加载提示词失败:', error);
      message.error(t('prompts.messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadPrompts();
  }, []);

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadPrompts(1, value);
  };

  // 分页处理
  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
    loadPrompts(page);
  };

  // 创建新提示词
  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 编辑提示词
  const handleEditPrompt = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    form.setFieldsValue({
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      tags: prompt.tags.join(', ')
    });
    setIsModalVisible(true);
  };

  // 保存提示词
  const handleSavePrompt = async (values: any) => {
    try {
      const tags = values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
      
      if (editingPrompt) {
        // 更新现有提示词
        const updateInput: UpdatePromptTemplateInput = {
          id: editingPrompt.id,
          title: values.title,
          description: values.description,
          content: values.content,
          tags: tags,
          isFavorite: editingPrompt.isFavorite
        };
        
        const response = await updatePromptTemplate(updateInput);
        if (response.success) {
          message.success(t('prompts.messages.updateSuccess'));
          loadPrompts(pagination.current);
        } else {
          message.error(response.message || t('prompts.messages.updateFailed'));
        }
      } else {
        // 创建新提示词
        const createInput: CreatePromptTemplateInput = {
          title: values.title,
          description: values.description,
          content: values.content,
          tags: tags
        };
        
        const response = await createPromptTemplate(createInput);
        if (response.success) {
          message.success(t('prompts.messages.createSuccess'));
          loadPrompts(1); // 回到第一页
        } else {
          message.error(response.message || t('prompts.messages.createFailed'));
        }
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('保存提示词失败:', error);
      message.error(t('prompts.messages.saveFailed'));
    }
  };

  // 删除提示词
  const handleDeletePrompt = (prompt: PromptTemplate) => {
    Modal.confirm({
      title: t('prompts.deleteConfirm.title'),
      content: t('prompts.deleteConfirm.content', { title: prompt.title }),
      okText: t('prompts.deleteConfirm.okText'),
      okType: 'danger',
      cancelText: t('prompts.deleteConfirm.cancelText'),
      onOk: async () => {
        try {
          const response = await deletePromptTemplate(prompt.id);
          if (response.success) {
            message.success(t('prompts.messages.deleteSuccess'));
            loadPrompts(pagination.current);
          } else {
            message.error(response.message || t('prompts.messages.deleteFailed'));
          }
        } catch (error) {
          console.error('删除提示词失败:', error);
          message.error(t('prompts.messages.deleteFailed'));
        }
      }
    });
  };

  // 切换收藏状态
  const handleToggleFavorite = async (prompt: PromptTemplate) => {
    try {
      const response = await toggleFavorite(prompt.id);
      if (response.success) {
        // 更新本地状态
        setPrompts(prev => prev.map(p => 
          p.id === prompt.id ? { ...p, isFavorite: response.data?.isFavorite || !p.isFavorite } : p
        ));
      } else {
        message.error(response.message || t('prompts.messages.operationFailed'));
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      message.error(t('prompts.messages.operationFailed'));
    }
  };

  // 切换分享状态
  const handleToggleShare = async (prompt: PromptTemplate) => {
    try {
      const response = await toggleShare(prompt.id);
      if (response.success) {
        // 更新本地状态
        setPrompts(prev => prev.map(p => 
          p.id === prompt.id ? { 
            ...p, 
            isShared: response.data?.isShared || !p.isShared,
            shareTime: response.data?.shareTime || p.shareTime
          } : p
        ));
        message.success(response.message || t('prompts.messages.shareSuccess'));
      } else {
        message.error(response.message || t('prompts.messages.shareFailed'));
      }
    } catch (error) {
      console.error('切换分享状态失败:', error);
      message.error(t('prompts.messages.operationFailed'));
    }
  };

  // 复制提示词内容
  const handleCopyPrompt = async (prompt: PromptTemplate) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      message.success(t('prompts.messages.copySuccess'));
    
      // 增加使用次数
      try {
        const response = await incrementUsage(prompt.id);
        if (response.success) {
          setPrompts(prev => prev.map(p => 
            p.id === prompt.id ? { ...p, usageCount: response.data?.usageCount || p.usageCount + 1 } : p
          ));
        }
      } catch (error) {
        console.error('更新使用次数失败:', error);
      }
    } catch (error) {
      console.error('复制失败:', error);
      message.error(t('prompts.messages.copyFailed'));
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    loadPrompts(pagination.current);
  };

  return (
    <PageContainer theme={theme}>
      <PageHeader theme={theme}>
        <Title level={2} className="page-title">
          <BulbOutlined style={{ marginRight: 12, color: '#1677ff' }} />
          {t('prompts.pageTitle')}
        </Title>
        <Text className="page-description">
          {t('prompts.pageDescription')}
        </Text>
      </PageHeader>

      <ActionBar>
        <Input
          className="search-input"
          placeholder={t('prompts.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
          allowClear
          onClear={() => handleSearch('')}
        />
        <div className="action-buttons">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            {t('prompts.refresh')}
          </Button>
          <CreateButton
            icon={<PlusOutlined />}
            onClick={handleCreatePrompt}
          >
            {t('prompts.createPrompt')}
          </CreateButton>
        </div>
      </ActionBar>

      <Spin spinning={loading}>
        {prompts.length === 0 && !loading ? (
          <Empty
            description={searchText ? t('prompts.noSearchResults') : t('prompts.noPrompts')}
            style={{ marginTop: 60 }}
          />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {prompts.map((prompt) => (
                <Col xs={24} sm={24} md={12} lg={8} xl={6} key={prompt.id}>
                  <PromptCard theme={theme}>
                    <PromptContent theme={theme}>
                      <div className="prompt-title">
                        {prompt.title}
                        <Tooltip title={prompt.isFavorite ? t('prompts.removeFavorite') : t('prompts.addFavorite')}>
                          <Button
                            type="text"
                            size="small"
                            icon={prompt.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(prompt);
                            }}
                          />
                        </Tooltip>
                      </div>
                      
                      <div className="prompt-description">
                        {prompt.description}
                      </div>
                      
                      <div className="prompt-text">
                        {prompt.content.length > 150 
                          ? `${prompt.content.substring(0, 150)}...` 
                          : prompt.content
                        }
                      </div>
                      
                      <div className="prompt-tags">
                        {prompt.tags.map(tag => (
                          <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                      
                      <div className="prompt-actions">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('prompts.usageStats', { count: prompt.usageCount })} · {t('prompts.createTime', { date: new Date(prompt.createdTime).toLocaleDateString() })}
                        </Text>
                        <Space>
                          <Tooltip title={t('prompts.copyContent')}>
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPrompt(prompt);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title={prompt.isShared ? t('prompts.cancelShare') : t('prompts.shareToSquare')}>
                            <Button
                              type="text"
                              size="small"
                              icon={<ShareAltOutlined />}
                              style={{ 
                                color: prompt.isShared ? '#52c41a' : undefined 
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleShare(prompt);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title={t('common.edit')}>
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPrompt(prompt);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title={t('common.delete')}>
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePrompt(prompt);
                              }}
                            />
                          </Tooltip>
                        </Space>
                      </div>
                    </PromptContent>
                  </PromptCard>
                </Col>
              ))}
            </Row>

            {pagination.total > pagination.pageSize && (
              <PaginationContainer>
                <Pagination
                  current={pagination.current}
                  total={pagination.total}
                  pageSize={pagination.pageSize}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => t('prompts.paginationText', { start: range[0], end: range[1], total })}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                />
              </PaginationContainer>
            )}
          </>
        )}
      </Spin>

      <Modal
        title={editingPrompt ? t('prompts.modal.editTitle') : t('prompts.modal.createTitle')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSavePrompt}
        >
          <Form.Item
            name="title"
            label={t('prompts.modal.titleLabel')}
            rules={[{ required: true, message: t('prompts.modal.titleRequired') }]}
          >
            <Input placeholder={t('prompts.modal.titlePlaceholder')} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label={t('prompts.modal.descriptionLabel')}
            rules={[{ required: true, message: t('prompts.modal.descriptionRequired') }]}
          >
            <Input placeholder={t('prompts.modal.descriptionPlaceholder')} />
          </Form.Item>
          
          <Form.Item
            name="content"
            label={t('prompts.modal.contentLabel')}
            rules={[{ required: true, message: t('prompts.modal.contentRequired') }]}
          >
            <TextArea
              rows={8}
              placeholder={t('prompts.modal.contentPlaceholder')}
            />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label={t('prompts.modal.tagsLabel')}
          >
            <Input placeholder={t('prompts.modal.tagsPlaceholder')} />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPrompt ? t('prompts.modal.updateButton') : t('prompts.modal.createButton')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PromptsPage; 