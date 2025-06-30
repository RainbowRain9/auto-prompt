using Console.Core;
using Console.Core.Entities;
using Console.Service.Infrastructure;
using Console.Service.Options;
using Console.Service.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Serilog;
using System.Text.Json;

namespace Console.Service.AI;

/// <summary>
/// 动态Kernel工厂，支持用户自定义AI服务配置
/// </summary>
public class DynamicKernelFactory
{
    private readonly IDbContext dbContext;
    private readonly IServiceProvider serviceProvider;

    public DynamicKernelFactory(IDbContext dbContext, IServiceProvider serviceProvider)
    {
        this.dbContext = dbContext;
        this.serviceProvider = serviceProvider;
    }

    /// <summary>
    /// 为指定用户创建Kernel，优先使用用户的默认配置
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="chatModel">指定的聊天模型（可选）</param>
    /// <param name="configId">指定的配置ID（可选）</param>
    /// <returns>配置好的Kernel实例</returns>
    public async Task<Kernel> CreateKernelForUserAsync(string userId, string? chatModel = null, Guid? configId = null)
    {
        try
        {
            AIServiceConfig? config = null;

            // 1. 如果指定了配置ID，使用指定配置
            if (configId.HasValue)
            {
                config = await dbContext.AIServiceConfigs
                    .FirstOrDefaultAsync(x => x.Id == configId.Value && x.UserId == userId && x.IsEnabled);
            }

            // 2. 如果没有指定配置ID，使用用户的默认配置
            if (config == null)
            {
                config = await dbContext.AIServiceConfigs
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.IsDefault && x.IsEnabled);
            }

            // 3. 如果没有默认配置，使用用户的第一个启用配置
            if (config == null)
            {
                config = await dbContext.AIServiceConfigs
                    .Where(x => x.UserId == userId && x.IsEnabled)
                    .OrderBy(x => x.SortOrder)
                    .ThenBy(x => x.CreatedTime)
                    .FirstOrDefaultAsync();
            }

            // 4. 如果用户没有任何配置，回退到系统默认配置
            if (config == null)
            {
                Log.Logger.Information("用户 {UserId} 没有AI服务配置，使用系统默认配置", userId);
                return CreateSystemDefaultKernel(chatModel);
            }

            // 5. 使用用户配置创建Kernel
            var apiKey = EncryptionHelper.DecryptApiKey(config.EncryptedApiKey);
            var modelToUse = chatModel ?? config.DefaultChatModel ?? GetFirstAvailableChatModel(config);

            if (string.IsNullOrEmpty(modelToUse))
            {
                Log.Logger.Warning("配置 {ConfigId} 没有可用的聊天模型，使用系统默认配置", config.Id);
                return CreateSystemDefaultKernel(chatModel);
            }

            Log.Logger.Information("为用户 {UserId} 创建Kernel，配置: {ConfigName}, 模型: {Model}", 
                userId, config.Name, modelToUse);

            var kernel = CreateKernelWithConfig(config, apiKey, modelToUse);

            // 更新使用统计
            await UpdateUsageStatistics(config.Id);

            return kernel;
        }
        catch (Exception ex)
        {
            Log.Logger.Error(ex, "为用户 {UserId} 创建Kernel失败，回退到系统默认配置", userId);
            return CreateSystemDefaultKernel(chatModel);
        }
    }

    /// <summary>
    /// 使用指定配置创建Kernel
    /// </summary>
    /// <param name="config">AI服务配置</param>
    /// <param name="apiKey">解密后的API密钥</param>
    /// <param name="chatModel">聊天模型</param>
    /// <returns>配置好的Kernel实例</returns>
    private Kernel CreateKernelWithConfig(AIServiceConfig config, string apiKey, string chatModel)
    {
        var kernelBuilder = Kernel.CreateBuilder();

        // 根据提供商类型配置不同的服务
        switch (config.Provider.ToLower())
        {
            case "openai":
            case "deepseek":
            case "volcengine":
                // 使用OpenAI兼容接口
                kernelBuilder.AddOpenAIChatCompletion(
                    chatModel, 
                    new Uri(config.ApiEndpoint), 
                    apiKey,
                    httpClient: CreateHttpClient(config)
                );
                break;

            case "googleai":
                // Google AI需要特殊处理
                // 这里可以添加Google AI的特定配置
                kernelBuilder.AddOpenAIChatCompletion(
                    chatModel, 
                    new Uri(config.ApiEndpoint), 
                    apiKey,
                    httpClient: CreateHttpClient(config)
                );
                break;

            case "ollama":
                // Ollama本地服务
                kernelBuilder.AddOpenAIChatCompletion(
                    chatModel, 
                    new Uri(config.ApiEndpoint), 
                    apiKey ?? "ollama", // Ollama可能不需要API密钥
                    httpClient: CreateHttpClient(config)
                );
                break;

            default:
                // 默认使用OpenAI兼容接口
                kernelBuilder.AddOpenAIChatCompletion(
                    chatModel, 
                    new Uri(config.ApiEndpoint), 
                    apiKey,
                    httpClient: CreateHttpClient(config)
                );
                break;
        }

        // 添加通用服务
        kernelBuilder.Services.AddSerilog(Log.Logger);
        kernelBuilder.Services.AddSingleton<IPromptRenderFilter>(new LanguagePromptFilter());

        // 添加插件
        kernelBuilder.Plugins.AddFromPromptDirectory(
            Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
            "Generate"
        );

        return kernelBuilder.Build();
    }

    /// <summary>
    /// 创建HTTP客户端
    /// </summary>
    private HttpClient CreateHttpClient(AIServiceConfig config)
    {
        var httpClient = new HttpClient(new KernelHttpClientHandler())
        {
            Timeout = TimeSpan.FromSeconds(600)
        };

        httpClient.DefaultRequestHeaders.Add("User-Agent", "AutoPrompt");
        httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

        // 添加额外配置
        if (!string.IsNullOrEmpty(config.ExtraConfig))
        {
            try
            {
                var extraConfig = JsonSerializer.Deserialize<Dictionary<string, object>>(config.ExtraConfig);
                if (extraConfig != null)
                {
                    foreach (var kvp in extraConfig)
                    {
                        if (kvp.Key.StartsWith("header_") && kvp.Value is string headerValue)
                        {
                            var headerName = kvp.Key.Substring(7); // 移除 "header_" 前缀
                            httpClient.DefaultRequestHeaders.Add(headerName, headerValue);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Logger.Warning(ex, "解析配置 {ConfigId} 的额外配置失败", config.Id);
            }
        }

        return httpClient;
    }

    /// <summary>
    /// 创建系统默认Kernel（回退方案）
    /// </summary>
    private Kernel CreateSystemDefaultKernel(string? chatModel = null)
    {
        var modelToUse = chatModel ?? ConsoleOptions.DefaultChatModel;
        return KernelFactory.CreateKernel(modelToUse, ConsoleOptions.OpenAIEndpoint, ConsoleOptions.DefaultAPIKey ?? "");
    }

    /// <summary>
    /// 获取配置中第一个可用的聊天模型
    /// </summary>
    private string? GetFirstAvailableChatModel(AIServiceConfig config)
    {
        try
        {
            var chatModels = JsonSerializer.Deserialize<List<string>>(config.ChatModels);
            return chatModels?.FirstOrDefault();
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// 更新使用统计
    /// </summary>
    private async Task UpdateUsageStatistics(Guid configId)
    {
        try
        {
            await dbContext.AIServiceConfigs
                .Where(x => x.Id == configId)
                .ExecuteUpdateAsync(x => x
                    .SetProperty(a => a.UsageCount, a => a.UsageCount + 1)
                    .SetProperty(a => a.LastUsedTime, DateTime.Now));
        }
        catch (Exception ex)
        {
            Log.Logger.Warning(ex, "更新配置 {ConfigId} 使用统计失败", configId);
        }
    }

    /// <summary>
    /// 获取用户的所有可用配置
    /// </summary>
    public async Task<List<AIServiceConfig>> GetUserConfigsAsync(string userId)
    {
        return await dbContext.AIServiceConfigs
            .Where(x => x.UserId == userId && x.IsEnabled)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.CreatedTime)
            .ToListAsync();
    }

    /// <summary>
    /// 获取用户的默认配置
    /// </summary>
    public async Task<AIServiceConfig?> GetUserDefaultConfigAsync(string userId)
    {
        return await dbContext.AIServiceConfigs
            .FirstOrDefaultAsync(x => x.UserId == userId && x.IsDefault && x.IsEnabled);
    }
}
