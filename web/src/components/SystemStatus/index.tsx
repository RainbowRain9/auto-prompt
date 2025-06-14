import React from 'react';
import { Tag, Tooltip, Space } from 'antd';
import { CheckCircleOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

const SystemStatus: React.FC = () => {
  const { systemInfo, isAuthenticated, loginType } = useAuthStore();

  if (!systemInfo) {
    return null;
  }

  return (
    <Space size="small">
      {/* 系统模式指示器 */}
      {systemInfo.builtInApiKey ? (
        <Tooltip title="系统已配置内置API Key，登录后无需配置API Key">
          <Tag icon={<KeyOutlined />} color="success">
            内置Key
          </Tag>
        </Tooltip>
      ) : (
        <>
        </>
      )}

      {/* 认证状态指示器 */}
      {isAuthenticated && (
        <Tooltip title={`当前登录类型: ${loginType}`}>
          <Tag icon={<CheckCircleOutlined />} color="green">
            已认证
          </Tag>
        </Tooltip>
      )}

      {/* 版本信息 */}
      <Tooltip title="系统版本">
        <Tag color="default">
          v{systemInfo.version}
        </Tag>
      </Tooltip>
    </Space>
  );
};

export default SystemStatus; 