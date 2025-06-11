using Console.Core;
using Console.Provider.PostgreSQL.Extensions;
using Console.Provider.Sqlite.Extensions;
using Console.Service.Infrastructure;
using Console.Service.Options;
using Console.Service.Services;
using Scalar.AspNetCore;
using Serilog;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);

var logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

ConsoleOptions.Initialize(builder.Configuration);

builder.Services.AddSerilog(logger);
builder.Services.AddOpenApi();
builder.Services.AddFastApis();
builder.Services.AddResponseCompression();
builder.Services.AddScoped<UserContext>();
builder.Services.AddSingleton<GlobalExceptionMiddleware>();
builder.Services.AddHttpContextAccessor();

if (builder.Configuration.GetConnectionString("Type")?.Equals("postgresql", StringComparison.OrdinalIgnoreCase) == true)
{
    // 注册PostgreSQL数据库上下文
    builder.Services.AddPostgreSQL(builder.Configuration.GetConnectionString("Default"));
}
else
{
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

await app.RunAsync();