import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Progress,
  Alert,
  Typography,
  Tag,
  List,
  Space,
  Spin,
  Tooltip,
  Badge,
  Empty,
  message,
  Collapse,
  Statistic,
  Switch,
  InputNumber,
  Divider,
  Tabs
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  FireOutlined,
  RocketOutlined,
  BarChartOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  BookOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { getModels } from '../../api/modelApi';
import { streamEvaluateModels, getEvaluationExamples } from '../../api/evaluationApi';
import { evaluationDB, type EvaluationRecord } from '../../api/evaluationHistoryApi';
import EvaluationCharts from '../../components/EvaluationCharts';
import EvaluationHistory from '../../components/EvaluationHistory';
import type {
  EvaluationInput,
  EvaluationResult,
  SSEEventData,
  StreamController,
  EvaluationExample
} from '../../api/evaluationApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

interface ModelEvaluationState {
  [model: string]: {
    status: 'pending' | 'processing' | 'completed' | 'error';
    step: string;
    result?: EvaluationResult;
    error?: string;
    startTime?: number;
    endTime?: number;
  };
}

const ModelEvaluationPage: React.FC = () => {
  const { theme } = useThemeStore();
  const { apiKey } = useAuthStore();
  const [form] = Form.useForm();

  // 状态管理
  const [models, setModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [evaluationStates, setEvaluationStates] = useState<ModelEvaluationState>({});
  const [streamController, setStreamController] = useState<StreamController | null>(null);
  const [totalModels, setTotalModels] = useState(0);
  const [completedModels, setCompletedModels] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // 示例数据相关状态
  const [examples, setExamples] = useState<EvaluationExample[]>([]);
  const [selectedExampleId, setSelectedExampleId] = useState<string>('');
  const [isLoadingExamples, setIsLoadingExamples] = useState(true);

  // 历史记录和图表相关状态
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationRecord[]>([]);
  const [currentEvaluationRecord, setCurrentEvaluationRecord] = useState<EvaluationRecord | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('evaluation');

  // 多次执行结果查看状态
  const [selectedExecutionIndex, setSelectedExecutionIndex] = useState<{ [model: string]: number }>({});

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        const response = await getModels();
        const chatModels = response.chatModels || [];
        const modelList = chatModels.map((model: any) => model.id);
        setModels(modelList);

        // 默认选择前3个模型
        if (modelList.length > 0) {
          setSelectedModels(modelList.slice(0, Math.min(3, modelList.length)));
        }
      } catch (error) {
        console.error('加载模型列表失败:', error);
        message.error('加载模型列表失败，请检查网络连接');
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
  }, []);

  // 加载示例数据
  useEffect(() => {
    const loadExamples = async () => {
      try {
        setIsLoadingExamples(true);
        const examplesData = await getEvaluationExamples();
        setExamples(examplesData);

        // 默认选择第一个示例
        if (examplesData.length > 0) {
          const firstExample = examplesData[0];
          setSelectedExampleId(firstExample.id);
          form.setFieldsValue({
            prompt: firstExample.prompt,
            request: firstExample.request,
            executionCount: 1,
            enableOptimization: true
          });
        }
      } catch (error) {
        console.error('加载示例数据失败:', error);
        message.error('加载示例数据失败，请检查网络连接');
        // 如果加载失败，设置一个默认示例
        const defaultExample = {
          id: 'default',
          title: '默认示例',
          category: '通用',
          description: '通用示例',
          prompt: '你是一个有用的AI助手，请根据用户的请求提供帮助。',
          request: '请介绍一下你的功能和特点。'
        };
        setExamples([defaultExample]);
        setSelectedExampleId(defaultExample.id);
        form.setFieldsValue({
          prompt: defaultExample.prompt,
          request: defaultExample.request,
          executionCount: 1,
          enableOptimization: true
        });
      } finally {
        setIsLoadingExamples(false);
      }
    };
    loadExamples();
  }, [form]);

  // 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        await evaluationDB.init();
        const history = await evaluationDB.getAllEvaluations();
        setEvaluationHistory(history);
      } catch (error) {
        console.error('加载历史记录失败:', error);
        message.error('加载历史记录失败');
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  // 重新加载评估历史列表的函数
  const reloadEvaluationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await evaluationDB.getAllEvaluations();
      setEvaluationHistory(history);
    } catch (error) {
      console.error('重新加载历史记录失败:', error);
      message.error('重新加载历史记录失败');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 处理SSE事件
  const handleSSEEvent = useCallback((eventData: SSEEventData) => {
    const { eventType, data } = eventData;

    switch (eventType) {
      case 'start':
        setTotalModels(data.totalModels);
        setCompletedModels(0);
        setStartTime(Date.now());
        // 初始化所有模型状态
        const initialStates: ModelEvaluationState = {};
        selectedModels.forEach(model => {
          initialStates[model] = {
            status: 'pending',
            step: '等待开始',
            startTime: Date.now()
          };
        });
        setEvaluationStates(initialStates);
        break;

      case 'model-start':
        setEvaluationStates(prev => ({
          ...prev,
          [data.model]: {
            ...prev[data.model],
            status: 'processing',
            step: '开始处理',
            startTime: Date.now()
          }
        }));
        break;

      case 'optimize-start':
        setEvaluationStates(prev => ({
          ...prev,
          [data.model]: { ...prev[data.model], step: '🔧 优化提示词' }
        }));
        break;

      case 'optimize-complete':
        setEvaluationStates(prev => ({
          ...prev,
          [data.model]: { ...prev[data.model], step: '✅ 提示词优化完成' }
        }));
        break;

      case 'execute-original':
        setEvaluationStates(prev => ({
          ...prev,
          [data.model]: { ...prev[data.model], step: data.execution ? `🚀 执行原始提示词 (第${data.execution}次)` : '🚀 执行原始提示词' }
        }));
        break;

      case 'execute-optimized':
        setEvaluationStates(prev => ({
          ...prev,
          [data.model]: { ...prev[data.model], step: data.execution ? `⚡ 执行优化提示词 (第${data.execution}次)` : '⚡ 执行优化提示词' }
        }));
        break;

      case 'scoring':
        setEvaluationStates(prev => ({
          ...prev,
          [data.model]: { ...prev[data.model], step: data.execution ? `📊 智能评分中 (第${data.execution}次)` : '📊 智能评分中' }
        }));
        break;

      case 'model-complete':
        setEvaluationStates(prev => ({
          ...prev,
          [data.model]: {
            ...prev[data.model],
            status: 'completed',
            step: data.result?.executionCount > 1 ? `🎉 评估完成 (${data.result.executionCount}次执行)` : '🎉 评估完成',
            result: data.result,
            endTime: Date.now()
          }
        }));
        setCompletedModels(prev => prev + 1);
        break;

      case 'model-error':
        setEvaluationStates(prev => ({
          ...prev,
          [data.model]: {
            ...prev[data.model],
            status: 'error',
            step: '❌ 评估失败',
            error: data.error || '未知错误',
            result: data.result,
            endTime: Date.now()
          }
        }));
        setCompletedModels(prev => prev + 1);
        break;

      case 'complete':
        setIsRunning(false);
        setStreamController(null);
        message.success('🎊 所有模型评估完成！');
        // 后端已自动保存评估记录，这里只需要重新加载历史记录
        reloadEvaluationHistory().then(() => {
          message.success('评估记录已自动保存');
        }).catch((error) => {
          console.error('重新加载历史记录失败:', error);
          message.warning('评估完成，但重新加载历史记录失败');
        });
        break;
    }
  }, [selectedModels, reloadEvaluationHistory]);

  // 历史记录管理函数
  const handleViewHistoryEvaluation = (evaluation: EvaluationRecord) => {
    setCurrentEvaluationRecord(evaluation);
    setActiveTab('charts');
  };

  const handleDeleteEvaluation = async (id: string) => {
    try {
      await evaluationDB.deleteEvaluation(id);
      await reloadEvaluationHistory();
      message.success('记录已删除');
    } catch (error) {
      console.error('删除记录失败:', error);
      message.error('删除记录失败');
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await evaluationDB.clearAllEvaluations();
      setEvaluationHistory([]);
      setCurrentEvaluationRecord(null);
      message.success('所有历史记录已清空');
    } catch (error) {
      console.error('清空历史记录失败:', error);
      message.error('清空历史记录失败');
    }
  };

  // 处理示例选择
  const handleExampleChange = (exampleId: string) => {
    const selectedExample = examples.find(ex => ex.id === exampleId);
    if (selectedExample) {
      setSelectedExampleId(exampleId);
      form.setFieldsValue({
        prompt: selectedExample.prompt,
        request: selectedExample.request
      });
      message.success(`已选择示例：${selectedExample.title}`);
    }
  };

  // 开始评估
  const handleStartEvaluation = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedModels.length) {
        message.error('请至少选择一个模型进行评估');
        return;
      }

      if (selectedModels.length > 10) {
        message.warning('建议同时评估的模型数量不超过10个，以确保最佳性能');
      }

      setIsRunning(true);
      setEvaluationStates({});

      const input: EvaluationInput = {
        models: selectedModels,
        prompt: values.prompt,
        request: values.request,
        apiKey: apiKey || '',
        executionCount: values.executionCount || 1,
        enableOptimization: values.enableOptimization !== false,
        requirements: values.requirements
      };

      // 如果token为空，则提示用户输入token
      if (!apiKey) {
        message.error('请先填写API Key');
        return;
      }

      const controller = streamEvaluateModels(
        input,
        handleSSEEvent,
        (error) => {
          console.error('评估错误:', error);
          message.error(`评估失败: ${error.message}`);
          setIsRunning(false);
          setStreamController(null);
        },
        () => {
          console.log('评估完成');
        }
      );

      setStreamController(controller);
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请检查输入内容是否完整');
    }
  };

  // 停止评估
  const handleStopEvaluation = () => {
    if (streamController) {
      streamController.abort();
      setStreamController(null);
    }
    setIsRunning(false);
    message.info('评估已停止');
  };

  // 重置表单
  const handleReset = () => {
    setEvaluationStates({});
    setCompletedModels(0);
    setTotalModels(0);
    setStartTime(0);
    message.success('已重置评估状态');
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <LoadingOutlined spin style={{ color: '#1677ff' }} />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  // 获取评分颜色和等级
  const getScoreInfo = (score: number) => {
    if (score >= 90) return { color: '#52c41a', level: '优秀', icon: '🏆' };
    if (score >= 80) return { color: '#1677ff', level: '良好', icon: '🎯' };
    if (score >= 70) return { color: '#faad14', level: '中等', icon: '📈' };
    if (score >= 60) return { color: '#fa8c16', level: '及格', icon: '📊' };
    return { color: '#ff4d4f', level: '待提升', icon: '📉' };
  };

  // 计算统计信息
  const getStatistics = () => {
    const completed = Object.values(evaluationStates).filter(s => s.status === 'completed');
    const avgScore = completed.length > 0
      ? completed.reduce((sum, s) => sum + (s.result?.score || 0), 0) / completed.length
      : 0;
    const totalTime = startTime > 0 && completedModels === totalModels
      ? Date.now() - startTime
      : 0;

    return { avgScore, totalTime, completed: completed.length };
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

  const overallProgress = totalModels > 0 ? (completedModels / totalModels) * 100 : 0;
  const statistics = getStatistics();

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      background: theme === 'dark' ? '#141414' : '#f5f5f5'
    }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ height: '100%' }}
        items={[
          {
            key: 'evaluation',
            label: (
              <span>
                <RocketOutlined />
                模型评估
              </span>
            ),
            children: (
              <Row style={{ height: 'calc(100vh - 46px)' }} gutter={0}>
                {/* 左侧配置区域 */}
                <Col span={10} style={{
                  height: '100%',
                  borderRight: `1px solid ${theme === 'dark' ? '#434343' : '#f0f0f0'}`,
                  background: theme === 'dark' ? '#1f1f1f' : '#ffffff'
                }}>
                  <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                      <BarChartOutlined style={{ fontSize: '24px', color: '#1677ff', marginRight: '12px' }} />
                      <Title level={3} style={{ margin: 0 }}>
                        模型评估工作台
                      </Title>
                    </div>

                    <Form
                      form={form}
                      layout="vertical"
                      size="large"
                    >
                      {/* 示例选择区域 */}
                      <Card size="small" style={{ marginBottom: '24px' }} title={
                        <Space>
                          <BookOutlined style={{ color: '#1677ff' }} />
                          <Text strong>选择示例模板</Text>
                        </Space>
                      }>
                        <Form.Item
                          label="示例类型"
                          extra={`共有 ${examples.length} 个示例可选`}
                        >
                          <Select
                            placeholder={isLoadingExamples ? "正在加载示例..." : "请选择示例类型"}
                            value={selectedExampleId}
                            onChange={handleExampleChange}
                            style={{ width: '100%' }}
                            loading={isLoadingExamples}
                            disabled={isRunning}
                            showSearch
                            optionLabelProp="label"
                            filterOption={(input, option) => {
                              if (!option) return false;
                              const label = option.label?.toString().toLowerCase() || '';
                              const children = option.children as any;
                              if (!children || !children.props) return false;

                              const title = children.props.children?.find((child: any) =>
                                child?.props?.style?.fontWeight === 'bold'
                              )?.props?.children || '';

                              const description = children.props.children?.find((child: any) =>
                                child?.props?.style?.fontSize === '12px'
                              )?.props?.children || '';

                              return label.toLowerCase().includes(input.toLowerCase()) ||
                                title.toLowerCase().includes(input.toLowerCase()) ||
                                description.toLowerCase().includes(input.toLowerCase());
                            }}
                          >
                            {examples.map(example => (
                              <Option
                                key={example.id}
                                value={example.id}
                                label={`${example.title} - ${example.category}`}
                              >
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  padding: '4px 0',
                                  minHeight: '44px'
                                }}>
                                  <div style={{ flex: 1, marginRight: '12px' }}>
                                    <div style={{
                                      fontWeight: 'bold',
                                      marginBottom: '2px',
                                      color: theme === 'dark' ? '#ffffff' : '#000000'
                                    }}>
                                      {example.title}
                                    </div>
                                    <div style={{
                                      fontSize: '12px',
                                      color: theme === 'dark' ? '#999999' : '#666666',
                                      lineHeight: '1.4',
                                      wordBreak: 'break-all'
                                    }}>
                                      {example.description}
                                    </div>
                                  </div>
                                  <Tag
                                    color={getCategoryColor(example.category)}
                                    style={{
                                      marginTop: '2px',
                                      fontSize: '11px',
                                      flexShrink: 0
                                    }}
                                  >
                                    {example.category}
                                  </Tag>
                                </div>
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        {/* 显示当前选择的示例信息 */}
                        {selectedExampleId && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: theme === 'dark' ? '#262626' : '#f6f6f6',
                            borderRadius: '6px',
                            border: `1px solid ${theme === 'dark' ? '#404040' : '#e6e6e6'}`
                          }}>
                            {(() => {
                              const selectedExample = examples.find(ex => ex.id === selectedExampleId);
                              return selectedExample ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <AppstoreOutlined style={{ color: '#1677ff', fontSize: '16px' }} />
                                    <Text strong style={{ fontSize: '15px' }}>{selectedExample.title}</Text>
                                    <Tag color={getCategoryColor(selectedExample.category)}>
                                      {selectedExample.category}
                                    </Tag>
                                  </div>
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: '13px',
                                      display: 'block',
                                      lineHeight: '1.5'
                                    }}
                                  >
                                    {selectedExample.description}
                                  </Text>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </Card>

                      <Divider style={{ margin: '16px 0' }} />

                      <Form.Item
                        label={
                          <Space>
                            <Text strong>选择评估模型</Text>
                            <Tooltip title="支持同时评估多个模型，建议不超过10个">
                              <QuestionCircleOutlined style={{ color: '#999' }} />
                            </Tooltip>
                          </Space>
                        }
                        required
                        extra={`已选择 ${selectedModels.length} 个模型 | 共 ${models.length} 个可用模型`}
                      >
                        <Select
                          mode="multiple"
                          placeholder={isLoadingModels ? "正在加载模型列表..." : "请选择要评估的模型"}
                          value={selectedModels}
                          onChange={setSelectedModels}
                          style={{ width: '100%' }}
                          maxTagCount="responsive"
                          loading={isLoadingModels}
                          disabled={isRunning}
                          showSearch
                          filterOption={(input, option) => {
                            if (!option) return false;
                            const label = option.label?.toString().toLowerCase() || '';
                            const value = option.value?.toString().toLowerCase() || '';
                            return label.includes(input.toLowerCase()) || value.includes(input.toLowerCase());
                          }}
                        >
                          {models.map(model => (
                            <Option key={model} value={model} label={model}>
                              <Space>
                                <RocketOutlined style={{ color: '#1677ff' }} />
                                {model}
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name="prompt"
                        label={
                          <Space>
                            <Text strong>基础提示词</Text>
                            <Tooltip title="这是将要被优化的原始提示词">
                              <InfoCircleOutlined style={{ color: '#999' }} />
                            </Tooltip>
                          </Space>
                        }
                        rules={[{ required: true, message: '请输入基础提示词' }]}
                        extra="用于模型评估的基础提示词模板"
                      >
                        <TextArea
                          rows={8}
                          placeholder="请输入您的提示词模板..."
                          disabled={isRunning}
                          showCount
                          maxLength={10000}
                        />
                      </Form.Item>

                      <Form.Item
                        name="request"
                        label={
                          <Space>
                            <Text strong>测试任务</Text>
                            <Tooltip title="具体的测试请求，用于验证提示词效果">
                              <BulbOutlined style={{ color: '#999' }} />
                            </Tooltip>
                          </Space>
                        }
                        rules={[{ required: true, message: '请输入测试任务' }]}
                        extra="这个任务将用于测试原始提示词和优化后提示词的效果差异"
                      >
                        <TextArea
                          rows={4}
                          placeholder="请输入具体的测试任务..."
                          disabled={isRunning}
                          showCount
                          maxLength={500}
                        />
                      </Form.Item>

                      <Card size="small" title={
                        <Space>
                          <SettingOutlined style={{ color: '#1677ff' }} />
                          <Text strong>评估配置</Text>
                        </Space>
                      } style={{ marginBottom: '24px' }}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              name="executionCount"
                              label={
                                <Space>
                                  <Text strong>执行次数</Text>
                                  <Tooltip title="每个模型执行测试的次数，多次执行将计算平均分">
                                    <QuestionCircleOutlined style={{ color: '#999' }} />
                                  </Tooltip>
                                </Space>
                              }
                              extra="设置每个模型执行评估的次数"
                            >
                              <InputNumber
                                min={1}
                                max={10}
                                style={{ width: '100%' }}
                                placeholder="1"
                                disabled={isRunning}
                                addonAfter="次"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="enableOptimization"
                              label={
                                <Space>
                                  <Text strong>提示词优化</Text>
                                  <Tooltip title="是否启用提示词自动优化功能">
                                    <ThunderboltOutlined style={{ color: '#999' }} />
                                  </Tooltip>
                                </Space>
                              }
                              valuePropName="checked"
                              extra="启用后将对比优化前后的效果"
                            >
                              <Switch
                                checkedChildren="启用"
                                unCheckedChildren="禁用"
                                disabled={isRunning}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* 优化需求参数输入框 - 只在启用优化时显示 */}
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.enableOptimization !== currentValues.enableOptimization}>
                          {({ getFieldValue }) => {
                            return getFieldValue('enableOptimization') !== false ? (
                              <Form.Item
                                name="requirements"
                                label={
                                  <Space>
                                    <Text strong>优化需求</Text>
                                    <Tooltip title="可选参数，用于指导提示词优化的具体需求和方向">
                                      <InfoCircleOutlined style={{ color: '#999' }} />
                                    </Tooltip>
                                  </Space>
                                }
                                extra="可选：描述您希望提示词优化的方向和具体需求"
                                style={{ marginTop: '16px' }}
                              >
                                <TextArea
                                  rows={3}
                                  placeholder="例如：提高回答的专业性，增加创意元素，使语言更加生动有趣..."
                                  disabled={isRunning}
                                  showCount
                                  maxLength={1000}
                                />
                              </Form.Item>
                            ) : null;
                          }}
                        </Form.Item>
                      </Card>

                      <Form.Item>
                        <Space size="middle">
                          <Button
                            type="primary"
                            size="large"
                            icon={<PlayCircleOutlined />}
                            onClick={handleStartEvaluation}
                            loading={isRunning}
                            disabled={!selectedModels.length || isLoadingModels}
                          >
                            开始评估
                          </Button>

                          {isRunning && (
                            <Button
                              danger
                              size="large"
                              icon={<StopOutlined />}
                              onClick={handleStopEvaluation}
                            >
                              停止评估
                            </Button>
                          )}

                          <Button
                            size="large"
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            disabled={isRunning}
                          >
                            重置
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>

                    {/* 整体进度和统计 */}
                    {totalModels > 0 && (
                      <Card size="small" style={{ marginTop: '16px' }}>
                        <div style={{ marginBottom: '16px' }}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Statistic
                                title="完成进度"
                                value={completedModels}
                                suffix={`/ ${totalModels}`}
                                prefix={<FireOutlined />}
                              />
                            </Col>
                            <Col span={12}>
                              <Statistic
                                title="平均得分"
                                value={statistics.avgScore}
                                precision={1}
                                suffix="分"
                                prefix={getScoreInfo(statistics.avgScore).icon}
                              />
                            </Col>
                          </Row>

                          {/* 显示当前配置 */}
                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Tag color="processing">
                              执行次数: {form.getFieldValue('executionCount') || 1}次
                            </Tag>
                            <Tag color={form.getFieldValue('enableOptimization') !== false ? 'success' : 'default'}>
                              {form.getFieldValue('enableOptimization') !== false ? '已启用优化' : '未启用优化'}
                            </Tag>
                          </div>
                        </div>
                        <Progress
                          percent={Math.round(overallProgress)}
                          status={isRunning ? 'active' : 'normal'}
                          strokeColor={getScoreInfo(statistics.avgScore).color}
                          trailColor={theme === 'dark' ? '#434343' : '#f5f5f5'}
                        />
                        {statistics.totalTime > 0 && (
                          <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                            总耗时: {Math.round(statistics.totalTime / 1000)}秒
                          </Text>
                        )}
                      </Card>
                    )}
                  </div>
                </Col>

                {/* 右侧结果区域 */}
                <Col span={14} style={{
                  height: '100%',
                  background: theme === 'dark' ? '#141414' : '#fafafa'
                }}>
                  <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Title level={3} style={{ margin: 0 }}>
                          评估结果
                        </Title>
                        {Object.keys(evaluationStates).length > 0 && (
                          <Badge
                            count={completedModels}
                            style={{ marginLeft: '12px' }}
                            showZero
                          />
                        )}
                      </div>
                      {completedModels > 0 && totalModels > 0 && (
                        <Tag color={overallProgress === 100 ? 'success' : 'processing'}>
                          {overallProgress === 100 ? '全部完成' : '进行中'}
                        </Tag>
                      )}
                    </div>

                    {Object.keys(evaluationStates).length === 0 ? (
                      <Empty
                        description={
                          <div>
                            <Text>请配置评估参数并开始模型评估</Text>
                            <br />
                            <Text type="secondary">左侧配置完成后点击"开始评估"按钮</Text>
                          </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      <List
                        dataSource={Object.entries(evaluationStates)}
                        renderItem={([model, state]) => (
                          <List.Item key={model} style={{ padding: 0, marginBottom: '16px' }}>
                            <Card
                              style={{ width: '100%' }}
                              title={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Space>
                                    {getStatusIcon(state.status)}
                                    <Text strong style={{ fontSize: '16px' }}>{model}</Text>
                                  </Space>
                                  <Space>
                                    <Tag color={
                                      state.status === 'completed' ? 'success' :
                                        state.status === 'error' ? 'error' :
                                          state.status === 'processing' ? 'processing' : 'default'
                                    }>
                                      {state.step}
                                    </Tag>
                                    {state.startTime && state.endTime && (
                                      <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {Math.round((state.endTime - state.startTime) / 1000)}s
                                      </Text>
                                    )}
                                  </Space>
                                </div>
                              }
                              size="small"
                            >
                              {state.status === 'processing' && (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                  <Spin size="large" />
                                  <div style={{ marginTop: '12px' }}>
                                    <Text type="secondary">{state.step}</Text>
                                  </div>
                                </div>
                              )}

                              {state.result && (
                                <div>
                                  <Row gutter={16} style={{ marginBottom: '16px' }}>
                                    <Col span={8}>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '4px' }}>
                                          {getScoreInfo(state.result.score).icon}
                                        </div>
                                        <Statistic
                                          value={state.result.score}
                                          suffix="分"
                                          valueStyle={{
                                            color: getScoreInfo(state.result.score).color,
                                            fontSize: '24px'
                                          }}
                                        />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                          {getScoreInfo(state.result.score).level}
                                        </Text>
                                      </div>
                                    </Col>
                                    <Col span={16}>
                                      <div>
                                        <Text strong>评估描述</Text>
                                        <div style={{ marginTop: '4px', marginBottom: '12px' }}>
                                          <Text>{state.result.description}</Text>
                                        </div>

                                        {/* 显示标签 */}
                                        {state.result.tags && state.result.tags.length > 0 && (
                                          <div style={{ marginBottom: '12px' }}>
                                            <Text strong style={{ fontSize: '12px', color: '#666' }}>提示词分类:</Text>
                                            <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                              {state.result.tags.map((tag, index) => (
                                                <Tag
                                                  key={index}
                                                  color="blue"
                                                  style={{ fontSize: '11px', padding: '2px 6px', lineHeight: '16px' }}
                                                >
                                                  {tag}
                                                </Tag>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {state.result.comment && (
                                          <Collapse ghost size="small">
                                            <Panel header="详细评价" key="1">
                                              <Paragraph
                                                style={{ margin: 0, fontSize: '14px' }}
                                                ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                                              >
                                                {state.result.comment}
                                              </Paragraph>
                                            </Panel>
                                          </Collapse>
                                        )}
                                      </div>
                                    </Col>
                                  </Row>

                                  {/* 显示提示词和输出结果 */}
                                  <Collapse ghost size="small" style={{ marginTop: '16px' }}>
                                    <Panel header={
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BulbOutlined style={{ color: '#1677ff' }} />
                                        <Text strong>查看提示词对比和输出结果</Text>
                                        {(state.result?.executionCount ?? 1) > 1 && (
                                          <Tag color="blue">
                                            {state.result?.executionCount}次执行
                                          </Tag>
                                        )}
                                      </div>
                                    } key="prompts">
                                      {/* 多次执行结果选择器 */}
                                      {state.result?.executionResults && state.result.executionResults.length > 1 && (
                                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <Text strong style={{ fontSize: '13px' }}>查看执行结果:</Text>
                                          <Select
                                            size="small"
                                            value={selectedExecutionIndex[model] ?? -1}
                                            onChange={(index) => {
                                              setSelectedExecutionIndex(prev => ({
                                                ...prev,
                                                [model]: index
                                              }));
                                            }}
                                            style={{ minWidth: '120px' }}
                                          >
                                            <Option value={-1}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <BarChartOutlined style={{ color: '#1677ff' }} />
                                                <span>平均结果</span>
                                              </div>
                                            </Option>
                                            {state.result.executionResults.map((_, index) => (
                                              <Option key={index} value={index}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                  <span>第{index + 1}次执行</span>
                                                  <Tag
                                                    color={getScoreInfo(state.result?.executionResults?.[index]?.score || 0).color}
                                                    style={{ fontSize: '10px', lineHeight: '14px', margin: 0 }}
                                                  >
                                                    {state.result?.executionResults?.[index]?.score || 0}分
                                                  </Tag>
                                                </div>
                                              </Option>
                                            ))}
                                          </Select>
                                        </div>
                                      )}

                                      {(() => {
                                        // 获取当前显示的执行结果
                                        const currentExecutionIndex = selectedExecutionIndex[model] ?? -1;
                                        const isShowingAverage = currentExecutionIndex === -1;
                                        const currentExecution = state.result?.executionResults?.[currentExecutionIndex];

                                        // 显示相应的结果信息
                                        if (!isShowingAverage && currentExecution) {
                                          return (
                                            <div style={{ marginBottom: '12px' }}>
                                              <Alert
                                                message={
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>第{currentExecutionIndex + 1}次执行结果</span>
                                                    <Tag color={getScoreInfo(currentExecution.score).color}>
                                                      {currentExecution.score}分 - {getScoreInfo(currentExecution.score).level}
                                                    </Tag>
                                                  </div>
                                                }
                                                description={currentExecution.description}
                                                type="info"
                                                showIcon={false}
                                                style={{ marginBottom: '12px' }}
                                              />
                                              {currentExecution.tags && currentExecution.tags.length > 0 && (
                                                <div style={{ marginBottom: '12px' }}>
                                                  <Text strong style={{ fontSize: '12px', color: '#666' }}>本次执行标签:</Text>
                                                  <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {currentExecution.tags.map((tag, tagIndex) => (
                                                      <Tag
                                                        key={tagIndex}
                                                        color="cyan"
                                                        style={{ fontSize: '10px', margin: '2px' }}
                                                      >
                                                        {tag}
                                                      </Tag>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}

                                      <Row gutter={16}>
                                        <Col span={12}>
                                          <Card size="small" title={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <Text style={{ fontSize: '13px', color: '#666' }}>原始提示词</Text>
                                            </div>
                                          }>
                                            <Paragraph
                                              style={{ margin: 0, fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}
                                              ellipsis={{ rows: 6, expandable: true, symbol: '展开' }}
                                            >
                                              {(() => {
                                                const currentExecutionIndex = selectedExecutionIndex[model] ?? -1;
                                                const currentExecution = state.result?.executionResults?.[currentExecutionIndex];
                                                return currentExecution?.prompt || state.result.prompt || '无';
                                              })()}
                                            </Paragraph>
                                            <div style={{ marginTop: '12px', padding: '8px', background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5', borderRadius: '4px' }}>
                                              <Text style={{ fontSize: '11px', color: '#999' }}>输出结果:</Text>
                                              <Paragraph
                                                style={{ margin: '4px 0 0 0', fontSize: '12px' }}
                                                ellipsis={{ rows: 4, expandable: true, symbol: '展开' }}
                                              >
                                                {(() => {
                                                  const currentExecutionIndex = selectedExecutionIndex[model] ?? -1;
                                                  const currentExecution = state.result?.executionResults?.[currentExecutionIndex];
                                                  return currentExecution?.promptOutput || state.result.promptOutput || '无输出';
                                                })()}
                                              </Paragraph>
                                            </div>
                                          </Card>
                                        </Col>
                                        <Col span={12}>
                                          <Card size="small" title={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <RocketOutlined style={{ color: '#52c41a' }} />
                                              <Text style={{ fontSize: '13px', color: '#52c41a' }}>
                                                {(() => {
                                                  const currentExecutionIndex = selectedExecutionIndex[model] ?? -1;
                                                  const currentExecution = state.result?.executionResults?.[currentExecutionIndex];
                                                  const optimizedPrompt = currentExecution?.originalPrompt || state.result?.originalPrompt;
                                                  const originalPrompt = currentExecution?.prompt || state.result?.prompt;
                                                  return optimizedPrompt === originalPrompt ? '原始提示词 (未优化)' : '优化提示词';
                                                })()}
                                              </Text>
                                            </div>
                                          }>
                                            <Paragraph
                                              style={{ margin: 0, fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}
                                              ellipsis={{ rows: 6, expandable: true, symbol: '展开' }}
                                            >
                                              {(() => {
                                                const currentExecutionIndex = selectedExecutionIndex[model] ?? -1;
                                                const currentExecution = state.result?.executionResults?.[currentExecutionIndex];
                                                return currentExecution?.originalPrompt || state.result.originalPrompt || '无';
                                              })()}
                                            </Paragraph>
                                            <div style={{ marginTop: '12px', padding: '8px', background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5', borderRadius: '4px' }}>
                                              <Text style={{ fontSize: '11px', color: '#999' }}>输出结果:</Text>
                                              <Paragraph
                                                style={{ margin: '4px 0 0 0', fontSize: '12px' }}
                                                ellipsis={{ rows: 4, expandable: true, symbol: '展开' }}
                                              >
                                                {(() => {
                                                  const currentExecutionIndex = selectedExecutionIndex[model] ?? -1;
                                                  const currentExecution = state.result?.executionResults?.[currentExecutionIndex];
                                                  return currentExecution?.originalPromptOutput || state.result.originalPromptOutput || '无输出';
                                                })()}
                                              </Paragraph>
                                            </div>
                                          </Card>
                                        </Col>
                                      </Row>
                                    </Panel>
                                  </Collapse>
                                </div>
                              )}

                              {state.error && (
                                <Alert
                                  message="评估失败"
                                  description={state.error}
                                  type="error"
                                  showIcon
                                  style={{ marginTop: '12px' }}
                                />
                              )}
                            </Card>
                          </List.Item>
                        )}
                      />
                    )}

                    {/* 评估完成后的总结 */}
                    {overallProgress === 100 && completedModels > 0 && (
                      <Card
                        style={{ marginTop: '24px', background: theme === 'dark' ? '#262626' : '#f9f9f9' }}
                        title="📊 评估总结"
                      >
                        <Row gutter={24}>
                          <Col span={6}>
                            <Statistic
                              title="参与模型"
                              value={totalModels}
                              suffix="个"
                              prefix="🤖"
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="成功完成"
                              value={statistics.completed}
                              suffix="个"
                              prefix="✅"
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="平均得分"
                              value={statistics.avgScore}
                              precision={1}
                              suffix="分"
                              prefix={getScoreInfo(statistics.avgScore).icon}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="总耗时"
                              value={Math.round(statistics.totalTime / 1000)}
                              suffix="秒"
                              prefix="⏱️"
                            />
                          </Col>
                        </Row>

                        {/* 标签统计 */}
                        {(() => {
                          const allTags = Object.values(evaluationStates)
                            .filter(state => state.result?.tags && state.result.tags.length > 0)
                            .flatMap(state => state.result?.tags || []);

                          if (allTags.length === 0) return null;

                          const tagCounts = allTags.reduce((acc, tag) => {
                            acc[tag] = (acc[tag] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);

                          const sortedTags = Object.entries(tagCounts)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10); // 只显示前10个最常见的标签

                          return (
                            <div style={{ marginTop: '16px' }}>
                              <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                                🏷️ 提示词分类统计
                              </Text>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {sortedTags.map(([tag, count]) => (
                                  <Tag
                                    key={tag}
                                    color="processing"
                                    style={{ marginBottom: '4px' }}
                                  >
                                    {tag} ({count})
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </Card>
                    )}
                  </div>
                </Col>
              </Row>
            )
          },
          {
            key: 'charts',
            label: (
              <span>
                <PieChartOutlined />
                数据图表
                {currentEvaluationRecord ? <Badge dot style={{ marginLeft: '4px' }} /> : null}
              </span>
            ),
            children: (
              <div style={{ padding: '24px', height: 'calc(100vh - 46px)', overflow: 'auto' }}>
                <EvaluationCharts
                  evaluations={evaluationHistory}
                  currentEvaluation={currentEvaluationRecord || undefined}
                />
              </div>
            )
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined />
                评估历史
                <Badge count={evaluationHistory.length} showZero style={{ marginLeft: '4px' }} />
              </span>
            ),
            children: (
              <div style={{ padding: '24px', height: 'calc(100vh - 46px)', overflow: 'auto' }}>
                <EvaluationHistory
                  evaluations={evaluationHistory}
                  onViewEvaluation={handleViewHistoryEvaluation}
                  onDeleteEvaluation={handleDeleteEvaluation}
                  onClearAll={handleClearAllHistory}
                  isLoading={isLoadingHistory}
                />
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

export default ModelEvaluationPage; 