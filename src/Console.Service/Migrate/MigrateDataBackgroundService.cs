using Console.Core;
using Console.Service.Entities;

namespace Console.Service.Migrate;

public class MigrateDataBackgroundService(IServiceProvider service, ILogger<MigrateDataBackgroundService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await using var scope = service.CreateAsyncScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<IDbContext>();

        // 获取环境变量中配置的默认账户和密码
        var defaultUsername = Environment.GetEnvironmentVariable("DEFAULT_USERNAME") ?? "admin";
        var defaultPassword = Environment.GetEnvironmentVariable("DEFAULT_PASSWORD") ?? "admin123";

        // 获取用户列表中是否存在admin用户，不存在则新增
        var user = dbContext.Users.FirstOrDefault(u => u.Username == defaultUsername);

        if (user == null)
        {
            user = new User
            {
                Username = defaultUsername,
                PasswordHash = User.HashPassword(defaultPassword),
                DisplayName = "管理员",
                Role = "Admin", // 默认角色为管理员
                IsActive = true,
                LastLoginTime = DateTime.UtcNow
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();
        }
        else
        {
            logger.LogInformation("默认用户已存在，跳过创建。用户名：{Username}", defaultUsername);
        }


        logger.LogInformation("TokenAI Console 服务已启动!");
    }
}