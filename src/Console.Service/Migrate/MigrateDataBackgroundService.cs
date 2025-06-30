using Console.Core;
using Console.Core.Entities;
using Console.Service.Options;
using Console.Service.Utils;
using System.Text.Json;

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

            logger.LogInformation("创建默认用户成功。用户名：{Username}", defaultUsername);
        }
        else
        {
            logger.LogInformation("默认用户已存在，跳过创建。用户名：{Username}", defaultUsername);
        }

        // 检查并创建默认AI服务配置
        await CreateDefaultAIServiceConfigs(dbContext, user.Id.ToString(), logger);

        logger.LogInformation("TokenAI Console 服务已启动!");
    }

    /// <summary>
    /// 创建默认AI服务配置
    /// </summary>
    private async Task CreateDefaultAIServiceConfigs(IDbContext dbContext, string userId, ILogger logger)
    {
        try
        {
            // 检查用户是否已有AI服务配置
            var existingConfigs = dbContext.AIServiceConfigs.Where(x => x.UserId == userId).ToList();
            if (existingConfigs.Any())
            {
                logger.LogInformation("用户 {UserId} 已有AI服务配置，跳过创建默认配置", userId);
                return;
            }

            var defaultConfigs = new List<AIServiceConfig>();

            // 1. 创建OpenAI官方配置模板（用户需要配置API密钥）
            var openaiConfig = new AIServiceConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "OpenAI 官方服务",
                Provider = "OpenAI",
                ApiEndpoint = "https://api.openai.com/v1",
                EncryptedApiKey = EncryptionHelper.EncryptApiKey("sk-请在此处填入您的OpenAI API密钥"),
                ChatModels = JsonSerializer.Serialize(new[] {
                    "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4",
                    "gpt-3.5-turbo", "o1-preview", "o1-mini", "o1-pro"
                }),
                ImageModels = JsonSerializer.Serialize(new[] { "dall-e-3", "dall-e-2" }),
                DefaultChatModel = "gpt-4o-mini",
                DefaultImageModel = "dall-e-3",
                IsEnabled = false, // 默认禁用，需要用户配置API密钥后启用
                IsDefault = false,
                Description = "OpenAI官方API服务，支持GPT-4o、DALL-E等最新模型。请配置您的API密钥后启用。",
                ConnectionStatus = "Unknown",
                UsageCount = 0,
                CreatedTime = DateTime.Now,
                UpdatedTime = DateTime.Now,
                SortOrder = 1
            };
            defaultConfigs.Add(openaiConfig);

            // 2. 创建Google Gemini配置模板（需要用户配置API密钥）
            var geminiConfig = new AIServiceConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "Google Gemini",
                Provider = "GoogleAI",
                ApiEndpoint = "https://generativelanguage.googleapis.com/v1beta",
                EncryptedApiKey = EncryptionHelper.EncryptApiKey("请在此处填入您的Gemini API密钥"),
                ChatModels = JsonSerializer.Serialize(new[] {
                    "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b",
                    "gemini-pro", "gemini-pro-vision", "gemini-2.0-flash-exp"
                }),
                ImageModels = JsonSerializer.Serialize(new[] { "gemini-pro-vision", "gemini-1.5-pro", "gemini-1.5-flash" }),
                DefaultChatModel = "gemini-1.5-flash",
                DefaultImageModel = "gemini-pro-vision",
                IsEnabled = false, // 默认禁用，需要用户配置API密钥后启用
                IsDefault = false,
                Description = "Google Gemini AI服务，支持多模态理解和生成。请在Google AI Studio获取API密钥后启用。",
                ConnectionStatus = "Unknown",
                UsageCount = 0,
                CreatedTime = DateTime.Now,
                UpdatedTime = DateTime.Now,
                SortOrder = 2
            };
            defaultConfigs.Add(geminiConfig);

            // 3. 创建DeepSeek配置示例
            var deepseekConfig = new AIServiceConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "DeepSeek (需配置API密钥)",
                Provider = "DeepSeek",
                ApiEndpoint = "https://api.deepseek.com/v1",
                EncryptedApiKey = EncryptionHelper.EncryptApiKey("请在此处填入您的DeepSeek API密钥"),
                ChatModels = JsonSerializer.Serialize(new[] { "deepseek-chat", "deepseek-coder" }),
                ImageModels = JsonSerializer.Serialize(new string[] { }),
                DefaultChatModel = "deepseek-chat",
                DefaultImageModel = null,
                IsEnabled = false, // 默认禁用
                IsDefault = false,
                Description = "DeepSeek AI服务，请配置您的API密钥后启用",
                ConnectionStatus = "Unknown",
                UsageCount = 0,
                CreatedTime = DateTime.Now,
                UpdatedTime = DateTime.Now,
                SortOrder = 3
            };
            defaultConfigs.Add(deepseekConfig);

            // 4. 创建Anthropic Claude配置模板
            var claudeConfig = new AIServiceConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "Anthropic Claude",
                Provider = "Anthropic",
                ApiEndpoint = "https://api.anthropic.com/v1",
                EncryptedApiKey = EncryptionHelper.EncryptApiKey("请在此处填入您的Anthropic API密钥"),
                ChatModels = JsonSerializer.Serialize(new[] {
                    "claude-opus-4-20250514", "claude-sonnet-4-20250514", "claude-3-7-sonnet-20250219",
                    "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"
                }),
                ImageModels = JsonSerializer.Serialize(new string[] { }),
                DefaultChatModel = "claude-3-5-sonnet-20241022",
                DefaultImageModel = null,
                IsEnabled = false,
                IsDefault = false,
                Description = "Anthropic Claude AI服务，支持Claude 4最新模型。请在Anthropic Console获取API密钥后启用。",
                ConnectionStatus = "Unknown",
                UsageCount = 0,
                CreatedTime = DateTime.Now,
                UpdatedTime = DateTime.Now,
                SortOrder = 4
            };
            defaultConfigs.Add(claudeConfig);

            // 5. 创建通用OpenAI兼容配置模板
            var compatibleConfig = new AIServiceConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "OpenAI兼容服务",
                Provider = "OpenAI",
                ApiEndpoint = "https://api.example.com/v1",
                EncryptedApiKey = EncryptionHelper.EncryptApiKey("请在此处填入您的API密钥"),
                ChatModels = JsonSerializer.Serialize(new[] {
                    "gpt-4o-mini", "gpt-3.5-turbo", "gpt-4", "claude-3-5-sonnet",
                    "gemini-pro", "llama-3.1-70b", "qwen-max"
                }),
                ImageModels = JsonSerializer.Serialize(new[] { "dall-e-3", "midjourney", "stable-diffusion" }),
                DefaultChatModel = "gpt-4o-mini",
                DefaultImageModel = "dall-e-3",
                IsEnabled = false,
                IsDefault = false,
                Description = "通用OpenAI兼容API服务，支持各种第三方API提供商（如DeepSeek、智谱AI、月之暗面等）。请修改端点地址和API密钥。",
                ConnectionStatus = "Unknown",
                UsageCount = 0,
                CreatedTime = DateTime.Now,
                UpdatedTime = DateTime.Now,
                SortOrder = 5
            };
            defaultConfigs.Add(compatibleConfig);

            // 6. 创建一个默认启用的演示配置（使用环境变量）
            if (!string.IsNullOrEmpty(ConsoleOptions.OpenAIEndpoint) && !string.IsNullOrEmpty(ConsoleOptions.DefaultAPIKey))
            {
                var demoConfig = new AIServiceConfig
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = "演示服务 (已配置)",
                    Provider = "OpenAI",
                    ApiEndpoint = ConsoleOptions.OpenAIEndpoint,
                    EncryptedApiKey = EncryptionHelper.EncryptApiKey(ConsoleOptions.DefaultAPIKey),
                    ChatModels = JsonSerializer.Serialize(ConsoleOptions.ChatModel ?? new[] { "gpt-4o-mini", "gpt-3.5-turbo" }),
                    ImageModels = JsonSerializer.Serialize(ConsoleOptions.ImageGenerationModel ?? new[] { "dall-e-3" }),
                    DefaultChatModel = ConsoleOptions.DefaultChatModel ?? "gpt-4o-mini",
                    DefaultImageModel = ConsoleOptions.DefaultImageGenerationModel ?? "dall-e-3",
                    IsEnabled = true, // 启用演示配置
                    IsDefault = true, // 设为默认配置
                    Description = "系统预配置的演示服务，可直接使用。建议添加您自己的API配置。",
                    ConnectionStatus = "Unknown",
                    UsageCount = 0,
                    CreatedTime = DateTime.Now,
                    UpdatedTime = DateTime.Now,
                    SortOrder = 0 // 排在最前面
                };
                defaultConfigs.Add(demoConfig);
            }

            // 批量添加配置
            foreach (var config in defaultConfigs)
            {
                dbContext.AIServiceConfigs.Add(config);
            }

            await dbContext.SaveChangesAsync();
            logger.LogInformation("为用户 {UserId} 创建了 {Count} 个默认AI服务配置", userId, defaultConfigs.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "创建默认AI服务配置失败，用户: {UserId}", userId);
        }
    }
}