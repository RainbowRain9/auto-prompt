import React, { useEffect, useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore, initializeTheme } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import { useLanguageStore, initializeLanguage } from './stores/languageStore';
import { getAntdTheme } from './styles/theme';
import Sidebar from './components/Sidebar';
import Workbench from './components/Workbench';
import LoginPage from './components/LoginPage';
import PromptsPage from './components/PromptsPage';
import DashboardPage from './components/DashboardPage';
import HomePage from './components/HomePage';
import GuestConfigModal from './components/GuestConfigModal';
import './styles/global.css';
import './i18n';

const { Content } = Layout;

// 主应用内容组件
const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/prompts') return 'prompts';
    if (path === '/workbench') return 'workbench';
    return 'workbench';
  };

  const handleMenuSelect = (key: string) => {
    // 根据菜单项导航到对应路由
    switch (key) {
      case 'home':
        navigate('/');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'prompts':
        navigate('/prompts');
        break;
      case 'workbench':
        navigate('/workbench');
        break;
      default:
        navigate('/');
    }
  };

  const handleCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  // 检查是否为首页
  const isHomePage = location.pathname === '/';

  // 如果是首页，使用单独的布局
  if (isHomePage) {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    );
  }

  // 其他页面使用带侧边栏的布局
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar 
        collapsed={collapsed}
        selectedKey={getSelectedKey()}
        onMenuSelect={handleMenuSelect}
        onCollapse={handleCollapse}
      />
      <Layout>
        <Content style={{ overflow: 'hidden' }}>
          <Routes>
            <Route path="/workbench" element={<Workbench />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/prompts" element={<PromptsPage />} />
            <Route path="/code" element={<div>Code Generation页面开发中...</div>} />
            <Route path="/documentation" element={<div>Documentation页面开发中...</div>} />
            <Route path="/settings" element={<div>Settings页面开发中...</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  const { theme } = useThemeStore();
  const { isAuthenticated, isGuestMode, enterGuestMode } = useAuthStore();
  const { language } = useLanguageStore();
  const { i18n } = useTranslation();
  const [showGuestConfig, setShowGuestConfig] = useState(false);
  
  useEffect(() => {
    console.log('showGuestConfig 状态变化:', showGuestConfig);
  }, [showGuestConfig]);

  useEffect(() => {
    initializeTheme();
    initializeLanguage();
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  const handleEnterGuestMode = () => {
    // 进入游客模式时不直接设置状态，而是显示配置弹窗
    setShowGuestConfig(true);
  };

  const handleGuestConfigOk = () => {
    console.log('App: handleGuestConfigOk 被调用');
    // 配置完成后才真正进入游客模式
    enterGuestMode();
    setShowGuestConfig(false);
  };

  const handleGuestConfigCancel = () => {
    setShowGuestConfig(false);
  };

  return (
    <ConfigProvider theme={getAntdTheme(theme === 'dark')}>
      {/* 如果既没有登录也没有进入游客模式，显示登录页面 */}
      {!isAuthenticated && !isGuestMode ? (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess}
          onEnterGuestMode={handleEnterGuestMode}
        />
      ) : (
        <Router>
          <AppContent />
        </Router>
      )}
      <GuestConfigModal
        open={showGuestConfig}
        onCancel={handleGuestConfigCancel}
        onOk={handleGuestConfigOk}
        title="配置API设置"
        description="欢迎使用游客模式！为了使用AI功能，请先配置您的API设置。您的API密钥将安全地存储在本地浏览器中。"
      />
    </ConfigProvider>
  );
};

export default App;
