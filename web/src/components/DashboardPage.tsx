import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  message,
  Spin,
  Empty,
  Tooltip,
  Pagination,
  Select
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CopyOutlined,
  FireOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../stores/themeStore';
import {
  searchSharedPromptTemplates,
  toggleLike,
  incrementView
} from '../api/promptTemplateApi';
import type {
  PromptTemplate,
  SharedPromptTemplateSearchInput
} from '../api/promptTemplateApi';
import PromptDetailPanel from './PromptDetailPanel';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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
    display: flex;
    align-items: center;
    gap: 12px;
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
  flex-wrap: wrap;
  
  .search-section {
    display: flex;
    gap: 12px;
    align-items: center;
    flex: 1;
    min-width: 300px;
  }
  
  .sort-section {
    display: flex;
    gap: 8px;
    align-items: center;
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
    
    .ant-card-body {
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }
`;

const PromptContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  
  .prompt-title {
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.3;
  }
  
  .prompt-creator {
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    font-size: 12px;
    flex-shrink: 0;
  }
  
  .prompt-description {
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    margin-bottom: 12px;
    font-size: 14px;
    flex-shrink: 0;
    height: 40px;
    overflow: hidden;
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
    height: 80px;
    overflow-y: auto;
    flex-shrink: 0;
  }
  
  .prompt-tags {
    margin-bottom: 12px;
    height: 32px;
    overflow: hidden;
    flex-shrink: 0;
  }
  
  .prompt-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    flex-shrink: 0;
  }
  
  .stats-left {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  
  .stats-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
    font-size: 12px;
  }
`;

const HotBadge = styled.div`
  background: linear-gradient(45deg, #ff6b6b, #ffa500);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 16px 0;
`;

const DashboardPage: React.FC = () => {
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('ViewCount');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);

  // 加载分享的提示词列表
  const loadSharedPrompts = async (page = 1, search = searchText, sort = sortBy, order = sortOrder) => {
    setLoading(true);
    try {
      const input: SharedPromptTemplateSearchInput = {
        searchText: search,
        page: page,
        pageSize: pagination.pageSize,
        sortBy: sort,
        sortOrder: order
      };

      const response = await searchSharedPromptTemplates(input);

      if (response.success) {
        setPrompts(response.data.items);
        setPagination(prev => ({
          ...prev,
          current: response.data.page,
          total: response.data.total
        }));
      } else {
        message.error(response.message || t('promptSquare.messages.loadFailed'));
      }
    } catch (error) {
      console.error('加载分享提示词失败:', error);
      message.error(t('promptSquare.messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadSharedPrompts();
  }, []);

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadSharedPrompts(1, value, sortBy, sortOrder);
  };

  // 排序处理
  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadSharedPrompts(1, searchText, newSortBy, sortOrder);
  };

  // 排序顺序处理
  const handleSortOrderChange = (newSortOrder: string) => {
    setSortOrder(newSortOrder);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadSharedPrompts(1, searchText, sortBy, newSortOrder);
  };

  // 分页处理
  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
    loadSharedPrompts(page, searchText, sortBy, sortOrder);
  };

  // 点赞处理
  const handleToggleLike = async (prompt: PromptTemplate, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const response = await toggleLike(prompt.id);
      if (response.success) {
        // 更新本地状态
        setPrompts(prev => prev.map(p => 
          p.id === prompt.id ? { 
            ...p, 
            likeCount: response.data?.likeCount || p.likeCount,
            isLikedByCurrentUser: response.data?.isLiked || !p.isLikedByCurrentUser
          } : p
        ));
        
        // 显示成功消息
        const messageKey = response.data?.isLiked ? 'likeSuccess' : 'unlikeSuccess';
        message.success(t(`promptSquare.messages.${messageKey}`));
      } else {
        message.error(response.message || t('promptSquare.messages.operationFailed'));
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      message.error(t('promptSquare.messages.operationFailed'));
    }
  };

  // 复制提示词内容
  const handleCopyPrompt = async (prompt: PromptTemplate, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      message.success(t('promptSquare.messages.copySuccess'));
      
      // 增加查看次数
      await incrementView(prompt.id);
      setPrompts(prev => prev.map(p => 
        p.id === prompt.id ? { ...p, viewCount: p.viewCount + 1 } : p
      ));
    } catch (error) {
      console.error('复制失败:', error);
      message.error(t('promptSquare.messages.copyFailed'));
    }
  };

  // 查看提示词详情
  const handleViewPrompt = async (prompt: PromptTemplate) => {
    try {
      // 增加查看次数
      await incrementView(prompt.id);
      setPrompts(prev => prev.map(p => 
        p.id === prompt.id ? { ...p, viewCount: p.viewCount + 1 } : p
      ));
      
      // 打开详情面板
      setSelectedPromptId(prompt.id);
      setDetailPanelVisible(true);
    } catch (error) {
      console.error('查看详情失败:', error);
    }
  };

  // 判断是否为热门提示词
  const isHotPrompt = (prompt: PromptTemplate) => {
    return prompt.viewCount > 100 || prompt.likeCount > 20;
  };

  // 刷新数据
  const handleRefresh = () => {
    loadSharedPrompts(pagination.current, searchText, sortBy, sortOrder);
  };

  return (
    <PageContainer theme={theme}>
      <PageHeader theme={theme}>
        <Title level={2} className="page-title">
          <TrophyOutlined style={{ color: '#ffa500' }} />
          {t('promptSquare.title')}
        </Title>
        <Text className="page-description">
          {t('promptSquare.description')}
        </Text>
      </PageHeader>

      <ActionBar>
        <div className="search-section">
          <Input.Search
            placeholder={t('promptSquare.searchPlaceholder')}
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            style={{ maxWidth: 400 }}
          />
        </div>
        
        <div className="sort-section">
          <Text type="secondary">{t('promptSquare.sortBy')}</Text>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            style={{ width: 120 }}
          >
            <Option value="ViewCount">{t('promptSquare.sortOptions.viewCount')}</Option>
            <Option value="LikeCount">{t('promptSquare.sortOptions.likeCount')}</Option>
            <Option value="ShareTime">{t('promptSquare.sortOptions.shareTime')}</Option>
            <Option value="CreatedTime">{t('promptSquare.sortOptions.createdTime')}</Option>
          </Select>
          
          <Select
            value={sortOrder}
            onChange={handleSortOrderChange}
            style={{ width: 80 }}
          >
            <Option value="desc">{t('promptSquare.sortOrder.desc')}</Option>
            <Option value="asc">{t('promptSquare.sortOrder.asc')}</Option>
          </Select>
          
          <Tooltip title={t('promptSquare.refresh')}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            />
          </Tooltip>
        </div>
      </ActionBar>

      <Spin spinning={loading}>
        {prompts.length === 0 && !loading ? (
          <Empty 
            description={t('promptSquare.empty')}
            style={{ marginTop: 60 }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {prompts.map((prompt) => (
              <Col xs={24} sm={24} md={12} lg={8} xl={6} key={prompt.id}>
                <PromptCard theme={theme} onClick={() => handleViewPrompt(prompt)}>
                  <PromptContent theme={theme}>
                    <div className="prompt-header">
                      <div>
                        <div className="prompt-title">
                          {prompt.title}
                          {isHotPrompt(prompt) && (
                            <HotBadge>
                              <FireOutlined />
                              {t('promptSquare.hotBadge')}
                            </HotBadge>
                          )}
                        </div>
                        <div className="prompt-creator">
                          <ClockCircleOutlined />
                          {new Date(prompt.shareTime || prompt.createdTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {prompt.description && (
                      <Paragraph 
                        className="prompt-description"
                        ellipsis={{ rows: 2, tooltip: prompt.description }}
                      >
                        {prompt.description}
                      </Paragraph>
                    )}
                    
                    <div className="prompt-text">
                      {prompt.content}
                    </div>
                    
                    <div className="prompt-tags">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>
                          {tag}
                        </Tag>
                      ))}
                      {prompt.tags.length > 3 && (
                        <Tag color="default">
                          {t('promptSquare.tags.more', { count: prompt.tags.length - 3 })}
                        </Tag>
                      )}
                    </div>
                    
                    <div className="prompt-stats">
                      <div className="stats-left">
                        <div className="stat-item">
                          <EyeOutlined />
                          {prompt.viewCount}
                        </div>
                        <div className="stat-item">
                          <HeartOutlined />
                          {prompt.likeCount}
                        </div>
                        <div className="stat-item">
                          <ShareAltOutlined />
                          {t('promptSquare.stats.usage', { count: prompt.usageCount })}
                        </div>
                      </div>
                      
                      <div className="stats-right">
                        <Tooltip title={t('promptSquare.actions.copy')}>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={(e) => handleCopyPrompt(prompt, e)}
                          />
                        </Tooltip>
                        <Tooltip title={prompt.isLikedByCurrentUser ? t('promptSquare.actions.unlike') : t('promptSquare.actions.like')}>
                          <Button
                            type="text"
                            size="small"
                            icon={prompt.isLikedByCurrentUser ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                            onClick={(e) => handleToggleLike(prompt, e)}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </PromptContent>
                </PromptCard>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      <PaginationContainer>
        <Pagination
          current={pagination.current}
          total={pagination.total}
          pageSize={pagination.pageSize}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) => t('promptSquare.pagination', { 
            start: range[0], 
            end: range[1], 
            total 
          })}
          onChange={handlePageChange}
          pageSizeOptions={['12', '24', '48', '96']}
        />
      </PaginationContainer>

      <PromptDetailPanel
        visible={detailPanelVisible}
        promptId={selectedPromptId}
        onClose={() => {
          setDetailPanelVisible(false);
          setSelectedPromptId(null);
        }}
        onLikeChange={(promptId, isLiked, likeCount) => {
          setPrompts(prev => prev.map(p => 
            p.id === promptId ? { 
              ...p, 
              isLikedByCurrentUser: isLiked, 
              likeCount: likeCount 
            } : p
          ));
        }}
      />
    </PageContainer>
  );
};

export default DashboardPage; 