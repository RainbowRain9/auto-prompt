import { useLocation, useNavigate } from 'react-router-dom';
import { mainRoutes, standaloneRoutes, getRouteByKey, getSidebarRoutes, getPageMetadata, type RouteConfig, type PageMetadata } from '../config';

export const useRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 获取当前路由信息
  const getCurrentRoute = (): RouteConfig | undefined => {
    const allRoutes = [...standaloneRoutes, ...mainRoutes];
    return allRoutes.find(route => route.path === location.pathname);
  };

  // 获取当前页面元数据
  const getCurrentPageMetadata = (): PageMetadata => {
    const currentRoute = getCurrentRoute();
    return getPageMetadata(currentRoute?.key || 'home');
  };

  // 获取当前选中的菜单key
  const getSelectedKey = (): string => {
    const path = location.pathname;
    const route = mainRoutes.find(r => r.path === path);
    return route?.key || 'workbench';
  };

  // 导航到指定路由
  const navigateToRoute = (key: string) => {
    const route = getRouteByKey(key);
    if (route) {
      navigate(route.path);
    } else {
      navigate('/');
    }
  };

  // 检查是否为独立页面（不需要侧边栏）
  const isStandalonePage = (): boolean => {
    return standaloneRoutes.some(route => route.path === location.pathname);
  };

  // 检查是否需要认证
  const requiresAuth = (): boolean => {
    const metadata = getCurrentPageMetadata();
    return metadata.requireAuth ?? false;
  };

  // 获取页面标题
  const getPageTitle = (): string => {
    const metadata = getCurrentPageMetadata();
    return metadata.title || 'Auto Prompt';
  };

  // 获取页面布局类型
  const getPageLayout = (): string => {
    const metadata = getCurrentPageMetadata();
    return metadata.layout || 'default';
  };

  return {
    currentRoute: getCurrentRoute(),
    currentPageMetadata: getCurrentPageMetadata(),
    selectedKey: getSelectedKey(),
    sidebarRoutes: getSidebarRoutes(),
    navigateToRoute,
    isStandalonePage: isStandalonePage(),
    requiresAuth: requiresAuth(),
    pageTitle: getPageTitle(),
    pageLayout: getPageLayout(),
    location,
    navigate
  };
}; 