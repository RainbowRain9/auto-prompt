import React, { useEffect, useState } from 'react';
import { Button, Typography, Row, Col, Card, Space, Avatar, Rate, Divider, Progress, Tag, Badge, Statistic } from 'antd';
import {
  RocketOutlined,
  DatabaseOutlined,
  BugOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  TrophyOutlined,
  GithubOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  StarOutlined,
  FireOutlined,
  CrownOutlined,
  SafetyOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  CodeOutlined,
  BulbOutlined,
  HeartOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import LanguageSwitcher from './LanguageSwitcher';

const { Title, Paragraph, Text } = Typography;

const HomePage: React.FC = () => {
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [animationClass, setAnimationClass] = useState('');
  const [counters, setCounters] = useState({
    users: 0,
    optimizations: 0,
    templates: 0,
    satisfaction: 0
  });

  // 页面加载动画
  useEffect(() => {
    setAnimationClass('fade-in');
    
    // 数字滚动动画
    const animateCounter = (key: keyof typeof counters, target: number, duration: number = 2000) => {
      const startTime = Date.now();
      const startValue = 0;
      
      const updateCounter = () => {
        const currentTime = Date.now();
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const currentValue = Math.floor(progress * target);
        
        setCounters(prev => ({ ...prev, [key]: currentValue }));
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    };

    // 延迟启动动画
    setTimeout(() => {
      animateCounter('users', 8000);
      animateCounter('optimizations', 800000);
      animateCounter('templates', 800);
      animateCounter('satisfaction', 100);
    }, 500);
  }, []);

  // 页面样式
  const pageStyle = {
    minHeight: '100vh',
    background: theme === 'dark' ? '#141414' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#000000'
  };

  // 动画样式
  const animationStyles = `
    .fade-in {
      animation: fadeIn 0.8s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .hover-lift {
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .hover-lift:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(22, 119, 255, 0.15);
    }
    
    .pulse-icon {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .bounce-in {
      animation: bounceIn 0.6s ease-out;
    }
    
    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    .slide-in-left {
      animation: slideInLeft 0.6s ease-out;
    }
    
    @keyframes slideInLeft {
      from { transform: translateX(-50px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .slide-in-right {
      animation: slideInRight 0.6s ease-out;
    }
    
    @keyframes slideInRight {
      from { transform: translateX(50px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .gradient-text {
      background: linear-gradient(135deg, #1677ff, #722ed1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .glow-button {
      position: relative;
      overflow: hidden;
    }
    
    .glow-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }
    
    .glow-button:hover::before {
      left: 100%;
    }
  `;

  // 功能特性数据（增强版）
  const features = [
    {
      icon: <RocketOutlined className="pulse-icon" style={{ fontSize: 32, color: '#1677ff' }} />,
      title: t('home.features.optimization.title'),
      description: t('home.features.optimization.description'),
      action: () => navigate('/workbench'),
      buttonText: t('common.generate'),
      stats: { improvement: '85%', time: '30s' },
      badge: '热门'
    },
    {
      icon: <DatabaseOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: t('home.features.community.title'),
      description: t('home.features.community.description'),
      action: () => navigate('/dashboard'),
      buttonText: t('nav.dashboard'),
      stats: { templates: '500+', users: '1K+' },
      badge: '推荐'
    },
    {
      icon: <BugOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      title: t('home.features.debugging.title'),
      description: t('home.features.debugging.description'),
      action: () => navigate('/prompts'),
      buttonText: t('nav.prompts'),
      stats: { accuracy: '95%', speed: '10x' },
      badge: '专业'
    }
  ];

  // 技术特性
  const techFeatures = [
    {
      icon: <ApiOutlined style={{ color: '#1677ff' }} />,
      title: '多模型支持',
      description: '支持GPT-4、Claude、Gemini等主流AI模型',
      progress: 90
    },
    {
      icon: <SafetyOutlined style={{ color: '#52c41a' }} />,
      title: '安全可靠',
      description: '企业级安全标准，数据加密传输和存储',
      progress: 95
    },
    {
      icon: <GlobalOutlined style={{ color: '#722ed1' }} />,
      title: '多语言支持',
      description: '支持中文、英文、日文等多种语言优化',
      progress: 80
    },
    {
      icon: <ThunderboltOutlined style={{ color: '#fa541c' }} />,
      title: '极速优化',
      description: '平均响应时间小于30秒，效率提升10倍',
      progress: 88
    }
  ];

  // 成功案例
  const successCases = [
    {
      company: '科技独角兽A',
      logo: '🚀',
      improvement: '提升效率 300%',
      description: '通过Prompt优化，AI客服响应质量显著提升',
      metrics: [
        { label: '响应时间', value: '-60%' },
        { label: '用户满意度', value: '+45%' }
      ]
    },
    {
      company: '教育平台B',
      logo: '📚',
      improvement: '优化成本 250%',
      description: '智能批改系统准确率大幅提升',
      metrics: [
        { label: '准确率', value: '+35%' },
        { label: '处理速度', value: '+80%' }
      ]
    },
    {
      company: '金融服务C',
      logo: '💰',
      improvement: '降低成本 180%',
      description: '风控模型效果优化，误报率显著下降',
      metrics: [
        { label: '误报率', value: '-40%' },
        { label: '处理效率', value: '+65%' }
      ]
    }
  ];

  // 优势数据（增强版）
  const advantages = [
    {
      icon: <CheckCircleOutlined style={{ color: '#1677ff' }} />,
      title: t('home.advantages.items.easyToUse.title'),
      description: t('home.advantages.items.easyToUse.description'),
      highlight: '零代码操作'
    },
    {
      icon: <ThunderboltOutlined style={{ color: '#52c41a' }} />,
      title: t('home.advantages.items.fastOptimization.title'),
      description: t('home.advantages.items.fastOptimization.description'),
      highlight: '30秒响应'
    },
    {
      icon: <TeamOutlined style={{ color: '#722ed1' }} />,
      title: t('home.advantages.items.communitySharing.title'),
      description: t('home.advantages.items.communitySharing.description'),
      highlight: '社区驱动'
    },
    {
      icon: <TrophyOutlined style={{ color: '#fa541c' }} />,
      title: t('home.advantages.items.continuousImprovement.title'),
      description: t('home.advantages.items.continuousImprovement.description'),
      highlight: 'AI学习'
    }
  ];

  // 用户评价数据（增强版）
  const testimonials = [
    {
      name: t('home.testimonials.items.zhang.name'),
      role: t('home.testimonials.items.zhang.role'),
      company: t('home.testimonials.items.zhang.company'),
      content: t('home.testimonials.items.zhang.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
      metrics: { likes: 156, helpful: 89 }
    },
    {
      name: t('home.testimonials.items.li.name'),
      role: t('home.testimonials.items.li.role'),
      company: t('home.testimonials.items.li.company'),
      content: t('home.testimonials.items.li.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
      metrics: { likes: 203, helpful: 112 }
    },
    {
      name: t('home.testimonials.items.wang.name'),
      role: t('home.testimonials.items.wang.role'),
      company: t('home.testimonials.items.wang.company'),
      content: t('home.testimonials.items.wang.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
      metrics: { likes: 178, helpful: 95 }
    }
  ];

  // 统计数据（动态）
  const stats = [
    { 
      number: counters.users + '+', 
      label: t('home.stats.activeUsers'), 
      icon: <TeamOutlined />,
      color: '#1677ff'
    },
    { 
      number: counters.optimizations + '+', 
      label: t('home.stats.optimizations'), 
      icon: <RocketOutlined />,
      color: '#52c41a'
    },
    { 
      number: counters.templates + '+', 
      label: t('home.stats.sharedTemplates'), 
      icon: <DatabaseOutlined />,
      color: '#722ed1'
    },
    { 
      number: counters.satisfaction + '%', 
      label: t('home.stats.satisfaction'), 
      icon: <StarOutlined />,
      color: '#fa541c'
    }
  ];

  return (
    <div style={pageStyle}>
      <style>{animationStyles}</style>
      
      {/* 顶部语言切换器 */}
      <div style={{ 
        position: 'absolute', 
        top: 24, 
        right: 24, 
        zIndex: 1000 
      }}>
        <LanguageSwitcher />
      </div>

      {/* Hero 区域 */}
      <div className={`${animationClass}`} style={{ textAlign: 'center', maxWidth: 1200, margin: '0 auto', padding: '120px 24px 80px' }}>
        <Badge.Ribbon text="AI驱动" color="blue" style={{ top: -10 }}>
          <Title level={1} className="gradient-text" style={{ 
            fontSize: 48, 
            fontWeight: 700, 
            marginBottom: 24
          }}>
            {t('home.title')}
          </Title>
        </Badge.Ribbon>
        
        <Paragraph style={{ 
          fontSize: 20, 
          marginBottom: 16, 
          color: theme === 'dark' ? '#ffffff85' : '#00000085',
          maxWidth: 600,
          margin: '0 auto 16px'
        }}>
          {t('home.subtitle')}
        </Paragraph>
        
        <Paragraph style={{ 
          fontSize: 16, 
          marginBottom: 48, 
          color: theme === 'dark' ? '#ffffff65' : '#00000065',
          maxWidth: 500,
          margin: '0 auto 48px'
        }}>
          {t('home.features.optimization.description')}
        </Paragraph>
        
        <Space size="large" wrap>
          <Button 
            type="primary" 
            size="large" 
            icon={<RocketOutlined />}
            onClick={() => navigate('/workbench')}
            className="glow-button"
            style={{ height: 44, padding: '0 24px', fontSize: 16 }}
          >
            {t('home.getStarted')}
          </Button>
          <Button 
            size="large" 
            icon={<DatabaseOutlined />}
            onClick={() => navigate('/dashboard')}
            className="hover-lift"
            style={{ height: 44, padding: '0 24px', fontSize: 16 }}
          >
            {t('nav.dashboard')}
          </Button>
        </Space>
        
        {/* 统计数据（动态动画） */}
        <Row gutter={[32, 16]} style={{ marginTop: 80 }}>
          {stats.map((stat, index) => (
            <Col xs={12} sm={6} key={index} style={{ textAlign: 'center' }}>
              <div className="bounce-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div style={{ 
                  fontSize: 24, 
                  color: stat.color, 
                  marginBottom: 8 
                }}>
                  {stat.icon}
                </div>
                <Statistic
                  value={stat.number}
                  valueStyle={{ 
                    fontSize: 24, 
                    fontWeight: 700, 
                    color: stat.color 
                  }}
                />
                <Text style={{ 
                  fontSize: 14, 
                  color: theme === 'dark' ? '#ffffff65' : '#00000065' 
                }}>
                  {stat.label}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ margin: '0 24px 80px' }} />

      {/* 功能特性（增强版） */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <Title level={2} style={{ 
          textAlign: 'center', 
          marginBottom: 16,
          fontSize: 32,
          fontWeight: 600
        }}>
          <FireOutlined style={{ marginRight: 12, color: '#fa541c' }} />
          核心功能特性
        </Title>
        
        <Paragraph style={{ 
          textAlign: 'center', 
          marginBottom: 64, 
          fontSize: 16,
          color: theme === 'dark' ? '#ffffff73' : '#00000073',
          maxWidth: 500,
          margin: '0 auto 64px'
        }}>
          专业的AI Prompt优化工具，让你的AI更聪明
        </Paragraph>
        
        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} md={8} key={index}>
              <Badge.Ribbon text={feature.badge} color="red">
                <Card 
                  hoverable
                  className="hover-lift"
                  style={{ 
                    height: '100%',
                    textAlign: 'center',
                    border: theme === 'dark' ? '1px solid #434343' : '1px solid #d9d9d9'
                  }}
                  bodyStyle={{ padding: 32 }}
                >
                  <div style={{ marginBottom: 24 }}>
                    {feature.icon}
                  </div>
                  <Title level={3} style={{ 
                    marginBottom: 16, 
                    fontSize: 18, 
                    fontWeight: 600 
                  }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ 
                    marginBottom: 24, 
                    color: theme === 'dark' ? '#ffffff73' : '#00000073',
                    fontSize: 14,
                    lineHeight: 1.6
                  }}>
                    {feature.description}
                  </Paragraph>
                  
                  {/* 功能统计 */}
                  <div style={{ marginBottom: 24 }}>
                    <Row gutter={16}>
                      {Object.entries(feature.stats).map(([key, value]) => (
                        <Col span={12} key={key}>
                          <Text strong style={{ color: '#1677ff' }}>{value}</Text>
                          <br />
                          <Text style={{ fontSize: 12, color: theme === 'dark' ? '#ffffff65' : '#00000065' }}>
                            {key === 'improvement' ? '效果提升' :
                             key === 'time' ? '平均时间' :
                             key === 'templates' ? '模板数量' :
                             key === 'users' ? '用户数量' :
                             key === 'accuracy' ? '准确率' :
                             key === 'speed' ? '速度提升' : key}
                          </Text>
                        </Col>
                      ))}
                    </Row>
                  </div>
                  
                  <Button 
                    type="primary" 
                    ghost
                    icon={<ArrowRightOutlined />}
                    onClick={feature.action}
                    className="glow-button"
                  >
                    {feature.buttonText}
                  </Button>
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ margin: '0 24px 80px' }} />

      {/* 技术特性 */}
      <div style={{ 
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 48px',
        background: theme === 'dark' ? '#1f1f1f' : '#fafafa',
        borderRadius: 12,
        marginBottom: 80
      }}>
        <Title level={2} style={{ 
          textAlign: 'center', 
          marginBottom: 16,
          fontSize: 32,
          fontWeight: 600
        }}>
          <CrownOutlined style={{ marginRight: 12, color: '#faad14' }} />
          技术优势
        </Title>
        
        <Paragraph style={{ 
          textAlign: 'center', 
          marginBottom: 64, 
          fontSize: 16,
          color: theme === 'dark' ? '#ffffff73' : '#00000073'
        }}>
          基于最新AI技术，为您提供专业的优化体验
        </Paragraph>
        
        <Row gutter={[32, 32]}>
          {techFeatures.map((tech, index) => (
            <Col xs={24} sm={12} key={index}>
              <div className="slide-in-left" style={{ animationDelay: `${index * 0.2}s` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                  <div style={{ 
                    fontSize: 24, 
                    marginTop: 4,
                    flexShrink: 0
                  }}>
                    {tech.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ 
                      marginBottom: 8, 
                      fontSize: 16, 
                      fontWeight: 600 
                    }}>
                      {tech.title}
                    </Title>
                    <Text style={{ 
                      color: theme === 'dark' ? '#ffffff73' : '#00000073',
                      fontSize: 14,
                      lineHeight: 1.5,
                      display: 'block',
                      marginBottom: 12
                    }}>
                      {tech.description}
                    </Text>
                    <Progress 
                      percent={tech.progress} 
                      size="small" 
                      strokeColor={{
                        '0%': '#1677ff',
                        '100%': '#722ed1',
                      }}
                    />
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* 成功案例 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <Title level={2} style={{ 
          textAlign: 'center', 
          marginBottom: 16,
          fontSize: 32,
          fontWeight: 600
        }}>
          <TrophyOutlined style={{ marginRight: 12, color: '#faad14' }} />
          成功案例
        </Title>
        
        <Paragraph style={{ 
          textAlign: 'center', 
          marginBottom: 64, 
          fontSize: 16,
          color: theme === 'dark' ? '#ffffff73' : '#00000073'
        }}>
          已帮助众多企业提升AI应用效率
        </Paragraph>
        
        <Row gutter={[32, 32]}>
          {successCases.map((case_, index) => (
            <Col xs={24} md={8} key={index}>
              <Card 
                className="hover-lift"
                style={{ 
                  height: '100%',
                  border: theme === 'dark' ? '1px solid #434343' : '1px solid #d9d9d9'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    {case_.logo}
                  </div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {case_.company}
                  </Title>
                  <Tag color="success" style={{ marginBottom: 12 }}>
                    {case_.improvement}
                  </Tag>
                  <Paragraph style={{ 
                    fontSize: 14, 
                    color: theme === 'dark' ? '#ffffff73' : '#00000073',
                    marginBottom: 16
                  }}>
                    {case_.description}
                  </Paragraph>
                  
                  <Row gutter={16}>
                    {case_.metrics.map((metric, idx) => (
                      <Col span={12} key={idx}>
                        <Statistic
                          title={metric.label}
                          value={metric.value}
                          valueStyle={{ 
                            fontSize: 16, 
                            color: metric.value.startsWith('+') ? '#52c41a' : '#fa541c'
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ margin: '0 24px 80px' }} />

      {/* 优势展示（增强版） */}
      <div style={{ 
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 48px',
        background: theme === 'dark' ? '#1f1f1f' : '#fafafa',
        borderRadius: 12,
        marginBottom: 80
      }}>
        <Title level={2} style={{ 
          textAlign: 'center', 
          marginBottom: 16,
          fontSize: 32,
          fontWeight: 600
        }}>
          <StarOutlined style={{ marginRight: 12, color: '#faad14' }} />
          为什么选择我们
        </Title>
        
        <Paragraph style={{ 
          textAlign: 'center', 
          marginBottom: 64, 
          fontSize: 16,
          color: theme === 'dark' ? '#ffffff73' : '#00000073'
        }}>
          专业团队打造，用户信赖之选
        </Paragraph>
        
        <Row gutter={[32, 24]}>
          {advantages.map((advantage, index) => (
            <Col xs={24} sm={12} key={index}>
              <div className="slide-in-right" style={{ animationDelay: `${index * 0.1}s` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ 
                    fontSize: 20, 
                    marginTop: 4,
                    flexShrink: 0
                  }}>
                    {advantage.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <Title level={4} style={{ 
                        marginBottom: 0, 
                        fontSize: 16, 
                        fontWeight: 600 
                      }}>
                        {advantage.title}
                      </Title>
                      <Tag color="blue">
                        {advantage.highlight}
                      </Tag>
                    </div>
                    <Text style={{ 
                      color: theme === 'dark' ? '#ffffff73' : '#00000073',
                      fontSize: 14,
                      lineHeight: 1.5
                    }}>
                      {advantage.description}
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* 用户评价（增强版） */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <Title level={2} style={{ 
          textAlign: 'center', 
          marginBottom: 16,
          fontSize: 32,
          fontWeight: 600
        }}>
          <HeartOutlined style={{ marginRight: 12, color: '#eb2f96' }} />
          用户好评
        </Title>
        
        <Paragraph style={{ 
          textAlign: 'center', 
          marginBottom: 64, 
          fontSize: 16,
          color: theme === 'dark' ? '#ffffff73' : '#00000073'
        }}>
          真实用户反馈，值得信赖的选择
        </Paragraph>
        
        <Row gutter={[32, 32]}>
          {testimonials.map((testimonial, index) => (
            <Col xs={24} md={8} key={index}>
              <Card 
                className="hover-lift"
                style={{ 
                  height: '100%',
                  border: theme === 'dark' ? '1px solid #434343' : '1px solid #d9d9d9'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Avatar size={48} src={testimonial.avatar} style={{ marginBottom: 12 }} />
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {testimonial.name}
                  </div>
                  <Text style={{ 
                    fontSize: 12, 
                    color: theme === 'dark' ? '#ffffff73' : '#00000073' 
                  }}>
                    {testimonial.role} · {testimonial.company}
                  </Text>
                </div>
                <Rate disabled defaultValue={testimonial.rating} style={{ 
                  fontSize: 12, 
                  display: 'block', 
                  textAlign: 'center', 
                  marginBottom: 16 
                }} />
                <Text style={{ 
                  color: theme === 'dark' ? '#ffffff85' : '#00000085', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                  display: 'block',
                  textAlign: 'center',
                  marginBottom: 16
                }}>
                  "{testimonial.content}"
                </Text>
                
                {/* 互动数据 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 24,
                  paddingTop: 16,
                  borderTop: `1px solid ${theme === 'dark' ? '#434343' : '#d9d9d9'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <LikeOutlined style={{ color: '#1677ff' }} />
                    <Text style={{ fontSize: 12 }}>{testimonial.metrics.likes}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MessageOutlined style={{ color: '#52c41a' }} />
                    <Text style={{ fontSize: 12 }}>{testimonial.metrics.helpful}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ margin: '0 24px 80px' }} />

      {/* CTA 区域 */}
      <div style={{ 
        padding: '80px 0', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1677ff, #722ed1)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 背景装饰 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          transform: 'translateY(-50%)',
          animation: 'pulse 3s infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '60px',
          height: '60px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
        
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <Title level={2} style={{ 
            color: 'white', 
            marginBottom: 16,
            fontSize: 28,
            fontWeight: 600
          }}>
            <RocketOutlined style={{ marginRight: 12 }} />
            准备好开始了吗？
          </Title>
          
          <Paragraph style={{ 
            color: 'rgba(255, 255, 255, 0.85)', 
            marginBottom: 32, 
            fontSize: 16,
            maxWidth: 500,
            margin: '0 auto 32px'
          }}>
            加入我们，体验AI Prompt优化的强大力量
          </Paragraph>
          
          <Space size="middle" wrap>
            <Button 
              type="primary" 
              size="large" 
              icon={<RocketOutlined />}
              onClick={() => navigate('/workbench')}
              className="glow-button"
              style={{ 
                height: 44, 
                padding: '0 24px', 
                fontSize: 16,
                background: 'white',
                color: '#1677ff',
                border: 'none'
              }}
            >
              立即开始优化
            </Button>
            <Button 
              size="large" 
              icon={<EyeOutlined />}
              onClick={() => navigate('/dashboard')}
              className="hover-lift"
              style={{ 
                height: 44, 
                padding: '0 24px', 
                fontSize: 16,
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}
            >
              查看案例
            </Button>
          </Space>
        </div>
      </div>

      {/* 页脚 */}
      <div style={{ 
        padding: '60px 0 40px',
        background: theme === 'dark' ? '#0a0a0a' : '#fafafa',
        borderTop: `1px solid ${theme === 'dark' ? '#434343' : '#d9d9d9'}`
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={3} className="gradient-text" style={{ 
              marginBottom: 8,
              fontSize: 20,
              fontWeight: 600
            }}>
              {t('home.footer.brandTitle')}
            </Title>
            <Text style={{ 
              color: theme === 'dark' ? '#ffffff73' : '#00000073',
              fontSize: 14
            }}>
              {t('home.footer.brandDescription')}
            </Text>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 32, 
            marginBottom: 24,
            flexWrap: 'wrap'
          }}>
            <a 
              href="/workbench" 
              style={{ 
                color: theme === 'dark' ? '#ffffff73' : '#00000073',
                textDecoration: 'none',
                fontSize: 14,
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#1677ff'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = theme === 'dark' ? '#ffffff73' : '#00000073'}
            >
              {t('home.footer.links.promptOptimization')}
            </a>
            <a 
              href="/prompts" 
              style={{ 
                color: theme === 'dark' ? '#ffffff73' : '#00000073',
                textDecoration: 'none',
                fontSize: 14,
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#1677ff'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = theme === 'dark' ? '#ffffff73' : '#00000073'}
            >
              {t('home.footer.links.promptDebugging')}
            </a>
            <a 
              href="/dashboard" 
              style={{ 
                color: theme === 'dark' ? '#ffffff73' : '#00000073',
                textDecoration: 'none',
                fontSize: 14,
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#1677ff'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = theme === 'dark' ? '#ffffff73' : '#00000073'}
            >
              {t('home.footer.links.sharingPlatform')}
            </a>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 16, 
            marginBottom: 24 
          }}>
            <Button 
              type="text" 
              icon={<GithubOutlined />} 
              size="large" 
              className="hover-lift"
              style={{ color: theme === 'dark' ? '#ffffff73' : '#00000073' }}
            />
            <Button 
              type="text" 
              icon={<TwitterOutlined />} 
              size="large" 
              className="hover-lift"
              style={{ color: theme === 'dark' ? '#ffffff73' : '#00000073' }}
            />
            <Button 
              type="text" 
              icon={<LinkedinOutlined />} 
              size="large" 
              className="hover-lift"
              style={{ color: theme === 'dark' ? '#ffffff73' : '#00000073' }}
            />
          </div>
          
          <Divider style={{ margin: '24px 0' }} />
          
          <div style={{ 
            textAlign: 'center',
            color: theme === 'dark' ? '#ffffff45' : '#00000045',
            fontSize: 12
          }}>
            {t('home.footer.copyright')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 