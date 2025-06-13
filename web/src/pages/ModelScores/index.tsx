import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Alert, Row, Col, Tag, Divider, Statistic, Tooltip, Button, Progress } from 'antd';
import { Column } from '@ant-design/charts';
import { 
  TrophyOutlined, 
  StarOutlined, 
  InfoCircleOutlined, 
  HomeOutlined,
  ArrowLeftOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  AimOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

interface ModelScore {
  name: string;
  score: number;
  description: string;
  comment: string;
}

const ModelScoresPage: React.FC = () => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelScores, setModelScores] = useState<ModelScore[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await fetch('/score.json');
        if (!response.ok) {
          throw new Error('无法加载评分数据');
        }
        const data = await response.json();
        
        // 转换数据格式并按分数排序
        const scores: ModelScore[] = Object.entries(data)
          .map(([name, info]: [string, any]) => ({
            name,
            score: info.Score,
            description: info.Description,
            comment: info.Comment
          }))
          .sort((a, b) => b.score - a.score);
        
        setModelScores(scores);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  // 柱状图配置 - 简化版本
  const chartConfig = {
    data: modelScores.map((model, index) => ({
      name: model.name.length > 15 ? model.name.substring(0, 15) + '...' : model.name,
      fullName: model.name,
      score: model.score,
      rank: index + 1
    })),
    xField: 'name',
    yField: 'score',
    height: 350,
    color: (data: any) => {
      const score = data.score;
      if (score >= 75) return '#52c41a';
      if (score >= 60) return '#1677ff';
      if (score >= 45) return '#faad14';
      return '#ff4d4f';
    },
    label: {
      position: 'top' as const,
      style: {
        fill: theme === 'dark' ? '#ffffff' : '#000000',
        fontSize: 11,
        fontWeight: 'bold'
      }
    },
    xAxis: {
      label: {
        style: {
          fontSize: 10,
          fill: theme === 'dark' ? '#ffffff85' : '#00000085'
        },
        rotate: -45
      }
    },
    yAxis: {
      max: 100,
      grid: {
        line: {
          style: {
            stroke: theme === 'dark' ? '#434343' : '#f0f0f0',
            lineWidth: 1
          }
        }
      }
    },
    tooltip: {
      formatter: (datum: any) => {
        return [
          { name: '模型', value: datum.fullName },
          { name: '评分', value: `${datum.score}分` },
          { name: '排名', value: `第${datum.rank}名` }
        ];
      }
    }
  };

  // 获取评分等级和颜色
  const getScoreLevel = (score: number) => {
    if (score >= 75) return { level: '优秀', color: '#52c41a', icon: <CrownOutlined /> };
    if (score >= 60) return { level: '良好', color: '#1677ff', icon: <ThunderboltOutlined /> };
    if (score >= 45) return { level: '中等', color: '#faad14', icon: <AimOutlined /> };
    return { level: '待优化', color: '#ff4d4f', icon: <InfoCircleOutlined /> };
  };

  // 获取排名图标
  const getRankIcon = (index: number) => {
    if (index === 0) return <TrophyOutlined style={{ color: '#faad14', fontSize: 20 }} />;
    if (index === 1) return <TrophyOutlined style={{ color: '#c0c0c0', fontSize: 18 }} />;
    if (index === 2) return <TrophyOutlined style={{ color: '#cd7f32', fontSize: 16 }} />;
    return <span style={{ 
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: theme === 'dark' ? '#434343' : '#f5f5f5',
      fontSize: 12,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#ffffff85' : '#00000085'
    }}>
      {index + 1}
    </span>;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        background: theme === 'dark' ? '#141414' : '#fafafa'
      }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>加载评分数据中...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme === 'dark' ? '#141414' : '#fafafa',
        padding: 24
      }}>
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          style={{ maxWidth: 400 }}
          action={
            <Button 
              size="small" 
              type="text" 
              onClick={() => navigate('/')}
              icon={<HomeOutlined />}
            >
              返回首页
            </Button>
          }
        />
      </div>
    );
  }

  const avgScore = Math.round(modelScores.reduce((sum, model) => sum + model.score, 0) / modelScores.length);
  const maxScore = Math.max(...modelScores.map(m => m.score));
  const excellentCount = modelScores.filter(m => m.score >= 75).length;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: theme === 'dark' ? '#141414' : '#fafafa'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: theme === 'dark' ? '#1f1f1f' : '#ffffff',
        borderBottom: `1px solid ${theme === 'dark' ? '#434343' : '#f0f0f0'}`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ padding: '4px 8px' }}
          >
            返回
          </Button>
          <div>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrophyOutlined style={{ color: '#faad14', fontSize: 20 }} />
              AI模型评分排行榜
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              基于专业评估标准的Prompt优化能力评分
            </Text>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            共{modelScores.length}个模型
          </Text>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* 核心统计指标 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', height: 120 }}>
              <StarOutlined style={{ fontSize: 24, color: '#1677ff', marginBottom: 8 }} />
              <Statistic
                title="参评模型"
                value={modelScores.length}
                valueStyle={{ fontSize: 20, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', height: 120 }}>
              <FireOutlined style={{ fontSize: 24, color: '#fa541c', marginBottom: 8 }} />
              <Statistic
                title="平均评分"
                value={avgScore}
                suffix="分"
                valueStyle={{ fontSize: 20, fontWeight: 'bold', color: '#fa541c' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', height: 120 }}>
              <CrownOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
              <Statistic
                title="最高评分"
                value={maxScore}
                suffix="分"
                valueStyle={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', height: 120 }}>
              <TrophyOutlined style={{ fontSize: 24, color: '#faad14', marginBottom: 8 }} />
              <Statistic
                title="优秀模型"
                value={excellentCount}
                suffix="个"
                valueStyle={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 评分分布图表 */}
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ThunderboltOutlined style={{ color: '#1677ff' }} />
              评分分布图表
            </div>
          }
          style={{ marginBottom: 32 }}
        >
          <Column {...chartConfig} />
        </Card>

        {/* 排行榜 */}
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrophyOutlined style={{ color: '#faad14' }} />
              详细排名
            </div>
          }
        >
          <Row gutter={[16, 16]}>
            {modelScores.map((model, index) => {
              const { level, color, icon } = getScoreLevel(model.score);
              return (
                <Col xs={24} xl={12} key={model.name}>
                  <Card 
                    size="small" 
                    hoverable
                    style={{ 
                      marginBottom: 8,
                      border: index < 3 ? `2px solid ${color}` : undefined,
                      boxShadow: index < 3 ? `0 4px 12px ${color}20` : undefined
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* 排名图标 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                        {getRankIcon(index)}
                        <Text style={{ fontSize: 12, marginTop: 4 }}>#{index + 1}</Text>
                      </div>
                      
                      {/* 模型信息 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Text strong style={{ fontSize: 16 }}>{model.name}</Text>
                          <Tag color={color} icon={icon}>{level}</Tag>
                        </div>
                        
                        {/* 评分显示 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color }}>
                              {model.score}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 14, marginLeft: 4 }}>分</Text>
                          </div>
                          <Progress 
                            percent={model.score} 
                            size="small" 
                            strokeColor={color}
                            showInfo={false}
                            style={{ flex: 1, maxWidth: 200 }}
                          />
                        </div>
                        
                        {/* 描述 */}
                        <Paragraph 
                          style={{ 
                            marginBottom: 8,
                            color: theme === 'dark' ? '#ffffff85' : '#00000085',
                            fontSize: 13,
                            lineHeight: 1.4
                          }}
                          ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                        >
                          {model.description}
                        </Paragraph>
                        
                        {/* 操作区域 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Tooltip title="查看详细评估报告">
                            <Button 
                              type="text" 
                              size="small"
                              icon={<InfoCircleOutlined />}
                              style={{ padding: 0, height: 'auto' }}
                            >
                              详细报告
                            </Button>
                          </Tooltip>
                          
                          {index < 3 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <StarOutlined style={{ color: '#faad14', fontSize: 12 }} />
                              <Text style={{ fontSize: 12, color: '#faad14' }}>
                                {index === 0 ? '冠军' : index === 1 ? '亚军' : '季军'}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ModelScoresPage; 