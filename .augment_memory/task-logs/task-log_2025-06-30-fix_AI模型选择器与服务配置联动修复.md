# Task Log: AI模型选择器与服务配置联动修复

**日期**: 2025-06-30  
**类型**: 功能修复  
**状态**: ✅ 已完成  
**项目**: auto-prompt AI提示词优化平台

## 🚨 问题描述

### 用户反馈问题
用户在工作台页面发现：**显示的AI模型不是按照AI配置服务选择的模型**

### 具体现象
- **AI服务配置选择器**: 用户可以选择不同的AI服务配置（如Google AI、OpenAI等）
- **模型选择器**: 显示的仍然是系统默认模型 `gemini-2.5-flash-preview-04-17`
- **问题**: 两个选择器之间没有联动，用户选择的AI服务配置中的模型没有被模型选择器使用

## 🔍 根因分析

### 技术问题
1. **独立的数据源**:
   - AI服务配置选择器使用 `useAIServiceConfigStore`
   - 模型选择器使用 `useModelStore`，调用 `/api/v1/models` 端点（系统默认模型）

2. **缺乏联动机制**:
   - 工作台页面没有为AI服务配置选择器设置 `onChange` 回调
   - 选择不同AI服务配置时，模型选择器不会更新

3. **数据不同步**:
   - 用户AI服务配置中的 `chatModels` 和 `defaultChatModel` 没有被使用
   - 模型选择器始终显示系统默认模型列表

### 架构问题
```typescript
// 问题：两个独立的数据流
AI服务配置选择器 → useAIServiceConfigStore → 用户配置
模型选择器 → useModelStore → 系统默认模型

// 缺少：联动机制
AI服务配置变化 → 模型选择器更新 → 显示配置中的模型
```

## 🛠️ 解决方案

### 修复策略
1. **添加联动机制**: 为AI服务配置选择器添加 `onChange` 回调
2. **动态模型列表**: 根据选择的AI服务配置动态更新模型选择器选项
3. **自动模型选择**: 当选择新配置时，自动选择该配置的默认聊天模型
4. **优化用户体验**: 更新占位符文本，明确显示当前配置的提供商

### 代码修改

#### 1. **添加必要的导入和状态管理**
```typescript
// 添加AI服务配置相关导入
import { useSelectedConfig } from '../../stores/aiServiceConfigStore';
import type { AIServiceConfigListDto } from '../../api/aiServiceConfig';
```

#### 2. **实现动态模型选项获取**
```typescript
// 使用AI服务配置 store
const { selectedConfig } = useSelectedConfig();

// 获取聊天模型选项 - 优先使用选择的AI服务配置中的模型
const getAvailableModelOptions = () => {
  if (selectedConfig && selectedConfig.chatModels && selectedConfig.chatModels.length > 0) {
    // 使用选择的AI服务配置中的模型
    return selectedConfig.chatModels.map(model => ({
      value: model,
      label: model,
    }));
  }
  // 回退到系统默认模型
  return getChatModelOptions();
};
```

#### 3. **添加AI服务配置变化处理**
```typescript
// 处理AI服务配置变化
const handleAIConfigChange = (configId: string | null, config: AIServiceConfigListDto | null) => {
  // 配置变化时，如果新配置有默认聊天模型，自动选择它
  if (config && config.defaultChatModel) {
    setSelectedModel(config.defaultChatModel);
  }
};
```

#### 4. **添加自动模型选择逻辑**
```typescript
// 当AI服务配置变化时，自动选择该配置的默认模型
useEffect(() => {
  if (selectedConfig && selectedConfig.defaultChatModel) {
    // 如果选择的配置有默认聊天模型，使用它
    setSelectedModel(selectedConfig.defaultChatModel);
  } else if (modelOptions.length > 0 && !selectedModel) {
    // 否则选择第一个可用模型
    setSelectedModel(modelOptions[0].value);
  }
}, [selectedConfig, modelOptions, selectedModel, setSelectedModel]);
```

#### 5. **更新UI组件**
```typescript
// 为AI服务配置选择器添加onChange回调
<AIServiceConfigSelector
  placeholder="选择AI服务配置"
  size="middle"
  showManageButton={true}
  style={{ width: '100%' }}
  onChange={handleAIConfigChange}
/>

// 优化模型选择器占位符
placeholder={
  modelsLoading 
    ? t('workbench.loadingModels') 
    : selectedConfig 
      ? `选择${selectedConfig.provider}模型` 
      : '选择聊天模型'
}
```

## ✅ 修复效果

### 预期行为
1. **联动选择**: 用户选择AI服务配置后，模型选择器自动显示该配置中的可用模型
2. **自动选择**: 自动选择该配置的默认聊天模型
3. **动态更新**: 切换不同AI服务配置时，模型列表动态更新
4. **用户体验**: 占位符文本明确显示当前配置的提供商

### 测试场景
1. **选择Google AI配置** → 模型选择器显示Gemini系列模型
2. **选择OpenAI配置** → 模型选择器显示GPT系列模型
3. **选择DeepSeek配置** → 模型选择器显示DeepSeek系列模型
4. **无配置时** → 回退到系统默认模型列表

## 📋 修改文件

### 主要修改
- **文件**: `web/src/pages/Workbench/index.tsx`
- **修改类型**: 功能增强 - 添加AI服务配置与模型选择器联动
- **代码行数**: 约40行修改/新增

### 关键改进
1. **数据流优化**: 建立AI服务配置与模型选择的联动关系
2. **用户体验**: 自动选择合适的默认模型，减少用户操作
3. **状态同步**: 确保UI状态与用户配置保持一致
4. **错误处理**: 提供回退机制，确保功能稳定性

## 🎯 技术价值

### 解决的核心问题
- **数据一致性**: 确保UI显示与用户配置一致
- **用户体验**: 减少用户困惑，提供直观的操作体验
- **功能完整性**: 实现AI服务配置功能的完整闭环

### 架构改进
```typescript
// 修复后的数据流
AI服务配置选择器 → onChange回调 → 更新模型选择器
                ↓
用户配置.chatModels → 模型选择器选项
用户配置.defaultChatModel → 自动选择模型
```

## 🚀 后续优化建议

1. **缓存优化**: 缓存不同配置的模型列表，提高切换速度
2. **加载状态**: 添加配置切换时的加载状态提示
3. **错误处理**: 完善配置无效时的错误提示和处理
4. **用户引导**: 添加首次使用时的操作引导

---

**状态**: ✅ 修复完成，AI服务配置与模型选择器现已正确联动
**验证**: 需要用户测试确认功能是否符合预期
