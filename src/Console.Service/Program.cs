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

// 临时解决方案：直接注册AI服务提供商API
app.MapGet("/api/v1/ai-service-configs/providers", async (AIServiceConfigService aiService, HttpContext context) =>
{
    var result = await aiService.GetProvidersAsync(context);
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