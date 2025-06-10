import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Space, 
  Typography, 
  Tag, 
  Modal,
  Form,
  message,
  Spin,
  Empty,
  Tooltip,
  Pagination,
  Select,
  Dropdown,
  Segmented
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
  ReloadOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  CalendarOutlined,
  TagOutlined,
  MoreOutlined,
  CloseOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../stores/themeStore';
import {
  searchPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  toggleFavorite,
  toggleShare,
  incrementUsage,
  getPromptTemplate
} from '../../api/promptTemplateApi';
import { GeneratePromptTemplateParameters } from '../../api/promptApi';
import type {
  PromptTemplate,
  CreatePromptTemplateInput,
  UpdatePromptTemplateInput
} from '../../api/promptTemplateApi';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PageContainer = styled.div`
  padding: 24px;
  height: 100vh;
  overflow: hidden;
  background: ${props => props.theme === 'dark' ? '#0a0a0a' : '#f5f5f5'};
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  flex-shrink: 0;
  
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
  flex-shrink: 0;
  
  .search-section {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    max-width: 600px;
  }
  
  .filter-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
`;

const ContentArea = styled.div`
  display: flex;
  gap: 24px;
  flex: 1;
  overflow: hidden;
`;

const LeftPanel = styled.div<{ showDetail?: boolean }>`
  flex: ${props => props.showDetail ? '1' : '1'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
`;

const LeftPanelContent = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .ant-spin-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
`;

const SpinContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const RightPanel = styled.div<{ visible: boolean }>`
  width: ${props => props.visible ? '480px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: ${props => props.visible ? `1px solid ${props.theme === 'dark' ? '#424242' : '#e8e8e8'}` : 'none'};
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
  border-radius: 12px;
`;

const ListContainer = styled.div`
  overflow-y: auto;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
  border-radius: 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
  height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
`;

const PromptListItem = styled.div<{ selected?: boolean }>`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#f0f0f0'};
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.selected 
    ? (props.theme === 'dark' ? '#1677ff20' : '#e6f7ff') 
    : 'transparent'
  };
  border-left: ${props => props.selected ? '3px solid #1677ff' : '3px solid transparent'};
  
  &:hover {
    background: ${props => props.theme === 'dark' ? '#262626' : '#f8f9fa'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const PromptItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const PromptItemTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  
  .title-text {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    margin: 0;
  }
`;

const PromptItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.7;
  
  .action-btn {
    padding: 4px;
    border: none;
    background: transparent;
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    
    &:hover {
      color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
      background: ${props => props.theme === 'dark' ? '#424242' : '#f0f0f0'};
    }
  }
`;

const PromptItemContent = styled.div`
  margin-bottom: 12px;
  
  .description {
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    margin-bottom: 8px;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .content-preview {
    background: ${props => props.theme === 'dark' ? '#262626' : '#f8f9fa'};
    border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
    border-radius: 6px;
    padding: 8px 12px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    max-height: 60px;
    overflow: hidden;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      background: linear-gradient(transparent, ${props => props.theme === 'dark' ? '#262626' : '#f8f9fa'});
    }
  }
`;

const PromptItemFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    flex: 1;
  }
  
  .stats {
    display: flex;
    align-items: center;
    gap: 12px;
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    font-size: 12px;
  }
`;

const DetailPanel = styled.div`
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  
  .close-btn {
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    
    &:hover {
      color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    }
  }
`;

const DetailContent = styled.div`
  flex: 1;
  
  .detail-title {
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .detail-description {
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    margin-bottom: 16px;
    line-height: 1.5;
  }
  
  .detail-content {
    background: ${props => props.theme === 'dark' ? '#262626' : '#f8f9fa'};
    border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .detail-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .detail-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: ${props => props.theme === 'dark' ? '#262626' : '#f8f9fa'};
    border-radius: 8px;
    border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
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
  margin-top: 16px;
  padding: 16px 0;
  flex-shrink: 0;
`;

type ViewMode = 'list' | 'card';
type FilterType = 'all' | 'favorite' | 'shared';

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
    pageSize: 20,
    total: 0
  });
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState('createdTime');
  const [generatingParameters, setGeneratingParameters] = useState(false);

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
        let filteredPrompts = response.data.items;
        
        // 应用筛选
        if (filterType === 'favorite') {
          filteredPrompts = filteredPrompts.filter(p => p.isFavorite);
        } else if (filterType === 'shared') {
          filteredPrompts = filteredPrompts.filter(p => p.isShared);
        }
        
        // 应用排序
        filteredPrompts.sort((a, b) => {
          switch (sortBy) {
            case 'usageCount':
              return b.usageCount - a.usageCount;
            case 'title':
              return a.title.localeCompare(b.title);
            case 'createdTime':
            default:
              return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
          }
        });

        setPrompts(filteredPrompts);
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
  }, [filterType, sortBy]);

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

  // 选择提示词
  const handleSelectPrompt = async (prompt: PromptTemplate) => {
    try {
      setLoading(true);
      const response = await getPromptTemplate(prompt.id);
      if (response.success && response.data) {
        setSelectedPrompt(response.data);
        setShowDetail(true);
      } else {
        message.error(response.message || t('prompts.messages.loadFailed'));
      }
    } catch (error) {
      console.error('获取提示词详情失败:', error);
      message.error(t('prompts.messages.loadFailed'));
      // 如果API调用失败，使用列表中的数据作为备选
      setSelectedPrompt(prompt);
      setShowDetail(true);
    } finally {
      setLoading(false);
    }
  };

  // 关闭详情面板
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedPrompt(null);
  };

  // 创建新提示词
  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 编辑提示词
  const handleEditPrompt = (prompt: PromptTemplate, event?: React.MouseEvent) => {
    event?.stopPropagation();
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
          // 如果当前选中的是被编辑的提示词，更新详情面板
          if (selectedPrompt?.id === editingPrompt.id) {
            setSelectedPrompt({ ...editingPrompt, ...values, tags });
          }
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
  const handleDeletePrompt = (prompt: PromptTemplate, event?: React.MouseEvent) => {
    event?.stopPropagation();
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
            // 如果删除的是当前选中的提示词，关闭详情面板
            if (selectedPrompt?.id === prompt.id) {
              handleCloseDetail();
            }
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
  const handleToggleFavorite = async (prompt: PromptTemplate, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const response = await toggleFavorite(prompt.id);
      if (response.success) {
        const newIsFavorite = response.data?.isFavorite || !prompt.isFavorite;
        // 更新本地状态
        setPrompts(prev => prev.map(p => 
          p.id === prompt.id ? { ...p, isFavorite: newIsFavorite } : p
        ));
        // 更新详情面板
        if (selectedPrompt?.id === prompt.id) {
          setSelectedPrompt(prev => prev ? { ...prev, isFavorite: newIsFavorite } : null);
        }
      } else {
        message.error(response.message || t('prompts.messages.operationFailed'));
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      message.error(t('prompts.messages.operationFailed'));
    }
  };

  // 切换分享状态
  const handleToggleShare = async (prompt: PromptTemplate, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const response = await toggleShare(prompt.id);
      if (response.success) {
        const newIsShared = response.data?.isShared || !prompt.isShared;
        const newShareTime = response.data?.shareTime || prompt.shareTime;
        // 更新本地状态
        setPrompts(prev => prev.map(p => 
          p.id === prompt.id ? { 
            ...p, 
            isShared: newIsShared,
            shareTime: newShareTime
          } : p
        ));
        // 更新详情面板
        if (selectedPrompt?.id === prompt.id) {
          setSelectedPrompt(prev => prev ? { 
            ...prev, 
            isShared: newIsShared,
            shareTime: newShareTime
          } : null);
        }
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
  const handleCopyPrompt = async (prompt: PromptTemplate, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      message.success(t('prompts.messages.copySuccess'));
    
      // 增加使用次数
      try {
        const response = await incrementUsage(prompt.id);
        if (response.success) {
          const newUsageCount = response.data?.usageCount || prompt.usageCount + 1;
          setPrompts(prev => prev.map(p => 
            p.id === prompt.id ? { ...p, usageCount: newUsageCount } : p
          ));
          // 更新详情面板
          if (selectedPrompt?.id === prompt.id) {
            setSelectedPrompt(prev => prev ? { ...prev, usageCount: newUsageCount } : null);
          }
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

  // 生成提示词模板参数
  const handleGenerateParameters = async () => {
    const content = form.getFieldValue('content');
    if (!content || content.trim() === '') {
      message.warning(t('prompts.modal.contentRequired'));
      return;
    }

    setGeneratingParameters(true);
    try {
      const result = await GeneratePromptTemplateParameters(content);
      debugger
      // 解析标签字符串
      let tags = [];
      try {
        tags = JSON.parse(result.tags);
      } catch (e) {
        // 如果解析失败，尝试按逗号分割
        tags = result.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }

      // 更新表单字段
      form.setFieldsValue({
        title: result.title,
        description: result.description,
        tags: Array.isArray(tags) ? tags.join(', ') : result.tags
      });

      message.success(t('prompts.modal.generateParametersSuccess'));
    } catch (error) {
      console.error('生成参数失败:', error);
      message.error(t('prompts.modal.generateParametersFailed'));
    } finally {
      setGeneratingParameters(false);
    }
  };

  // 渲染列表项
  const renderListItem = (prompt: PromptTemplate) => (
    <PromptListItem
      key={prompt.id}
      theme={theme}
      selected={selectedPrompt?.id === prompt.id}
      onClick={() => handleSelectPrompt(prompt)}
    >
      <PromptItemHeader>
        <PromptItemTitle theme={theme}>
          <span className="title-text">{prompt.title}</span>
          {prompt.isFavorite && <StarFilled style={{ color: '#faad14', fontSize: 14 }} />}
          {prompt.isShared && <ShareAltOutlined style={{ color: '#52c41a', fontSize: 14 }} />}
        </PromptItemTitle>
        <PromptItemActions theme={theme}>
          <Tooltip title={t('prompts.copyContent')}>
            <Button
              type="text"
              size="small"
              className="action-btn"
              icon={<CopyOutlined />}
              onClick={(e) => handleCopyPrompt(prompt, e)}
            />
          </Tooltip>
          <Tooltip title={prompt.isFavorite ? t('prompts.removeFavorite') : t('prompts.addFavorite')}>
            <Button
              type="text"
              size="small"
              className="action-btn"
              icon={prompt.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={(e) => handleToggleFavorite(prompt, e)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                                 {
                   key: 'edit',
                   label: t('common.edit'),
                   icon: <EditOutlined />,
                   onClick: () => handleEditPrompt(prompt)
                 },
                 {
                   key: 'share',
                   label: prompt.isShared ? t('prompts.cancelShare') : t('prompts.shareToSquare'),
                   icon: <ShareAltOutlined />,
                   onClick: () => handleToggleShare(prompt)
                 },
                 {
                   type: 'divider'
                 },
                 {
                   key: 'delete',
                   label: t('common.delete'),
                   icon: <DeleteOutlined />,
                   danger: true,
                   onClick: () => handleDeletePrompt(prompt)
                 }
              ]
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              className="action-btn"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </PromptItemActions>
      </PromptItemHeader>
      
      <PromptItemContent theme={theme}>
        <div className="description">{prompt.description}</div>
        <div className="content-preview">
          {prompt.content.length > 120 
            ? `${prompt.content.substring(0, 120)}...` 
            : prompt.content
          }
        </div>
      </PromptItemContent>
      
      <PromptItemFooter theme={theme}>
                 <div className="tags">
           {prompt.tags.slice(0, 3).map(tag => (
             <Tag key={tag} color="blue">
               {tag}
             </Tag>
           ))}
           {prompt.tags.length > 3 && (
             <Tag color="default">+{prompt.tags.length - 3}</Tag>
           )}
         </div>
        <div className="stats">
          <span><EyeOutlined /> {prompt.usageCount}</span>
          <span><CalendarOutlined /> {new Date(prompt.createdTime).toLocaleDateString()}</span>
        </div>
      </PromptItemFooter>
    </PromptListItem>
  );

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
        <div className="search-section">
          <Input
            placeholder={t('prompts.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
            allowClear
            onClear={() => handleSearch('')}
            style={{ maxWidth: 300 }}
          />
          
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 120 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">{t('prompts.filter.all')}</Option>
            <Option value="favorite">{t('prompts.filter.favorite')}</Option>
            <Option value="shared">{t('prompts.filter.shared')}</Option>
          </Select>
          
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 140 }}
          >
            <Option value="createdTime">{t('prompts.sort.createTime')}</Option>
            <Option value="usageCount">{t('prompts.sort.usage')}</Option>
            <Option value="title">{t('prompts.sort.title')}</Option>
          </Select>
        </div>
        
        <div className="filter-section">
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { label: <UnorderedListOutlined />, value: 'list' },
              { label: <AppstoreOutlined />, value: 'card' }
            ]}
          />
        </div>
        
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

      <ContentArea>
        <LeftPanel showDetail={showDetail}>
          <LeftPanelContent>
            <Spin spinning={loading} style={{ height: '100%' }}>
              {prompts.length === 0 && !loading ? (
                <Empty
                  description={searchText ? t('prompts.noSearchResults') : t('prompts.noPrompts')}
                  style={{ marginTop: 60 }}
                />
              ) : (
                <>
                  <SpinContainer>
                    <ListContainer theme={theme}>
                      {prompts.map(renderListItem)}
                    </ListContainer>
                  </SpinContainer>

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
                        size="small"
                      />
                    </PaginationContainer>
                  )}
                </>
              )}
            </Spin>
          </LeftPanelContent>
        </LeftPanel>

        <RightPanel visible={showDetail} theme={theme}>
          {selectedPrompt && (
            <DetailPanel>
              <DetailHeader theme={theme}>
                <Title level={4} style={{ margin: 0 }}>
                  {t('prompts.detail.title')}
                </Title>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={handleCloseDetail}
                  className="close-btn"
                />
              </DetailHeader>
              
              <DetailContent theme={theme}>
                <div className="detail-title">
                  {selectedPrompt.title}
                  {selectedPrompt.isFavorite && <StarFilled style={{ color: '#faad14' }} />}
                  {selectedPrompt.isShared && <ShareAltOutlined style={{ color: '#52c41a' }} />}
                </div>
                
                <div className="detail-description">
                  {selectedPrompt.description}
                </div>
                
                <div className="detail-content">
                  {selectedPrompt.content}
                </div>
                
                <div className="detail-actions">
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyPrompt(selectedPrompt)}
                  >
                    {t('prompts.copyContent')}
                  </Button>
                  <Button
                    icon={selectedPrompt.isFavorite ? <StarFilled /> : <StarOutlined />}
                    onClick={() => handleToggleFavorite(selectedPrompt)}
                  >
                    {selectedPrompt.isFavorite ? t('prompts.removeFavorite') : t('prompts.addFavorite')}
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEditPrompt(selectedPrompt)}
                  >
                    {t('common.edit')}
                  </Button>
                </div>
                
                <div className="detail-meta">
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <Text type="secondary">
                      <EyeOutlined /> {t('prompts.usageStats', { count: selectedPrompt.usageCount })}
                    </Text>
                    <Text type="secondary">
                      <CalendarOutlined /> {t('prompts.createTime', { date: new Date(selectedPrompt.createdTime).toLocaleDateString() })}
                    </Text>
                  </div>
                  
                  {selectedPrompt.tags.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ marginRight: 8 }}>
                        <TagOutlined /> {t('prompts.tags')}:
                      </Text>
                      <Space wrap>
                        {selectedPrompt.tags.map(tag => (
                          <Tag key={tag} color="blue">{tag}</Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                  
                  {selectedPrompt.isShared && selectedPrompt.shareTime && (
                    <Text type="secondary">
                      <ShareAltOutlined /> {t('prompts.sharedAt')} {new Date(selectedPrompt.shareTime).toLocaleDateString()}
                    </Text>
                  )}
                </div>
              </DetailContent>
            </DetailPanel>
          )}
        </RightPanel>
      </ContentArea>

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
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>{t('prompts.modal.contentLabel')}</span>
                <Tooltip title={t('prompts.modal.generateParametersTooltip')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    loading={generatingParameters}
                    onClick={handleGenerateParameters}
                    style={{ 
                      color: '#1677ff',
                      fontSize: '12px',
                      height: '24px',
                      padding: '0 8px'
                    }}
                  >
                    {generatingParameters ? t('prompts.modal.generatingParameters') : t('prompts.modal.generateParameters')}
                  </Button>
                </Tooltip>
              </div>
            }
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