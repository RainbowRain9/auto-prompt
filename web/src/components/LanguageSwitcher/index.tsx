import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { GlobalOutlined } from '@ant-design/icons';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const items: MenuProps['items'] = [
    {
      key: 'zh',
      label: t('common.chinese'),
      onClick: () => handleLanguageChange('zh'),
    },
    {
      key: 'en',
      label: t('common.english'),
      onClick: () => handleLanguageChange('en'),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button 
        type="text" 
        icon={<GlobalOutlined />}
        style={{ border: 'none' }}
      >
        <Space>
          {t('common.language')}
        </Space>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher; 