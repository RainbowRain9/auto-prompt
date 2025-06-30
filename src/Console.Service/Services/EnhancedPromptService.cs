using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Console.Core;
using Console.Core.Entities;
using Console.Service.AI;
using Console.Service.Dto;
using Console.Service.Infrastructure;
using Console.Service.Options;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace Console.Service.Services;

[FastService.Route("/enhanced-prompt")]
[Tags("增强提示词生成")]
public class EnhancedPromptService : FastApi
{
    private readonly IDbContext dbContext;
    private readonly DynamicKernelFactory kernelFactory;
    private readonly UserContext userContext;
    private readonly ILogger<EnhancedPromptService> logger;

    public EnhancedPromptService(
        IDbContext dbContext, 
        DynamicKernelFactory kernelFactory,
        UserContext userContext,
        ILogger<EnhancedPromptService> logger)
    {
        this.dbContext = dbContext;
        this.kernelFactory = kernelFactory;
        this.userContext = userContext;
        this.logger = logger;
    }

    [EndpointSummary("使用用户配置生成优化提示词")]
    [HttpPost("optimize")]
    public async Task OptimizePromptWithUserConfigAsync(
        [FromBody] OptimizePromptWithConfigInput input, 
        HttpContext context)
    {
        if (!userContext.IsAuthenticated || string.IsNullOrEmpty(userContext.UserId))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("未授权访问，请先登录");
            return;
        }

        try
        {
            // 创建用户专属的Kernel
            var kernel = await kernelFactory.CreateKernelForUserAsync(
                userContext.UserId, 
                input.ChatModel, 
                input.ConfigId);

            // 设置响应头
            context.Response.Headers.ContentType = "text/event-stream";
            context.Response.Headers.CacheControl = "no-cache";
            context.Response.Headers.Connection = "keep-alive";

            var result = new StringBuilder();
            bool isFirst = true;

            // 根据是否启用深度推理选择不同的处理方式
            if (input.EnableDeepReasoning)
            {
                await ProcessWithDeepReasoning(kernel, input, context, result);
            }
            else
            {
                await ProcessNormalOptimization(kernel, input, context, result, isFirst);
            }

            // 保存历史记录
            await SavePromptHistory(input, result.ToString());
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "优化提示词失败，用户: {UserId}", userContext.UserId);
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync($"data: {{\"error\": \"{ex.Message}\"}}\n\n");
        }
    }

    [EndpointSummary("获取用户的AI服务配置列表")]
    [HttpGet("user-configs")]
    public async Task<object> GetUserConfigsAsync(HttpContext context)
    {
        if (!userContext.IsAuthenticated || string.IsNullOrEmpty(userContext.UserId))
        {
            context.Response.StatusCode = 401;
            return new { success = false, message = "未授权访问" };
        }

        try
        {
            var configs = await kernelFactory.GetUserConfigsAsync(userContext.UserId);
            var configDtos = configs.Select(c => {
                var chatModels = JsonSerializer.Deserialize<List<string>>(c.ChatModels) ?? new();
                var imageModels = JsonSerializer.Deserialize<List<string>>(c.ImageModels) ?? new();

                // 添加调试日志
                System.Console.WriteLine($"🔍 [EnhancedPromptService] 配置: {c.Name}, ChatModels原始: {c.ChatModels}, 解析后: [{string.Join(", ", chatModels)}]");

                return new
                {
                    c.Id,
                    c.Name,
                    c.Provider,
                    c.IsDefault,
                    c.IsEnabled,
                    ChatModels = chatModels,
                    ImageModels = imageModels,
                    c.DefaultChatModel,
                    c.DefaultImageModel,
                    c.ConnectionStatus,
                    c.LastUsedTime,
                    c.UsageCount
                };
            }).ToList();

            System.Console.WriteLine($"🎯 [EnhancedPromptService] 返回 {configDtos.Count} 个配置给用户 {userContext.UserId}");
            return new { success = true, data = configDtos };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "获取用户配置失败，用户: {UserId}", userContext.UserId);
            return new { success = false, message = $"获取配置失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取用户默认配置")]
    [HttpGet("default-config")]
    public async Task<object> GetUserDefaultConfigAsync(HttpContext context)
    {
        if (!userContext.IsAuthenticated || string.IsNullOrEmpty(userContext.UserId))
        {
            context.Response.StatusCode = 401;
            return new { success = false, message = "未授权访问" };
        }

        try
        {
            var defaultConfig = await kernelFactory.GetUserDefaultConfigAsync(userContext.UserId);
            if (defaultConfig == null)
            {
                return new { success = true, data = (object?)null, message = "用户没有设置默认配置" };
            }

            var configDto = new
            {
                defaultConfig.Id,
                defaultConfig.Name,
                defaultConfig.Provider,
                ChatModels = JsonSerializer.Deserialize<List<string>>(defaultConfig.ChatModels) ?? new(),
                ImageModels = JsonSerializer.Deserialize<List<string>>(defaultConfig.ImageModels) ?? new(),
                defaultConfig.DefaultChatModel,
                defaultConfig.DefaultImageModel,
                defaultConfig.ConnectionStatus
            };

            return new { success = true, data = configDto };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "获取用户默认配置失败，用户: {UserId}", userContext.UserId);
            return new { success = false, message = $"获取默认配置失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 处理深度推理模式
    /// </summary>
    private async Task ProcessWithDeepReasoning(
        Kernel kernel, 
        OptimizePromptWithConfigInput input, 
        HttpContext context, 
        StringBuilder result)
    {
        // 实现深度推理逻辑
        var deepReasoningResult = kernel.InvokeStreamingAsync(
            kernel.Plugins["Generate"]["DeepReasoning"],
            new KernelArguments(new OpenAIPromptExecutionSettings()
            {
                MaxTokens = 2000,
                Temperature = 0.7f,
            })
            {
                ["prompt"] = input.Prompt,
                ["requirements"] = input.Requirements ?? ""
            });

        await foreach (var item in deepReasoningResult)
        {
            if (item is OpenAIStreamingChatMessageContent chatContent && chatContent.Content != null)
            {
                result.Append(chatContent.Content);
                await context.Response.WriteAsync($"data: {{\"content\": \"{EscapeJson(chatContent.Content)}\", \"type\": \"reasoning\"}}\n\n");
                await context.Response.Body.FlushAsync();
            }
        }
    }

    /// <summary>
    /// 处理普通优化模式
    /// </summary>
    private async Task ProcessNormalOptimization(
        Kernel kernel, 
        OptimizePromptWithConfigInput input, 
        HttpContext context, 
        StringBuilder result, 
        bool isFirst)
    {
        var optimizationResult = kernel.InvokeStreamingAsync(
            kernel.Plugins["Generate"]["OptimizePrompt"],
            new KernelArguments(new OpenAIPromptExecutionSettings()
            {
                MaxTokens = 1500,
                Temperature = 0.8f,
            })
            {
                ["prompt"] = input.Prompt,
                ["requirements"] = input.Requirements ?? ""
            });

        await foreach (var item in optimizationResult)
        {
            if (item is OpenAIStreamingChatMessageContent chatContent && chatContent.Content != null)
            {
                result.Append(chatContent.Content);
                await context.Response.WriteAsync($"data: {{\"content\": \"{EscapeJson(chatContent.Content)}\", \"type\": \"optimization\"}}\n\n");
                await context.Response.Body.FlushAsync();
            }
        }
    }

    /// <summary>
    /// 保存提示词历史记录
    /// </summary>
    private async Task SavePromptHistory(OptimizePromptWithConfigInput input, string result)
    {
        try
        {
            var history = new PromptHistory
            {
                Id = Guid.NewGuid(),
                UserId = userContext.UserId!,
                OriginalPrompt = input.Prompt,
                OptimizedPrompt = result,
                Requirements = input.Requirements,
                ChatModel = input.ChatModel ?? "",
                CreatedTime = DateTime.Now,
                ConfigId = input.ConfigId
            };

            await dbContext.PromptHistory.AddAsync(history);
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "保存提示词历史失败，用户: {UserId}", userContext.UserId);
        }
    }

    /// <summary>
    /// 转义JSON字符串
    /// </summary>
    private static string EscapeJson(string text)
    {
        return text.Replace("\\", "\\\\")
                  .Replace("\"", "\\\"")
                  .Replace("\n", "\\n")
                  .Replace("\r", "\\r")
                  .Replace("\t", "\\t");
    }
}

/// <summary>
/// 使用配置优化提示词输入
/// </summary>
public class OptimizePromptWithConfigInput
{
    public string Prompt { get; set; } = string.Empty;
    public string? Requirements { get; set; }
    public string? ChatModel { get; set; }
    public Guid? ConfigId { get; set; }
    public bool EnableDeepReasoning { get; set; } = false;
}
