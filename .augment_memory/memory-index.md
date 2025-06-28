# 记忆系统索引

## 记忆系统概览

**创建时间**: 2025-06-28  
**项目**: auto-prompt (AI提示词管理平台)  
**技术栈**: .NET Core + React  
**记忆系统版本**: v1.0  

## 三层记忆架构

### 1. 长期记忆 (Long-Term Memory)
**位置**: `.augment_memory/core/`  
**功能**: 存储项目的核心架构、设计模式、技术决策等长期稳定的信息

#### 核心文件
- **architecture.md** - 项目架构文档
  - 技术栈架构 (.NET + React)
  - 核心模块 (提示词管理、AI集成、用户界面)
  - 开发工具链和部署架构
  - 项目特点和业务特色

- **patterns.md** - 开发模式和最佳实践
  - 架构模式 (分层架构、提供者模式、依赖注入)
  - 前端开发模式 (组件化、状态管理、路由)
  - 后端开发模式 (控制器、服务层、仓储)
  - 配置和错误处理模式

- **decisions.md** - 技术决策记录 (ADR)
  - ADR-001: 全栈技术架构选择
  - ADR-002: React 19前端框架
  - ADR-003: Ant Design UI组件库
  - ADR-004: TipTap富文本编辑器
  - ADR-005: Zustand状态管理
  - ADR-006: 多数据库支持策略
  - ADR-007: Docker容器化部署

- **best-practices.md** - 开发最佳实践
  - 通用开发原则 (代码质量、版本控制)
  - .NET后端最佳实践 (项目结构、依赖注入、异常处理)
  - React前端最佳实践 (组件设计、状态管理、性能优化)
  - 安全最佳实践 (API安全、环境变量管理)

- **tech-stack.md** - 技术栈详细信息
  - 后端技术栈 (.NET Core详细配置)
  - 前端技术栈 (React生态系统)
  - 开发工具链 (构建、测试、部署)
  - AI集成支持 (多提供商支持)
  - 性能和安全特性

### 2. 工作记忆 (Working Memory)
**位置**: `.augment_memory/activeContext.md`  
**功能**: 当前活跃任务上下文和即时目标

#### 当前内容
- **会话信息**: 当前任务状态和优先级
- **项目当前状态**: 基本信息和技术栈检测结果
- **任务进度**: 已完成、进行中、待完成的任务
- **关键发现**: 项目特点、架构优势、开发工具链
- **即时目标**: 短期和中期目标规划
- **注意事项**: 技术约束、开发重点、安全考虑

### 3. 短期记忆 (Short-Term Memory)
**位置**: `.augment_memory/task-logs/`  
**功能**: 最近任务的详细记录和学习模式

#### 任务日志结构
```
task-logs/
├── task-log_2025-06-28-[时间]_项目初始化.md
└── [未来任务日志...]
```

## 记忆文件关系图

```
.augment_memory/
├── core/                           # 长期记忆
│   ├── architecture.md            # 项目架构 ←→ tech-stack.md
│   ├── patterns.md                # 开发模式 ←→ best-practices.md
│   ├── decisions.md               # 技术决策 ←→ architecture.md
│   ├── best-practices.md          # 最佳实践 ←→ patterns.md
│   └── tech-stack.md              # 技术栈 ←→ decisions.md
├── task-logs/                      # 短期记忆
│   └── [任务执行日志]
├── activeContext.md                # 工作记忆 ←→ 所有文件
├── memory-index.md                 # 本文件 (记忆索引)
└── session-history.md              # 会话历史
```

## 记忆更新策略

### 自动更新触发条件
1. **技术栈变更**: 更新 tech-stack.md 和 architecture.md
2. **架构调整**: 更新 architecture.md 和 patterns.md
3. **新技术决策**: 添加新的ADR到 decisions.md
4. **最佳实践发现**: 更新 best-practices.md
5. **任务完成**: 创建新的任务日志

### 手动更新场景
1. **重大重构**: 全面更新长期记忆
2. **技术升级**: 更新相关技术文档
3. **新功能开发**: 更新架构和模式文档
4. **性能优化**: 更新最佳实践文档

## 记忆查询指南

### 按需求类型查询
- **架构理解**: architecture.md → tech-stack.md
- **开发指导**: patterns.md → best-practices.md
- **决策背景**: decisions.md → architecture.md
- **当前状态**: activeContext.md
- **历史任务**: task-logs/ 目录

### 按技术领域查询
- **前端开发**: patterns.md (React部分) + best-practices.md (前端部分)
- **后端开发**: patterns.md (.NET部分) + best-practices.md (后端部分)
- **数据库**: decisions.md (ADR-006) + tech-stack.md (数据访问部分)
- **部署运维**: tech-stack.md (部署部分) + decisions.md (ADR-007)

## 记忆维护计划

### 定期维护 (每周)
- 检查 activeContext.md 是否需要更新
- 清理过期的任务日志
- 验证记忆文件之间的一致性

### 版本更新 (每月)
- 更新技术栈版本信息
- 补充新的最佳实践
- 添加新的技术决策记录

### 重大更新 (按需)
- 架构重构时全面更新
- 技术栈升级时同步更新
- 新功能模块时扩展文档

## 记忆质量指标

### 完整性指标
- ✅ 核心架构文档完整
- ✅ 技术决策记录完整
- ✅ 最佳实践覆盖全面
- ✅ 当前上下文准确

### 一致性指标
- ✅ 技术栈信息一致
- ✅ 架构描述一致
- ✅ 决策记录一致
- ✅ 实践指导一致

### 时效性指标
- ✅ 信息更新及时
- ✅ 状态反映准确
- ✅ 版本标记清晰
- ✅ 历史记录完整

---

*索引创建时间: 2025-06-28*  
*索引版本: v1.0*  
*下次更新: 根据项目进展*
