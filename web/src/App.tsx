import React, { useEffect, useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore, initializeTheme } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import { useLanguageStore, initializeLanguage } from './stores/languageStore';
import { getAntdTheme } from './styles/theme';
import Sidebar from './components/Sidebar';
import { Login } from './pages';
import GuestConfigModal from './components/GuestConfigModal';
import { mainRoutes, standaloneRoutes } from './config';
import { useRoutes } from './hooks/useRoutes';
import './styles/global.css';
import './i18n';

const { Content } = Layout;

// 主应用内容组件
const AppContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedKey, navigateToRoute, isStandalonePage } = useRoutes();

  const handleMenuSelect = (key: string) => {
    navigateToRoute(key);
  };

  const handleCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  // 如果是独立页面，使用单独的布局
  if (isStandalonePage) {
    return (
      <Routes>
        {standaloneRoutes.map(route => (
          <Route key={route.key} path={route.path} element={route.element} />
        ))}
      </Routes>
    );
  }

  // 其他页面使用带侧边栏的布局
  return (
    <Layout style={{ minHeight: '100vh',
      overflow:'hidden',
     }}>
      <Sidebar 
        collapsed={collapsed}
        selectedKey={selectedKey}
        onMenuSelect={handleMenuSelect}
        onCollapse={handleCollapse}
      />
      <Layout>
        <Content style={{ overflow: 'hidden' }}>
          <Routes>
            {mainRoutes.map(route => (
              <Route key={route.key} path={route.path} element={route.element} />
            ))}
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
        <Login 
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
