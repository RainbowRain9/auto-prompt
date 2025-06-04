import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Avatar } from 'antd';
import {
  DashboardOutlined,
  ExperimentOutlined,
  LogoutOutlined,
  BulbOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import LanguageSwitcher from './LanguageSwitcher';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  &.ant-layout-sider {
    background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#fafafa'} !important;
    border-right: 1px solid ${props => props.theme === 'dark' ? '#333' : '#e8e8e8'};
    position: relative;
    z-index: 100;
  }

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
`;

const SidebarHeader = styled.div`
  padding: 24px 20px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#e8e8e8'};
  position: relative;
  background: ${props => props.theme === 'dark' ? '#262626' : '#ffffff'};
`;

const CollapseButton = styled(Button)`
  &.ant-btn {
    position: absolute;
    top: 24px;
    right: 20px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid ${props => props.theme === 'dark' ? '#333' : '#d9d9d9'};
    background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    color: ${props => props.theme === 'dark' ? '#fff' : '#666'};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #1677ff;
      color: #1677ff;
      background: ${props => props.theme === 'dark' ? '#000' : '#f8f9fa'};
    }
    
    .anticon {
      font-size: 14px;
    }
  }
`;

// 用户信息接口类型定义
interface UserInfoData {
  userName: string;
  email: string;
  avatar: string;
  role: string;
  isDisabled: boolean;
  isDelete: boolean;
  consumeToken: number;
  requestCount: number;
  groups: string[];
  residualCredit: number;
  id: string;
  updatedAt: string;
  modifier: string;
  createdAt: string;
}

interface UserInfoResponse {
  message: string;
  success: boolean;
  data: UserInfoData;
}

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme === 'dark' ? '#fff' : '#1677ff'};
  text-align: center;
  padding-right: 40px;
`;

const MenuSection = styled.div`
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const StyledMenu = styled(Menu)`
  &.ant-menu {
    background: transparent;
    border: none;
    
    .ant-menu-item {
      margin: 2px 0;
      border-radius: 8px;
      height: 40px;
      line-height: 40px;
      padding: 0 16px;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      
      &:hover {
        background: ${props => props.theme === 'dark' ? '#333' : '#f0f8ff'};
        border-color: ${props => props.theme === 'dark' ? '#444' : '#e6f4ff'};
      }
      
      &.ant-menu-item-selected {
        background: ${props => props.theme === 'dark' ? '#1677ff' : '#1677ff'};
        color: #ffffff;
        font-weight: 600;
        border-color: #1677ff;
        
        .anticon {
          color: #ffffff;
        }
      }
    }
    
    .ant-menu-item-icon {
      font-size: 16px;
      margin-right: 12px;
    }
    
    .ant-menu-title-content {
      font-size: 14px;
      font-weight: 500;
    }
  }
`;

const SidebarFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#333' : '#e8e8e8'};
  background: ${props => props.theme === 'dark' ? '#262626' : '#ffffff'};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
  border: 1px solid ${props => props.theme === 'dark' ? '#333' : '#e8e8e8'};
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme === 'dark' ? '#1677ff' : '#1677ff'};
  }

  .user-details {
    flex: 1;
    
    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
      line-height: 1.4;
      margin-bottom: 4px;
    }
    
    .user-email {
      font-size: 12px;
      color: ${props => props.theme === 'dark' ? '#999' : '#666'};
      line-height: 1.4;
    }
  }
`;

const StyledAvatar = styled(Avatar)`
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  border: 2px solid ${props => props.theme === 'dark' ? '#333' : '#e8e8e8'};
  font-weight: 600;
  flex-shrink: 0;
`;

const LogoutButton = styled(Button)`
  &.ant-btn {
    width: 100%;
    height: 40px;
    border: 1px solid ${props => props.theme === 'dark' ? '#333' : '#d9d9d9'};
    background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    color: ${props => props.theme === 'dark' ? '#fff' : '#666'};
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    
    &:hover {
      border-color: #ff4d4f;
      color: #ff4d4f;
      background: ${props => props.theme === 'dark' ? '#2a1616' : '#fff2f0'};
    }
    
    .anticon {
      font-size: 16px;
    }
  }
`;

interface SidebarProps {
  collapsed?: boolean;
  selectedKey?: string;
  onMenuSelect?: (key: string) => void;
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  selectedKey = 'workbench',
  onMenuSelect,
  onCollapse
}) => {
  const { theme } = useThemeStore();
  const { logout, token } = useAuthStore();
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);

  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!token) return;
    try {
      const response = await fetch('https://api.token-ai.cn/api/v1/user/info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result: UserInfoResponse = await response.json();
        if (result.success) {
          setUserInfo(result.data);
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [token]);

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: t('nav.home'),
    },
    {
      key: 'workbench',
      icon: <ExperimentOutlined />,
      label: t('nav.workbench'),
    },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('nav.dashboard'),
    },
    {
      key: 'prompts',
      icon: <BulbOutlined />,
      label: t('nav.prompts'),
    }
  ];

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const handleCollapse = () => {
    onCollapse?.(!collapsed);
  };

  if (collapsed) {
    return (
      <StyledSider
        width={64}
        theme={theme}
        style={{ minHeight: '100vh' }}
      >
        <div style={{ 
          padding: '24px 16px', 
          textAlign: 'center',
          borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e8e8e8'}`,
          background: theme === 'dark' ? '#262626' : '#ffffff',
        }}>
          <CollapseButton
            theme={theme}
            icon={<MenuUnfoldOutlined />}
            onClick={handleCollapse}
            title="展开侧边栏"
          />
        </div>
        <MenuSection>
          <StyledMenu
            theme={theme}
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems.map(item => ({
              ...item,
              label: null,
            }))}
            onSelect={({ key }) => onMenuSelect?.(key)}
          />
        </MenuSection>
      </StyledSider>
    );
  }

  return (
    <StyledSider
      width={260}
      theme={theme}
      style={{ minHeight: '100vh' }}
    >
      <SidebarHeader theme={theme}>
        <Logo theme={theme}>
          TokenAI Console
        </Logo>
        <CollapseButton
          theme={theme}
          icon={<MenuFoldOutlined />}
          onClick={handleCollapse}
          title="收起侧边栏"
        />
      </SidebarHeader>

      <MenuSection>
        <StyledMenu
          theme={theme}
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onSelect={({ key }) => onMenuSelect?.(key)}
        />
      </MenuSection>

      <SidebarFooter theme={theme}>
        <UserInfo theme={theme}>
          <StyledAvatar
            size={40}
            theme={theme}
            icon={<UserOutlined />}
            src={userInfo?.avatar ? 'https://api.dicebear.com/7.x/adventurer-neutral/svg' : undefined}
          >
            {!userInfo?.avatar && (userInfo?.userName?.charAt(0)?.toUpperCase() || 'U')}
          </StyledAvatar>
          <div className="user-details">
            <div className="user-name">{userInfo?.userName || t('auth.username')}</div>
            <div className="user-email">{userInfo?.email || 'user@example.com'}</div>
          </div>
        </UserInfo>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <LogoutButton
            theme={theme}
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            {t('auth.logout')}
          </LogoutButton>
        </Space>
      </SidebarFooter>
    </StyledSider>
  );
};

export default Sidebar;