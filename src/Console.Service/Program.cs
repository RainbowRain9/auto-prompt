using Console.Core;
using Console.Provider.PostgreSQL.Extensions;
using Console.Provider.Sqlite.Extensions;
using Console.Service.Infrastructure;
using Console.Service.MCP;
using Console.Service.Migrate;
using Console.Service.Options;
using Console.Service.Services;
using Scalar.AspNetCore;
using Serilog;
using System.Text.Json;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);


Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console(
        outputTemplate: "TokenAI-工作台日志({Level:u3}) => {Timestamp:HH:mm:ss} {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

await InitializeConsole.Initialize();

await ConsoleOptions.Initialize(builder.Configuration);

builder.Services.AddMcp();
builder.Services.AddSerilog(Log.Logger);
builder.Services.AddOpenApi();
builder.Services.AddFastApis();
builder.Services.AddResponseCompression();
builder.Services.AddScoped<UserContext>();
builder.Services.AddSingleton<GlobalExceptionMiddleware>();
builder.Services.AddHostedService<MigrateDataBackgroundService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<Console.Service.AI.DynamicKernelFactory>();

if (builder.Configuration.GetConnectionString("Type")?.Equals("postgresql", StringComparison.OrdinalIgnoreCase) == true)
{
    // 注册PostgreSQL数据库上下文
    builder.Services.AddPostgreSQL(builder.Configuration.GetConnectionString("Default"));
}
else
{
    var str = builder.Configuration.GetConnectionString("Default");

    // 获取str的sqlite的所在文件地址
    var sqliteFilePath = str?.Replace("Data Source=", string.Empty).Trim();
    // 后面有可能会有其他参数，所以需要去掉前面的Data Source=部分
    sqliteFilePath = sqliteFilePath.Replace(":", string.Empty).Trim();
    var info = new FileInfo(sqliteFilePath);

    if (info.Directory?.Exists == false)
    {
        info.Directory.Create();
    }
    
    // 注册SQLite数据库上下文
    builder.Services.AddSqlite(builder.Configuration.GetConnectionString("Default"));
}

builder.Services.AddHttpForwarder();
// 注册JWT服务
builder.Services.AddScoped<JwtService>();

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference("scalar");

app.UseSerilogRequestLogging();

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseResponseCompression();
app.UseStaticFiles();

app.MapFastApis(options =>
{
    options.Prefix = "/api";
    options.Version = "v1";
});

// 临时解决方案：直接注册AI服务配置相关API端点
app.MapGet("/api/v1/ai-service-configs/providers", async (AIServiceConfigService aiService, HttpContext context) =>
{
    var result = await aiService.GetProvidersAsync(context);
    return Results.Ok(result);
});

app.MapPost("/api/v1/ai-service-configs", async (AIServiceConfigService aiService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.CreateAIServiceConfigInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var result = await aiService.CreateConfigAsync(input!, context);
    return Results.Ok(result);
});

app.MapPost("/api/v1/ai-service-configs/test-connection", async (AIServiceConfigService aiService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.TestConnectionInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var result = await aiService.TestConnectionAsync(input!, context);
    return Results.Ok(result);
});

app.MapPost("/api/v1/ai-service-configs/search", async (AIServiceConfigService aiService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.AIServiceConfigSearchInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var result = await aiService.SearchConfigsAsync(input!, context);
    return Results.Ok(result);
});

app.MapPut("/api/v1/ai-service-configs", async (AIServiceConfigService aiService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.UpdateAIServiceConfigInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var result = await aiService.UpdateConfigAsync(input!, context);
    return Results.Ok(result);
});

app.MapPost("/api/v1/ai-service-configs/{id}/test-connection", async (string id, AIServiceConfigService aiService, HttpContext context) =>
{
    var result = await aiService.TestSavedConfigConnectionAsync(id, context);
    return Results.Ok(result);
});

// 添加其他关键API端点映射
app.MapGet("/api/v1/models", async (Console.Service.Services.ModelsService modelsService) =>
{
    var result = await modelsService.GetModelsAsync();
    return Results.Ok(result);
});

app.MapGet("/api/v1/system/info", async (Console.Service.Services.SystemService systemService) =>
{
    var result = await systemService.GetInfoAsync();
    return Results.Ok(result);
});

// 添加缺失的enhanced-prompt相关端点
app.MapGet("/api/v1/enhanced-prompt/user-configs", async (Console.Service.Services.EnhancedPromptService enhancedPromptService, HttpContext context) =>
{
    var result = await enhancedPromptService.GetUserConfigsAsync(context);
    return Results.Ok(result);
});

app.MapGet("/api/v1/enhanced-prompt/default-config", async (HttpContext context) =>
{
    // 返回默认配置
    var defaultConfig = new
    {
        success = true,
        data = new
        {
            enableDeepReasoning = false,
            chatModel = "gpt-4o-mini",
            configId = "",
            description = "默认配置"
        }
    };
    return Results.Ok(defaultConfig);
});

// 添加缺失的api-keys相关端点
app.MapPost("/api/v1/api-keys/search", async (Console.Service.Services.ApiKeyService apiKeyService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.ApiKeySearchInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var result = await apiKeyService.SearchApiKeysAsync(input!, context);
    return Results.Ok(result);
});

// 添加缺失的images相关端点
app.MapPost("/api/v1/images/search", async (Console.Service.Services.ImageService imageService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.ImageSearchInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var result = await imageService.SearchImagesAsync(input!, context);
    return Results.Ok(result);
});

// 添加缺失的prompt-templates相关端点
app.MapPost("/api/v1/prompt-templates/search", async (Console.Service.Services.PromptTemplateService promptTemplateService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.PromptTemplateSearchInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var result = await promptTemplateService.SearchPromptTemplatesAsync(input!, context);
    return Results.Ok(result);
});

app.MapPost("/api/v1/prompt-templates/shared/search", async (Console.Service.Services.PromptTemplateService promptTemplateService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.SharedPromptTemplateSearchInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var result = await promptTemplateService.SearchSharedPromptTemplatesAsync(input!);
    return Results.Ok(result);
});

// 添加缺失的evaluation相关端点
app.MapGet("/api/v1/evaluation/examples", async (Console.Service.Services.EvaluationService evaluationService) =>
{
    var result = await evaluationService.GetEvaluationExamples();
    return Results.Ok(result);
});

app.MapPost("/api/v1/evaluation/execute-model-task-stream", async (Console.Service.Services.EvaluationService evaluationService, HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var input = System.Text.Json.JsonSerializer.Deserialize<Console.Service.Dto.ExecuteTestInput>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

    // 设置SSE响应头
    context.Response.Headers.ContentType = "text/event-stream";
    context.Response.Headers.CacheControl = "no-cache";
    context.Response.Headers.Connection = "keep-alive";

    // 调用现有的评估方法并流式返回结果
    var result = await evaluationService.EvaluationAsync(input!);
    await context.Response.WriteAsync($"data: {System.Text.Json.JsonSerializer.Serialize(result)}\n\n");
});

// 添加缺失的evaluation-history相关端点
app.MapGet("/api/v1/evaluation-history/all", async (Console.Service.Services.EvaluationHistoryService evaluationHistoryService, HttpContext context) =>
{
    var result = await evaluationHistoryService.GetAllEvaluationRecordsAsync(context);
    return Results.Ok(result);
});

// SPA fallback - 只对非API请求生效
app.Use((async (context, next) =>
{
    await next(context);

    // 只对非API路径的404请求进行SPA fallback
    if (context.Response.StatusCode == 404 && !context.Request.Path.StartsWithSegments("/api"))
    {
        var indexPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "index.html");
        if (File.Exists(indexPath))
        {
            // 转发到index.html
            context.Request.Path = "/index.html";
            context.Response.StatusCode = 200; // 重置状态码
            await context.Response.SendFileAsync(indexPath);
        }
        else
        {
            // 如果没有前端文件，返回简单的API信息页面
            context.Response.StatusCode = 200;
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.WriteAsync(@"
<!DOCTYPE html>
<html>
<head>
    <title>Auto-Prompt API Service</title>
    <meta charset='utf-8'>
</head>
<body>
    <h1>Auto-Prompt API Service</h1>
    <p>API服务正在运行中...</p>
    <p>前端服务请访问: <a href='http://localhost:5174'>http://localhost:5174</a></p>
    <p>API文档: <a href='/scalar'>Scalar API文档</a></p>
</body>
</html>");
        }
    }
}));

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<IDbContext>();

    try
    {
        await dbContext.BeginMigrationAsync();
    }
    catch (Exception ex)
    {
        Log.Warning("数据库迁移失败，将尝试创建数据库: {Error}", ex.Message);
        // 对于本地开发，如果迁移失败，尝试确保数据库已创建
        if (dbContext is Microsoft.EntityFrameworkCore.DbContext efContext)
        {
            await efContext.Database.EnsureCreatedAsync();
        }
    }
}

app.MapOpenAiProxy();

app.MapMcp("/mcp");

await app.RunAsync();