# Augment Agent 主配置文件

## 📋 目录索引

### 第一部分：核心系统
- [1. 核心规则和元认知工作流](#1-核心规则和元认知工作流)
- [2. 三层记忆系统架构](#2-三层记忆系统架构)
- [3. 性能评估系统（23分制）](#3-性能评估系统23分制)
- [4. 四阶段自我批评循环](#4-四阶段自我批评循环)
- [5. 事件驱动工作流](#5-事件驱动工作流)

### 第二部分：技术栈支持
- [6. 支持的技术栈](#6-支持的技术栈)
- [7. 自动检测机制](#7-自动检测机制)
- [8. 技术栈特定配置](#8-技术栈特定配置)

### 第三部分：命令系统
- [9. augment_init 命令](#9-augment_init-命令)
- [10. augment_reload 命令](#10-augment_reload-命令)
- [11. augment_import_windsurf 命令](#11-augment_import_windsurf-命令)
- [12. augment_force_reset 命令](#12-augment_force_reset-命令)

### 第四部分：使用指南
- [13. 快速开始](#13-快速开始)
- [14. 部署指南](#14-部署指南)
- [15. 故障排除](#15-故障排除)
- [16. 最佳实践](#16-最佳实践)

---

## 1. 核心规则和元认知工作流

### 元认知原则

#### 记忆优先开发（Memory-First Development）
1. **会话开始**：自动加载三层记忆系统
2. **任务执行**：基于历史记忆和当前上下文做决策
3. **状态保存**：完成任务后更新相应记忆层
4. **一致性验证**：定期检查记忆系统的完整性

#### 完整实现要求（Complete Implementation）
- **零占位符原则**：永不留下TODO、FIXME或不完整的实现
- **功能完整性**：每个任务都必须交付完全可用的功能
- **测试覆盖**：为关键功能提供适当的测试验证
- **文档同步**：代码变更时同步更新相关文档

#### 读取后编辑原则（Read Before Edit）
- **上下文理解**：使用 `codebase-retrieval` 深入理解代码结构
- **文件检查**：使用 `view` 工具查看文件内容
- **精确编辑**：使用 `str-replace-editor` 进行精确的代码修改
- **验证修改**：编辑后验证修改的正确性

### 工具使用优先级

#### 核心工具序列
1. **codebase-retrieval**（最高优先级）
   - 理解项目结构和代码关系
   - 获取实现上下文和相关代码
   
2. **view**
   - 检查具体文件内容
   - 验证实现细节和代码结构
   
3. **str-replace-editor**
   - 精确的代码修改和实现
   - 确保修改的准确性和完整性
   
4. **launch-process**
   - 执行构建、测试和包管理命令
   - 验证功能正确性
   
5. **diagnostics**
   - 检查代码质量和潜在问题
   - 识别编译错误和警告
   
6. **save-file**
   - 创建新文件和文档
   - 维护记忆系统文件

### 记忆管理工具
- **文件系统记忆**：使用 save-file 和 str-replace-editor 维护 `.augment_memory/` 目录
- **工具记忆**：使用 `remember` 工具作为补充记忆机制
- **混合策略**：结合文件系统和工具记忆的优势

---

## 2. 三层记忆系统架构

### 工作记忆（Working Memory）
- **位置**：`.augment_memory/activeContext.md`
- **功能**：当前活跃任务上下文和即时目标
- **更新频率**：每个任务开始和完成时更新
- **内容**：当前工作重点、即时决策、临时上下文

### 短期记忆（Short-Term Memory）
- **位置**：`.augment_memory/task-logs/` 目录
- **功能**：最近任务的详细记录和学习模式
- **更新频率**：每个任务完成后创建新日志
- **内容**：任务执行过程、决策记录、实现模式

### 长期记忆（Long-Term Memory）
- **位置**：`.augment_memory/core/` 目录
- **功能**：持久的项目知识和架构决策
- **更新频率**：重大架构决策或模式发现时更新
- **内容**：架构设计、成功模式、最佳实践、重要决策

### 记忆文件结构

```
.augment_memory/                 # 运行时记忆系统（自动生成）
├── core/                        # 长期记忆
│   ├── architecture.md         # 项目架构设计
│   ├── patterns.md             # 成功的实现模式
│   ├── decisions.md            # 重要的架构决策
│   ├── best-practices.md       # 项目特定最佳实践
│   └── tech-stack.md           # 技术栈信息和约定
├── task-logs/                  # 短期记忆
│   ├── task-log_YYYY-MM-DD-HH-MM_description.md
│   └── ...
├── activeContext.md            # 工作记忆
├── memory-index.md             # 记忆索引和元数据
└── session-history.md          # 会话历史记录
```

### 配置与记忆分离

```
.augment_memory_config/          # 配置文件（用户部署）
├── augment_master_config.md    # 主配置文件（本文件）
└── README.md                   # 快速开始指南

.augment_memory/                 # 运行时记忆（系统生成）
├── core/                       # 长期记忆文件
├── task-logs/                  # 短期记忆文件
├── activeContext.md            # 工作记忆文件
├── memory-index.md             # 记忆索引文件
└── session-history.md          # 会话历史文件
```

---

## 3. 性能评估系统（23分制）

### 评分标准
- **优秀**：21-23分 (≥90%) - 超越要求的高质量实现
- **充分**：18-20分 (≥78%) - 满足所有基本要求
- **最低标准**：18分 (≥78%) - 可接受的最低性能
- **不可接受**：<18分 (<78%) - 需要立即修复

### 奖励机制（正分）
- **+10分**：实现优雅、优化的解决方案，超越要求
- **+5分**：有效使用语言特定的高级特性和优化
- **+3分**：完美遵循语言特定风格和社区约定
- **+2分**：用最少代码行解决问题（DRY原则，无冗余）
- **+2分**：高效处理边界情况，不过度复杂化
- **+1分**：提供可移植、可重用或可扩展的解决方案

### 惩罚机制（负分）
- **-10分**：未能解决核心问题或引入错误
- **-5分**：包含占位符注释或懒惰输出
- **-5分**：存在更好选择时使用低效算法或模式
- **-3分**：违反语言风格约定或包含不必要代码
- **-2分**：遗漏可能破坏解决方案的明显边界情况
- **-1分**：过度复杂化解决方案
- **-1分**：依赖过时或次优的库/框架

### 质量保证原则
- 任何得分低于18分的任务被视为失败，需要立即修复
- -5分或-10分的惩罚自动触发失败，无论总分如何
- 不允许例外情况，质量标准不可协商

---

## 4. 四阶段自我批评循环

### 创建者阶段（Creator Phase）
1. **需求分析**：深入理解任务需求和约束条件
2. **技术选型**：选择最适合的技术方案和工具
3. **架构设计**：设计清晰的实现架构
4. **初始实现**：创建完整的功能实现

### 批评者阶段（Critic Phase）
1. **代码审查**：检查实现质量和潜在问题
2. **性能分析**：评估算法效率和资源使用
3. **安全检查**：识别安全漏洞和风险点
4. **边界测试**：发现边界条件和异常情况

### 辩护者阶段（Defender Phase）
1. **问题修复**：系统性解决识别出的问题
2. **性能优化**：改进算法和数据结构
3. **安全加固**：修复安全问题和漏洞
4. **健壮性增强**：添加错误处理和边界检查

### 评判者阶段（Judge Phase）
1. **质量评估**：使用23分制评估最终质量
2. **对比分析**：比较原始版本和改进版本
3. **学习记录**：记录成功模式和失败教训
4. **知识更新**：更新相应的记忆层

---

## 5. 事件驱动工作流

### 会话开始事件（SessionStart）
1. **目录检查**：检查 `.augment_memory/` 目录结构
2. **记忆加载**：加载三层记忆系统内容
3. **一致性验证**：验证记忆文件的完整性
4. **上下文重建**：重建项目工作环境
5. **技术栈识别**：自动检测项目技术栈

### 任务开始事件（TaskStart）
1. **目标文档化**：在activeContext.md中记录任务目标
2. **上下文收集**：使用 `codebase-retrieval` 获取相关代码
3. **历史查询**：检查类似任务的历史记录
4. **计划制定**：制定详细的实现计划
5. **开始循环**：启动四阶段自我批评循环

### 错误检测事件（ErrorDetected）
1. **错误记录**：详细记录错误信息和上下文
2. **历史查询**：查找类似错误的解决方案
3. **根因分析**：深入分析错误的根本原因
4. **修复策略**：制定系统性的修复方案
5. **模式更新**：更新错误处理模式库

### 任务完成事件（TaskComplete）
1. **质量评估**：执行23分制性能评估
2. **日志创建**：在task-logs/中创建详细任务日志
3. **模式提取**：识别和记录成功的实现模式
4. **记忆更新**：更新相应的记忆层
5. **下一步规划**：确定后续任务优先级

### 会话结束事件（SessionEnd）
1. **记忆同步**：确保所有记忆层一致
2. **索引更新**：更新memory-index.md
3. **会话摘要**：创建会话总结
4. **状态保存**：保存当前项目状态

---

## 6. 支持的技术栈

### 完全支持的技术栈

#### JavaScript/TypeScript
- **框架**: React, Vue, Angular, Express, Next.js
- **工具**: npm, yarn, pnpm, Webpack, Vite
- **检测文件**: `package.json`

#### Python
- **框架**: Django, Flask, FastAPI, Streamlit
- **工具**: pip, poetry, conda, pytest
- **检测文件**: `requirements.txt`, `pyproject.toml`

#### Rust
- **类型**: Binary, Library, Workspace
- **工具**: cargo, rustfmt, clippy
- **检测文件**: `Cargo.toml`

#### Java
- **框架**: Spring Boot, Spring MVC
- **工具**: Maven, Gradle, JUnit
- **检测文件**: `pom.xml`, `build.gradle`

#### Go
- **类型**: Module, Package
- **工具**: go mod, go test, go fmt
- **检测文件**: `go.mod`

#### C#/.NET
- **框架**: .NET Core, .NET 5+, ASP.NET
- **工具**: dotnet CLI, NuGet
- **检测文件**: `*.csproj`, `*.sln`

#### PHP
- **框架**: Laravel, Symfony, CodeIgniter
- **工具**: Composer, PHPUnit
- **检测文件**: `composer.json`

#### Ruby
- **框架**: Rails, Sinatra
- **工具**: Bundler, RSpec
- **检测文件**: `Gemfile`

#### C/C++
- **构建系统**: CMake, Makefile
- **工具**: GCC, Clang, Make
- **检测文件**: `CMakeLists.txt`, `Makefile`

---

## 7. 自动检测机制

### 检测逻辑

```
技术栈检测序列：
1. view(".", type="directory") - 扫描根目录
2. 检测关键配置文件：
   - package.json → JavaScript/TypeScript
   - requirements.txt/pyproject.toml → Python
   - Cargo.toml → Rust
   - pom.xml/build.gradle → Java
   - go.mod → Go
   - *.csproj/*.sln → C#/.NET
   - composer.json → PHP
   - Gemfile → Ruby
   - CMakeLists.txt/Makefile → C/C++

3. 设置技术栈特定配置
```

### 配置生成

每种技术栈都会自动生成相应的配置：
- 包管理器设置
- 构建工具配置
- 测试框架集成
- 代码质量工具
- 最佳实践指南

---

## 8. 技术栈特定配置

### JavaScript/TypeScript 项目配置

**自动配置内容**：
- React/Vue/Angular 框架检测
- npm/yarn/pnpm 包管理器
- Webpack/Vite 构建工具
- Jest/Cypress 测试框架
- ESLint/Prettier 代码质量

**tech-stack.md 模板**：
```markdown
# JavaScript/TypeScript 技术栈

## 核心技术
- **运行时**: Node.js v[版本]
- **语言**: [JavaScript/TypeScript]
- **包管理器**: [npm/yarn/pnpm]
- **主要框架**: [框架名称和版本]

## 开发工具
- **构建工具**: [Webpack/Vite/Rollup等]
- **测试框架**: [Jest/Mocha/Cypress等]
- **代码质量**: [ESLint/Prettier配置]
- **类型检查**: [TypeScript配置]

## 常用命令
- **安装依赖**: [npm install/yarn/pnpm install]
- **启动开发**: [npm run dev/yarn dev]
- **构建项目**: [npm run build/yarn build]
- **运行测试**: [npm test/yarn test]
```

### Python 项目配置

**自动配置内容**：
- Django/Flask/FastAPI 框架检测
- pip/poetry/conda 包管理器
- pytest/unittest 测试框架
- black/flake8 代码质量

### 其他技术栈配置

每种技术栈都有相应的自动配置模板，包括：
- 项目结构分析
- 依赖管理配置
- 构建和测试命令
- 代码质量工具设置
- 最佳实践指南

---

## 9. augment_init 命令

### 概述

`augment_init` 是一个自动化命令，能够在任何项目中一键部署完整的Augment Agent元认知工作流系统。该命令会自动检测技术栈、创建记忆系统、初始化配置文件，并执行完整的SessionStart流程。

### 使用方法

#### 基本用法
```
在Augment Agent中说：
"执行 augment_init 命令初始化项目"
```

#### 高级用法
```
"执行 augment_init 命令，强制重新初始化所有配置"
"执行 augment_init 命令，仅检测技术栈不创建文件"
```

### 完整实施流程

#### 阶段1：环境检查和准备

```markdown
## 步骤1.1：检查当前目录
工具调用：view(".", type="directory")
目的：确认在项目根目录，扫描项目文件

## 步骤1.2：检查现有配置
工具调用：view(".augment_memory", type="directory")
结果处理：
- 如果目录存在：询问是否覆盖或更新
- 如果目录不存在：继续初始化流程
```

#### 阶段2：技术栈自动检测

```markdown
## 步骤2.1：扫描配置文件
检测序列：
1. view("package.json") → JavaScript/TypeScript/Node.js
2. view("requirements.txt") → Python
3. view("pyproject.toml") → Python (Poetry)
4. view("Cargo.toml") → Rust
5. view("pom.xml") → Java (Maven)
6. view("build.gradle") → Java (Gradle)
7. view("go.mod") → Go
8. view("*.csproj") → C#/.NET
9. view("composer.json") → PHP
10. view("Gemfile") → Ruby
11. view("CMakeLists.txt") → C/C++

## 步骤2.2：技术栈确定
基于检测结果确定：
- 主要编程语言
- 框架和库
- 包管理器
- 构建工具
- 测试框架
```

#### 阶段3：记忆系统创建

```markdown
## 步骤3.1：创建核心目录结构
工具调用序列：
1. save-file(".augment_memory/core/architecture.md", 架构模板)
2. save-file(".augment_memory/core/patterns.md", 模式模板)
3. save-file(".augment_memory/core/decisions.md", 决策模板)
4. save-file(".augment_memory/core/best-practices.md", 最佳实践模板)
5. save-file(".augment_memory/core/tech-stack.md", 技术栈信息)

## 步骤3.2：创建工作记忆
工具调用：save-file(".augment_memory/activeContext.md", 工作记忆模板)

## 步骤3.3：创建管理文件
工具调用：
1. save-file(".augment_memory/memory-index.md", 索引模板)
2. save-file(".augment_memory/session-history.md", 会话历史模板)
```

#### 阶段4：项目分析和上下文建立

```markdown
## 步骤4.1：项目整体分析
工具调用：codebase-retrieval("项目整体架构、主要模块、技术栈、开发状态和关键组件")

## 步骤4.2：关键文件分析
1. view("README.md") - 项目描述
2. view(主配置文件) - 根据技术栈确定
3. view(".gitignore") - 项目结构理解

## 步骤4.3：架构信息写入
基于分析结果更新：
- .augment_memory/core/architecture.md
- .augment_memory/core/patterns.md
- .augment_memory/activeContext.md
```

### 错误处理机制

#### 常见错误和解决方案

```markdown
1. 权限错误
错误：无法创建 .augment_memory/ 目录
解决：
- 检查当前目录写入权限
- 尝试使用 sudo 权限（如果适用）
- 建议用户手动创建目录

2. 技术栈检测失败
错误：无法识别项目技术栈
解决：
- 使用通用配置模板
- 提示用户手动指定技术栈
- 记录检测失败的详细信息

3. 文件创建失败
错误：记忆文件创建失败
解决：
- 检查磁盘空间
- 验证文件路径有效性
- 提供备用创建方案
```

### 验证和确认

```markdown
初始化成功验证：
□ .augment_memory/ 目录结构完整
□ 所有核心记忆文件存在
□ 技术栈正确识别和配置
□ 工作记忆包含项目信息
□ 记忆索引文件有效
□ 会话历史记录创建
□ 工具记忆已更新
□ 项目上下文成功建立
```

---

## 10. augment_reload 命令

### 概述

`augment_reload` 是一个记忆系统刷新命令，类似于Windsurf的记忆重载功能。该命令会重新加载所有记忆层、验证记忆一致性、重建项目上下文，并清理过期信息。

### 使用方法

#### 基本用法
```
在Augment Agent中说：
"执行 augment_reload 命令重新加载项目记忆"
```

#### 高级用法
```
"执行 augment_reload 命令，强制重建所有上下文"
"执行 augment_reload 命令，仅验证记忆一致性"
"执行 augment_reload 命令，清理过期的任务日志"
```

### 完整实施流程

#### 阶段1：记忆系统状态检查

```markdown
## 步骤1.1：验证记忆系统存在
工具调用：view(".augment_memory", type="directory")
目的：确认记忆系统已初始化

如果目录不存在：
- 提示用户先运行 augment_init
- 提供快速初始化选项

## 步骤1.2：检查记忆文件完整性
工具调用序列：
1. view(".augment_memory/memory-index.md") - 检查索引文件
2. view(".augment_memory/activeContext.md") - 检查工作记忆
3. view(".augment_memory/core", type="directory") - 检查长期记忆
4. view(".augment_memory/task-logs", type="directory") - 检查短期记忆
```

#### 阶段2：记忆一致性验证

```markdown
## 步骤2.1：加载记忆索引
view(".augment_memory/memory-index.md")
解析内容：
- 检查元数据完整性
- 验证文件校验和
- 确认最后更新时间

## 步骤2.2：验证长期记忆
工具调用序列：
1. view(".augment_memory/core/architecture.md")
2. view(".augment_memory/core/patterns.md")
3. view(".augment_memory/core/decisions.md")
4. view(".augment_memory/core/best-practices.md")
5. view(".augment_memory/core/tech-stack.md")

验证内容：
- 文件格式正确性
- 内容逻辑一致性
- 技术栈信息准确性
```

#### 阶段3：项目上下文重新分析

```markdown
## 步骤3.1：重新扫描项目结构
codebase-retrieval("项目当前状态、最新的代码变更、架构演进和新增功能")

## 步骤3.2：检查技术栈变更
1. view(".", type="directory") - 扫描根目录
2. 检查主要配置文件是否有变更
3. 对比当前状态与记忆中的状态

## 步骤3.3：分析项目变更
- 新增的文件和模块
- 依赖关系的变化
- 架构的演进
- 配置的更新
```

### 触发条件和时机

#### 自动触发条件
```markdown
1. 容量阈值触发
   - activeContext.md 大小超过70%阈值
   - 工作记忆内容过于复杂

2. 时间触发
   - 会话持续时间超过2小时
   - 距离上次重载超过24小时

3. 变更触发
   - 检测到重大项目变更
   - 技术栈配置更新
   - 架构重构完成
```

#### 手动触发场景
```markdown
1. 项目状态变更
   - 切换开发分支
   - 合并重要功能
   - 升级依赖版本

2. 性能优化
   - 记忆系统响应变慢
   - 上下文理解不准确
   - 需要清理冗余信息

3. 问题排查
   - 记忆一致性问题
   - 配置信息过期
   - 工作流程异常
```

#### 高级用法
```
"执行 augment_import_windsurf 命令，仅导入核心记忆文件"
"执行 augment_import_windsurf 命令，包含任务日志和计划文件"
"执行 augment_import_windsurf 命令，合并到现有Augment配置"
```

### 完整实施流程

#### 阶段1：Windsurf系统检测

```markdown
## 步骤1.1：检查Windsurf目录
工具调用：view(".windsurf", type="directory")
目的：确认Windsurf配置存在

如果目录不存在：
- 提示用户Windsurf配置未找到
- 建议直接使用 augment_init

## 步骤1.2：分析Windsurf结构
工具调用序列：
1. view(".windsurf/memory-index.md") - 检查记忆索引
2. view(".windsurf/core", type="directory") - 检查核心记忆
3. view(".windsurf/task-logs", type="directory") - 检查任务日志
4. view(".windsurf/plans", type="directory") - 检查计划文件
5. view(".windsurf/errors", type="directory") - 检查错误记录
```

#### 阶段2：内容分析和转换

```markdown
## 步骤2.1：核心记忆文件导入
导入序列：
1. view(".windsurf/core/activeContext.md") → .augment/activeContext.md
2. view(".windsurf/core/projectbrief.md") → .augment/core/architecture.md
3. view(".windsurf/core/techContext.md") → .augment/core/tech-stack.md
4. view(".windsurf/core/systemPatterns.md") → .augment/core/patterns.md
5. view(".windsurf/core/progress.md") → .augment/core/decisions.md

## 步骤2.2：格式转换和适配
转换规则：
- 保持Markdown格式不变
- 调整章节结构以符合Augment标准
- 转换元数据格式
- 保留所有原始内容和时间戳
```

#### 阶段3：任务日志迁移

```markdown
## 步骤3.1：任务日志扫描
工具调用：view(".windsurf/task-logs", type="directory")
识别所有任务日志文件

## 步骤3.2：日志格式转换
转换过程：
1. 保持原有的任务信息结构
2. 转换为Augment的23分制评分格式
3. 添加四阶段循环标记
4. 保留原始时间戳和文件名

## 步骤3.3：批量导入
工具调用序列：
for each task_log in windsurf_task_logs:
    view(task_log) → 转换格式 → save-file(.augment/task-logs/converted_log)
```

#### 阶段4：配置整合和验证

```markdown
## 步骤4.1：技术栈信息整合
合并策略：
- Windsurf的技术上下文 + 当前项目检测结果
- 保留Windsurf的历史配置信息
- 添加Augment的自动检测功能

## 步骤4.2：记忆索引重建
工具调用：str-replace-editor(".augment/memory-index.md")
更新内容：
- 合并Windsurf和Augment的记忆文件信息
- 重新计算文件大小和校验和
- 更新创建和修改时间
```

### 导入策略和选项

#### 导入模式

```markdown
1. 完全导入模式（默认）
   - 导入所有Windsurf记忆文件
   - 导入所有任务日志
   - 导入计划和错误记录
   - 创建完整的Augment配置

2. 核心导入模式
   - 仅导入核心记忆文件
   - 跳过任务日志和临时文件
   - 适用于快速迁移场景

3. 合并导入模式
   - 与现有Augment配置合并
   - 智能处理冲突和重复
   - 保留两个系统的优势
```

#### 冲突处理

```markdown
1. 文件名冲突
   - 自动重命名：添加时间戳后缀
   - 内容合并：智能合并相似内容
   - 用户选择：提示用户决定保留哪个版本

2. 格式差异
   - 自动转换：标准化为Augment格式
   - 保留原始：在注释中保留原始格式
   - 双重保存：同时保存两种格式

3. 内容重复
   - 去重处理：自动识别和去除重复内容
   - 版本合并：合并不同版本的相同内容
   - 历史保留：保留完整的历史记录
```

### 验证和确认

```markdown
导入成功验证：
□ Windsurf核心记忆文件已导入
□ 任务日志格式转换正确
□ 技术栈信息合并完整
□ 记忆索引更新成功
□ 文件完整性验证通过
□ 时间戳和元数据保留
□ Augment系统功能正常
□ 导入日志记录完整
```

---

## 12. augment_force_reset 命令

### 概述

`augment_force_reset` 是一个强制重置命令，能够完全清除所有Augment Agent配置和记忆，将系统重置为干净状态。该命令提供安全确认机制，支持选择性重置。

### 使用方法

#### 基本用法
```
在Augment Agent中说：
"执行 augment_force_reset 命令重置所有配置"
```

#### 高级用法
```
"执行 augment_force_reset 命令，仅删除配置保留记忆"
"执行 augment_force_reset 命令，完全重置包括备份"
"执行 augment_force_reset 命令，重置后自动重新初始化"
```

### 完整实施流程

#### 阶段1：安全确认和备份

```markdown
## 步骤1.1：安全确认
确认序列：
1. 显示将要删除的内容清单
2. 要求用户明确确认（输入特定确认码）
3. 提供取消选项和备份建议
4. 记录重置操作的原因和时间

## 步骤1.2：自动备份
备份策略：
1. 创建 .augment_backup_TIMESTAMP/ 目录
2. 复制所有重要记忆文件
3. 保存当前配置状态快照
4. 生成备份清单和恢复指南
```

#### 阶段2：选择性重置选项

```markdown
## 重置级别选择

### 级别1：配置重置（保留记忆）
删除内容：
- .augment_memory/ 目录（配置文件）
- 工具配置和缓存
保留内容：
- .augment/core/ 目录（长期记忆）
- .augment/task-logs/ 目录（任务历史）
- .augment/activeContext.md（当前上下文）

### 级别2：记忆重置（保留配置）
删除内容：
- .augment/ 目录（所有记忆文件）
- 任务日志和历史记录
保留内容：
- .augment_memory/ 目录（配置文件）
- 用户自定义配置

### 级别3：完全重置
删除内容：
- .augment/ 目录（完整记忆系统）
- .augment_memory/ 目录（配置系统）
- 所有相关缓存和临时文件
- 工具记忆中的项目信息
```

#### 阶段3：执行重置操作

```markdown
## 步骤3.1：文件系统清理
清理序列：
1. 停止所有相关进程
2. 清除文件系统记忆
3. 删除指定的目录和文件
4. 清理工具记忆缓存
5. 重置环境变量和配置

## 步骤3.2：验证清理结果
验证步骤：
1. 确认目标文件和目录已删除
2. 检查是否有残留文件
3. 验证系统状态已重置
4. 确认备份文件完整性
```

#### 阶段4：可选的重新初始化

```markdown
## 步骤4.1：自动重新初始化
如果用户选择自动重新初始化：
1. 立即执行 augment_init 命令
2. 使用默认配置创建新的记忆系统
3. 从备份中恢复重要信息（可选）
4. 验证新系统功能正常

## 步骤4.2：恢复指导
提供恢复选项：
1. 从备份恢复特定文件
2. 重新导入Windsurf配置
3. 手动重建记忆系统
4. 联系技术支持
```

### 安全机制和保护

#### 确认机制

```markdown
1. 三级确认系统
   - 第一级：命令确认（确认执行重置）
   - 第二级：范围确认（确认重置范围）
   - 第三级：最终确认（输入确认码：RESET-CONFIRM）

2. 冷却期机制
   - 重要操作前30秒冷却期
   - 显示倒计时和取消选项
   - 允许用户重新考虑决定

3. 操作日志
   - 详细记录重置操作
   - 保存操作时间和用户信息
   - 记录重置原因和范围
```

#### 数据保护

```markdown
1. 强制备份
   - 重置前自动创建备份
   - 备份文件包含完整恢复信息
   - 备份保留期：30天

2. 关键文件保护
   - 识别和保护重要的项目文件
   - 避免误删除项目源代码
   - 仅删除Augment相关文件

3. 恢复支持
   - 提供详细的恢复指南
   - 支持部分恢复和选择性恢复
   - 提供技术支持联系方式
```

### 使用场景和建议

#### 适用场景

```markdown
1. 系统故障恢复
   - 记忆系统损坏无法修复
   - 配置文件冲突严重
   - 性能问题无法解决

2. 项目迁移
   - 切换到新的项目环境
   - 更改技术栈或架构
   - 清理历史遗留问题

3. 测试和开发
   - 测试新配置和功能
   - 开发环境清理
   - 演示和培训准备

4. 安全和隐私
   - 清除敏感信息
   - 符合数据保护要求
   - 系统交接准备
```

#### 使用建议

```markdown
1. 重置前准备
   - 确认重置的必要性
   - 备份重要的项目文件
   - 记录当前配置和设置
   - 准备重新初始化的时间

2. 重置后恢复
   - 立即执行 augment_init 重新初始化
   - 从备份中恢复重要信息
   - 验证系统功能正常
   - 更新项目文档和记录

3. 预防措施
   - 定期备份重要配置
   - 使用版本控制管理配置文件
   - 记录重要的配置变更
   - 建立恢复流程和文档
```

---

## 13. 快速开始

### 🚀 一键部署（推荐）

在任何项目中，只需要运行一个简单命令：

```
在Augment Agent中说：
"执行 augment_init 命令初始化项目"
```

系统将自动：
- ✅ 检测项目技术栈
- ✅ 创建完整的记忆系统
- ✅ 配置开发工具链
- ✅ 建立项目上下文
- ✅ 启动AI辅助开发工作流

### 📋 使用流程

#### 1. 新项目部署

```bash
# 步骤1: 进入项目根目录
cd /path/to/your/project

# 步骤2: 在Augment Agent中执行初始化
"执行 augment_init 命令初始化项目"
```

#### 2. 现有项目集成

```bash
# 直接在项目根目录运行
"执行 augment_init 命令初始化项目"
```

#### 3. 从Windsurf迁移

```bash
# 如果项目已有Windsurf配置
"执行 augment_import_windsurf 命令导入Windsurf配置"
```

#### 4. 日常使用

```bash
# 开始新的开发会话
"执行 augment_reload 命令重新加载项目记忆"

# 正常开发（系统自动应用工作流）
"帮我实现用户登录功能"
"优化这个函数的性能"
"为这个模块编写测试"
```

### 🧠 记忆系统说明

#### 三层记忆架构

**工作记忆（Working Memory）**
- **位置**: `.augment/activeContext.md`
- **内容**: 当前任务、即时目标、临时上下文
- **更新**: 每个任务开始/完成时

**短期记忆（Short-Term Memory）**
- **位置**: `.augment/task-logs/`
- **内容**: 最近任务的详细记录
- **管理**: 自动归档30天前的日志

**长期记忆（Long-Term Memory）**
- **位置**: `.augment/core/`
- **内容**: 架构设计、成功模式、重要决策
- **更新**: 重大架构决策时

#### 记忆文件结构

```
.augment/
├── core/                    # 长期记忆
│   ├── architecture.md     # 项目架构
│   ├── patterns.md         # 成功模式
│   ├── decisions.md        # 重要决策
│   ├── best-practices.md   # 最佳实践
│   └── tech-stack.md       # 技术栈信息
├── task-logs/              # 短期记忆
│   ├── task-log_YYYY-MM-DD-HH-MM_description.md
│   └── ...
├── activeContext.md        # 工作记忆
├── memory-index.md         # 记忆索引
└── session-history.md      # 会话历史
```

### ⚙️ 工作流说明

#### 四阶段自我批评循环

1. **创建者阶段**: 生成初始解决方案
2. **批评者阶段**: 识别问题和改进点
3. **辩护者阶段**: 系统性解决问题
4. **评判者阶段**: 质量评估和学习记录

#### 23分制评分系统

- **优秀**: 21-23分 (≥90%)
- **充分**: 18-20分 (≥78%)
- **最低标准**: 18分 (≥78%)
- **不可接受**: <18分 (<78%)

#### 事件驱动工作流

- **SessionStart**: 会话开始，加载记忆系统
- **TaskStart**: 任务开始，建立上下文
- **TaskComplete**: 任务完成，更新记忆
- **ErrorDetected**: 错误检测，执行恢复
- **SessionEnd**: 会话结束，同步记忆

---

## 14. 部署指南

### 📦 配置文件部署

#### 方案1：直接使用（推荐）

在任何项目中，直接使用Augment Agent执行：

```
"执行 augment_init 命令初始化项目"
```

系统会自动：
1. 检测项目技术栈
2. 创建 `.augment/` 记忆系统
3. 配置开发工具链
4. 建立项目上下文

#### 方案2：配置文件复制

如果需要自定义配置：

```bash
# 复制配置文件到目标项目
cp -r .augment_memory/ /path/to/your/project/

# 在目标项目中执行初始化
cd /path/to/your/project/
# 然后在Augment Agent中说：
"执行 augment_init 命令初始化项目"
```

### 🔧 技术栈特定部署

#### JavaScript/TypeScript 项目

```bash
# 项目结构示例
my-react-app/
├── package.json          # 自动检测
├── src/
├── public/
└── .augment/             # 自动创建
    ├── core/
    │   └── tech-stack.md # 自动配置React+TypeScript
    └── ...
```

**自动配置内容**：
- React/Vue/Angular 框架检测
- npm/yarn/pnpm 包管理器
- Webpack/Vite 构建工具
- Jest/Cypress 测试框架

#### Python 项目

```bash
# 项目结构示例
my-django-app/
├── requirements.txt      # 自动检测
├── manage.py
├── myapp/
└── .augment/            # 自动创建
    ├── core/
    │   └── tech-stack.md # 自动配置Django+Python
    └── ...
```

**自动配置内容**：
- Django/Flask/FastAPI 框架检测
- pip/poetry/conda 包管理器
- pytest/unittest 测试框架
- black/flake8 代码质量工具

#### 其他技术栈

每种技术栈都有相应的自动配置，包括：
- 项目结构分析
- 依赖管理配置
- 构建和测试命令
- 代码质量工具设置
- 最佳实践指南

### 📋 部署验证清单

#### 基础验证

```markdown
□ .augment/ 目录已创建
□ 所有核心记忆文件存在
□ 技术栈正确识别
□ activeContext.md 包含项目信息
□ memory-index.md 文件有效
```

#### 功能验证

```markdown
□ 可以执行 augment_reload 命令
□ 项目上下文分析正确
□ 代码分析功能正常
□ 任务执行记录到日志
□ 质量评分系统工作
```

#### 性能验证

```markdown
□ 初始化时间 < 30秒
□ 记忆加载时间 < 10秒
□ 上下文分析准确
□ 工具调用响应及时
□ 记忆系统稳定
```

### 🔄 升级和维护

#### 配置更新

当有新版本配置时：

```bash
# 备份现有配置
cp -r .augment/ .augment.backup/

# 更新配置文件
cp -r new-config/.augment_memory/ ./

# 重新加载
# 在Augment Agent中说：
"执行 augment_reload 命令重新加载项目记忆"
```

#### 定期维护

建议的维护任务：

```bash
# 每周执行一次记忆重载
"执行 augment_reload 命令重新加载项目记忆"

# 每月清理一次任务日志
# 系统会自动归档30天前的日志

# 项目重大变更后更新配置
# 编辑 .augment/core/tech-stack.md
# 然后执行 augment_reload
```

---

## 15. 故障排除

### 🔧 常见问题和解决方案

#### 问题1：初始化失败

**症状**：
- `augment_init` 命令执行失败
- 无法创建 `.augment/` 目录
- 技术栈检测失败

**解决方案**：

```markdown
1. 权限问题
   - 检查当前目录写入权限
   - 确保在项目根目录执行命令
   - 尝试使用管理员权限

2. 技术栈检测失败
   - 手动检查项目配置文件是否存在
   - 确认项目结构符合标准
   - 使用通用配置模板

3. 网络或系统问题
   - 检查磁盘空间是否充足
   - 确认系统资源可用
   - 重启Augment Agent会话
```

#### 问题2：记忆系统不一致

**症状**：
- 记忆文件内容冲突
- 索引文件与实际文件不匹配
- 上下文理解不准确

**解决方案**：

```markdown
1. 执行记忆重载
   "执行 augment_reload 命令重新加载项目记忆"

2. 手动修复
   - 检查 .augment/memory-index.md
   - 验证所有核心文件存在
   - 重新生成索引文件

3. 完全重置（最后手段）
   "执行 augment_force_reset 命令重置所有配置"
   然后重新初始化
```

#### 问题3：性能问题

**症状**：
- 命令执行缓慢
- 记忆加载时间过长
- 上下文分析不准确

**解决方案**：

```markdown
1. 清理过期数据
   - 删除30天前的任务日志
   - 清理临时文件和缓存
   - 压缩大型记忆文件

2. 优化配置
   - 减少工作记忆内容
   - 简化项目上下文
   - 更新技术栈配置

3. 系统重载
   "执行 augment_reload 命令重新加载项目记忆"
```

#### 问题4：Windsurf导入失败

**症状**：
- 无法找到Windsurf配置
- 导入过程中断
- 格式转换错误

**解决方案**：

```markdown
1. 检查Windsurf配置
   - 确认 .windsurf/ 目录存在
   - 验证核心文件完整性
   - 检查文件权限

2. 手动导入
   - 逐个文件检查和转换
   - 手动创建Augment配置
   - 保留原始Windsurf文件

3. 混合方案
   - 使用 augment_init 创建新配置
   - 手动复制重要内容
   - 逐步迁移历史记录
```

### 🔍 诊断工具和方法

#### 系统状态检查

```markdown
1. 检查目录结构
   - 确认 .augment/ 目录存在
   - 验证所有核心文件完整
   - 检查文件权限和大小

2. 验证记忆一致性
   - 对比索引文件与实际文件
   - 检查文件修改时间
   - 验证内容格式正确性

3. 测试核心功能
   - 执行 augment_reload 命令
   - 测试项目上下文分析
   - 验证任务日志记录
```

#### 日志分析

```markdown
1. 查看会话历史
   - 检查 .augment/session-history.md
   - 分析最近的操作记录
   - 识别异常模式

2. 分析任务日志
   - 查看最近的任务执行记录
   - 检查错误和警告信息
   - 分析性能指标

3. 系统日志
   - 检查Augment Agent系统日志
   - 查看工具调用记录
   - 分析错误堆栈信息
```

### 📞 获取帮助

#### 自助资源

```markdown
1. 文档资源
   - 查看本配置文件的相关章节
   - 参考技术栈特定指南
   - 查看命令使用说明

2. 社区支持
   - 搜索类似问题的解决方案
   - 查看最佳实践指南
   - 参考成功案例

3. 实验和测试
   - 在测试环境中重现问题
   - 尝试不同的解决方案
   - 记录解决过程
```

#### 报告问题

```markdown
1. 问题描述
   - 详细描述问题症状
   - 提供错误信息和日志
   - 说明重现步骤

2. 环境信息
   - 项目技术栈和版本
   - 操作系统和环境
   - Augment Agent版本

3. 配置信息
   - 提供相关配置文件
   - 说明自定义设置
   - 包含目录结构信息
```

---

## 16. 最佳实践

### 🎯 开发工作流最佳实践

#### 会话管理

```markdown
1. 会话开始
   - 总是从 augment_reload 开始新会话
   - 确认项目上下文正确加载
   - 检查记忆系统状态

2. 任务规划
   - 将大任务分解为小任务
   - 明确定义任务目标和成功标准
   - 考虑任务间的依赖关系

3. 会话结束
   - 确认所有任务完成
   - 检查记忆系统更新
   - 记录重要决策和学习
```

#### 记忆管理

```markdown
1. 工作记忆优化
   - 保持activeContext.md简洁明确
   - 及时更新当前任务状态
   - 避免信息过载

2. 长期记忆维护
   - 定期更新架构文档
   - 记录重要的设计决策
   - 维护最佳实践库

3. 短期记忆清理
   - 定期归档旧任务日志
   - 保留有价值的学习记录
   - 清理冗余信息
```

#### 质量保证

```markdown
1. 代码质量
   - 始终追求18分以上的质量评分
   - 重视代码审查和重构
   - 遵循技术栈最佳实践

2. 测试策略
   - 为关键功能编写测试
   - 使用自动化测试工具
   - 定期执行回归测试

3. 文档维护
   - 保持代码和文档同步
   - 记录重要的架构决策
   - 提供清晰的使用指南
```

### 🔄 项目生命周期管理

#### 项目初期

```markdown
1. 架构设计
   - 使用四阶段循环设计架构
   - 记录重要的设计决策
   - 建立代码质量标准

2. 技术选型
   - 基于项目需求选择技术栈
   - 考虑团队技能和经验
   - 评估长期维护成本

3. 开发环境
   - 配置一致的开发环境
   - 建立自动化构建流程
   - 设置代码质量检查
```

#### 项目中期

```markdown
1. 迭代开发
   - 使用短迭代周期
   - 定期评估和调整
   - 保持代码质量

2. 团队协作
   - 共享记忆系统和最佳实践
   - 定期进行代码审查
   - 维护团队知识库

3. 性能优化
   - 定期进行性能分析
   - 优化关键路径
   - 监控系统指标
```

#### 项目后期

```markdown
1. 系统稳定性
   - 加强错误处理
   - 提高系统可靠性
   - 完善监控和告警

2. 文档完善
   - 更新用户文档
   - 完善API文档
   - 记录运维指南

3. 知识传承
   - 整理项目经验
   - 更新最佳实践
   - 培训新团队成员
```

### 🚀 性能优化建议

#### 记忆系统优化

```markdown
1. 文件大小控制
   - 保持单个记忆文件 < 100KB
   - 定期清理冗余内容
   - 使用压缩和归档

2. 访问模式优化
   - 优先访问热点记忆
   - 缓存常用信息
   - 延迟加载大文件

3. 索引优化
   - 保持索引文件最新
   - 使用高效的查找算法
   - 定期重建索引
```

#### 工作流优化

```markdown
1. 任务分解
   - 将复杂任务分解为简单任务
   - 并行执行独立任务
   - 优化任务执行顺序

2. 工具使用
   - 熟练使用核心工具
   - 避免不必要的工具调用
   - 批量处理相似操作

3. 上下文管理
   - 保持上下文聚焦
   - 避免频繁切换上下文
   - 使用上下文缓存
```

### 📊 质量度量和改进

#### 关键指标

```markdown
1. 质量指标
   - 平均任务评分 > 18分
   - 代码审查通过率 > 90%
   - 测试覆盖率 > 80%

2. 效率指标
   - 任务完成时间
   - 记忆系统响应时间
   - 错误修复时间

3. 学习指标
   - 成功模式识别率
   - 知识重用率
   - 团队技能提升
```

#### 持续改进

```markdown
1. 定期评估
   - 每月评估系统性能
   - 分析质量趋势
   - 识别改进机会

2. 流程优化
   - 简化复杂流程
   - 自动化重复任务
   - 标准化最佳实践

3. 知识管理
   - 更新最佳实践库
   - 分享成功经验
   - 学习失败教训
```

---

## 📚 附录

### 版本信息

- **配置版本**: 2.0 (Windsurf-Compatible)
- **创建日期**: 2024-01-15
- **最后更新**: 2024-01-15
- **兼容性**: 支持所有主流技术栈

### 更新日志

#### v2.0 (2024-01-15)
- 🎉 基于Windsurf最佳实践重新设计
- ✨ 整合8个配置文件为单一主配置
- 🚀 新增Windsurf导入和强制重置命令
- 📁 采用分层目录结构 (.augment_memory/)
- 🔧 简化部署流程和用户体验

#### v1.0 (2024-01-01)
- 🎯 初始版本，支持基础功能
- 📝 8个独立配置文件
- 🧠 三层记忆系统
- ⚙️ 四阶段自我批评循环
- 📊 23分制评分系统

### 技术支持

如需技术支持或有改进建议，请：
1. 查看本配置文件的相关章节
2. 使用故障排除指南
3. 参考最佳实践建议
4. 联系开发团队

### 许可证

本配置系统采用MIT许可证，允许自由使用、修改和分发。

---

**🎉 恭喜！您已完成Augment Agent配置系统的学习。现在可以开始享受高效的AI辅助开发体验！**
