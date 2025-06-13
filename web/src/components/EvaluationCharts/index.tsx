import React from 'react';
import { Card, Row, Col, Typography, Empty } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { useThemeStore } from '../../stores/themeStore';
import type { EvaluationRecord } from '../../utils/indexedDB';

const { Title, Text } = Typography;

interface EvaluationChartsProps {
  evaluations: EvaluationRecord[];
  currentEvaluation?: EvaluationRecord;
}

const EvaluationCharts: React.FC<EvaluationChartsProps> = ({ evaluations, currentEvaluation }) => {
  const { theme } = useThemeStore();

  // 颜色配置
  const colors = ['#1677ff', '#52c41a', '#faad14', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];
  const pieColors = ['#52c41a', '#1677ff', '#faad14', '#fa8c16', '#f5222d'];
  
  // 文字颜色
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const secondaryTextColor = theme === 'dark' ? '#999999' : '#666666';

  // 处理评分分布数据
  const getScoreDistributionData = () => {
    if (!currentEvaluation) return [];
    
    const distribution = {
      '优秀(90-100)': 0,
      '良好(80-89)': 0,
      '中等(70-79)': 0,
      '及格(60-69)': 0,
      '待提升(0-59)': 0
    };

    Object.values(currentEvaluation.results).forEach(result => {
      if (result.score >= 90) distribution['优秀(90-100)']++;
      else if (result.score >= 80) distribution['良好(80-89)']++;
      else if (result.score >= 70) distribution['中等(70-79)']++;
      else if (result.score >= 60) distribution['及格(60-69)']++;
      else distribution['待提升(0-59)']++;
    });

    return Object.entries(distribution)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  // 处理模型对比数据
  const getModelComparisonData = () => {
    if (!currentEvaluation) return [];
    
    return Object.entries(currentEvaluation.results).map(([model, result]) => ({
      model: model.length > 15 ? model.substring(0, 15) + '...' : model,
      fullModel: model,
      score: result.score,
      duration: Math.round(result.duration / 1000)
    }));
  };

  // 处理雷达图数据
  const getRadarData = () => {
    if (!currentEvaluation) return [];
    
    const models = Object.keys(currentEvaluation.results);
    if (models.length === 0) return [];

    const subjects = ['评分', '执行时长', '标签数量', '描述长度', '评论长度'];
    
    return subjects.map(subject => {
      const dataPoint: any = { subject };
      
      models.forEach((model, index) => {
        const result = currentEvaluation.results[model];
        let value = 0;
        
        switch (subject) {
          case '评分':
            value = result.score;
            break;
          case '执行时长':
            value = Math.max(0, 100 - (result.duration / 1000 / 10)); // 转换为0-100分值，时间越短分数越高
            break;
          case '标签数量':
            value = Math.min(100, result.tags.length * 20); // 每个标签20分，最高100分
            break;
          case '描述长度':
            value = Math.min(100, result.description.length / 2); // 描述长度转换为分值
            break;
          case '评论长度':
            value = Math.min(100, result.comment.length / 5); // 评论长度转换为分值
            break;
        }
        
        const modelKey = model.length > 10 ? model.substring(0, 10) + '...' : model;
        dataPoint[modelKey] = Math.round(value);
      });
      
      return dataPoint;
    });
  };

  // 处理历史趋势数据
  const getHistoryTrendData = () => {
    if (evaluations.length === 0) return [];
    
    return evaluations
      .slice(0, 10) // 只显示最近10次评估
      .reverse()
      .map((evaluation, index) => ({
        index: index + 1,
        date: new Date(evaluation.timestamp).toLocaleDateString(),
        avgScore: evaluation.statistics.avgScore,
        modelsCount: evaluation.statistics.totalModels,
        completedCount: evaluation.statistics.completedModels
      }));
  };

  // 处理分类分布数据
  const getCategoryDistributionData = () => {
    const categoryCount: { [key: string]: number } = {};
    
    evaluations.forEach(evaluation => {
      if (evaluation.config.exampleCategory) {
        const category = evaluation.config.exampleCategory;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    return Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
  };

  const scoreDistributionData = getScoreDistributionData();
  const modelComparisonData = getModelComparisonData();
  const radarData = getRadarData();
  const historyTrendData = getHistoryTrendData();
  const categoryDistributionData = getCategoryDistributionData();

  if (!currentEvaluation && evaluations.length === 0) {
    return (
      <Empty
        description="暂无评估数据"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: '24px', color: textColor }}>
        📊 数据可视化分析
      </Title>
      
      {/* 当前评估结果图表 */}
      {currentEvaluation && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {/* 评分分布饼图 */}
            <Col span={12}>
              <Card 
                title="🎯 评分分布" 
                size="small"
                style={{ height: '320px' }}
              >
                {scoreDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={scoreDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {scoreDistributionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>
            
            {/* 模型对比柱状图 */}
            <Col span={12}>
              <Card 
                title="🏆 模型评分对比" 
                size="small"
                style={{ height: '320px' }}
              >
                {modelComparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={modelComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="model" 
                        tick={{ fontSize: 11, fill: secondaryTextColor }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11, fill: secondaryTextColor }} />
                      <Tooltip 
                        formatter={(value: any, name: string, props: any) => [
                          name === 'score' ? `${value}分` : `${value}秒`,
                          name === 'score' ? '评分' : '耗时'
                        ]}
                        labelFormatter={(label: string, payload: any) => {
                          const data = payload?.[0]?.payload;
                          return data ? data.fullModel : label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="score" fill="#1677ff" name="评分" />
                      <Bar dataKey="duration" fill="#52c41a" name="耗时(秒)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>
          </Row>

          {/* 雷达图 */}
          {radarData.length > 0 && Object.keys(currentEvaluation.results).length > 0 && (
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <Card 
                  title="🎪 模型综合能力雷达图" 
                  size="small"
                  style={{ height: '400px' }}
                >
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: secondaryTextColor }} />
                      <PolarRadiusAxis 
                        tick={{ fontSize: 10, fill: secondaryTextColor }}
                        domain={[0, 100]}
                      />
                      {Object.keys(currentEvaluation.results).map((model, index) => {
                        const modelKey = model.length > 10 ? model.substring(0, 10) + '...' : model;
                        return (
                          <Radar
                            key={model}
                            name={modelKey}
                            dataKey={modelKey}
                            stroke={colors[index % colors.length]}
                            fill={colors[index % colors.length]}
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                        );
                      })}
                      <Legend />
                      <Tooltip 
                        formatter={(value: any, name: string) => [`${value}分`, name]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* 历史数据图表 */}
      {evaluations.length > 1 && (
        <Row gutter={[16, 16]}>
          {/* 历史趋势折线图 */}
          <Col span={16}>
            <Card 
              title="📈 评估历史趋势" 
              size="small"
              style={{ height: '320px' }}
            >
              {historyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={historyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: secondaryTextColor }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: secondaryTextColor }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avgScore" 
                      stroke="#1677ff" 
                      strokeWidth={2}
                      name="平均分数"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="modelsCount" 
                      stroke="#52c41a" 
                      strokeWidth={2}
                      name="评估模型数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="暂无历史数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          
          {/* 分类分布饼图 */}
          <Col span={8}>
            <Card 
              title="📂 评估类型分布" 
              size="small"
              style={{ height: '320px' }}
            >
              {categoryDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string, percent: number }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="暂无分类数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default EvaluationCharts; 