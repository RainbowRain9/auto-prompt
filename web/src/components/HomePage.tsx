import React from 'react';
import { Button, Typography, Row, Col, Card, Space, Avatar, Rate } from 'antd';
import {
  RocketOutlined,
  DatabaseOutlined,
  BugOutlined,
  ArrowRightOutlined,
  StarOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  HeartOutlined,
  GithubOutlined,
  TwitterOutlined,
  LinkedinOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import LanguageSwitcher from './LanguageSwitcher';

const { Title, Paragraph } = Typography;

// 动画定义
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const HomeContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'dark' 
    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #e0eafc 100%)'
  };
  overflow-y: auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.theme === 'dark' 
      ? 'radial-gradient(circle at 20% 80%, rgba(22, 119, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(114, 46, 209, 0.1) 0%, transparent 50%)'
      : 'radial-gradient(circle at 20% 80%, rgba(22, 119, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(114, 46, 209, 0.05) 0%, transparent 50%)'
    };
    pointer-events: none;
  }
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 120px 24px 80px;
  position: relative;
  
  .hero-title {
    font-size: 56px;
    font-weight: 800;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #1677ff, #722ed1, #eb2f96, #f759ab);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${fadeInUp} 0.8s ease-out;
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 40px;
    }
    
    @media (max-width: 480px) {
      font-size: 32px;
    }
  }
  
  .hero-subtitle {
    font-size: 22px;
    color: ${props => props.theme === 'dark' ? '#ffffff85' : '#00000085'};
    margin-bottom: 16px;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
    animation: ${fadeInUp} 0.8s ease-out 0.2s both;
    line-height: 1.6;
    
    @media (max-width: 768px) {
      font-size: 18px;
    }
  }
  
  .hero-description {
    font-size: 16px;
    color: ${props => props.theme === 'dark' ? '#ffffff65' : '#00000065'};
    margin-bottom: 48px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    animation: ${fadeInUp} 0.8s ease-out 0.4s both;
    line-height: 1.7;
  }
  
  .hero-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
    animation: ${fadeInUp} 0.8s ease-out 0.6s both;
    margin-bottom: 60px;
  }
  
  .hero-stats {
    display: flex;
    justify-content: center;
    gap: 48px;
    flex-wrap: wrap;
    animation: ${fadeInUp} 0.8s ease-out 0.8s both;
    
    @media (max-width: 768px) {
      gap: 24px;
    }
  }
  
  .hero-stat {
    text-align: center;
    
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      color: #1677ff;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 14px;
      color: ${props => props.theme === 'dark' ? '#ffffff65' : '#00000065'};
    }
  }
`;

const HeroButton = styled(Button)`
  &.ant-btn {
    height: 48px;
    padding: 0 32px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(22, 119, 255, 0.3);
    }
    
    &.primary {
      background: linear-gradient(135deg, #1677ff, #722ed1);
      border: none;
      
      &:hover {
        background: linear-gradient(135deg, #4096ff, #9254de);
      }
    }
  }
`;

const FeaturesSection = styled.div`
  padding: 80px 24px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
`;

const FeatureCard = styled(Card)`
  &.ant-card {
    height: 100%;
    border-radius: 20px;
    border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
    background: ${props => props.theme === 'dark' 
      ? 'linear-gradient(145deg, #1a1a1a, #262626)'
      : 'linear-gradient(145deg, #ffffff, #f8f9fa)'
    };
    transition: all 0.4s ease;
    cursor: pointer;
    overflow: hidden;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${props => props.color || 'linear-gradient(135deg, #1677ff, #722ed1)'};
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }
    
    &:hover {
      transform: translateY(-12px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, ${props => props.theme === 'dark' ? '0.4' : '0.15'});
      border-color: #1677ff;
      
      &::before {
        transform: scaleX(1);
      }
    }
    
    .ant-card-body {
      padding: 40px 32px;
      text-align: center;
    }
  }
`;

const FeatureIcon = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #1677ff, #722ed1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  font-size: 36px;
  color: white;
  box-shadow: 0 12px 30px rgba(22, 119, 255, 0.3);
  animation: ${float} 3s ease-in-out infinite;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: ${props => props.color || 'linear-gradient(135deg, #1677ff, #722ed1)'};
    opacity: 0.3;
    z-index: -1;
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const AdvantagesSection = styled.div`
  background: ${props => props.theme === 'dark' 
    ? 'linear-gradient(135deg, #1a1a1a 0%, #262626 100%)'
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
  };
  padding: 80px 24px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #1677ff, transparent);
  }
`;

const AdvantageItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 12px;
  background: ${props => props.theme === 'dark' ? '#00000020' : '#ffffff40'};
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(8px);
    background: ${props => props.theme === 'dark' ? '#00000040' : '#ffffff60'};
  }
  
  .advantage-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #1677ff, #722ed1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    flex-shrink: 0;
  }
  
  .advantage-content {
    flex: 1;
    
    .advantage-title {
      font-size: 18px;
      font-weight: 600;
      color: ${props => props.theme === 'dark' ? '#ffffffd9' : '#000000d9'};
      margin-bottom: 4px;
    }
    
    .advantage-desc {
      color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
      font-size: 14px;
      line-height: 1.5;
    }
  }
`;

const TestimonialsSection = styled.div`
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TestimonialCard = styled(Card)`
  &.ant-card {
    border-radius: 16px;
    border: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
    background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, ${props => props.theme === 'dark' ? '0.3' : '0.1'});
    }
    
    .ant-card-body {
      padding: 32px;
    }
  }
`;

const CTASection = styled.div`
  background: linear-gradient(135deg, #1677ff, #722ed1, #eb2f96);
  padding: 80px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
  }
  
  .cta-content {
    position: relative;
    z-index: 1;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .cta-title {
    color: white;
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 16px;
    
    @media (max-width: 768px) {
      font-size: 28px;
    }
  }
  
  .cta-subtitle {
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    margin-bottom: 32px;
    line-height: 1.6;
  }
`;

const FooterSection = styled.div`
  background: ${props => props.theme === 'dark' ? '#0a0a0a' : '#f8f9fa'};
  padding: 60px 24px 40px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#424242' : '#e8e8e8'};
  
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .footer-brand {
    text-align: center;
    margin-bottom: 40px;
    
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #1677ff, #722ed1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    
    .brand-desc {
      color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
      font-size: 14px;
    }
  }
  
  .footer-links {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-bottom: 32px;
    flex-wrap: wrap;
    
    a {
      color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s ease;
      
      &:hover {
        color: #1677ff;
      }
    }
  }
  
  .footer-social {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-bottom: 32px;
    
    .social-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${props => props.theme === 'dark' ? '#262626' : '#ffffff'};
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${props => props.theme === 'dark' ? '#ffffff73' : '#00000073'};
      transition: all 0.3s ease;
      cursor: pointer;
      
      &:hover {
        background: #1677ff;
        color: white;
        transform: translateY(-2px);
      }
    }
  }
  
  .footer-copyright {
    text-align: center;
    color: ${props => props.theme === 'dark' ? '#ffffff45' : '#00000045'};
    font-size: 12px;
    padding-top: 20px;
    border-top: 1px solid ${props => props.theme === 'dark' ? '#262626' : '#e8e8e8'};
  }
`;

const HomePage: React.FC = () => {
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: <RocketOutlined />,
      title: t('home.features.optimization.title'),
      description: t('home.features.optimization.description'),
      color: 'linear-gradient(135deg, #1677ff, #40a9ff)',
      action: () => navigate('/workbench'),
      buttonText: t('common.generate')
    },
    {
      icon: <DatabaseOutlined />,
      title: t('home.features.community.title'),
      description: t('home.features.community.description'),
      color: 'linear-gradient(135deg, #722ed1, #b37feb)',
      action: () => navigate('/dashboard'),
      buttonText: t('nav.dashboard')
    },
    {
      icon: <BugOutlined />,
      title: t('home.features.debugging.title'),
      description: t('home.features.debugging.description'),
      color: 'linear-gradient(135deg, #eb2f96, #f759ab)',
      action: () => navigate('/prompts'),
      buttonText: t('nav.prompts')
    }
  ];

  const advantages = [
    {
      icon: <CheckCircleOutlined />,
      title: t('home.advantages.items.easyToUse.title'),
      description: t('home.advantages.items.easyToUse.description')
    },
    {
      icon: <ThunderboltOutlined />,
      title: t('home.advantages.items.fastOptimization.title'),
      description: t('home.advantages.items.fastOptimization.description')
    },
    {
      icon: <TeamOutlined />,
      title: t('home.advantages.items.communitySharing.title'),
      description: t('home.advantages.items.communitySharing.description')
    },
    {
      icon: <TrophyOutlined />,
      title: t('home.advantages.items.continuousImprovement.title'),
      description: t('home.advantages.items.continuousImprovement.description')
    }
  ];

  const testimonials = [
    {
      name: t('home.testimonials.items.zhang.name'),
      role: t('home.testimonials.items.zhang.role'),
      company: t('home.testimonials.items.zhang.company'),
      content: t('home.testimonials.items.zhang.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang'
    },
    {
      name: t('home.testimonials.items.li.name'),
      role: t('home.testimonials.items.li.role'),
      company: t('home.testimonials.items.li.company'),
      content: t('home.testimonials.items.li.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li'
    },
    {
      name: t('home.testimonials.items.wang.name'),
      role: t('home.testimonials.items.wang.role'),
      company: t('home.testimonials.items.wang.company'),
      content: t('home.testimonials.items.wang.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang'
    }
  ];

  const heroStats = [
    { number: '1K+', label: t('home.stats.activeUsers') },
    { number: '5K+', label: t('home.stats.optimizations') },
    { number: '500+', label: t('home.stats.sharedTemplates') },
    { number: '95%', label: t('home.stats.satisfaction') }
  ];

  return (
    <HomeContainer theme={theme}>
      {/* 语言切换器 */}
      <div style={{ 
        position: 'absolute', 
        top: 24, 
        right: 24, 
        zIndex: 1000 
      }}>
        <LanguageSwitcher />
      </div>
      <HeroSection theme={theme}>
        <Title className="hero-title">
          {t('home.title')}
        </Title>
        <Paragraph className="hero-subtitle">
          {t('home.subtitle')}
        </Paragraph>
        <Paragraph className="hero-description">
          {t('home.features.optimization.description')}
        </Paragraph>
        <div className="hero-buttons">
          <HeroButton 
            type="primary" 
            size="large" 
            icon={<RocketOutlined />}
            className="primary"
            onClick={() => navigate('/workbench')}
          >
            {t('home.getStarted')}
          </HeroButton>
          <HeroButton 
            size="large" 
            icon={<DatabaseOutlined />}
            onClick={() => navigate('/dashboard')}
          >
            {t('nav.dashboard')}
          </HeroButton>
        </div>
        <div className="hero-stats">
          {heroStats.map((stat, index) => (
            <div key={index} className="hero-stat">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </HeroSection>

      <FeaturesSection>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 16, color: theme === 'dark' ? '#ffffffd9' : '#000000d9', fontSize: 40, fontWeight: 700 }}>
          <StarOutlined style={{ marginRight: 16, color: '#ffa500' }} />
          {t('home.features.title')}
        </Title>
        <Paragraph style={{ textAlign: 'center', marginBottom: 64, color: theme === 'dark' ? '#ffffff73' : '#00000073', fontSize: 18, maxWidth: 600, margin: '0 auto 64px' }}>
          {t('home.features.subtitle')}
        </Paragraph>
        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} md={8} key={index}>
              <FeatureCard theme={theme} color={feature.color} onClick={feature.action}>
                <FeatureIcon color={feature.color}>
                  {feature.icon}
                </FeatureIcon>
                <Title level={3} style={{ color: theme === 'dark' ? '#ffffffd9' : '#000000d9', marginBottom: 16, fontSize: 20, fontWeight: 600 }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ color: theme === 'dark' ? '#ffffff73' : '#00000073', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  {feature.description}
                </Paragraph>
                <Button 
                  type="primary" 
                  icon={<ArrowRightOutlined />}
                  style={{ borderRadius: 8, fontWeight: 500 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    feature.action();
                  }}
                >
                  {feature.buttonText}
                </Button>
              </FeatureCard>
            </Col>
          ))}
        </Row>
      </FeaturesSection>

      <AdvantagesSection theme={theme}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                  <Title level={2} style={{ textAlign: 'center', marginBottom: 16, color: theme === 'dark' ? '#ffffffd9' : '#000000d9', fontSize: 36, fontWeight: 700 }}>
          <TrophyOutlined style={{ marginRight: 16, color: '#1677ff' }} />
          {t('home.advantages.title')}
        </Title>
        <Paragraph style={{ textAlign: 'center', marginBottom: 64, color: theme === 'dark' ? '#ffffff73' : '#00000073', fontSize: 16, maxWidth: 500, margin: '0 auto 64px' }}>
          {t('home.advantages.subtitle')}
        </Paragraph>
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              {advantages.slice(0, 2).map((advantage, index) => (
                <AdvantageItem key={index} theme={theme}>
                  <div className="advantage-icon">
                    {advantage.icon}
                  </div>
                  <div className="advantage-content">
                    <div className="advantage-title">{advantage.title}</div>
                    <div className="advantage-desc">{advantage.description}</div>
                  </div>
                </AdvantageItem>
              ))}
            </Col>
            <Col xs={24} lg={12}>
              {advantages.slice(2, 4).map((advantage, index) => (
                <AdvantageItem key={index + 2} theme={theme}>
                  <div className="advantage-icon">
                    {advantage.icon}
                  </div>
                  <div className="advantage-content">
                    <div className="advantage-title">{advantage.title}</div>
                    <div className="advantage-desc">{advantage.description}</div>
                  </div>
                </AdvantageItem>
              ))}
            </Col>
          </Row>
        </div>
      </AdvantagesSection>

      <TestimonialsSection>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 16, color: theme === 'dark' ? '#ffffffd9' : '#000000d9', fontSize: 36, fontWeight: 700 }}>
          <HeartOutlined style={{ marginRight: 16, color: '#eb2f96' }} />
          {t('home.testimonials.title')}
        </Title>
        <Paragraph style={{ textAlign: 'center', marginBottom: 64, color: theme === 'dark' ? '#ffffff73' : '#00000073', fontSize: 16, maxWidth: 500, margin: '0 auto 64px' }}>
          {t('home.testimonials.subtitle')}
        </Paragraph>
        <Row gutter={[32, 32]}>
          {testimonials.map((testimonial, index) => (
            <Col xs={24} md={8} key={index}>
              <TestimonialCard theme={theme}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Avatar size={64} src={testimonial.avatar} style={{ marginBottom: 16 }} />
                  <div style={{ fontWeight: 600, color: theme === 'dark' ? '#ffffffd9' : '#000000d9', marginBottom: 4 }}>
                    {testimonial.name}
                  </div>
                  <div style={{ fontSize: 12, color: theme === 'dark' ? '#ffffff73' : '#00000073', marginBottom: 8 }}>
                    {testimonial.role} · {testimonial.company}
                  </div>
                  <Rate disabled defaultValue={testimonial.rating} style={{ fontSize: 14 }} />
                </div>
                <Paragraph style={{ color: theme === 'dark' ? '#ffffff85' : '#00000085', fontSize: 14, lineHeight: 1.6, textAlign: 'center', fontStyle: 'italic' }}>
                  "{testimonial.content}"
                </Paragraph>
              </TestimonialCard>
            </Col>
          ))}
        </Row>
      </TestimonialsSection>

      <CTASection>
        <div className="cta-content">
          <Title className="cta-title">
            {t('home.cta.title')}
          </Title>
          <Paragraph className="cta-subtitle">
            {t('home.cta.subtitle')}
          </Paragraph>
          <Space size="large">
            <Button 
              type="primary" 
              size="large" 
              icon={<RocketOutlined />}
              style={{ 
                height: 48, 
                padding: '0 32px', 
                borderRadius: 24, 
                fontSize: 16, 
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
              onClick={() => navigate('/workbench')}
            >
              {t('home.cta.startOptimizing')}
            </Button>
            <Button 
              size="large" 
              icon={<DatabaseOutlined />}
              style={{ 
                height: 48, 
                padding: '0 32px', 
                borderRadius: 24, 
                fontSize: 16, 
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                color: 'white'
              }}
              onClick={() => navigate('/dashboard')}
            >
              {t('home.cta.explorePlatform')}
            </Button>
          </Space>
        </div>
      </CTASection>

      <FooterSection theme={theme}>
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-title">{t('home.footer.brandTitle')}</div>
            <div className="brand-desc">{t('home.footer.brandDescription')}</div>
          </div>
          
          <div className="footer-links">
            <a href="/workbench">{t('home.footer.links.promptOptimization')}</a>
            <a href="/prompts">{t('home.footer.links.promptDebugging')}</a>
            <a href="/dashboard">{t('home.footer.links.sharingPlatform')}</a>
          </div>
          
          <div className="footer-social">
            <div className="social-icon">
              <GithubOutlined />
            </div>
            <div className="social-icon">
              <TwitterOutlined />
            </div>
            <div className="social-icon">
              <LinkedinOutlined />
            </div>
          </div>
          
          <div className="footer-copyright">
            {t('home.footer.copyright')}
          </div>
        </div>
      </FooterSection>
    </HomeContainer>
  );
};

export default HomePage; 