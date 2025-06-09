import React, { useEffect, useState } from 'react';
import { Button, Card, Typography, Space, Spin } from 'antd';
import { LoginOutlined, RobotOutlined, StarOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import { useAuthStore, getLoginUrl } from '../stores/authStore';

const { Title, Text } = Typography;

// 更现代的渐变动画
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// 优雅的淡入动画
const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
`;

// 闪光效果动画
const shine = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// 粒子浮动动画
const particleFloat = keyframes`
  0%, 100% { 
    transform: translateY(0px) translateX(0px) rotate(0deg); 
    opacity: 0.7;
  }
  25% { 
    transform: translateY(-20px) translateX(10px) rotate(90deg); 
    opacity: 1;
  }
  50% { 
    transform: translateY(-10px) translateX(-5px) rotate(180deg); 
    opacity: 0.8;
  }
  75% { 
    transform: translateY(-30px) translateX(15px) rotate(270deg); 
    opacity: 0.9;
  }
`;

// 脉冲动画
const pulse = keyframes`
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.8;
  }
  50% { 
    transform: scale(1.1); 
    opacity: 1;
  }
`;

// 波纹效果
const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    #667eea 0%, 
    #764ba2 25%, 
    #f093fb 50%, 
    #f5576c 75%, 
    #4facfe 100%
  );
  background-size: 400% 400%;
  animation: ${gradientAnimation} 20s ease infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="%23ffffff" stroke-width="0.3" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    z-index: 1;
  }
`;

// 增强的发光效果
const GlowEffect = styled.div`
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%);
  filter: blur(30px);
  animation: ${fadeIn} 3s ease-out forwards, ${pulse} 8s ease-in-out infinite;
  
  &:nth-child(1) {
    width: 400px;
    height: 400px;
    top: 10%;
    left: 20%;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, rgba(102, 126, 234, 0) 70%);
    animation-delay: 0.5s;
  }
  
  &:nth-child(2) {
    width: 300px;
    height: 300px;
    bottom: 15%;
    right: 25%;
    background: radial-gradient(circle, rgba(245, 87, 108, 0.3) 0%, rgba(245, 87, 108, 0) 70%);
    animation-delay: 1s;
  }
  
  &:nth-child(3) {
    width: 250px;
    height: 250px;
    top: 60%;
    left: 10%;
    background: radial-gradient(circle, rgba(79, 172, 254, 0.3) 0%, rgba(79, 172, 254, 0) 70%);
    animation-delay: 1.5s;
  }
`;

// 粒子系统
const ParticleSystem = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: ${particleFloat} 15s ease-in-out infinite;

    &:nth-child(1) {
      top: 20%;
      left: 10%;
      animation-delay: 0s;
      animation-duration: 12s;
    }
    
    &:nth-child(2) {
      top: 60%;
      left: 20%;
      animation-delay: 2s;
      animation-duration: 18s;
    }
    
    &:nth-child(3) {
      top: 30%;
      right: 15%;
      animation-delay: 4s;
      animation-duration: 14s;
    }
    
    &:nth-child(4) {
      bottom: 25%;
      left: 30%;
      animation-delay: 6s;
      animation-duration: 16s;
    }
    
    &:nth-child(5) {
      top: 70%;
      right: 30%;
      animation-delay: 8s;
      animation-duration: 20s;
    }
    
    &:nth-child(6) {
      top: 15%;
      left: 60%;
      animation-delay: 10s;
      animation-duration: 13s;
    }
    
    &:nth-child(7) {
      bottom: 40%;
      right: 10%;
      animation-delay: 12s;
      animation-duration: 17s;
    }
    
    &:nth-child(8) {
      top: 45%;
      left: 5%;
      animation-delay: 14s;
      animation-duration: 19s;
    }
  }
`;

// 优化的登录卡片
const LoginCard = styled(Card)`
  width: 450px;
  backdrop-filter: blur(25px);
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 3;
  animation: ${fadeIn} 1.2s ease-out forwards;
  overflow: hidden;

  .ant-card-body {
    padding: 56px 48px;
  }

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    height: 6px;
    background: linear-gradient(90deg, 
      #667eea 0%, 
      #764ba2 25%, 
      #f093fb 50%, 
      #f5576c 75%, 
      #4facfe 100%
    );
    background-size: 300% 300%;
    animation: ${shine} 4s linear infinite;
    border-radius: 24px 24px 0 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.1) 0%, 
      rgba(255, 255, 255, 0.05) 50%, 
      rgba(255, 255, 255, 0.1) 100%
    );
    border-radius: 24px;
    pointer-events: none;
    z-index: -1;
  }
`;

// 优化的标题样式
const StyledTitle = styled(Title)`
  &.ant-typography {
    color: white !important;
    text-align: center;
    margin-bottom: 16px !important;
    font-weight: 800;
    font-size: 32px !important;
    text-shadow: 
      0 2px 10px rgba(0, 0, 0, 0.3),
      0 0 30px rgba(255, 255, 255, 0.2);
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

// 优化的描述文字
const StyledText = styled(Text)`
  &.ant-typography {
    color: rgba(255, 255, 255, 0.95) !important;
    text-align: center;
    display: block;
    margin-bottom: 40px;
    font-size: 17px;
    font-weight: 400;
    line-height: 1.6;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.3px;
  }
`;

// 优化的登录按钮
const LoginButton = styled(Button)`
  &.ant-btn {
    width: 100%;
    height: 56px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 
      0 8px 25px rgba(102, 126, 234, 0.4),
      0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    letter-spacing: 0.8px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.2) 50%, 
        transparent 100%
      );
      transition: left 0.6s ease;
    }

    &:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 
        0 12px 35px rgba(102, 126, 234, 0.6),
        0 8px 20px rgba(0, 0, 0, 0.2);
      background: linear-gradient(135deg, #7c8cfa 0%, #8a5cb8 100%);
      
      &::before {
        left: 100%;
      }
    }

    &:active {
      transform: translateY(-1px) scale(1.01);
      transition: all 0.1s ease;
    }

    .anticon {
      font-size: 20px;
      margin-right: 8px;
    }
  }
`;

// 增强的图标包装器
const float = keyframes`
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
  }
  25% { 
    transform: translateY(-15px) rotate(5deg); 
  }
  50% { 
    transform: translateY(-8px) rotate(0deg); 
  }
  75% { 
    transform: translateY(-12px) rotate(-5deg); 
  }
`;

const IconWrapper = styled.div`
  text-align: center;
  margin-bottom: 40px;
  position: relative;

  .main-icon {
    font-size: 72px;
    color: white;
    text-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.3),
      0 0 40px rgba(255, 255, 255, 0.3);
    animation: ${float} 8s ease-in-out infinite;
    position: relative;
    z-index: 3;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
  }
  
  &::before {
    content: '';
    position: absolute;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.2) 0%, 
      rgba(255, 255, 255, 0.05) 100%
    );
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    filter: blur(8px);
    animation: ${pulse} 4s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, 
      rgba(102, 126, 234, 0.3) 0%, 
      rgba(102, 126, 234, 0) 70%
    );
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    animation: ${ripple} 3s ease-out infinite;
  }
`;

// 装饰性星星
const DecorativeStars = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;

  .star {
    position: absolute;
    color: rgba(255, 255, 255, 0.8);
    animation: ${particleFloat} 10s ease-in-out infinite;

    &:nth-child(1) {
      top: 15%;
      left: 15%;
      font-size: 12px;
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      top: 25%;
      right: 20%;
      font-size: 8px;
      animation-delay: 2s;
    }
    
    &:nth-child(3) {
      bottom: 30%;
      left: 10%;
      font-size: 10px;
      animation-delay: 4s;
    }
    
    &:nth-child(4) {
      bottom: 20%;
      right: 15%;
      font-size: 14px;
      animation-delay: 6s;
    }
  }
`;

// 优化的浮动元素
const FloatingElements = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;

  .floating-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.15) 0%, 
      rgba(255, 255, 255, 0.05) 100%
    );
    animation: float-circle 20s ease-in-out infinite;
    box-shadow: 
      inset 0 0 20px rgba(255, 255, 255, 0.1),
      0 0 40px rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);

    &:nth-child(1) {
      width: 120px;
      height: 120px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    &:nth-child(2) {
      width: 180px;
      height: 180px;
      top: 65%;
      right: 10%;
      animation-delay: 4s;
    }

    &:nth-child(3) {
      width: 90px;
      height: 90px;
      top: 30%;
      right: 20%;
      animation-delay: 8s;
    }
    
    &:nth-child(4) {
      width: 70px;
      height: 70px;
      top: 75%;
      left: 15%;
      animation-delay: 6s;
    }
    
    &:nth-child(5) {
      width: 50px;
      height: 50px;
      top: 20%;
      left: 45%;
      animation-delay: 10s;
    }

    &:nth-child(6) {
      width: 100px;
      height: 100px;
      bottom: 15%;
      left: 60%;
      animation-delay: 12s;
    }
  }

  @keyframes float-circle {
    0%, 100% { 
      transform: translateY(0px) translateX(0px) rotate(0deg); 
      opacity: 0.6;
    }
    25% { 
      transform: translateY(-50px) translateX(20px) rotate(90deg); 
      opacity: 0.8;
    }
    50% { 
      transform: translateY(-30px) translateX(-15px) rotate(180deg); 
      opacity: 1;
    }
    75% { 
      transform: translateY(-60px) translateX(25px) rotate(270deg); 
      opacity: 0.7;
    }
  }
`;

// 优化的加载状态
const LoadingWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 10;
  border-radius: 24px;
  color: white;
  animation: ${fadeIn} 0.4s ease-out forwards;
  
  .ant-spin {
    margin-bottom: 20px;
    
    .ant-spin-dot {
      font-size: 48px;
    }
    
    .ant-spin-dot-item {
      background-color: #667eea;
    }
  }

  .loading-text {
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
`;

interface LoginPageProps {
  onLoginSuccess?: () => void;
  onEnterGuestMode?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onEnterGuestMode }) => {
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 检查URL中是否有token参数
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setIsLoading(true);
      login(token);
      // 清除URL中的token参数
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 模拟加载效果
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess?.();
      }, 1500);
    }
  }, [login, onLoginSuccess]);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const currentUrl = window.location.href;
      const loginUrl = getLoginUrl(currentUrl);
      window.location.href = loginUrl;
    }, 800);
  };



  return (
    <LoginContainer>
      <GlowEffect />
      <GlowEffect />
      <GlowEffect />
      
      <ParticleSystem>
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
      </ParticleSystem>
      
      <FloatingElements>
        <div className="floating-circle" />
        <div className="floating-circle" />
        <div className="floating-circle" />
        <div className="floating-circle" />
        <div className="floating-circle" />
        <div className="floating-circle" />
      </FloatingElements>

      <DecorativeStars>
        <StarOutlined className="star" />
        <StarOutlined className="star" />
        <StarOutlined className="star" />
        <StarOutlined className="star" />
      </DecorativeStars>
      
      <LoginCard className="fade-in">
        {isLoading && (
          <LoadingWrapper>
            <Spin size="large" />
            <div className="loading-text">正在登录，请稍候...</div>
          </LoadingWrapper>
        )}
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <IconWrapper>
            <RobotOutlined className="main-icon" />
          </IconWrapper>
          
          <div>
            <StyledTitle level={2}>
              欢迎使用提示词优化平台
            </StyledTitle>
            <StyledText>
              通过智能AI深度优化您的提示词，让AI理解更加精准、响应更加智能，助您轻松驾驭人工智能的无限可能
            </StyledText>
          </div>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <LoginButton
              type="primary"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              className="hover-effect"
            >
              立即开始体验
            </LoginButton>
            
            <Button
              type="default"
              onClick={() => {
                if (onEnterGuestMode) {
                  onEnterGuestMode();
                } else {
                  console.log('onEnterGuestMode 为空');
                }
              }}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontWeight: '500',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                zIndex: 10,
                cursor: 'pointer',
              }}
            >
              游客模式体验
            </Button>
          </Space>
        </Space>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage; 