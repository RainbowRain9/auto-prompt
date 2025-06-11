import React, { useEffect, useState } from 'react';
import { Button, Typography, Space, Spin, Form, Input, Tabs, message } from 'antd';
import { LoginOutlined, UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import styled from 'styled-components';
import { useAuthStore, getLoginUrl } from '../../stores/authStore';
import { loginWithPassword, registerUser, type LoginInput, type RegisterInput } from '../../api/authApi';

const { Title, Text } = Typography;

// 统一色彩系统
const colors = {
  // 主色调
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // 中性色
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // 状态色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  // 背景色
  background: {
    light: '#ffffff',
    lighter: '#f8fafc',
    body: '#f1f5f9',
  }
};

// 现代分屏布局容器
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${colors.background.body};
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// 左侧品牌展示区域
const BrandSection = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 40px;
  position: relative;
  overflow: hidden;
  
  // 背景装饰效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
    pointer-events: none;
  }

  // 浮动粒子动画
  .floating-particles {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    
    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      animation: float 6s ease-in-out infinite;
      
      &:nth-child(1) { top: 20%; left: 20%; animation-delay: 0s; }
      &:nth-child(2) { top: 40%; left: 60%; animation-delay: 2s; }
      &:nth-child(3) { top: 70%; left: 30%; animation-delay: 4s; }
      &:nth-child(4) { top: 30%; left: 80%; animation-delay: 1s; }
      &:nth-child(5) { top: 80%; left: 70%; animation-delay: 3s; }
    }
  }

  // 霓虹边框线条
  .neon-lines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    
    .line {
      position: absolute;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      
      &.horizontal {
        height: 1px;
        width: 100%;
        
        &:first-child { top: 20%; animation: shimmer-h 3s linear infinite; }
        &:nth-child(2) { bottom: 20%; animation: shimmer-h 3s linear infinite reverse; }
      }
      
      &.vertical {
        width: 1px;
        height: 100%;
        
        &:nth-child(3) { left: 20%; animation: shimmer-v 4s linear infinite; }
        &:nth-child(4) { right: 20%; animation: shimmer-v 4s linear infinite reverse; }
      }
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(120deg); }
    66% { transform: translateY(10px) rotate(240deg); }
  }

  @keyframes shimmer-h {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes shimmer-v {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }

  @media (max-width: 768px) {
    padding: 40px 20px;
    min-height: 50vh;
  }
`;

const BrandContent = styled.div`
  text-align: center;
  z-index: 2;
  
  .brand-title {
    font-size: 48px;
    font-weight: 800;
    color: white;
    margin-bottom: 24px;
    line-height: 1.2;
    letter-spacing: -0.02em;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
      font-size: 36px;
      margin-bottom: 16px;
    }
  }
  
  .brand-subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    max-width: 500px;
    margin: 0 auto;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
      font-size: 16px;
      max-width: 300px;
    }
  }
`;

// 右侧表单区域
const FormSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 40px;
  background: ${colors.background.light};
  
  @media (max-width: 768px) {
    padding: 40px 20px;
  }
`;

// 表单容器
const FormContainer = styled.div`
  width: 100%;
  max-width: 420px;
  
  &.register-form {
    max-width: 480px;
  }
`;

// 表单标题
const FormTitle = styled(Title)`
  &.ant-typography {
    text-align: center;
    margin-bottom: 12px !important;
    color: ${colors.gray[800]} !important;
    font-size: 32px !important;
    font-weight: 700 !important;
    letter-spacing: -0.025em;
  }
`;

// 表单描述
const FormDescription = styled(Text)`
  display: block;
  text-align: center;
  margin-bottom: 32px;
  color: ${colors.gray[600]};
  font-size: 16px;
  line-height: 1.5;
`;

// 现代Tab组件
const ModernTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 32px;
    
    &::before {
      border-bottom: 2px solid ${colors.gray[200]};
    }
  }
  
  .ant-tabs-tab {
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    color: ${colors.gray[600]};
    border: none;
    background: transparent;
    transition: all 0.3s ease;
    
    &:hover {
      color: ${colors.primary[600]};
    }
    
    &.ant-tabs-tab-active {
      color: ${colors.primary[600]};
      
      .ant-tabs-tab-btn {
        color: ${colors.primary[600]};
        text-shadow: none;
      }
    }
  }
  
  .ant-tabs-ink-bar {
    background: linear-gradient(90deg, ${colors.primary[500]}, ${colors.primary[600]});
    height: 3px;
    border-radius: 2px;
  }
  
  .ant-tabs-content-holder {
    padding-top: 8px;
  }
`;

// 现代按钮样式
const ModernButton = styled(Button)`
  &.ant-btn {
    height: 48px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid transparent;
    
    &.primary-btn {
      background: linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%);
      border-color: ${colors.primary[600]};
      color: white;
      box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.25);
      
      &:hover {
        background: linear-gradient(135deg, ${colors.primary[700]} 0%, ${colors.primary[800]} 100%);
        border-color: ${colors.primary[700]};
        box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.35);
        transform: translateY(-2px);
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px 0 rgba(59, 130, 246, 0.35);
      }
    }
    
    &.secondary-btn {
      background: ${colors.background.light};
      border-color: ${colors.gray[300]};
      color: ${colors.gray[700]};
      
      &:hover {
        border-color: ${colors.primary[400]};
        color: ${colors.primary[600]};
        background: ${colors.primary[50]};
        transform: translateY(-1px);
      }
    }
    
    &.outline-btn {
      background: transparent;
      border-color: ${colors.gray[300]};
      color: ${colors.gray[700]};
      
      &:hover {
        border-color: ${colors.primary[400]};
        color: ${colors.primary[600]};
        background: ${colors.primary[50]};
      }
    }
  }
`;

// 自定义表单项
const StyledFormItem = styled(Form.Item)`
  &.ant-form-item {
    margin-bottom: 20px;
    
    &.compact {
      margin-bottom: 16px;
    }
    
    .ant-form-item-label > label {
      font-weight: 600;
      color: ${colors.gray[700]};
      font-size: 14px;
    }
    
    .ant-input,
    .ant-input-password .ant-input {
      height: 44px;
      border-radius: 8px;
      border: 2px solid ${colors.gray[200]};
      font-size: 15px;
      transition: all 0.3s ease;
      
      &:focus,
      &:hover {
        border-color: ${colors.primary[400]};
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      &::placeholder {
        color: ${colors.gray[400]};
      }
    }
    
    .ant-input-prefix {
      color: ${colors.gray[500]};
      margin-right: 12px;
    }
  }
`;

// 加载遮罩
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  
  .loading-text {
    margin-top: 24px;
    color: white;
    font-size: 18px;
    font-weight: 500;
  }
  
  .ant-spin-dot {
    font-size: 40px;
  }
  
  .ant-spin-dot-item {
    background-color: ${colors.primary[500]};
  }
`;

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('thor');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  useEffect(() => {
    // 检查URL中是否有token参数（Thor登录回调）
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setIsLoading(true);
      login(token, 'thor'); // Thor登录
      // 清除URL中的token参数
      window.history.replaceState({}, document.title, window.location.pathname);

      // 模拟加载效果
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess?.();
      }, 1500);
    }
  }, [login, onLoginSuccess]);

  const handleThorLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const currentUrl = window.location.href;
      const loginUrl = getLoginUrl(currentUrl);
      window.location.href = loginUrl;
    }, 800);
  };

  const handlePasswordLogin = async (values: LoginInput) => {
    try {
      setIsLoading(true);
      const response = await loginWithPassword(values);

      if (response.success && response.data) {
        login(response.data.token, 'password'); // 账户密码登录
        message.success('登录成功！');
        onLoginSuccess?.();
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (values: RegisterInput) => {
    try {
      setIsLoading(true);
      const response = await registerUser(values);

      if (response.success && response.data) {
        login(response.data.token, 'password'); // 注册成功后也是账户密码登录类型
        message.success('注册成功！');
        onLoginSuccess?.();
      } else {
        message.error(response.message || '注册失败');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      {isLoading && (
        <LoadingOverlay>
          <Spin size="large" />
          <div className="loading-text">正在登录，请稍候...</div>
        </LoadingOverlay>
      )}

      {/* 左侧品牌区域 */}
      <BrandSection>
        {/* 浮动光点效果 */}
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        
        {/* 霓虹线条效果 */}
        <div className="neon-lines">
          <div className="line horizontal"></div>
          <div className="line horizontal"></div>
          <div className="line vertical"></div>
          <div className="line vertical"></div>
        </div>
        
        <BrandContent>
          <div className="brand-title">
            提示词优化平台
          </div>
          <div className="brand-subtitle">
            智能优化您的提示词，让AI理解更精准，响应更智能。
            助您轻松驾驭人工智能的无限可能。
          </div>
        </BrandContent>
      </BrandSection>

      {/* 右侧表单区域 */}
      <FormSection>
        <FormContainer className={activeTab === 'register' ? 'register-form' : ''}>
          <FormTitle level={2}>欢迎回来</FormTitle>
          <FormDescription>
            请选择您的登录方式开始使用
          </FormDescription>

          <ModernTabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            items={[
              {
                key: 'thor',
                label: 'Thor 登录',
                children: (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <ModernButton
                      type="primary"
                      icon={<LoginOutlined />}
                      onClick={handleThorLogin}
                      className="primary-btn"
                      block
                      loading={isLoading && activeTab === 'thor'}
                    >
                      使用 Thor 平台登录
                    </ModernButton>
                  </Space>
                ),
              },
              {
                key: 'password',
                label: '账户登录',
                children: (
                  <Form
                    form={loginForm}
                    onFinish={handlePasswordLogin}
                    layout="vertical"
                    size='small'
                  >
                    <StyledFormItem
                      name="username"
                      label="用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="请输入用户名"
                      />
                    </StyledFormItem>

                    <StyledFormItem
                      name="password"
                      label="密码"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请输入密码"
                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      />
                    </StyledFormItem>

                    <StyledFormItem>
                      <ModernButton
                        type="primary"
                        htmlType="submit"
                        className="primary-btn"
                        size='small'
                        loading={isLoading && activeTab === 'password'}
                        block
                      >
                        登录
                      </ModernButton>
                    </StyledFormItem>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: '注册账户',
                children: (
                  <div className="form-content">
                    <Form
                      form={registerForm}
                      onFinish={handleRegister}
                      layout="vertical"
                      size='small'
                    >
                      <StyledFormItem
                        className="compact"
                        name="username"
                        label="用户名"
                        rules={[
                          { required: true, message: '请输入用户名' },
                          { min: 3, max: 50, message: '用户名长度必须在3-50个字符之间' },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="请输入用户名"
                        />
                      </StyledFormItem>

                      <StyledFormItem
                        className="compact"
                        name="displayName"
                        label="显示名称"
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="显示名称（可选）"
                        />
                      </StyledFormItem>

                      <StyledFormItem
                        className="compact"
                        name="email"
                        label="邮箱"
                        rules={[
                          { type: 'email', message: '请输入正确的邮箱格式' },
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined />}
                          placeholder="邮箱（可选）"
                        />
                      </StyledFormItem>

                      <StyledFormItem
                        className="compact"
                        name="password"
                        label="密码"
                        rules={[
                          { required: true, message: '请输入密码' },
                          { min: 6, message: '密码长度至少为6个字符' },
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="请输入密码"
                          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                      </StyledFormItem>
                      <StyledFormItem >
                        <ModernButton
                          type="primary"
                          htmlType="submit"
                          className="primary-btn"
                          size='small'
                          loading={isLoading && activeTab === 'register'}
                          block
                        >
                          注册账户
                        </ModernButton>
                      </StyledFormItem>
                    </Form>
                  </div>
                ),
              },
            ]}
          />
        </FormContainer>
      </FormSection>
    </LoginContainer>
  );
};

export default LoginPage; 