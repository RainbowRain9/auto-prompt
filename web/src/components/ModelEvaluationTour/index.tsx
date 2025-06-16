import React from 'react';
import { Tour } from 'antd';
import type { TourProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../stores/themeStore';

interface ModelEvaluationTourProps {
  open: boolean;
  onClose: () => void;
}

const ModelEvaluationTour: React.FC<ModelEvaluationTourProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();

  // 引导步骤配置
  const steps: TourProps['steps'] = [
    {
      title: t('modelEvaluation.tour.welcome.title'),
      description: t('modelEvaluation.tour.welcome.description'),
      target: null, // 居中显示
    },
    {
      title: t('modelEvaluation.tour.exampleSelector.title'),
      description: t('modelEvaluation.tour.exampleSelector.description'),
      target: () => document.querySelector('[data-tour="example-selector"]') as HTMLElement,
      placement: 'bottom',
    },
    {
      title: t('modelEvaluation.tour.modelSelector.title'),
      description: t('modelEvaluation.tour.modelSelector.description'),
      target: () => document.querySelector('[data-tour="model-selector"]') as HTMLElement,
      placement: 'bottom',
    },
    {
      title: t('modelEvaluation.tour.basePrompt.title'),
      description: t('modelEvaluation.tour.basePrompt.description'),
      target: () => document.querySelector('[data-tour="base-prompt"]') as HTMLElement,
      placement: 'right',
    },
    {
      title: t('modelEvaluation.tour.testTask.title'),
      description: t('modelEvaluation.tour.testTask.description'),
      target: () => document.querySelector('[data-tour="test-task"]') as HTMLElement,
      placement: 'right',
    },
    {
      title: t('modelEvaluation.tour.evaluationConfig.title'),
      description: t('modelEvaluation.tour.evaluationConfig.description'),
      target: () => document.querySelector('[data-tour="evaluation-config"]') as HTMLElement,
      placement: 'top',
    },
    {
      title: t('modelEvaluation.tour.startButton.title'),
      description: t('modelEvaluation.tour.startButton.description'),
      target: () => document.querySelector('[data-tour="start-button"]') as HTMLElement,
      placement: 'top',
    },
    {
      title: t('modelEvaluation.tour.resultsArea.title'),
      description: t('modelEvaluation.tour.resultsArea.description'),
      target: () => document.querySelector('[data-tour="results-area"]') as HTMLElement,
      placement: 'left',
    },
    {
      title: t('modelEvaluation.tour.tabsNavigation.title'),
      description: t('modelEvaluation.tour.tabsNavigation.description'),
      target: () => document.querySelector('.ant-tabs-nav') as HTMLElement,
      placement: 'bottom',
    },
    {
      title: t('modelEvaluation.tour.complete.title'),
      description: t('modelEvaluation.tour.complete.description'),
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

export default ModelEvaluationTour; 