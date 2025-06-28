# 开发模式和最佳实践

## 架构模式

### 1. 分层架构模式
```
前端层 (React/TypeScript)
    ↓
API层 (ASP.NET Core)
    ↓
业务逻辑层 (Console.Core)
    ↓
数据访问层 (Provider)
    ↓
数据存储层 (SQLite/PostgreSQL)
```

### 2. 提供者模式 (Provider Pattern)
- **Console.Provider.Sqlite** - SQLite数据提供者
- **Console.Provider.PostgreSQL** - PostgreSQL数据提供者
- 支持运行时数据库切换
- 统一的数据访问接口

### 3. 依赖注入模式
- .NET Core内置DI容器
- 服务生命周期管理
- 配置和服务解耦

## 前端开发模式

### 1. 组件化开发
```typescript
// 函数式组件 + Hooks
const PromptEditor: React.FC<Props> = ({ prompt, onChange }) => {
  const [content, setContent] = useState(prompt.content);
  
  return (
    <TipTapEditor 
      content={content}
      onChange={handleChange}
    />
  );
};
```

### 2. 状态管理模式 (Zustand)
```typescript
// 全局状态管理
interface AppState {
  prompts: Prompt[];
  currentPrompt: Prompt | null;
  setPrompts: (prompts: Prompt[]) => void;
  setCurrentPrompt: (prompt: Prompt) => void;
}

const useAppStore = create<AppState>((set) => ({
  prompts: [],
  currentPrompt: null,
  setPrompts: (prompts) => set({ prompts }),
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
}));
```

### 3. 路由模式
```typescript
// React Router v7 配置
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "prompts", element: <PromptList /> },
      { path: "prompts/:id", element: <PromptEditor /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
```

## 后端开发模式

### 1. 控制器模式
```csharp
[ApiController]
[Route("api/[controller]")]
public class PromptsController : ControllerBase
{
    private readonly IPromptService _promptService;
    
    public PromptsController(IPromptService promptService)
    {
        _promptService = promptService;
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Prompt>>> GetPrompts()
    {
        return Ok(await _promptService.GetAllAsync());
    }
}
```

### 2. 服务层模式
```csharp
public interface IPromptService
{
    Task<IEnumerable<Prompt>> GetAllAsync();
    Task<Prompt> GetByIdAsync(int id);
    Task<Prompt> CreateAsync(Prompt prompt);
    Task<Prompt> UpdateAsync(Prompt prompt);
    Task DeleteAsync(int id);
}
```

### 3. 仓储模式
```csharp
public interface IPromptRepository
{
    Task<IEnumerable<Prompt>> GetAllAsync();
    Task<Prompt> GetByIdAsync(int id);
    Task<Prompt> AddAsync(Prompt prompt);
    Task UpdateAsync(Prompt prompt);
    Task DeleteAsync(int id);
}
```

## 数据模式

### 1. 实体模式
```csharp
public class Prompt
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public string Category { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Tags { get; set; }
}
```

### 2. DTO模式
```csharp
public class PromptDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public string Category { get; set; }
    public List<string> Tags { get; set; }
}
```

## 配置模式

### 1. 环境配置
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=data/ConsoleService.db"
  },
  "AI": {
    "Provider": "OpenAI",
    "ApiKey": "${AI_API_KEY}",
    "Model": "gpt-4"
  }
}
```

### 2. Docker配置模式
```yaml
# docker-compose.yaml
services:
  app:
    build: .
    ports:
      - "8080:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    volumes:
      - ./data:/app/data
```

## 错误处理模式

### 1. 全局异常处理
```csharp
public class GlobalExceptionMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }
}
```

### 2. 前端错误边界
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 测试模式

### 1. 单元测试
```csharp
[Test]
public async Task GetPrompts_ShouldReturnAllPrompts()
{
    // Arrange
    var mockRepo = new Mock<IPromptRepository>();
    var service = new PromptService(mockRepo.Object);
    
    // Act
    var result = await service.GetAllAsync();
    
    // Assert
    Assert.IsNotNull(result);
}
```

### 2. 前端测试
```typescript
import { render, screen } from '@testing-library/react';
import PromptEditor from './PromptEditor';

test('renders prompt editor', () => {
  render(<PromptEditor />);
  const editor = screen.getByRole('textbox');
  expect(editor).toBeInTheDocument();
});
```

---

*最后更新: 2025-06-28*  
*模式版本: v1.0*
