# 开发最佳实践

## 通用开发原则

### 1. 代码质量原则
- **可读性优先**: 代码应该易于理解和维护
- **单一职责**: 每个类/函数只负责一个功能
- **DRY原则**: 不要重复自己 (Don't Repeat Yourself)
- **KISS原则**: 保持简单愚蠢 (Keep It Simple, Stupid)
- **YAGNI原则**: 你不会需要它 (You Aren't Gonna Need It)

### 2. 版本控制最佳实践
```bash
# 提交信息格式
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动

# 分支策略
main/master - 生产分支
develop - 开发分支
feature/* - 功能分支
hotfix/* - 热修复分支
```

## .NET后端最佳实践

### 1. 项目结构
```
src/
├── Console.Core/           # 核心业务逻辑
│   ├── Entities/          # 实体类
│   ├── Interfaces/        # 接口定义
│   ├── Services/          # 业务服务
│   └── DTOs/              # 数据传输对象
├── Console.Service/        # Web API层
│   ├── Controllers/       # API控制器
│   ├── Middleware/        # 中间件
│   └── Configuration/     # 配置
└── Console.Provider.*/     # 数据访问层
    ├── Repositories/      # 仓储实现
    └── Configurations/    # 数据库配置
```

### 2. 依赖注入配置
```csharp
// Program.cs
builder.Services.AddScoped<IPromptService, PromptService>();
builder.Services.AddScoped<IPromptRepository, PromptRepository>();

// 配置数据库
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var provider = builder.Configuration.GetValue<string>("DatabaseProvider");
    switch (provider?.ToLower())
    {
        case "sqlite":
            options.UseSqlite(connectionString);
            break;
        case "postgresql":
            options.UseNpgsql(connectionString);
            break;
    }
});
```

### 3. 异常处理
```csharp
// 全局异常处理中间件
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            NotFoundException => 404,
            ValidationException => 400,
            UnauthorizedException => 401,
            _ => 500
        };

        var response = new
        {
            error = exception.Message,
            statusCode = context.Response.StatusCode
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
```

### 4. 配置管理
```csharp
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=data/ConsoleService.db"
  },
  "DatabaseProvider": "sqlite",
  "AI": {
    "Provider": "OpenAI",
    "ApiKey": "${AI_API_KEY}",
    "BaseUrl": "https://api.openai.com/v1"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}

// 强类型配置
public class AIConfiguration
{
    public string Provider { get; set; }
    public string ApiKey { get; set; }
    public string BaseUrl { get; set; }
}

// 注册配置
builder.Services.Configure<AIConfiguration>(
    builder.Configuration.GetSection("AI"));
```

## React前端最佳实践

### 1. 组件设计原则
```typescript
// 函数式组件 + TypeScript
interface PromptCardProps {
  prompt: Prompt;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ 
  prompt, 
  onEdit, 
  onDelete 
}) => {
  const handleEdit = useCallback(() => {
    onEdit(prompt.id);
  }, [prompt.id, onEdit]);

  return (
    <Card
      title={prompt.title}
      extra={
        <Space>
          <Button onClick={handleEdit}>编辑</Button>
          <Button danger onClick={() => onDelete(prompt.id)}>
            删除
          </Button>
        </Space>
      }
    >
      <p>{prompt.content}</p>
    </Card>
  );
};
```

### 2. 状态管理
```typescript
// Zustand store
interface PromptStore {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchPrompts: () => Promise<void>;
  addPrompt: (prompt: Omit<Prompt, 'id'>) => Promise<void>;
  updatePrompt: (id: string, prompt: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
}

const usePromptStore = create<PromptStore>((set, get) => ({
  prompts: [],
  loading: false,
  error: null,

  fetchPrompts: async () => {
    set({ loading: true, error: null });
    try {
      const prompts = await promptApi.getAll();
      set({ prompts, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addPrompt: async (prompt) => {
    try {
      const newPrompt = await promptApi.create(prompt);
      set(state => ({ 
        prompts: [...state.prompts, newPrompt] 
      }));
    } catch (error) {
      set({ error: error.message });
    }
  }
}));
```

### 3. 自定义Hooks
```typescript
// 数据获取Hook
const usePrompts = () => {
  const { prompts, loading, error, fetchPrompts } = usePromptStore();

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return { prompts, loading, error, refetch: fetchPrompts };
};

// 表单处理Hook
const usePromptForm = (initialValues?: Partial<Prompt>) => {
  const [form] = Form.useForm();
  const { addPrompt, updatePrompt } = usePromptStore();

  const handleSubmit = async (values: PromptFormData) => {
    try {
      if (initialValues?.id) {
        await updatePrompt(initialValues.id, values);
      } else {
        await addPrompt(values);
      }
      form.resetFields();
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    }
  };

  return { form, handleSubmit };
};
```

### 4. 错误边界
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="出现错误"
          subTitle="抱歉，页面出现了错误。"
          extra={
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
```

## 性能优化最佳实践

### 1. 前端性能优化
```typescript
// 组件懒加载
const PromptEditor = lazy(() => import('./components/PromptEditor'));
const Settings = lazy(() => import('./pages/Settings'));

// 使用Suspense
<Suspense fallback={<Spin size="large" />}>
  <Routes>
    <Route path="/editor" element={<PromptEditor />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>

// 虚拟化长列表
import { FixedSizeList as List } from 'react-window';

const VirtualizedPromptList: React.FC<{ prompts: Prompt[] }> = ({ prompts }) => (
  <List
    height={600}
    itemCount={prompts.length}
    itemSize={120}
    itemData={prompts}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <PromptCard prompt={data[index]} />
      </div>
    )}
  </List>
);
```

### 2. 后端性能优化
```csharp
// 异步编程
public async Task<IEnumerable<Prompt>> GetPromptsAsync(
    int page = 1, 
    int pageSize = 20)
{
    return await _context.Prompts
        .OrderByDescending(p => p.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
}

// 缓存策略
[ResponseCache(Duration = 300)] // 5分钟缓存
public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
{
    return Ok(await _categoryService.GetAllAsync());
}

// 数据库查询优化
public async Task<Prompt> GetPromptWithDetailsAsync(int id)
{
    return await _context.Prompts
        .Include(p => p.Category)
        .Include(p => p.Tags)
        .FirstOrDefaultAsync(p => p.Id == id);
}
```

## 安全最佳实践

### 1. API安全
```csharp
// 输入验证
[HttpPost]
public async Task<ActionResult<Prompt>> CreatePrompt(
    [FromBody] CreatePromptDto dto)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    // 防止XSS攻击
    dto.Content = _htmlSanitizer.Sanitize(dto.Content);
    
    var prompt = await _promptService.CreateAsync(dto);
    return CreatedAtAction(nameof(GetPrompt), new { id = prompt.Id }, prompt);
}

// CORS配置
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowedOrigins", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://yourdomain.com")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

### 2. 环境变量管理
```bash
# .env (不提交到版本控制)
AI_API_KEY=your_secret_key
DATABASE_CONNECTION_STRING=your_db_connection
JWT_SECRET=your_jwt_secret

# docker-compose.yaml
environment:
  - AI_API_KEY=${AI_API_KEY}
  - ASPNETCORE_ENVIRONMENT=Production
```

---

*最后更新: 2025-06-28*  
*实践版本: v1.0*
