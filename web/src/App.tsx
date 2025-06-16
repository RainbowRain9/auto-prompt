import React, { useEffect, useState } from 'react';
import { ConfigProvider, Layout, Spin } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore, initializeTheme } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import { useLanguageStore, initializeLanguage } from './stores/languageStore';
import { getAntdTheme } from './styles/theme';
import Sidebar from './components/Sidebar';
import { Login } from './pages';
import ApiConfigModal from './components/GuestConfigModal';
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
  const { 
    isAuthenticated, 
    hasApiConfig, 
    setApiConfig, 
    loadSystemInfo, 
    shouldRequireLogin, 
    systemInfoLoaded 
  } = useAuthStore();
  const { language } = useLanguageStore();
  const { i18n } = useTranslation();
  const [showApiConfig, setShowApiConfig] = useState(false);
  
  useEffect(() => {
    initializeTheme();
    initializeLanguage();
    // 应用启动时加载系统信息
    loadSystemInfo();
  }, [loadSystemInfo]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    // 只有在系统信息加载完成后才检查API配置需求
    if (systemInfoLoaded && isAuthenticated && !hasApiConfig()) {
      // 如果有内置API Key，不需要用户配置API Key
      const { systemInfo } = useAuthStore.getState();
      if (!systemInfo?.builtInApiKey) {
        setShowApiConfig(true);
      }
    }
  }, [systemInfoLoaded, isAuthenticated, hasApiConfig]);

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  const handleApiConfigOk = (config: { apiKey: string;  }) => {
    // 保存API配置
    setApiConfig(config.apiKey);
    setShowApiConfig(false);
  };

  const handleApiConfigCancel = () => {
    // 如果用户没有API配置就不能使用系统
    if (!hasApiConfig()) {
      // 可以选择退出登录或者提示必须配置
      setShowApiConfig(true);
    } else {
      setShowApiConfig(false);
    }
  };

  // 显示加载状态直到系统信息加载完成
  if (!systemInfoLoaded) {
    return (
      <ConfigProvider theme={getAntdTheme(theme === 'dark')}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Spin size="large" />
          <div>正在初始化系统...</div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={getAntdTheme(theme === 'dark')}>
      {/* 根据系统配置决定是否显示登录页面 */}
      {shouldRequireLogin() ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Router>
          <AppContent />
        </Router>
      )}
      
      {/* API配置弹窗 - 仅在非内置API Key模式下显示 */}
      <ApiConfigModal
        open={showApiConfig}
        onCancel={handleApiConfigCancel}
        onOk={handleApiConfigOk}
      />
    </ConfigProvider>
  );
};

export default App;
