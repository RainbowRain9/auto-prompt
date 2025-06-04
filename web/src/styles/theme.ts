import { theme } from 'antd';

export const lightTheme = {
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f5f5f5',
  colorBgElevated: '#ffffff',
  colorBorder: '#d9d9d9',
  colorBorderSecondary: '#f0f0f0',
  colorText: '#000000d9',
  colorTextSecondary: '#00000073',
  colorTextTertiary: '#00000040',
  colorPrimary: '#1677ff',
  colorPrimaryHover: '#4096ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',
  colorInfo: '#1677ff',
  boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  borderRadius: 6,
};

export const darkTheme = {
  colorBgContainer: '#1f1f1f',
  colorBgLayout: '#141414',
  colorBgElevated: '#262626',
  colorBorder: '#424242',
  colorBorderSecondary: '#303030',
  colorText: '#ffffffd9',
  colorTextSecondary: '#ffffff73',
  colorTextTertiary: '#ffffff40',
  colorPrimary: '#1677ff',
  colorPrimaryHover: '#4096ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',
  colorInfo: '#1677ff',
  boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 3px 6px -4px rgba(0, 0, 0, 0.48), 0 9px 28px 8px rgba(0, 0, 0, 0.2)',
  borderRadius: 6,
};

export const getAntdTheme = (isDark: boolean) => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    ...(isDark ? darkTheme : lightTheme),
  },
  components: {
    Layout: {
      bodyBg: isDark ? '#141414' : '#f5f5f5',
      siderBg: isDark ? '#1f1f1f' : '#ffffff',
      headerBg: isDark ? '#1f1f1f' : '#ffffff',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: isDark ? '#1677ff1a' : '#e6f4ff',
      itemHoverBg: isDark ? '#ffffff0f' : '#f5f5f5',
    },
    Button: {
      primaryShadow: 'none',
    },
  },
}); 