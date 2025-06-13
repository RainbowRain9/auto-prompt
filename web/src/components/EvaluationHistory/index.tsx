import React, { useState } from 'react';
import {
  Card,
  List,
  Button,
  Tag,
  Typography,
  Space,
  Tooltip,
  Modal,
  Popconfirm,
  Empty,
  Row,
  Col,
  Statistic,
  Collapse,
  Descriptions
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { EvaluationRecord } from '../../utils/indexedDB';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface EvaluationHistoryProps {
  evaluations: EvaluationRecord[];
  onViewEvaluation: (evaluation: EvaluationRecord) => void;
  onDeleteEvaluation: (id: string) => void;
  onClearAll: () => void;
  isLoading?: boolean;
}

const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({
  evaluations,
  onViewEvaluation,
  onDeleteEvaluation,
  onClearAll,
  isLoading = false
}) => {
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 获取评分颜色和等级
  const getScoreInfo = (score: number) => {
    if (score >= 90) return { color: '#52c41a', level: '优秀', icon: '🏆' };
    if (score >= 80) return { color: '#1677ff', level: '良好', icon: '🎯' };
    if (score >= 70) return { color: '#faad14', level: '中等', icon: '📈' };
    if (score >= 60) return { color: '#fa8c16', level: '及格', icon: '📊' };
    return { color: '#ff4d4f', level: '待提升', icon: '📉' };
  };

  // 格式化时间
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化时长
  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  // 查看详细信息
  const handleViewDetail = (evaluation: EvaluationRecord) => {
    setSelectedEvaluation(evaluation);
    setDetailModalVisible(true);
  };

  // 查看评估结果
  const handleViewEvaluation = (evaluation: EvaluationRecord) => {
    onViewEvaluation(evaluation);
    setDetailModalVisible(false);
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      '文案策划': 'blue',
      '编程开发': 'green',
      '创意写作': 'purple',
      '商业分析': 'orange',
      '教育培训': 'cyan',
      '客户服务': 'magenta',
      '技术写作': 'geekblue',
      '生活服务': 'volcano'
    };
    return colors[category] || 'default';
  };

  if (evaluations.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <DatabaseOutlined style={{ color: '#1677ff' }} />
            <Title level={4} style={{ margin: 0 }}>评估历史</Title>
          </Space>
        }
        extra={
          <Text type="secondary">共 0 条记录</Text>
        }
      >
        <Empty
          description="暂无评估历史记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div>
      <Card 
        title={
          <Space>
            <DatabaseOutlined style={{ color: '#1677ff' }} />
            <Title level={4} style={{ margin: 0 }}>评估历史</Title>
          </Space>
        }
        extra={
          <Space>
            <Text type="secondary">共 {evaluations.length} 条记录</Text>
            {evaluations.length > 0 && (
              <Popconfirm
                title="确认清空所有历史记录？"
                description="此操作不可恢复，请谨慎操作"
                onConfirm={onClearAll}
                okText="确认"
                cancelText="取消"
                icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              >
                <Button danger size="small">
                  清空历史
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <List
          loading={isLoading}
          dataSource={evaluations}
          pagination={{
            pageSize: 5,
            size: 'small',
            showSizeChanger: false,
            showQuickJumper: true
          }}
          renderItem={(evaluation) => (
            <List.Item
              actions={[
                <Tooltip title="查看详情">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(evaluation)}
                  />
                </Tooltip>,
                <Tooltip title="查看结果">
                  <Button
                    type="text"
                    icon={<BarChartOutlined />}
                    onClick={() => onViewEvaluation(evaluation)}
                  />
                </Tooltip>,
                <Popconfirm
                  title="确认删除此记录？"
                  onConfirm={() => onDeleteEvaluation(evaluation.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Tooltip title="删除记录">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Tooltip>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong>{evaluation.title}</Text>
                    {evaluation.config.exampleCategory && (
                      <Tag color={getCategoryColor(evaluation.config.exampleCategory)}>
                        {evaluation.config.exampleCategory}
                      </Tag>
                    )}
                    <Tag color="processing">
                      {evaluation.statistics.totalModels} 模型
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: '4px' }}>
                      <Space>
                        <ClockCircleOutlined />
                        <Text type="secondary">{formatDate(evaluation.timestamp)}</Text>
                        <TrophyOutlined />
                        <Text type="secondary">平均分: {evaluation.statistics.avgScore.toFixed(1)}</Text>
                        <Text type="secondary">耗时: {formatDuration(evaluation.statistics.totalTime)}</Text>
                      </Space>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {evaluation.config.models.slice(0, 3).map(model => (
                        <Tag key={model}>
                          {model.length > 15 ? model.substring(0, 15) + '...' : model}
                        </Tag>
                      ))}
                      {evaluation.config.models.length > 3 && (
                        <Tag>+{evaluation.config.models.length - 3}</Tag>
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title={`评估详情 - ${selectedEvaluation?.title}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="view"
            type="primary"
            onClick={() => selectedEvaluation && handleViewEvaluation(selectedEvaluation)}
          >
            查看结果
          </Button>
        ]}
      >
        {selectedEvaluation && (
          <div>
            {/* 基本信息 */}
            <Descriptions
              title="基本信息"
              size="small"
              column={2}
              style={{ marginBottom: '16px' }}
            >
              <Descriptions.Item label="评估时间">
                {formatDate(selectedEvaluation.timestamp)}
              </Descriptions.Item>
              <Descriptions.Item label="总耗时">
                {formatDuration(selectedEvaluation.statistics.totalTime)}
              </Descriptions.Item>
              <Descriptions.Item label="评估模型">
                {selectedEvaluation.statistics.totalModels} 个
              </Descriptions.Item>
              <Descriptions.Item label="完成模型">
                {selectedEvaluation.statistics.completedModels} 个
              </Descriptions.Item>
              <Descriptions.Item label="平均分数">
                <span style={{ color: getScoreInfo(selectedEvaluation.statistics.avgScore).color }}>
                  {selectedEvaluation.statistics.avgScore.toFixed(1)} 分
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="评估类型">
                {selectedEvaluation.config.exampleCategory && (
                  <Tag color={getCategoryColor(selectedEvaluation.config.exampleCategory)}>
                    {selectedEvaluation.config.exampleCategory}
                  </Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* 统计信息 */}
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic
                  title="参与模型"
                  value={selectedEvaluation.statistics.totalModels}
                  suffix="个"
                  prefix="🤖"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="平均得分"
                  value={selectedEvaluation.statistics.avgScore}
                  precision={1}
                  suffix="分"
                  prefix={getScoreInfo(selectedEvaluation.statistics.avgScore).icon}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="总耗时"
                  value={Math.round(selectedEvaluation.statistics.totalTime / 1000)}
                  suffix="秒"
                  prefix="⏱️"
                />
              </Col>
            </Row>

            {/* 详细配置 */}
            <Collapse size="small" style={{ marginBottom: '16px' }}>
              <Panel header="配置详情" key="config">
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="执行次数">
                    {selectedEvaluation.config.executionCount} 次
                  </Descriptions.Item>
                  <Descriptions.Item label="启用优化">
                    {selectedEvaluation.config.enableOptimization ? '是' : '否'}
                  </Descriptions.Item>
                  <Descriptions.Item label="参与模型">
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {selectedEvaluation.config.models.map(model => (
                        <Tag key={model}>{model}</Tag>
                      ))}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="基础提示词">
                    <Paragraph
                      style={{ margin: 0 }}
                      ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                    >
                      {selectedEvaluation.config.prompt}
                    </Paragraph>
                  </Descriptions.Item>
                  <Descriptions.Item label="测试任务">
                    <Paragraph
                      style={{ margin: 0 }}
                      ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                    >
                      {selectedEvaluation.config.request}
                    </Paragraph>
                  </Descriptions.Item>
                </Descriptions>
              </Panel>
            </Collapse>

            {/* 评估结果概览 */}
            <div>
              <Title level={5}>评估结果概览</Title>
              <List
                size="small"
                dataSource={Object.entries(selectedEvaluation.results)}
                renderItem={([model, result]) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Text>{model}</Text>
                          <Tag color={getScoreInfo(result.score).color}>
                            {result.score}分 - {getScoreInfo(result.score).level}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary">{result.description}</Text>
                          {result.tags.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              {result.tags.map(tag => (
                                <Tag key={tag} color="blue">
                                  {tag}
                                </Tag>
                              ))}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EvaluationHistory; 