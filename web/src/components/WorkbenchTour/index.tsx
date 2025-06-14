import React from 'react';
import { Tour } from 'antd';
import type { TourProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../stores/themeStore';

interface WorkbenchTourProps {
  open: boolean;
  onClose: () => void;
}

const WorkbenchTour: React.FC<WorkbenchTourProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();

  // 引导步骤配置
  const steps: TourProps['steps'] = [
    {
      title: t('workbench.tour.welcome.title'),
      description: t('workbench.tour.welcome.description'),
      target: null, // 居中显示
    },
    {
      title: t('workbench.tour.modelSelector.title'),
      description: t('workbench.tour.modelSelector.description'),
      target: () => document.querySelector('.model-selector-section') as HTMLElement,
      placement: 'bottom',
    },
    {
      title: t('workbench.tour.promptOptimization.title'),
      description: t('workbench.tour.promptOptimization.description'),
      target: () => document.querySelector('[data-tour="prompt-optimize"]') as HTMLElement,
      placement: 'bottom',
    },
    {
      title: t('workbench.tour.functionCalling.title'),
      description: t('workbench.tour.functionCalling.description'),
      target: () => document.querySelector('[data-tour="function-calling"]') as HTMLElement,
      placement: 'bottom',
    },
    {
      title: t('workbench.tour.systemPrompt.title'),
      description: t('workbench.tour.systemPrompt.description'),
      target: () => document.querySelector('[data-tour="system-prompt"]') as HTMLElement,
      placement: 'right',
    },
    {
      title: t('workbench.tour.messages.title'),
      description: t('workbench.tour.messages.description'),
      target: () => document.querySelector('[data-tour="messages"]') as HTMLElement,
      placement: 'left',
    },
    {
      title: t('workbench.tour.addMessages.title'),
      description: t('workbench.tour.addMessages.description'),
      target: () => document.querySelector('[data-tour="add-messages"]') as HTMLElement,
      placement: 'top',
    },
    {
      title: t('workbench.tour.testSection.title'),
      description: t('workbench.tour.testSection.description'),
      target: () => document.querySelector('[data-tour="test-section"]') as HTMLElement,
      placement: 'left',
    },
    {
      title: t('workbench.tour.runButton.title'),
      description: t('workbench.tour.runButton.description'),
      target: () => document.querySelector('[data-tour="run-button"]') as HTMLElement,
      placement: 'bottom',
    },
    {
      title: t('workbench.tour.complete.title'),
      description: t('workbench.tour.complete.description'),
      target: null, // 居中显示
    },
  ];

  return (
    <Tour
      open={open}
      onClose={onClose}
      steps={steps}
      indicatorsRender={(current, total) => (
        <span style={{ 
          color: theme === 'dark' ? '#fff' : '#000',
          fontSize: '14px'
        }}>
          {current + 1} / {total}
        </span>
      )}
      type="primary"
      arrow={true}
      mask={{
        style: {
          boxShadow: 'inset 0 0 15px #fff',
        },
      }}
      zIndex={1001}
    />
  );
};

export default WorkbenchTour; 