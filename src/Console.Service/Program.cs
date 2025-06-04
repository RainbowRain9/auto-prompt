using Console.Service.DbAccess;
using Console.Service.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);

var logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog(logger);
builder.Services.AddOpenApi();
builder.Services.WithFast();
builder.Services.AddResponseCompression();
builder.Services.AddDbContext<ConsoleDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default"));

    options.EnableSensitiveDataLogging();
});

// 注册JWT服务
builder.Services.AddScoped<JwtService>();

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference("scalar");
}

app.UseSerilogRequestLogging();

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

app.MapFast();

await app.RunAsync();