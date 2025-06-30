import React, { useEffect, useState } from 'react';
import {
  Select,
  Space,
  Tag,
  Tooltip,
  Button,
  Divider,
  Typography,
  Badge,
  Alert,
  message,
} from 'antd';
import {
  ApiOutlined,
  SettingOutlined,
  StarFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  useAIServiceConfigStore,
  useUserConfigs,
  useSelectedConfig,
} from '../stores/aiServiceConfigStore';
import type { AIServiceConfigListDto } from '../api/aiServiceConfig';
import { getSessionConfig } from '../api/aiServiceConfig';

const { Option } = Select;
const { Text } = Typography;

interface AIServiceConfigSelectorProps {
  value?: string; // 当前选择的配置ID
  onChange?: (configId: string | null, config: AIServiceConfigListDto | null) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
  showManageButton?: boolean;
  allowClear?: boolean;
}

const AIServiceConfigSelector: React.FC<AIServiceConfigSelectorProps> = ({
  value,
  onChange,
  placeholder = '选择AI服务配置',
  style,
  size = 'middle',
  showManageButton = true,
  allowClear = true,
}) => {
  const navigate = useNavigate();
  const { userConfigs, loading, error, loadUserConfigs } = useUserConfigs();
  const { selectedConfig, setSelectedConfig } = useSelectedConfig();
  const refreshConfigs = useAIServiceConfigStore(state => state.refreshConfigs);
  
  const [localValue, setLocalValue] = useState<string | undefined>(value);

  // 初始化加载配置
  useEffect(() => {
    loadUserConfigs();
  }, [loadUserConfigs]);

  // 同步外部value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 处理配置选择
  const handleChange = async (configId: string | null) => {
    if (!configId) {
      setLocalValue(undefined);
      setSelectedConfig(null);
      if (onChange) {
        onChange(null, null);
      }
      return;
    }

    try {
      // 获取包含解密API密钥的完整配置
      const response = await getSessionConfig(configId);
      if (response.success && response.data) {
        const sessionConfig = response.data;

        setLocalValue(configId);
        setSelectedConfig(sessionConfig);

        console.log('🔑 [AIServiceConfigSelector] 获取会话配置成功:', {
          configId: sessionConfig.id,
          provider: sessionConfig.provider,
          name: sessionConfig.name,
          hasApiKey: !!sessionConfig.apiKey,
          chatModelsCount: sessionConfig.chatModels?.length || 0
        });

        if (onChange) {
          onChange(configId, sessionConfig);
        }
      } else {
        message.error(`获取AI服务配置失败: ${response.message}`);
        // 回退到基础配置
        const basicConfig = userConfigs.find(c => c.id === configId) || null;
        setLocalValue(configId);
        setSelectedConfig(basicConfig);
        if (onChange) {
          onChange(configId, basicConfig);
        }
      }
    } catch (error) {
      console.error('获取会话配置失败:', error);
      message.error('获取AI服务配置失败，请重试');
      // 回退到基础配置
      const basicConfig = userConfigs.find(c => c.id === configId) || null;
      setLocalValue(configId);
      setSelectedConfig(basicConfig);
      if (onChange) {
        onChange(configId, basicConfig);
      }
    }
  };

  // 获取连接状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Connected':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'Failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  // 获取提供商标签颜色
  const getProviderColor = (provider: string) => {
    const colors = {
      OpenAI: 'blue',
      DeepSeek: 'purple',
      GoogleAI: 'red',
      Ollama: 'green',
      VolcEngine: 'orange',
    };
    return colors[provider as keyof typeof colors] || 'default';
  };

  // 刷新配置
  const handleRefresh = async () => {
    await refreshConfigs();
  };

  // 跳转到配置管理页面
  const handleManage = () => {
    navigate('/ai-service-config');
  };

  if (error) {
    return (
      <Alert
        message="加载AI服务配置失败"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={handleRefresh}>
            重试
          </Button>
        }
        style={style}
      />
    );
  }

  return (
    <Space.Compact style={style}>
      <Select
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        loading={loading}
        allowClear={allowClear}
        size={size}
        style={{ minWidth: 200, flex: 1 }}
        dropdownRender={(menu) => (
          <div>
            {menu}
            {userConfigs.length === 0 && !loading && (
              <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                <Text type="secondary">暂无AI服务配置</Text>
                <br />
                <Button
                  type="link"
                  size="small"
                  onClick={handleManage}
                  style={{ padding: 0 }}
                >
                  立即创建
                </Button>
              </div>
            )}
            {userConfigs.length > 0 && (
              <>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ padding: '4px 8px' }}>
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                    >
                      刷新
                    </Button>
                    {showManageButton && (
                      <Button
                        type="text"
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={handleManage}
                      >
                        管理配置
                      </Button>
                    )}
                  </Space>
                </div>
              </>
            )}
          </div>
        )}
      >
        {userConfigs.map((config) => (
          <Option key={config.id} value={config.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Text strong={config.isDefault}>
                  {config.name}
                  {config.isDefault && (
                    <StarFilled style={{ color: '#faad14', marginLeft: 4 }} />
                  )}
                </Text>
                <Tag color={getProviderColor(config.provider)} size="small">
                  {config.provider}
                </Tag>
              </Space>
              <Space>
                <Tooltip title={`连接状态: ${config.connectionStatus}`}>
                  {getStatusIcon(config.connectionStatus)}
                </Tooltip>
                <Badge count={config.usageCount} size="small" />
              </Space>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
              {config.description || config.apiEndpoint}
            </div>
          </Option>
        ))}
      </Select>
      
      {showManageButton && (
        <Tooltip title="管理AI服务配置">
          <Button
            icon={<ApiOutlined />}
            onClick={handleManage}
            size={size}
          />
        </Tooltip>
      )}
    </Space.Compact>
  );
};

export default AIServiceConfigSelector;
