import React, { useEffect, useState } from 'react';
import { 
  Drawer, 
  Typography, 
  Tag, 
  Space, 
  Button, 
  message, 
  Spin, 
  Divider,
  Card,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  HeartOutlined, 
  HeartFilled, 
  EyeOutlined, 
  CopyOutlined,
  UserOutlined,
  CalendarOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PromptTemplate } from '../api/promptTemplateApi';
import { getSharedPromptTemplate, toggleLike } from '../api/promptTemplateApi';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

interface PromptDetailPanelProps {
  visible: boolean;
  promptId: string | null;
  onClose: () => void;
  onLikeChange?: (promptId: string, isLiked: boolean, likeCount: number) => void;
}

const PromptDetailPanel: React.FC<PromptDetailPanelProps> = ({
  visible,
  promptId,
  onClose,
  onLikeChange
}) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState<PromptTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && promptId) {
      loadPromptDetail();
    }
  }, [visible, promptId]);

  const loadPromptDetail = async () => {
    if (!promptId) return;
    
    setLoading(true);
    try {
      const response = await getSharedPromptTemplate(promptId);
      if (response.success && response.data) {
        setPrompt(response.data);
      } else {
        message.error(response.message || t('promptDetail.loadDetailFailed'));
      }
    } catch (error) {
      console.error('获取详情失败:', error);
      message.error(t('promptDetail.loadDetailFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!prompt) return;

    try {
      const response = await toggleLike(prompt.id);
      if (response.success && response.data) {
        const newIsLiked = response.data.isLiked;
        const newLikeCount = response.data.likeCount;
        
        setPrompt(prev => prev ? {
          ...prev,
          isLikedByCurrentUser: newIsLiked,
          likeCount: newLikeCount
        } : null);

        onLikeChange?.(prompt.id, newIsLiked, newLikeCount);
        message.success(newIsLiked ? t('promptDetail.likeSuccess') : t('promptDetail.unlikeSuccess'));
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      message.error(t('promptDetail.operationFailed'));
    }
  };

  const handleCopy = async () => {
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt.content);
      message.success(t('promptDetail.copySuccess'));
    } catch (error) {
      console.error('复制失败:', error);
      message.error(t('promptDetail.copyFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm');
  };

  return (
    <Drawer
      title={t('promptDetail.title')}
      placement="right"
      width={600}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : prompt ? (
        <div>
          {/* 标题和基本信息 */}
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 8 }}>
              {prompt.title}
            </Title>
            
            <Space wrap style={{ marginBottom: 16 }}>
              <Text type="secondary">
                <UserOutlined /> {prompt.creatorName || t('promptDetail.anonymousUser')}
              </Text>
              <Text type="secondary">
                <CalendarOutlined /> {formatDate(prompt.createdTime)}
              </Text>
              {prompt.shareTime && (
                <Text type="secondary">
                  <ShareAltOutlined /> {t('promptDetail.sharedAt')} {formatDate(prompt.shareTime)}
                </Text>
              )}
            </Space>

            {prompt.description && (
              <Paragraph style={{ marginBottom: 16 }}>
                {prompt.description}
              </Paragraph>
            )}

            {/* 标签 */}
            {prompt.tags && prompt.tags.length > 0 && (
              <Space wrap style={{ marginBottom: 16 }}>
                {prompt.tags.map((tag, index) => (
                  <Tag key={index} color="blue">{tag}</Tag>
                ))}
              </Space>
            )}
          </div>

          {/* 统计信息 */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={t('promptDetail.viewCount')}
                  value={prompt.viewCount}
                  prefix={<EyeOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('promptDetail.likeCount')}
                  value={prompt.likeCount}
                  prefix={<HeartOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('promptDetail.usageCount')}
                  value={prompt.usageCount}
                />
              </Col>
            </Row>
          </Card>

          {/* 操作按钮 */}
          <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'center' }}>
            <Button
              type={prompt.isLikedByCurrentUser ? "primary" : "default"}
              icon={prompt.isLikedByCurrentUser ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleLike}
            >
              {prompt.isLikedByCurrentUser ? t('promptDetail.liked') : t('promptDetail.like')} ({prompt.likeCount})
            </Button>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleCopy}
            >
              {t('promptDetail.copyContent')}
            </Button>
          </Space>

          <Divider />

          {/* 提示词内容 */}
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>{t('promptDetail.promptContent')}</Title>
            <Card>
              <Paragraph
                copyable={{
                  text: prompt.content,
                  tooltips: [t('promptDetail.copyTooltips.copy'), t('promptDetail.copyTooltips.copied')]
                }}
                style={{
                  whiteSpace: 'pre-wrap',
                  marginBottom: 0,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                {prompt.content}
              </Paragraph>
            </Card>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text type="secondary">{t('promptDetail.notFound')}</Text>
        </div>
      )}
    </Drawer>
  );
};

export default PromptDetailPanel; 