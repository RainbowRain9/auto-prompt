using System.Text.Json;
using Console.Core;
using Console.Core.Entities;
using Console.Service.Dto;
using Console.Service.Infrastructure;
using Console.Service.Options;
using Console.Service.Utils;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenAI;

namespace Console.Service.Services;

[FastService.Route("/v1/ai-service-configs")]
[Tags("AI服务配置管理")]
public class AIServiceConfigService : FastApi
{
    private readonly IDbContext dbContext;
    private readonly JwtService jwtService;

    public AIServiceConfigService(IDbContext dbContext, JwtService jwtService)
    {
        this.dbContext = dbContext;
        this.jwtService = jwtService;
    }

    /// <summary>
    /// 验证用户身份并获取用户ID
    /// </summary>
    private (bool isValid, string? userId, object? errorResponse, string? userName) ValidateTokenAndGetUserId(HttpContext context)
    {
        var token = context.Request.Headers.Authorization.ToString().Replace("Bearer ", "");

        if (string.IsNullOrWhiteSpace(token))
        {
            context.Response.StatusCode = 401;
            return (false, null, new { success = false, message = "未提供访问令牌" }, null);
        }

        var userId = jwtService.GetUserIdFromToken(token);
        if (string.IsNullOrWhiteSpace(userId))
        {
            context.Response.StatusCode = 401;
            return (false, null, new { success = false, message = "无效的访问令牌" }, null);
        }

        if (!jwtService.IsTokenValid(token))
        {
            context.Response.StatusCode = 401;
            return (false, null, new { success = false, message = "访问令牌已过期" }, null);
        }

        return (true, userId, null, jwtService.GetUserNameFromToken(token));
    }

    /// <summary>
    /// 将实体转换为DTO
    /// </summary>
    private AIServiceConfigDto MapToDto(AIServiceConfig entity)
    {
        return new AIServiceConfigDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Provider = entity.Provider,
            ApiEndpoint = entity.ApiEndpoint,
            ApiKey = EncryptionHelper.DecryptApiKey(entity.EncryptedApiKey),
            ChatModels = JsonSerializer.Deserialize<List<string>>(entity.ChatModels) ?? new(),
            ImageModels = JsonSerializer.Deserialize<List<string>>(entity.ImageModels) ?? new(),
            DefaultChatModel = entity.DefaultChatModel,
            DefaultImageModel = entity.DefaultImageModel,
            IsEnabled = entity.IsEnabled,
            IsDefault = entity.IsDefault,
            Description = entity.Description,
            ExtraConfig = string.IsNullOrEmpty(entity.ExtraConfig) 
                ? null 
                : JsonSerializer.Deserialize<Dictionary<string, object>>(entity.ExtraConfig),
            ConnectionStatus = entity.ConnectionStatus,
            LastTestTime = entity.LastTestTime,
            LastTestError = entity.LastTestError,
            UsageCount = entity.UsageCount,
            LastUsedTime = entity.LastUsedTime,
            CreatedTime = entity.CreatedTime,
            UpdatedTime = entity.UpdatedTime,
            SortOrder = entity.SortOrder
        };
    }

    /// <summary>
    /// 将实体转换为列表DTO（隐藏敏感信息）
    /// </summary>
    private AIServiceConfigListDto MapToListDto(AIServiceConfig entity)
    {
        return new AIServiceConfigListDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Provider = entity.Provider,
            ApiEndpoint = entity.ApiEndpoint,
            MaskedApiKey = EncryptionHelper.MaskApiKey(EncryptionHelper.DecryptApiKey(entity.EncryptedApiKey)),
            ChatModels = JsonSerializer.Deserialize<List<string>>(entity.ChatModels) ?? new(),
            ImageModels = JsonSerializer.Deserialize<List<string>>(entity.ImageModels) ?? new(),
            DefaultChatModel = entity.DefaultChatModel,
            DefaultImageModel = entity.DefaultImageModel,
            IsEnabled = entity.IsEnabled,
            IsDefault = entity.IsDefault,
            Description = entity.Description,
            ConnectionStatus = entity.ConnectionStatus,
            LastTestTime = entity.LastTestTime,
            LastTestError = entity.LastTestError,
            UsageCount = entity.UsageCount,
            LastUsedTime = entity.LastUsedTime,
            CreatedTime = entity.CreatedTime,
            UpdatedTime = entity.UpdatedTime,
            SortOrder = entity.SortOrder
        };
    }

    [EndpointSummary("获取AI服务配置列表")]
    [HttpPost("search")]
    public async Task<object> SearchConfigsAsync(AIServiceConfigSearchInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var query = dbContext.AIServiceConfigs
                .Where(x => x.UserId == userId)
                .AsQueryable();

            // 搜索过滤
            if (!string.IsNullOrWhiteSpace(input.SearchText))
            {
                query = query.Where(x => x.Name.Contains(input.SearchText) || 
                                        x.Description!.Contains(input.SearchText) ||
                                        x.Provider.Contains(input.SearchText));
            }

            if (!string.IsNullOrWhiteSpace(input.Provider))
            {
                query = query.Where(x => x.Provider == input.Provider);
            }

            if (input.IsEnabled.HasValue)
            {
                query = query.Where(x => x.IsEnabled == input.IsEnabled.Value);
            }

            if (!string.IsNullOrWhiteSpace(input.ConnectionStatus))
            {
                query = query.Where(x => x.ConnectionStatus == input.ConnectionStatus);
            }

            // 排序
            query = input.SortBy.ToLower() switch
            {
                "name" => input.SortOrder.ToLower() == "desc" 
                    ? query.OrderByDescending(x => x.Name)
                    : query.OrderBy(x => x.Name),
                "provider" => input.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.Provider)
                    : query.OrderBy(x => x.Provider),
                "createdtime" => input.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.CreatedTime)
                    : query.OrderBy(x => x.CreatedTime),
                "sortorder" => input.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.SortOrder)
                    : query.OrderBy(x => x.SortOrder),
                _ => query.OrderByDescending(x => x.CreatedTime)
            };

            var total = await query.CountAsync();
            var items = await query
                .Skip((input.Page - 1) * input.PageSize)
                .Take(input.PageSize)
                .ToListAsync();

            var result = new AIServiceConfigSearchResponse
            {
                Items = items.Select(MapToListDto).ToList(),
                Total = total,
                Page = input.Page,
                PageSize = input.PageSize
            };

            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"查询失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取AI服务配置详情")]
    [HttpGet("{id}")]
    public async Task<object> GetConfigAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(x => x.Id.ToString().ToLower() == id.ToLower() && x.UserId == userId);

            if (entity == null)
            {
                return new { success = false, message = "配置不存在或无权限访问" };
            }

            var result = MapToDto(entity);
            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"获取配置失败: {ex.Message}" };
        }
    }

    [EndpointSummary("创建AI服务配置")]
    [HttpPost]
    public async Task<object> CreateConfigAsync(CreateAIServiceConfigInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            // 验证API密钥格式
            if (!EncryptionHelper.ValidateApiKeyFormat(input.ApiKey, input.Provider))
            {
                return new { success = false, message = "API密钥格式不正确" };
            }

            // 检查名称是否重复
            var existingConfig = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(x => x.UserId == userId && x.Name == input.Name);
            if (existingConfig != null)
            {
                return new { success = false, message = "配置名称已存在" };
            }

            // 如果设置为默认配置，取消其他默认配置
            if (input.IsDefault)
            {
                await dbContext.AIServiceConfigs
                    .Where(x => x.UserId == userId && x.IsDefault)
                    .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsDefault, false));
            }

            var entity = new AIServiceConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId!,
                Name = input.Name,
                Provider = input.Provider,
                ApiEndpoint = input.ApiEndpoint,
                EncryptedApiKey = EncryptionHelper.EncryptApiKey(input.ApiKey),
                ChatModels = JsonSerializer.Serialize(input.ChatModels),
                ImageModels = JsonSerializer.Serialize(input.ImageModels),
                DefaultChatModel = input.DefaultChatModel,
                DefaultImageModel = input.DefaultImageModel,
                IsEnabled = input.IsEnabled,
                IsDefault = input.IsDefault,
                Description = input.Description,
                ExtraConfig = input.ExtraConfig != null ? JsonSerializer.Serialize(input.ExtraConfig) : null,
                ConnectionStatus = "Unknown",
                UsageCount = 0,
                CreatedTime = DateTime.Now,
                UpdatedTime = DateTime.Now,
                SortOrder = input.SortOrder
            };

            await dbContext.AIServiceConfigs.AddAsync(entity);
            await dbContext.SaveChangesAsync();

            var result = MapToDto(entity);
            return new { success = true, data = result, message = "创建成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"创建失败: {ex.Message}" };
        }
    }

    [EndpointSummary("更新AI服务配置")]
    [HttpPut]
    public async Task<object> UpdateConfigAsync(UpdateAIServiceConfigInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(x => x.Id == input.Id && x.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "配置不存在或无权限访问" };
            }

            // 验证API密钥格式（如果提供了新密钥）
            if (!string.IsNullOrEmpty(input.ApiKey) &&
                !EncryptionHelper.ValidateApiKeyFormat(input.ApiKey, input.Provider))
            {
                return new { success = false, message = "API密钥格式不正确" };
            }

            // 检查名称是否重复（排除自己）
            var existingConfig = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(x => x.UserId == userId && x.Name == input.Name && x.Id != input.Id);
            if (existingConfig != null)
            {
                return new { success = false, message = "配置名称已存在" };
            }

            // 如果设置为默认配置，取消其他默认配置
            if (input.IsDefault && !entity.IsDefault)
            {
                await dbContext.AIServiceConfigs
                    .Where(x => x.UserId == userId && x.IsDefault && x.Id != input.Id)
                    .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsDefault, false));
            }

            // 更新实体
            entity.Name = input.Name;
            entity.Provider = input.Provider;
            entity.ApiEndpoint = input.ApiEndpoint;
            if (!string.IsNullOrEmpty(input.ApiKey))
            {
                entity.EncryptedApiKey = EncryptionHelper.EncryptApiKey(input.ApiKey);
            }
            entity.ChatModels = JsonSerializer.Serialize(input.ChatModels);
            entity.ImageModels = JsonSerializer.Serialize(input.ImageModels);
            entity.DefaultChatModel = input.DefaultChatModel;
            entity.DefaultImageModel = input.DefaultImageModel;
            entity.IsEnabled = input.IsEnabled;
            entity.IsDefault = input.IsDefault;
            entity.Description = input.Description;
            entity.ExtraConfig = input.ExtraConfig != null ? JsonSerializer.Serialize(input.ExtraConfig) : null;
            entity.UpdatedTime = DateTime.Now;
            entity.SortOrder = input.SortOrder;

            // 如果配置发生变化，重置连接状态
            entity.ConnectionStatus = "Unknown";
            entity.LastTestTime = null;
            entity.LastTestError = null;

            await dbContext.SaveChangesAsync();

            var result = MapToDto(entity);
            return new { success = true, data = result, message = "更新成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"更新失败: {ex.Message}" };
        }
    }

    [EndpointSummary("删除AI服务配置")]
    [HttpDelete("{id}")]
    public async Task<object> DeleteConfigAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(x => x.Id.ToString().ToLower() == id.ToLower() && x.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "配置不存在或无权限访问" };
            }

            dbContext.AIServiceConfigs.Remove(entity);
            await dbContext.SaveChangesAsync();

            return new { success = true, message = "删除成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"删除失败: {ex.Message}" };
        }
    }

    [EndpointSummary("设置默认AI服务配置")]
    [HttpPost("{id}/set-default")]
    public async Task<object> SetDefaultConfigAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(x => x.Id.ToString().ToLower() == id.ToLower() && x.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "配置不存在或无权限访问" };
            }

            // 取消其他默认配置
            await dbContext.AIServiceConfigs
                .Where(x => x.UserId == userId && x.IsDefault)
                .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsDefault, false));

            // 设置当前配置为默认
            entity.IsDefault = true;
            entity.UpdatedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            return new { success = true, message = "设置默认配置成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"设置默认配置失败: {ex.Message}" };
        }
    }

    [EndpointSummary("测试AI服务连接")]
    [HttpPost("test-connection")]
    public async Task<object> TestConnectionAsync(TestConnectionInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            // 验证API密钥格式
            if (!EncryptionHelper.ValidateApiKeyFormat(input.ApiKey, input.Provider))
            {
                return new { success = false, message = "API密钥格式不正确" };
            }

            var result = await TestAIServiceConnection(input.Provider, input.ApiEndpoint, input.ApiKey, input.TestModel);
            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"连接测试失败: {ex.Message}" };
        }
    }

    [EndpointSummary("测试已保存的AI服务配置连接")]
    [HttpPost("{id}/test-connection")]
    public async Task<object> TestSavedConfigConnectionAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(x => x.Id.ToString().ToLower() == id.ToLower() && x.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "配置不存在或无权限访问" };
            }

            var apiKey = EncryptionHelper.DecryptApiKey(entity.EncryptedApiKey);
            var result = await TestAIServiceConnection(entity.Provider, entity.ApiEndpoint, apiKey, entity.DefaultChatModel);

            // 更新连接状态
            entity.ConnectionStatus = result.Success ? "Connected" : "Failed";
            entity.LastTestTime = DateTime.Now;
            entity.LastTestError = result.Success ? null : result.Message;
            entity.UpdatedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"连接测试失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取AI服务提供商信息")]
    [HttpGet("providers")]
    public async Task<object> GetProvidersAsync(HttpContext context)
    {
        // 获取提供商信息不需要认证，这是公开信息
        try
        {
            var providers = new List<AIProviderInfo>
            {
                new()
                {
                    Name = "OpenAI",
                    DisplayName = "OpenAI",
                    Description = "OpenAI官方API服务，支持GPT系列模型",
                    DefaultEndpoint = "https://api.openai.com/v1",
                    SupportedFeatures = new() { "chat", "image", "embedding" },
                    ConfigTemplate = new Dictionary<string, object>
                    {
                        { "apiKeyFormat", "sk-..." },
                        { "commonModels", new[] { "gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo", "dall-e-3", "text-embedding-ada-002" } }
                    }
                },
                new()
                {
                    Name = "DeepSeek",
                    DisplayName = "DeepSeek",
                    Description = "DeepSeek AI服务，高性价比的国产AI模型",
                    DefaultEndpoint = "https://api.deepseek.com/v1",
                    SupportedFeatures = new() { "chat", "code" },
                    ConfigTemplate = new Dictionary<string, object>
                    {
                        { "apiKeyFormat", "sk-..." },
                        { "commonModels", new[] { "deepseek-chat", "deepseek-coder", "deepseek-reasoner" } }
                    }
                },
                new()
                {
                    Name = "GoogleAI",
                    DisplayName = "Google AI",
                    Description = "Google AI服务，支持Gemini系列模型",
                    DefaultEndpoint = "https://generativelanguage.googleapis.com/v1beta",
                    SupportedFeatures = new() { "chat", "image", "multimodal" },
                    ConfigTemplate = new Dictionary<string, object>
                    {
                        { "apiKeyFormat", "AIza..." },
                        { "commonModels", new[] { "gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision" } }
                    }
                },
                new()
                {
                    Name = "Ollama",
                    DisplayName = "Ollama",
                    Description = "本地AI模型服务，支持多种开源模型",
                    DefaultEndpoint = "http://localhost:11434/v1",
                    SupportedFeatures = new() { "chat", "local" },
                    ConfigTemplate = new Dictionary<string, object>
                    {
                        { "apiKeyFormat", "可选或留空" },
                        { "commonModels", new[] { "llama3.2", "llama3.1", "qwen2.5", "codellama", "mistral", "phi3" } }
                    }
                },
                new()
                {
                    Name = "AzureOpenAI",
                    DisplayName = "Azure OpenAI",
                    Description = "Microsoft Azure OpenAI服务，企业级AI解决方案",
                    DefaultEndpoint = "https://your-resource.openai.azure.com/",
                    SupportedFeatures = new() { "chat", "image", "embedding" },
                    ConfigTemplate = new Dictionary<string, object>
                    {
                        { "apiKeyFormat", "Azure API Key" },
                        { "commonModels", new[] { "gpt-4o", "gpt-4", "gpt-35-turbo", "dall-e-3", "text-embedding-ada-002" } }
                    }
                },
                new()
                {
                    Name = "VolcEngine",
                    DisplayName = "火山引擎",
                    Description = "字节跳动火山引擎AI服务",
                    DefaultEndpoint = "https://ark.cn-beijing.volces.com/api/v3",
                    SupportedFeatures = new() { "chat", "image" },
                    ConfigTemplate = new Dictionary<string, object>
                    {
                        { "apiKeyFormat", "自定义格式" },
                        { "commonModels", new[] { "doubao-pro-4k", "doubao-lite-4k", "doubao-pro-32k" } }
                    }
                },
                new()
                {
                    Name = "Anthropic",
                    DisplayName = "Anthropic",
                    Description = "Anthropic Claude AI服务，专注安全的AI助手",
                    DefaultEndpoint = "https://api.anthropic.com/v1",
                    SupportedFeatures = new() { "chat", "reasoning" },
                    ConfigTemplate = new Dictionary<string, object>
                    {
                        { "apiKeyFormat", "sk-ant-..." },
                        { "commonModels", new[] { "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229" } }
                    }
                }
            };

            return new { success = true, data = providers };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"获取提供商信息失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 测试AI服务连接
    /// </summary>
    private async Task<TestConnectionResponse> TestAIServiceConnection(string provider, string apiEndpoint, string apiKey, string? testModel = null)
    {
        try
        {
            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
            httpClient.DefaultRequestHeaders.Add("User-Agent", "AutoPrompt-ConfigTest/1.0");

            // 根据不同提供商使用不同的测试方法
            return provider.ToLower() switch
            {
                "openai" => await TestOpenAIConnection(httpClient, apiEndpoint, testModel),
                "deepseek" => await TestDeepSeekConnection(httpClient, apiEndpoint, testModel),
                "googleai" => await TestGoogleAIConnection(httpClient, apiEndpoint, apiKey, testModel),
                "ollama" => await TestOllamaConnection(httpClient, apiEndpoint, testModel),
                "volcengine" => await TestVolcEngineConnection(httpClient, apiEndpoint, testModel),
                _ => await TestGenericOpenAIConnection(httpClient, apiEndpoint, testModel)
            };
        }
        catch (Exception ex)
        {
            return new TestConnectionResponse
            {
                Success = false,
                Message = $"连接测试失败: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// 测试OpenAI连接
    /// </summary>
    private async Task<TestConnectionResponse> TestOpenAIConnection(HttpClient httpClient, string apiEndpoint, string? testModel)
    {
        try
        {
            // 首先获取模型列表
            var modelsResponse = await httpClient.GetAsync($"{apiEndpoint.TrimEnd('/')}/models");
            if (!modelsResponse.IsSuccessStatusCode)
            {
                return new TestConnectionResponse
                {
                    Success = false,
                    Message = $"无法获取模型列表: {modelsResponse.StatusCode}"
                };
            }

            var modelsContent = await modelsResponse.Content.ReadAsStringAsync();
            var modelsData = JsonSerializer.Deserialize<JsonElement>(modelsContent);

            var availableModels = new List<string>();
            if (modelsData.TryGetProperty("data", out var dataArray))
            {
                foreach (var model in dataArray.EnumerateArray())
                {
                    if (model.TryGetProperty("id", out var id))
                    {
                        availableModels.Add(id.GetString() ?? "");
                    }
                }
            }

            // 如果指定了测试模型，进行简单的聊天测试
            if (!string.IsNullOrEmpty(testModel) && availableModels.Contains(testModel))
            {
                var chatRequest = new
                {
                    model = testModel,
                    messages = new[]
                    {
                        new { role = "user", content = "Hello" }
                    },
                    max_tokens = 5
                };

                var chatContent = new StringContent(JsonSerializer.Serialize(chatRequest), System.Text.Encoding.UTF8, "application/json");
                var chatResponse = await httpClient.PostAsync($"{apiEndpoint.TrimEnd('/')}/chat/completions", chatContent);

                if (!chatResponse.IsSuccessStatusCode)
                {
                    return new TestConnectionResponse
                    {
                        Success = false,
                        Message = $"聊天测试失败: {chatResponse.StatusCode}",
                        AvailableModels = availableModels
                    };
                }
            }

            return new TestConnectionResponse
            {
                Success = true,
                Message = "连接成功",
                AvailableModels = availableModels,
                Details = new Dictionary<string, object>
                {
                    { "modelCount", availableModels.Count },
                    { "endpoint", apiEndpoint }
                }
            };
        }
        catch (Exception ex)
        {
            return new TestConnectionResponse
            {
                Success = false,
                Message = $"OpenAI连接测试失败: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// 测试DeepSeek连接
    /// </summary>
    private async Task<TestConnectionResponse> TestDeepSeekConnection(HttpClient httpClient, string apiEndpoint, string? testModel)
    {
        // DeepSeek使用OpenAI兼容接口
        return await TestOpenAIConnection(httpClient, apiEndpoint, testModel);
    }

    /// <summary>
    /// 测试Google AI连接
    /// </summary>
    private async Task<TestConnectionResponse> TestGoogleAIConnection(HttpClient httpClient, string apiEndpoint, string apiKey, string? testModel)
    {
        try
        {
            // Google AI使用不同的认证方式
            httpClient.DefaultRequestHeaders.Clear();

            var testUrl = $"{apiEndpoint.TrimEnd('/')}/models?key={apiKey}";
            var response = await httpClient.GetAsync(testUrl);

            if (!response.IsSuccessStatusCode)
            {
                return new TestConnectionResponse
                {
                    Success = false,
                    Message = $"Google AI连接失败: {response.StatusCode}"
                };
            }

            var content = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<JsonElement>(content);

            var availableModels = new List<string>();
            if (data.TryGetProperty("models", out var modelsArray))
            {
                foreach (var model in modelsArray.EnumerateArray())
                {
                    if (model.TryGetProperty("name", out var name))
                    {
                        var modelName = name.GetString()?.Split('/').LastOrDefault();
                        if (!string.IsNullOrEmpty(modelName))
                        {
                            availableModels.Add(modelName);
                        }
                    }
                }
            }

            return new TestConnectionResponse
            {
                Success = true,
                Message = "Google AI连接成功",
                AvailableModels = availableModels
            };
        }
        catch (Exception ex)
        {
            return new TestConnectionResponse
            {
                Success = false,
                Message = $"Google AI连接测试失败: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// 测试Ollama连接
    /// </summary>
    private async Task<TestConnectionResponse> TestOllamaConnection(HttpClient httpClient, string apiEndpoint, string? testModel)
    {
        try
        {
            // Ollama通常不需要API密钥
            httpClient.DefaultRequestHeaders.Clear();

            var response = await httpClient.GetAsync($"{apiEndpoint.TrimEnd('/')}/api/tags");
            if (!response.IsSuccessStatusCode)
            {
                return new TestConnectionResponse
                {
                    Success = false,
                    Message = $"Ollama连接失败: {response.StatusCode}"
                };
            }

            var content = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<JsonElement>(content);

            var availableModels = new List<string>();
            if (data.TryGetProperty("models", out var modelsArray))
            {
                foreach (var model in modelsArray.EnumerateArray())
                {
                    if (model.TryGetProperty("name", out var name))
                    {
                        availableModels.Add(name.GetString() ?? "");
                    }
                }
            }

            return new TestConnectionResponse
            {
                Success = true,
                Message = "Ollama连接成功",
                AvailableModels = availableModels
            };
        }
        catch (Exception ex)
        {
            return new TestConnectionResponse
            {
                Success = false,
                Message = $"Ollama连接测试失败: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// 测试火山引擎连接
    /// </summary>
    private async Task<TestConnectionResponse> TestVolcEngineConnection(HttpClient httpClient, string apiEndpoint, string? testModel)
    {
        // 火山引擎的具体实现需要根据其API文档调整
        return await TestGenericOpenAIConnection(httpClient, apiEndpoint, testModel);
    }

    /// <summary>
    /// 通用OpenAI兼容接口测试
    /// </summary>
    private async Task<TestConnectionResponse> TestGenericOpenAIConnection(HttpClient httpClient, string apiEndpoint, string? testModel)
    {
        try
        {
            var response = await httpClient.GetAsync($"{apiEndpoint.TrimEnd('/')}/models");
            if (!response.IsSuccessStatusCode)
            {
                return new TestConnectionResponse
                {
                    Success = false,
                    Message = $"连接失败: {response.StatusCode}"
                };
            }

            return new TestConnectionResponse
            {
                Success = true,
                Message = "连接成功（通用OpenAI兼容接口）"
            };
        }
        catch (Exception ex)
        {
            return new TestConnectionResponse
            {
                Success = false,
                Message = $"连接测试失败: {ex.Message}"
            };
        }
    }

    [EndpointSummary("设置AI服务配置为全局默认")]
    [HttpPost("{id}/set-global-default")]
    public async Task<object> SetGlobalDefaultAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            // 查找指定的AI服务配置
            var config = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(c => c.Id.ToString().ToLower() == id.ToLower() &&
                                         c.UserId == userId &&
                                         c.IsEnabled);

            if (config == null)
            {
                return new { success = false, message = "AI服务配置不存在或无权限访问" };
            }

            // 验证配置是否可用（连接状态为成功）
            if (config.ConnectionStatus != "Connected")
            {
                return new { success = false, message = "只有连接测试成功的配置才能设置为全局默认" };
            }

            // 解密API密钥
            string decryptedApiKey;
            try
            {
                decryptedApiKey = EncryptionHelper.DecryptApiKey(config.EncryptedApiKey);
                if (string.IsNullOrEmpty(decryptedApiKey))
                {
                    return new { success = false, message = "API密钥解密失败" };
                }
            }
            catch (Exception ex)
            {
                return new { success = false, message = $"API密钥解密失败: {ex.Message}" };
            }

            // 清除当前用户的其他全局默认设置
            var currentGlobalDefaults = await dbContext.AIServiceConfigs
                .Where(c => c.UserId == userId && c.IsDefault)
                .ToListAsync();

            foreach (var defaultConfig in currentGlobalDefaults)
            {
                defaultConfig.IsDefault = false;
            }

            // 设置新的全局默认
            config.IsDefault = true;
            config.LastUsedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            // 更新系统全局配置
            ConsoleOptions.UpdateGlobalConfig(config, decryptedApiKey);

            return new {
                success = true,
                message = "已成功设置为全局默认配置",
                data = new {
                    configId = config.Id,
                    provider = config.Provider,
                    name = config.Name,
                    endpoint = config.ApiEndpoint,
                    defaultChatModel = config.DefaultChatModel
                }
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"设置全局默认配置失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取当前全局默认配置")]
    [HttpGet("global-default")]
    public async Task<object> GetGlobalDefaultAsync(HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            // 查找当前用户的全局默认配置
            var globalDefault = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(c => c.UserId == userId && c.IsDefault && c.IsEnabled);

            if (globalDefault == null)
            {
                return new {
                    success = true,
                    data = new { },
                    message = "未设置全局默认配置"
                };
            }

            var result = new
            {
                id = globalDefault.Id,
                name = globalDefault.Name,
                provider = globalDefault.Provider,
                description = globalDefault.Description,
                apiEndpoint = globalDefault.ApiEndpoint,
                defaultChatModel = globalDefault.DefaultChatModel,
                defaultImageModel = globalDefault.DefaultImageModel,
                connectionStatus = globalDefault.ConnectionStatus,
                lastUsedTime = globalDefault.LastUsedTime,
                isDefault = globalDefault.IsDefault
            };

            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"获取全局默认配置失败: {ex.Message}" };
        }
    }

    [EndpointSummary("清除全局默认配置")]
    [HttpDelete("global-default")]
    public async Task<object> ClearGlobalDefaultAsync(HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            // 清除当前用户的全局默认设置
            var globalDefaults = await dbContext.AIServiceConfigs
                .Where(c => c.UserId == userId && c.IsDefault)
                .ToListAsync();

            foreach (var config in globalDefaults)
            {
                config.IsDefault = false;
            }

            await dbContext.SaveChangesAsync();

            // 清除系统全局配置
            ConsoleOptions.ClearGlobalConfig();

            return new {
                success = true,
                message = "已清除全局默认配置，回退到系统默认设置"
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"清除全局默认配置失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取全局配置状态")]
    [HttpGet("global-status")]
    public async Task<object> GetGlobalStatusAsync(HttpContext context)
    {
        try
        {
            var status = ConsoleOptions.GetGlobalConfigStatus();
            return new { success = true, data = status };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"获取全局配置状态失败: {ex.Message}" };
        }
    }
}
