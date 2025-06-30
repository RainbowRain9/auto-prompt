import React from 'react';
import { Navigate } from 'react-router-dom';
import { Home, Dashboard, Prompts, Workbench, ImageGeneration, ModelScores, ModelEvaluation } from '../pages';
import ApiKeysPage from '../pages/ApiKeys';
import AIServiceConfigPage from '../pages/AIServiceConfig';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  key: string;
  title?: string;
  icon?: string;
  showInSidebar?: boolean;
  requireAuth?: boolean;
}

// 主页面路由配置（带侧边栏的页面）
export const mainRoutes: RouteConfig[] = [
  {
    path: '/workbench',
    element: <Workbench />,
    key: 'workbench',
    title: '工作台',
    icon: 'CodeOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    key: 'dashboard',
    title: '仪表板',
    icon: 'DashboardOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/prompts',
    element: <Prompts />,
    key: 'prompts',
    title: '提示词',
    icon: 'MessageOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/evaluation',
    element: <ModelEvaluation />,
    key: 'evaluation',
    title: '模型评估',
    icon: 'BarChartOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/image',
    element: <ImageGeneration />,
    key: 'image',
    title: '图片生成',
    icon: 'PictureOutlined',
    showInSidebar: true,
    requireAuth: false,
  },

  {
    path: '/apikeys',
    element: <ApiKeysPage />,
    key: 'apikeys',
    title: 'API Key 管理',
    icon: 'KeyOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/ai-service-config',
    element: <AIServiceConfigPage />,
    key: 'ai-service-config',
    title: 'AI服务配置',
    icon: 'ApiOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/code',
    element: <div>Code Generation页面开发中...</div>,
    key: 'code',
    title: '代码生成',
    icon: 'CodeOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/documentation',
    element: <div>Documentation页面开发中...</div>,
    key: 'documentation',
    title: '文档',
    icon: 'FileTextOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/settings',
    element: <div>Settings页面开发中...</div>,
    key: 'settings',
    title: '设置',
    icon: 'SettingOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
    key: 'fallback',
    showInSidebar: false,
    requireAuth: false,
  },
];

// 独立页面路由配置（不带侧边栏的页面）
export const standaloneRoutes: RouteConfig[] = [
  {
    path: '/',
    element: <Home />,
    key: 'home',
    title: '首页',
    showInSidebar: false,
    requireAuth: false,
  },
  {
    path: '/scores',
    element: <ModelScores />,
    key: 'scores',
    title: '模型评分',
    showInSidebar: false,
    requireAuth: false,
  },
];

// 获取所有路由
export const getAllRoutes = (): RouteConfig[] => [
  ...standaloneRoutes,
  ...mainRoutes,
];

// 获取侧边栏显示的路由
export const getSidebarRoutes = (): RouteConfig[] => {
  return mainRoutes.filter(route => route.showInSidebar);
};

// 根据路径获取路由配置
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return getAllRoutes().find(route => route.path === path);
};

// 根据key获取路由配置
export const getRouteByKey = (key: string): RouteConfig | undefined => {
  return getAllRoutes().find(route => route.key === key);
}; 