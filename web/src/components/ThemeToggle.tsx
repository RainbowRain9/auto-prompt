import React from 'react';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../stores/themeStore';

// 旋转动画
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// 发光动画
const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.6); }
`;

// 月亮发光动画
const moonGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(147, 197, 253, 0.5); }
  50% { box-shadow: 0 0 30px rgba(147, 197, 253, 0.8), 0 0 40px rgba(147, 197, 253, 0.6); }
`;

// Uiverse 风格的主题切换按钮
const UiverseThemeButton = styled.button`
  position: relative;
  width: 60px;
  height: 32px;
  border: none;
  border-radius: 16px;
  background: ${props => props.theme === 'dark' ? 
    'linear-gradient(145deg, #1a1a2e, #16213e)' : 
    'linear-gradient(145deg, #87ceeb, #4682b4)'};
  cursor: pointer;
  transition: all 0.4s ease;
  overflow: hidden;
  box-shadow: ${props => props.theme === 'dark' ? 
    'inset 2px 2px 5px #0f0f1a, inset -2px -2px 5px #25253e' : 
    'inset 2px 2px 5px #6bb6cc, inset -2px -2px 5px #a2e6ff'};

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }

  .toggle-slider {
    position: absolute;
    top: 2px;
    left: ${props => props.theme === 'dark' ? '30px' : '2px'};
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: ${props => props.theme === 'dark' ? 
      'radial-gradient(circle, #f0f8ff 0%, #e6f3ff 100%)' : 
      'radial-gradient(circle, #ffd700 0%, #ffb347 100%)'};
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${props => props.theme === 'dark' ? 
      '0 2px 10px rgba(240, 248, 255, 0.3)' : 
      '0 2px 10px rgba(255, 215, 0, 0.3)'};

    .theme-icon {
      font-size: 14px;
      color: ${props => props.theme === 'dark' ? '#4a90e2' : '#ff6b35'};
      transition: all 0.3s ease;
    }
  }

  &:hover .toggle-slider {
    animation: ${props => props.theme === 'dark' ? moonGlow : glow} 2s infinite;
    
    .theme-icon {
      animation: ${rotate} 1s ease-in-out;
    }
  }

  .background-stars {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: ${props => props.theme === 'dark' ? '1' : '0'};
    transition: opacity 0.4s ease;
    
    &::before, &::after {
      content: '';
      position: absolute;
      width: 2px;
      height: 2px;
      background: white;
      border-radius: 50%;
      animation: ${rotate} 10s linear infinite;
    }
    
    &::before {
      top: 6px;
      left: 8px;
      animation-delay: -2s;
    }
    
    &::after {
      top: 20px;
      right: 8px;
      animation-delay: -5s;
    }
  }

  .background-clouds {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: ${props => props.theme === 'light' ? '1' : '0'};
    transition: opacity 0.4s ease;
    
    &::before, &::after {
      content: '';
      position: absolute;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 10px;
    }
    
    &::before {
      width: 8px;
      height: 3px;
      top: 8px;
      left: 6px;
    }
    
    &::after {
      width: 6px;
      height: 2px;
      top: 18px;
      right: 8px;
    }
  }
`;

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();

  return (
    <UiverseThemeButton
      theme={theme}
      onClick={toggleTheme}
      title={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
    >
      <div className="background-stars" />
      <div className="background-clouds" />
      <div className="toggle-slider">
        {theme === 'dark' ? (
          <MoonOutlined className="theme-icon" />
        ) : (
          <SunOutlined className="theme-icon" />
        )}
      </div>
    </UiverseThemeButton>
  );
};

export default ThemeToggle; 