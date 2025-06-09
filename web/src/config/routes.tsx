import React from 'react';
import { Navigate } from 'react-router-dom';
import { HomePage, DashboardPage, PromptsPage, Workbench } from '../pages';

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
    element: <DashboardPage />,
    key: 'dashboard',
    title: '仪表板',
    icon: 'DashboardOutlined',
    showInSidebar: true,
    requireAuth: false,
  },
  {
    path: '/prompts',
    element: <PromptsPage />,
    key: 'prompts',
    title: '提示词',
    icon: 'MessageOutlined',
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
    element: <HomePage />,
    key: 'home',
    title: '首页',
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