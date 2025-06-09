// 页面元数据配置
export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  showHeader?: boolean;
  showFooter?: boolean;
  requireAuth?: boolean;
  layout?: 'default' | 'fullscreen' | 'minimal';
}

// 页面数据配置
export const pageMetadata: Record<string, PageMetadata> = {
  home: {
    title: 'AI Prompt 优化工具',
    description: '专业的AI Prompt优化平台，提升AI对话质量',
    keywords: ['AI', 'Prompt', '优化', '人工智能'],
    showHeader: false,
    showFooter: true,
    requireAuth: false,
    layout: 'fullscreen'
  },
  workbench: {
    title: '工作台',
    description: 'AI Prompt优化工作台',
    keywords: ['工作台', 'Prompt', '优化'],
    showHeader: true,
    showFooter: false,
    requireAuth: false,
    layout: 'default'
  },
  dashboard: {
    title: '仪表板',
    description: '数据统计和分析仪表板',
    keywords: ['仪表板', '统计', '分析'],
    showHeader: true,
    showFooter: false,
    requireAuth: false,
    layout: 'default'
  },
  prompts: {
    title: '提示词管理',
    description: 'Prompt模板管理和分享',
    keywords: ['提示词', '模板', '管理'],
    showHeader: true,
    showFooter: false,
    requireAuth: false,
    layout: 'default'
  },
  code: {
    title: '代码生成',
    description: 'AI代码生成工具',
    keywords: ['代码生成', 'AI', '编程'],
    showHeader: true,
    showFooter: false,
    requireAuth: false,
    layout: 'default'
  },
  documentation: {
    title: '文档中心',
    description: '使用文档和API参考',
    keywords: ['文档', 'API', '帮助'],
    showHeader: true,
    showFooter: false,
    requireAuth: false,
    layout: 'default'
  },
  settings: {
    title: '设置',
    description: '系统设置和个人偏好',
    keywords: ['设置', '配置', '偏好'],
    showHeader: true,
    showFooter: false,
    requireAuth: false,
    layout: 'default'
  },
  login: {
    title: '登录',
    description: '用户登录页面',
    keywords: ['登录', '认证'],
    showHeader: false,
    showFooter: false,
    requireAuth: false,
    layout: 'minimal'
  }
};

// 获取页面元数据
export const getPageMetadata = (key: string): PageMetadata => {
  return pageMetadata[key] || {
    title: 'Auto Prompt',
    description: 'AI Prompt优化工具',
    requireAuth: false,
    layout: 'default'
  };
}; 