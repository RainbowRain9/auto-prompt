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


var logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console(
        outputTemplate: "TokenAI-工作台日志({Level:u3}) => {Timestamp:HH:mm:ss} {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

await InitializeConsole.Initialize();

ConsoleOptions.Initialize(builder.Configuration);

builder.Services.AddMcp();
builder.Services.AddSerilog(logger);
builder.Services.AddOpenApi();
builder.Services.AddFastApis();
builder.Services.AddResponseCompression();
builder.Services.AddScoped<UserContext>();
builder.Services.AddSingleton<GlobalExceptionMiddleware>();
builder.Services.AddHostedService<MigrateDataBackgroundService>();
builder.Services.AddHttpContextAccessor();

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

app.Use((async (context, next) =>
{
    await next(context);

    if (context.Response.StatusCode == 404)
    {
        // 转发到index.html
        context.Request.Path = "/index.html";
        context.Response.StatusCode = 200; // 重置状态码
        await context.Response.SendFileAsync(
            Path.Combine(AppContext.BaseDirectory, "wwwroot", "index.html"));
    }
}));

app.UseResponseCompression();
app.UseStaticFiles();

app.MapFastApis(options =>
{
    options.Prefix = "/api";
    options.Version = "v1";
});

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<IDbContext>();

    await dbContext.BeginMigrationAsync();
}

app.MapOpenAiProxy();

app.MapMcp("/mcp");

await app.RunAsync();