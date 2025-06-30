using Console.Service.Options;
using Console.Service.Utils;
using Console.Service.Services;
using Console.Core.Entities;
using Console.Core;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text;
using Yarp.ReverseProxy.Forwarder;

namespace Console.Service.Services;

public static class ProxyService
{
    public static IEndpointRouteBuilder MapOpenAiProxy(this WebApplication builder)
    {
        // 使用直接的路由映射方式

        // 会话级别配置代理 - 捕获所有 /openai/session/* 路径
        builder.MapMethods("/openai/session/{**path}", new[] { "GET", "POST", "PUT", "DELETE", "PATCH" }, async (HttpContext context) =>
        {
            System.Console.WriteLine($"🎯 [ProxyService] 捕获到会话级别请求: {context.Request.Path} {context.Request.Method}");
            await HandleOpenAIProxyRequest(context, useGlobalConfig: false);
        });

        // 全局配置代理 - 捕获所有 /openai/* 路径（但排除 /openai/session/*）
        builder.MapMethods("/openai/{**path}", new[] { "GET", "POST", "PUT", "DELETE", "PATCH" }, async (HttpContext context) =>
        {
            // 排除已经被会话级别路由处理的路径
            if (context.Request.Path.StartsWithSegments("/openai/session"))
            {
                return;
            }
            System.Console.WriteLine($"🎯 [ProxyService] 捕获到全局配置请求: {context.Request.Path} {context.Request.Method}");
            await HandleOpenAIProxyRequest(context, useGlobalConfig: true);
        });

        return builder;
    }

    private static async Task HandleOpenAIProxyRequest(HttpContext context, bool useGlobalConfig)
    {
        var httpForwarder = context.RequestServices.GetRequiredService<IHttpForwarder>();

        string? apiKey = null;
        string? endpoint = null;
        SessionConfigResult? sessionConfigResult = null;

        if (useGlobalConfig)
        {
            // 使用全局配置（原有逻辑）
            apiKey = ConsoleOptions.DefaultAPIKey;
            endpoint = ConsoleOptions.OpenAIEndpoint;

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("未配置API密钥，请先设置AI服务配置为全局默认");
                return;
            }

            if (string.IsNullOrWhiteSpace(endpoint))
            {
                context.Response.StatusCode = 500;
                await context.Response.WriteAsync("未配置API端点，请先设置AI服务配置为全局默认");
                return;
            }

            // 处理全局配置的路径：移除 /openai 前缀
            var originalPath = context.Request.Path.Value ?? "";
            if (originalPath.StartsWith("/openai"))
            {
                context.Request.Path = originalPath.Substring(7); // 移除 "/openai"
            }
        }
        else
        {
            // 使用会话级别配置
            sessionConfigResult = await GetSessionConfigFromHeaders(context);
            if (!sessionConfigResult.Success)
            {
                context.Response.StatusCode = sessionConfigResult.StatusCode;
                await context.Response.WriteAsync(sessionConfigResult.Message);
                return;
            }

            apiKey = sessionConfigResult.ApiKey;
            endpoint = sessionConfigResult.Endpoint;

            // 根据服务商类型转换请求格式
            var originalPath = context.Request.Path.Value ?? "";
            string? requestBody = null;

            if (originalPath.StartsWith("/openai/session"))
            {
                var remainingPath = originalPath.Substring(15); // 移除 "/openai/session"

                // 根据服务商类型决定API格式
                if (remainingPath.StartsWith("/chat/completions"))
                {
                    if (sessionConfigResult.Provider == "GoogleAI")
                    {
                        // Google AI 格式：需要转换为 /v1beta/models/{model}:generateContent
                        // 先读取请求体获取模型名称
                        context.Request.EnableBuffering();
                        using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                        requestBody = await reader.ReadToEndAsync();
                        context.Request.Body.Position = 0;

                        // 解析请求体获取模型名称
                        var requestJson = JsonDocument.Parse(requestBody);
                        var model = requestJson.RootElement.GetProperty("model").GetString() ?? "gemini-pro";

                        // 构建 Google AI 格式的路径，移除端点中的 v1beta 避免重复
                        context.Request.Path = $"/models/{model}:generateContent";
                        // 如果端点不包含 v1beta，则添加
                        if (!endpoint.Contains("/v1beta"))
                        {
                            context.Request.Path = $"/v1beta{context.Request.Path}";
                        }
                        System.Console.WriteLine($"🔍 [ProxyService] Google AI格式转换: {remainingPath} -> /v1beta/models/{model}:generateContent");

                        // 保存原始 OpenAI 请求体到 HttpContext.Items 中，供后续流式检测使用
                        context.Items["OriginalOpenAIRequestBody"] = requestBody;

                        // 转换请求体格式：OpenAI -> Google AI
                        var googleRequest = ConvertOpenAIToGoogleAI(requestJson);
                        var googleRequestBody = JsonSerializer.Serialize(googleRequest);

                        // 替换请求体
                        var bodyBytes = Encoding.UTF8.GetBytes(googleRequestBody);
                        context.Request.Body = new MemoryStream(bodyBytes);
                        context.Request.ContentLength = bodyBytes.Length;

                        System.Console.WriteLine($"🔍 [ProxyService] 请求体已转换为Google AI格式");
                    }
                    else
                    {
                        // OpenAI 格式或其他格式，保持原路径
                        context.Request.Path = remainingPath;
                        System.Console.WriteLine($"🔍 [ProxyService] 保持OpenAI格式: {remainingPath}");
                    }
                }
                else
                {
                    context.Request.Path = remainingPath;
                }
            }
        }

        // 设置Authorization头
        context.Request.Headers["Authorization"] = $"Bearer {apiKey}";

        try
        {
            if (sessionConfigResult?.Provider == "GoogleAI")
            {
                // Google AI 需要特殊处理响应转换
                await HandleGoogleAIRequest(context, endpoint, apiKey);
            }
            else
            {
                // 其他服务使用标准代理
                await httpForwarder.SendAsync(context, endpoint, new HttpMessageInvoker(
                    new HttpClientHandler()
                    {
                        AllowAutoRedirect = true,
                        UseCookies = true,
                    }));
            }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync($"代理请求失败: {ex.Message}");
        }
    }

    private static async Task<SessionConfigResult> GetSessionConfigFromHeaders(HttpContext context)
    {
        try
        {
            System.Console.WriteLine($"🔍 [ProxyService] 开始处理会话配置请求");
            System.Console.WriteLine($"🔍 [ProxyService] 请求头: {string.Join(", ", context.Request.Headers.Select(h => $"{h.Key}={h.Value}"))}");

            // 从请求头获取配置ID
            if (!context.Request.Headers.TryGetValue("X-AI-Config-Id", out var configIdHeader) ||
                string.IsNullOrEmpty(configIdHeader))
            {
                System.Console.WriteLine($"❌ [ProxyService] 缺少X-AI-Config-Id请求头");
                return new SessionConfigResult
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "缺少AI服务配置ID，请在请求头中设置X-AI-Config-Id"
                };
            }

            var configId = configIdHeader.ToString();
            System.Console.WriteLine($"✅ [ProxyService] 获取到配置ID: {configId}");

            // 从Authorization头中获取用户ID
            var token = context.Request.Headers.Authorization.ToString().Replace("Bearer ", "");
            System.Console.WriteLine($"🔍 [ProxyService] 获取到token: {token?.Substring(0, Math.Min(10, token.Length))}...");

            if (string.IsNullOrWhiteSpace(token))
            {
                System.Console.WriteLine($"❌ [ProxyService] 缺少认证token");
                return new SessionConfigResult
                {
                    Success = false,
                    StatusCode = 401,
                    Message = "缺少认证token"
                };
            }

            // 验证token并获取用户ID
            var jwtService = context.RequestServices.GetRequiredService<JwtService>();
            var userId = jwtService.GetUserIdFromToken(token);
            System.Console.WriteLine($"🔍 [ProxyService] 解析到用户ID: {userId}");

            if (string.IsNullOrEmpty(userId))
            {
                System.Console.WriteLine($"❌ [ProxyService] token无效或已过期");
                return new SessionConfigResult
                {
                    Success = false,
                    StatusCode = 401,
                    Message = "token无效或已过期"
                };
            }

            // 从数据库获取AI服务配置
            var dbContext = context.RequestServices.GetRequiredService<Console.Core.IDbContext>();
            var config = await dbContext.AIServiceConfigs
                .FirstOrDefaultAsync(c => c.Id.ToString().ToLower() == configId.ToLower() &&
                                         c.UserId == userId &&
                                         c.IsEnabled);

            if (config == null)
            {
                return new SessionConfigResult
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "AI服务配置不存在或无权限访问"
                };
            }

            // 解密API密钥
            string decryptedApiKey;
            try
            {
                decryptedApiKey = EncryptionHelper.DecryptApiKey(config.EncryptedApiKey);
                if (string.IsNullOrEmpty(decryptedApiKey))
                {
                    return new SessionConfigResult
                    {
                        Success = false,
                        StatusCode = 500,
                        Message = "API密钥解密失败"
                    };
                }
            }
            catch (Exception ex)
            {
                return new SessionConfigResult
                {
                    Success = false,
                    StatusCode = 500,
                    Message = $"API密钥解密失败: {ex.Message}"
                };
            }

            return new SessionConfigResult
            {
                Success = true,
                ApiKey = decryptedApiKey,
                Endpoint = config.ApiEndpoint,
                ConfigId = config.Id.ToString(),
                Provider = config.Provider
            };
        }
        catch (Exception ex)
        {
            return new SessionConfigResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"获取会话配置失败: {ex.Message}"
            };
        }
    }

    private class SessionConfigResult
    {
        public bool Success { get; set; }
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ApiKey { get; set; }
        public string? Endpoint { get; set; }
        public string? ConfigId { get; set; }
        public string? Provider { get; set; }
    }

    /// <summary>
    /// 将 OpenAI 格式的请求转换为 Google AI 格式
    /// </summary>
    private static object ConvertOpenAIToGoogleAI(JsonDocument openAIRequest)
    {
        var root = openAIRequest.RootElement;

        // 获取消息列表
        var messages = root.GetProperty("messages").EnumerateArray().ToList();

        // 转换消息格式
        var contents = new List<object>();

        foreach (var message in messages)
        {
            var role = message.GetProperty("role").GetString();
            var content = message.GetProperty("content").GetString();

            // Google AI 格式的消息
            var googleMessage = new
            {
                role = role == "user" ? "user" : "model",
                parts = new[] { new { text = content } }
            };

            contents.Add(googleMessage);
        }

        // 构建 Google AI 请求格式
        var googleRequest = new
        {
            contents = contents,
            generationConfig = new
            {
                temperature = root.TryGetProperty("temperature", out var temp) ? temp.GetDouble() : 0.5,
                maxOutputTokens = root.TryGetProperty("max_tokens", out var maxTokens) ? maxTokens.GetInt32() : 4096
            }
        };

        return googleRequest;
    }

    /// <summary>
    /// 处理 Google AI 请求和响应转换
    /// </summary>
    private static async Task HandleGoogleAIRequest(HttpContext context, string endpoint, string apiKey)
    {
        using var httpClient = new HttpClient();

        // 构建完整的请求URL
        var requestUrl = $"{endpoint.TrimEnd('/')}{context.Request.Path}?key={apiKey}";
        System.Console.WriteLine($"🔍 [ProxyService] Google AI 请求URL: {requestUrl}");

        // 读取当前请求体（Google AI 格式）
        context.Request.EnableBuffering();
        using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
        var googleRequestBody = await reader.ReadToEndAsync();
        context.Request.Body.Position = 0;

        // 从 HttpContext.Items 中获取原始 OpenAI 请求体进行流式检测
        var originalRequestBody = context.Items["OriginalOpenAIRequestBody"] as string;
        var isStreaming = false;

        if (!string.IsNullOrEmpty(originalRequestBody))
        {
            var originalRequestJson = JsonDocument.Parse(originalRequestBody);
            isStreaming = originalRequestJson.RootElement.TryGetProperty("stream", out var streamProp) && streamProp.GetBoolean();
            System.Console.WriteLine($"🔍 [ProxyService] 原始OpenAI请求体: {originalRequestBody}");
        }
        else
        {
            System.Console.WriteLine($"🔍 [ProxyService] 未找到原始OpenAI请求体，使用当前请求体");
        }

        System.Console.WriteLine($"🔍 [ProxyService] 当前Google AI请求体: {googleRequestBody}");
        System.Console.WriteLine($"🔍 [ProxyService] 是否流式请求: {isStreaming}");

        // 发送请求到 Google AI
        var httpRequest = new HttpRequestMessage(HttpMethod.Post, requestUrl)
        {
            Content = new StringContent(googleRequestBody, Encoding.UTF8, "application/json")
        };

        var response = await httpClient.SendAsync(httpRequest);
        var responseContent = await response.Content.ReadAsStringAsync();

        System.Console.WriteLine($"🔍 [ProxyService] Google AI 响应状态: {response.StatusCode}");
        System.Console.WriteLine($"🔍 [ProxyService] Google AI 响应内容: {responseContent.Substring(0, Math.Min(200, responseContent.Length))}...");
        System.Console.WriteLine($"🔍 [ProxyService] 是否流式请求: {isStreaming}");

        if (response.IsSuccessStatusCode)
        {

            if (isStreaming)
            {
                // 流式响应：转换为 OpenAI 流式格式
                await ConvertGoogleAIToOpenAIStream(responseContent, context);
            }
            else
            {
                // 非流式响应：转换为 OpenAI 格式
                var openAIResponse = ConvertGoogleAIToOpenAI(responseContent);
                var openAIJson = JsonSerializer.Serialize(openAIResponse);

                context.Response.StatusCode = 200;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(openAIJson);
            }
        }
        else
        {
            context.Response.StatusCode = (int)response.StatusCode;
            await context.Response.WriteAsync(responseContent);
        }
    }

    /// <summary>
    /// 将 Google AI 响应转换为 OpenAI 流式格式
    /// </summary>
    private static async Task ConvertGoogleAIToOpenAIStream(string googleResponse, HttpContext context)
    {
        try
        {
            var googleData = JsonSerializer.Deserialize<JsonElement>(googleResponse);

            // 提取 Google AI 响应中的内容
            var content = "";
            if (googleData.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];
                if (firstCandidate.TryGetProperty("content", out var contentObj) &&
                    contentObj.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0)
                {
                    var firstPart = parts[0];
                    if (firstPart.TryGetProperty("text", out var text))
                    {
                        content = text.GetString() ?? "";
                    }
                }
            }

            // 设置流式响应头
            context.Response.StatusCode = 200;
            context.Response.ContentType = "text/plain; charset=utf-8";
            context.Response.Headers.Add("Cache-Control", "no-cache");
            context.Response.Headers.Add("Connection", "keep-alive");

            // 构建 OpenAI 流式响应
            var chatId = $"chatcmpl-{Guid.NewGuid().ToString("N")[..29]}";
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            // 发送开始事件
            var startChunk = new
            {
                id = chatId,
                @object = "chat.completion.chunk",
                created = timestamp,
                model = "gemini-2.5-flash",
                choices = new[]
                {
                    new
                    {
                        index = 0,
                        delta = new
                        {
                            role = "assistant",
                            content = ""
                        },
                        finish_reason = (string?)null
                    }
                }
            };

            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(startChunk)}\n\n");
            await context.Response.Body.FlushAsync();

            // 发送内容事件
            var contentChunk = new
            {
                id = chatId,
                @object = "chat.completion.chunk",
                created = timestamp,
                model = "gemini-2.5-flash",
                choices = new[]
                {
                    new
                    {
                        index = 0,
                        delta = new
                        {
                            content = content
                        },
                        finish_reason = (string?)null
                    }
                }
            };

            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(contentChunk)}\n\n");
            await context.Response.Body.FlushAsync();

            // 发送结束事件
            var endChunk = new
            {
                id = chatId,
                @object = "chat.completion.chunk",
                created = timestamp,
                model = "gemini-2.5-flash",
                choices = new[]
                {
                    new
                    {
                        index = 0,
                        delta = new { },
                        finish_reason = "stop"
                    }
                }
            };

            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(endChunk)}\n\n");
            await context.Response.WriteAsync("data: [DONE]\n\n");
            await context.Response.Body.FlushAsync();
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"🚨 [ProxyService] Google AI 流式响应转换失败: {ex.Message}");
            await context.Response.WriteAsync($"data: {{\"error\": \"响应转换失败: {ex.Message}\"}}\n\n");
        }
    }

    /// <summary>
    /// 将 Google AI 响应转换为 OpenAI 格式
    /// </summary>
    private static object ConvertGoogleAIToOpenAI(string googleResponse)
    {
        try
        {
            var googleData = JsonSerializer.Deserialize<JsonElement>(googleResponse);

            // 提取 Google AI 响应中的内容
            var content = "";
            if (googleData.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];
                if (firstCandidate.TryGetProperty("content", out var contentObj) &&
                    contentObj.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0)
                {
                    var firstPart = parts[0];
                    if (firstPart.TryGetProperty("text", out var text))
                    {
                        content = text.GetString() ?? "";
                    }
                }
            }

            // 构建 OpenAI 格式的响应
            var openAIResponse = new
            {
                id = $"chatcmpl-{Guid.NewGuid().ToString("N")[..29]}",
                @object = "chat.completion",
                created = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                model = "gemini-2.5-flash",
                choices = new[]
                {
                    new
                    {
                        index = 0,
                        message = new
                        {
                            role = "assistant",
                            content = content
                        },
                        finish_reason = "stop"
                    }
                },
                usage = new
                {
                    prompt_tokens = 0,
                    completion_tokens = 0,
                    total_tokens = 0
                }
            };

            return openAIResponse;
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"🚨 [ProxyService] Google AI 响应转换失败: {ex.Message}");
            return new
            {
                error = new
                {
                    message = $"响应转换失败: {ex.Message}",
                    type = "conversion_error"
                }
            };
        }
    }
}