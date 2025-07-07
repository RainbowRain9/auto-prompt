using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Console.Core;
using Console.Core.Entities;
using Console.Service.AI;
using Console.Service.Dto;
using Console.Service.Options;
using Console.Service.Utils;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using OpenAI;

namespace Console.Service.Services;

[FastService.Route("/v1/prompt")]
[Tags("提示词生成")]
public class PromptService(IDbContext dbContext, ILogger<PromptService> logger) : FastApi
{
    [EndpointSummary("自动生成提示词模板参数")]
    public async Task<PromptTemplateParameterDto> GeneratePromptTemplateParametersAsync(
        [FromBody] GeneratePromptTemplateParameterInput input, HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            throw new UnauthorizedAccessException("未授权访问，请提供有效的API令牌。");
        }

        var kernel = KernelFactory.CreateKernel(ConsoleOptions.DefaultChatModel, ConsoleOptions.OpenAIEndpoint, token);

        var plugins = await kernel.InvokeAsync(kernel.CreatePluginFromPromptDirectory(
                Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
                "Generate")["GenerateDescription"],
            new KernelArguments(new OpenAIPromptExecutionSettings()
            {
                MaxTokens = 400,
                Temperature = 1
            })
            {
                ["prompt"] = input.Prompt
            });

        // 正则表达式提取<data>
        var regex = new Regex(@"<data>(.*?)<\/data>",
            RegexOptions.Singleline);
        var match = regex.Match(plugins.ToString());
        if (match.Success)
        {
            var dataContent = match.Groups[1].Value.Trim();
            var parameters =
                JsonSerializer.Deserialize<PromptTemplateParameterDto>(dataContent, JsonSerializerOptions.Web);

            if (parameters != null)
            {
                return parameters;
            }

            logger.LogWarning("从生成的提示词中提取的<data>标签内容无法反序列化为PromptTemplateParameterDto，请检查提示词格式: {Prompt}",
                input.Prompt);
        }
        else
        {
            logger.LogWarning("未能从生成的提示词中提取<data>标签内容，请检查提示词格式: {Prompt}", input.Prompt);
        }

        throw new Exception("无法从生成的提示词中提取参数，请检查提示词格式。");
    }

    [EndpointSummary("优化Function Calling提示词")]
    [HttpPost("optimize-function-calling")]
    public async Task OptimizeFunctionCallingPromptAsync(
        [FromBody] OptimizeFunctionCallingPromptInput input, HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Trim();
        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            throw new UnauthorizedAccessException("未授权访问，请提供有效的API令牌。");
        }

        if (token.StartsWith("tk-"))
        {
            // 如果是sk 则是API Key
            var apiKey = await dbContext.ApiKeys
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Key == token);

            if (apiKey == null)
            {
                throw new InvalidOperationException("API Key not found.");
            }

            if (apiKey.ExpiresAt != null && apiKey.ExpiresAt < DateTime.Now)
            {
                throw new InvalidOperationException("API Key has expired.");
            }

            token = apiKey.OpenAiApiKey;
        }

        // 获取会话配置ID
        string configId = context.Request.Headers["X-AI-Config-Id"].ToString();

        // 设置API端点和认证信息
        string apiEndpoint = ConsoleOptions.OpenAIEndpoint;
        string actualToken = token;
        Dictionary<string, string> customHeaders = null;

        // 如果有配置ID，使用会话级别代理服务
        if (!string.IsNullOrEmpty(configId))
        {
            apiEndpoint = "http://localhost:5298/openai/session";
            // 保持原始token，代理服务需要它来验证用户身份
            customHeaders = new Dictionary<string, string>
            {
                { "X-AI-Config-Id", configId }
            };
        }

        if (input.EnableDeepReasoning)
        {
            await DeepReasoningFunctionCallingAsync(input, context, actualToken, apiEndpoint, configId);
        }
        else
        {
            bool isFirst = true;

            var kernel = KernelFactory.CreateKernel(input.ChatModel, apiEndpoint, actualToken, customHeaders);

            var result = new StringBuilder();

            await foreach (var item in kernel.InvokeStreamingAsync(
                               kernel.Plugins["Generate"]["OptimizeInitialFunctionCallingPrompt"],
                               new KernelArguments(
                                   new OpenAIPromptExecutionSettings()
                                   {
                                       MaxTokens = MaxToken(input.ChatModel),
                                       Temperature = 0.7f,
                                   })
                               {
                                   { "function_call", input.Prompt },
                                   { "requirement", input.Requirements }
                               }))
            {
                if (isFirst)
                {
                    context.Response.Headers.ContentType = "text/event-stream";
                    context.Response.Headers.CacheControl = "no-cache";
                    context.Response.Headers.Connection = "keep-alive";

                    isFirst = false;
                }

                if (item is OpenAIStreamingChatMessageContent chatMessageContent)
                {
                    if (chatMessageContent.Content == null)
                    {
                        continue;
                    }

                    await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                    {
                        message = chatMessageContent.Content,
                        type = "message",
                    }, JsonSerializerOptions.Web)}\n\n");

                    result.Append(chatMessageContent.Content);

                    await context.Response.Body.FlushAsync();
                }
            }

            // 开始生成评估
            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
            {
                type = "evaluate-start",
            }, JsonSerializerOptions.Web)}\n\n");

            await foreach (var i in EvaluatePromptWordAsync(input.Prompt, result.ToString(), token,
                               apiEndpoint, input.ChatModel, configId))
            {
                await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                {
                    message = i,
                    type = "evaluate",
                }, JsonSerializerOptions.Web)}\n\n");
            }

            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
            {
                type = "evaluate-end",
            }, JsonSerializerOptions.Web)}\n\n");

            await context.Response.WriteAsync("data: [DONE]\n\n");
            await context.Response.Body.FlushAsync();

            var entity = new PromptHistory()
            {
                Id = Guid.NewGuid(),
                Requirement = input.Requirements ?? "",
                Result = result.ToString(),
                CreatedTime = DateTime.Now,
                DeepReasoning = "",
                Prompt = input.Prompt
            };

            await dbContext.PromptHistory.AddAsync(entity);

            if (token.StartsWith("tk-"))
            {
                await dbContext.ApiKeys
                    .Where(x => x.Key == token)
                    .ExecuteUpdateAsync(x => x.SetProperty(a => a.UsageCount, a => a.UsageCount + 1)
                        .SetProperty(a => a.LastUsedTime, a => DateTime.Now));
            }

            await dbContext.SaveChangesAsync();
        }
    }


    [EndpointSummary("优化image提示词")]
    public async Task OptimizeImagePromptAsync(
        [FromBody] GenerateImagePromptInput input, HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            throw new UnauthorizedAccessException("未授权访问，请提供有效的API令牌。");
        }

        if (token.StartsWith("tk-"))
        {
            // 如果是sk 则是API Key
            var apiKey = await dbContext.ApiKeys
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Key == token);

            if (apiKey == null)
            {
                throw new InvalidOperationException("API Key not found.");
            }

            if (apiKey.ExpiresAt != null && apiKey.ExpiresAt < DateTime.Now)
            {
                throw new InvalidOperationException("API Key has expired.");
            }

            token = apiKey.OpenAiApiKey;
        }

        bool isFirst = true;

        var kernel = KernelFactory.CreateKernel(ConsoleOptions.DefaultImageGenerationModel,
            ConsoleOptions.OpenAIEndpoint, token);


        var result = new StringBuilder();

        await foreach (var item in kernel.InvokeStreamingAsync(kernel.Plugins["Generate"]["OptimizeImagePrompt"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = MaxToken(ConsoleOptions.DefaultImageGenerationModel),
                                   Temperature = 0.7f,
                               })
                           {
                               { "prompt", input.Prompt },
                               { "requirement", input.Requirements }
                           }))
        {
            if (isFirst)
            {
                context.Response.Headers.ContentType = "text/event-stream";
                context.Response.Headers.CacheControl = "no-cache";
                context.Response.Headers.Connection = "keep-alive";

                isFirst = false;
            }

            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                {
                    message = chatMessageContent.Content,
                    type = "message",
                }, JsonSerializerOptions.Web)}\n\n");

                result.Append(chatMessageContent.Content);

                await context.Response.Body.FlushAsync();
            }
        }

        await context.Response.WriteAsync("data: [DONE]\n\n");

        await context.Response.Body.FlushAsync();

        var entity = new PromptHistory()
        {
            Id = Guid.NewGuid(),
            Requirement = input.Requirements ?? "",
            Result = result.ToString(),
            CreatedTime = DateTime.Now,
            DeepReasoning = "",
            Prompt = input.Prompt
        };

        await dbContext.PromptHistory.AddAsync(entity);

        if (token.StartsWith("tk-"))
        {
            await dbContext.ApiKeys
                .Where(x => x.Key == token)
                .ExecuteUpdateAsync(x => x.SetProperty(a => a.UsageCount, a => a.UsageCount + 1)
                    .SetProperty(a => a.LastUsedTime, a => DateTime.Now));
        }

        await dbContext.SaveChangesAsync();
    }

    private async Task DeepReasoningFunctionCallingAsync(OptimizeFunctionCallingPromptInput input, HttpContext context,
        string token,
        string apiUrl, string configId = null)
    {
        // 设置认证信息
        string actualToken = token;
        Dictionary<string, string> customHeaders = null;

        // 如果有配置ID，使用会话级别代理服务
        if (!string.IsNullOrEmpty(configId))
        {
            customHeaders = new Dictionary<string, string>
            {
                { "X-AI-Config-Id", configId }
            };
        }

        var kernel = KernelFactory.CreateKernel(input.ChatModel, apiUrl, actualToken, customHeaders);

        var isFirst = true;

        context.Response.Headers.ContentType = "text/event-stream";
        context.Response.Headers.CacheControl = "no-cache";
        context.Response.Headers.Connection = "keep-alive";


        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
        {
            type = "deep-reasoning-start",
        }, JsonSerializerOptions.Web)}\n\n");

        var deepReasoning = new StringBuilder();

        await foreach (var item in kernel.InvokeStreamingAsync(
                           kernel.Plugins["Generate"]["DeepReasoningFunctionCalling"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = MaxToken(input.ChatModel),
                                   Temperature = 0.7f,
                               })
                           {
                               { "date", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") },
                               { "function_call", input.Prompt },
                               { "requirement", input.Requirements }
                           }))
        {
            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                deepReasoning.Append(chatMessageContent.Content);

                await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                {
                    message = chatMessageContent.Content,
                    type = "deep-reasoning",
                }, JsonSerializerOptions.Web)}\n\n");

                await context.Response.Body.FlushAsync();
            }
        }

        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
        {
            type = "deep-reasoning-end",
        }, JsonSerializerOptions.Web)}\n\n");

        var result = new StringBuilder();

        await foreach (var item in kernel.InvokeStreamingAsync(
                           kernel.Plugins["Generate"]["DeepReasoningFunctionCallingPrompt"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = MaxToken(input.ChatModel),
                                   Temperature = 0.7f,
                               })
                           {
                               { "function_call", input.Prompt },
                               { "requirement", input.Requirements },
                               { "deepReasoning", deepReasoning.ToString() }
                           }))
        {
            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                {
                    message = chatMessageContent.Content,
                    type = "message",
                }, JsonSerializerOptions.Web)}\n\n");

                result.Append(chatMessageContent.Content);

                await context.Response.Body.FlushAsync();
            }
        }

        // 开始生成评估
        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
        {
            type = "evaluate-start",
        }, JsonSerializerOptions.Web)}\n\n");

        await foreach (var i in EvaluatePromptWordAsync(input.Prompt, result.ToString(), token,
                           apiUrl, input.ChatModel, configId))
        {
            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
            {
                message = i,
                type = "evaluate",
            }, JsonSerializerOptions.Web)}\n\n");
        }

        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
        {
            type = "evaluate-end",
        }, JsonSerializerOptions.Web)}\n\n");

        await context.Response.WriteAsync("data: [DONE]\n\n");
        await context.Response.Body.FlushAsync();

        var entity = new PromptHistory()
        {
            Id = Guid.NewGuid(),
            Requirement = input.Requirements ?? "",
            Result = result.ToString(),
            CreatedTime = DateTime.Now,
            DeepReasoning = deepReasoning.ToString(),
            Prompt = input.Prompt
        };

        await dbContext.PromptHistory.AddAsync(entity);

        if (token.StartsWith("tk-"))
        {
            await dbContext.ApiKeys
                .Where(x => x.Key == token)
                .ExecuteUpdateAsync(x => x.SetProperty(a => a.UsageCount, a => a.UsageCount + 1)
                    .SetProperty(a => a.LastUsedTime, a => DateTime.Now));
        }

        await dbContext.SaveChangesAsync();
    }

    [EndpointSummary("优化提示词")]
    [HttpPost("generate")]
    public async Task GeneratePromptAsync(GeneratePromptInput input, HttpContext context)
    {
        // 统一从Authorization头获取JWT token，与其他服务保持一致
        var token = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Trim();
        var configId = context.Request.Headers["X-AI-Config-Id"].ToString();

        // 获取AI服务配置信息
        string apiEndpoint = ConsoleOptions.OpenAIEndpoint; // 默认端点

        if (!string.IsNullOrEmpty(configId))
        {
            // 如果有配置ID，获取用户的AI服务配置
            var userId = context.User.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                var aiConfig = await dbContext.AIServiceConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id.ToString() == configId && x.UserId == userId && x.IsEnabled);

                if (aiConfig != null)
                {
                    apiEndpoint = aiConfig.ApiEndpoint;
                    // 当使用配置ID时，保持用户token不变，让代理服务处理API密钥
                    // actualToken 保持为用户的JWT token
                }
            }
        }
        else
        {
            // 没有配置ID时，验证JWT token
            if (string.IsNullOrEmpty(token))
            {
                context.Response.StatusCode = 401;
                return;
            }

            // 验证JWT token
            var jwtService = context.RequestServices.GetRequiredService<JwtService>();
            var userId = jwtService.GetUserIdFromToken(token);

            if (string.IsNullOrEmpty(userId))
            {
                context.Response.StatusCode = 401;
                return;
            }

            if (!jwtService.IsTokenValid(token))
            {
                context.Response.StatusCode = 401;
                return;
            }

            // 获取用户的默认AI服务配置
            var defaultConfig = await dbContext.AIServiceConfigs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IsDefault && x.IsEnabled);

            if (defaultConfig != null)
            {
                // 使用默认配置，通过代理服务调用
                apiEndpoint = defaultConfig.ApiEndpoint;
                configId = defaultConfig.Id.ToString(); // 设置配置ID以使用代理服务
            }
            else
            {
                // 如果没有默认配置，检查全局配置
                if (string.IsNullOrEmpty(ConsoleOptions.DefaultAPIKey))
                {
                    context.Response.StatusCode = 400;
                    await context.Response.WriteAsync("请先配置AI服务或设置默认配置");
                    return;
                }
                // 使用全局配置（直接调用）
                // 注意：这里需要使用API密钥而不是JWT token
                token = ConsoleOptions.DefaultAPIKey;
            }
        }

        if (input.EnableDeepReasoning)
        {
            var isFirst = true;
            // 推理结束
            var deepReasoningEnd = false;

            context.Response.Headers.ContentType = "text/event-stream";
            context.Response.Headers.CacheControl = "no-cache";
            context.Response.Headers.Connection = "keep-alive";


            var deepReasoning = new StringBuilder();
            var result = new StringBuilder();

            try
            {
                await foreach (var (deep, value) in GenerateDeepReasoningPromptAsync(input.ChatModel, input.Prompt,
                                   input.Requirements, token, apiEndpoint, configId))
                {
                    if (isFirst && deep)
                    {
                        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                        {
                            type = "deep-reasoning-start",
                        }, JsonSerializerOptions.Web)}\n\n");

                        isFirst = false;
                    }

                    if (deep)
                    {
                        deepReasoning.Append(value);

                        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                        {
                            message = value,
                            type = "deep-reasoning",
                        }, JsonSerializerOptions.Web)}\n\n");

                        await context.Response.Body.FlushAsync();
                    }
                    else if (deepReasoningEnd == false)
                    {
                        deepReasoningEnd = true;

                        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                        {
                            type = "deep-reasoning-end",
                        }, JsonSerializerOptions.Web)}\n\n");
                    }
                    else
                    {
                        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                        {
                            message = value,
                            type = "message",
                        }, JsonSerializerOptions.Web)}\n\n");

                        result.Append(value);

                        await context.Response.Body.FlushAsync();
                    }
                }
            }
            catch (Exception e)
            {
                logger.LogError(e, "Deep reasoning failed for prompt: {Prompt}", input.Prompt);
                await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                {
                    error = e.Message,
                    type = "error",
                }, JsonSerializerOptions.Web)}\n\n");
                await context.Response.Body.FlushAsync();
                return;
            }

            // 开始生成评估
            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
            {
                type = "evaluate-start",
            }, JsonSerializerOptions.Web)}\n\n");

            await foreach (var i in EvaluatePromptWordAsync(input.Prompt, result.ToString(), token,
                               apiEndpoint, input.ChatModel, configId))
            {
                await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                {
                    message = i,
                    type = "evaluate",
                }, JsonSerializerOptions.Web)}\n\n");
            }

            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
            {
                type = "evaluate-end",
            }, JsonSerializerOptions.Web)}\n\n");

            await context.Response.WriteAsync("data: [DONE]\n\n");
            await context.Response.Body.FlushAsync();

            var entity = new PromptHistory()
            {
                Id = Guid.NewGuid(),
                Requirement = input.Requirements ?? "",
                Result = result.ToString(),
                CreatedTime = DateTime.Now,
                DeepReasoning = deepReasoning.ToString(),
                Prompt = input.Prompt
            };

            await dbContext.PromptHistory.AddAsync(entity);

            await dbContext.SaveChangesAsync();
        }
        else
        {
            bool isFirst = true;

            var result = new StringBuilder();

            await foreach (var chatMessageContent in OptimizeInitialPromptAsync(input.ChatModel, input.Prompt,
                               input.Requirements, token,
                               apiEndpoint, configId))
            {
                if (isFirst)
                {
                    context.Response.Headers.ContentType = "text/event-stream";
                    context.Response.Headers.CacheControl = "no-cache";
                    context.Response.Headers.Connection = "keep-alive";

                    isFirst = false;
                }

                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                {
                    message = chatMessageContent.Content,
                    type = "message",
                }, JsonSerializerOptions.Web)}\n\n");

                result.Append(chatMessageContent.Content);

                await context.Response.Body.FlushAsync();
            }

            // 开始生成评估
            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
            {
                type = "evaluate-start",
            }, JsonSerializerOptions.Web)}\n\n");

            await foreach (var i in EvaluatePromptWordAsync(input.Prompt, result.ToString(), token,
                               apiEndpoint, input.ChatModel, configId))
            {
                await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
                {
                    message = i,
                    type = "evaluate",
                }, JsonSerializerOptions.Web)}\n\n");
            }


            await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
            {
                type = "evaluate-end",
            }, JsonSerializerOptions.Web)}\n\n");

            await context.Response.WriteAsync("data: [DONE]\n\n");
            await context.Response.Body.FlushAsync();

            var entity = new PromptHistory()
            {
                Id = Guid.NewGuid(),
                Requirement = input.Requirements ?? "",
                Result = result.ToString(),
                CreatedTime = DateTime.Now,
                DeepReasoning = "",
                Prompt = input.Prompt
            };

            await dbContext.PromptHistory.AddAsync(entity);

            if (token.StartsWith("tk-"))
            {
                await dbContext.ApiKeys
                    .Where(x => x.Key == token)
                    .ExecuteUpdateAsync(x => x.SetProperty(a => a.UsageCount, a => a.UsageCount + 1)
                        .SetProperty(a => a.LastUsedTime, a => DateTime.Now));
            }

            await dbContext.SaveChangesAsync();
        }
    }

    [IgnoreRoute]
    public async IAsyncEnumerable<(bool, string)> GenerateDeepReasoningPromptAsync(
        string model,
        string prompt,
        string requirements, string token, string apiEndpoint = null, string configId = null)
    {
        var endpoint = apiEndpoint ?? ConsoleOptions.OpenAIEndpoint;

        // 如果有配置ID，使用会话级别代理服务
        Dictionary<string, string> customHeaders = null;

        if (!string.IsNullOrEmpty(configId))
        {
            endpoint = "http://localhost:5298/openai/session";
            // 保持原始token，代理服务需要它来验证用户身份
            customHeaders = new Dictionary<string, string>
            {
                { "X-AI-Config-Id", configId }
            };
        }

        var kernel = KernelFactory.CreateKernel(model, endpoint, token, customHeaders);

        var deepReasoning = new StringBuilder();

        await foreach (var item in kernel.InvokeStreamingAsync(kernel.Plugins["Generate"]["DeepReasoning"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = MaxToken(model),
                                   Temperature = 0.7f,
                               })
                           {
                               { "date", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") },
                               { "prompt", prompt },
                               { "requirement", requirements }
                           }))
        {
            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                deepReasoning.Append(chatMessageContent.Content);

                yield return (true, chatMessageContent.Content);
            }
        }

        var result = new StringBuilder();

        // 正则表达式匹配<output>
        var regex = new Regex(@"<output>(.*?)<\/output>",
            RegexOptions.Singleline);

        var deepReasoningResult = deepReasoning.ToString();

        // 删除thought内容
        deepReasoningResult =
            Regex.Replace(deepReasoningResult, @"<thought>.*?<\/thought>", "", RegexOptions.Singleline);
        var match = regex.Match(deepReasoningResult);
        if (match.Success)
        {
            var outputContent = match.Groups[1].Value.Trim();
            deepReasoning.Clear();
            deepReasoning.Append(outputContent);
        }


        await foreach (var item in kernel.InvokeStreamingAsync(kernel.Plugins["Generate"]["DeepReasoningPrompt"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = MaxToken(model),
                                   Temperature = 0.7f,
                               })
                           {
                               { "prompt", prompt },
                               { "requirement", requirements },
                               { "deepReasoning", deepReasoning.ToString() }
                           }))
        {
            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                deepReasoning.Append(chatMessageContent.Content);

                yield return (false, chatMessageContent.Content);

                result.Append(chatMessageContent.Content);
            }
        }
    }

    [IgnoreRoute]
    public async IAsyncEnumerable<OpenAIStreamingChatMessageContent> OptimizeInitialPromptAsync(
        string model,
        string prompt,
        string requirements,
        string token, string apiUrl, string configId = null)
    {
        // 如果有配置ID，使用会话级别代理服务
        string actualApiUrl = apiUrl;
        string actualToken = token;
        Dictionary<string, string> customHeaders = null;

        if (!string.IsNullOrEmpty(configId))
        {
            actualApiUrl = "http://localhost:5298/openai/session";
            // 保持原始token，代理服务需要它来验证用户身份
            customHeaders = new Dictionary<string, string>
            {
                { "X-AI-Config-Id", configId }
            };
        }

        var kernel = KernelFactory.CreateKernel(model, actualApiUrl, actualToken, customHeaders);

        await foreach (var item in kernel.InvokeStreamingAsync(kernel.Plugins["Generate"]["OptimizeInitialPrompt"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = MaxToken(model),
                                   Temperature = 0.7f,
                               })
                           {
                               { "prompt", prompt },
                               { "requirement", requirements }
                           }))
        {
            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                yield return chatMessageContent;
            }
        }
    }

    /// <summary>
    /// PromptWordEvaluation
    /// </summary>
    /// <returns></returns>
    private async IAsyncEnumerable<string> EvaluatePromptWordAsync(string prompt, string newPrompt, string token,
        string apiUrl, string model = null, string configId = null)
    {
        var chatModel = model ?? ConsoleOptions.DefaultChatModel;

        // 如果有配置ID，使用会话级别代理服务
        Dictionary<string, string> customHeaders = null;
        if (!string.IsNullOrEmpty(configId))
        {
            customHeaders = new Dictionary<string, string>
            {
                { "X-AI-Config-Id", configId }
            };
            // 使用会话级别代理服务URL
            apiUrl = "http://localhost:5298/openai/session";
        }

        var kernel = KernelFactory.CreateKernel(chatModel, apiUrl, token, customHeaders);

        await foreach (var item in kernel.InvokeStreamingAsync(kernel.Plugins["Generate"]["PromptWordEvaluation"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = MaxToken(chatModel),
                                   Temperature = 0.7f,
                               })
                           {
                               { "prompt", prompt },
                               { "newPrompt", newPrompt }
                           }))
        {
            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                yield return chatMessageContent.Content;
            }
        }
    }

    /// <summary>
    /// 生成提示词优化建议
    /// </summary>
    /// <returns></returns>
    [EndpointSummary("生成提示词优化建议")]
    [HttpPost("generate-prompt-optimization-suggestion")]
    public async Task<string> GeneratePromptOptimizationSuggestionAsync(GeneratePromptOptimizationSuggestionInput input,
        HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            return "Unauthorized access, please provide a valid API token.";
        }

        if (token.StartsWith("tk-"))
        {
            // 如果是sk 则是API Key
            var apiKey = await dbContext.ApiKeys
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Key == token);

            if (apiKey == null)
            {
                throw new InvalidOperationException("API Key not found.");
            }

            if (apiKey.ExpiresAt != null && apiKey.ExpiresAt < DateTime.Now)
            {
                throw new InvalidOperationException("API Key has expired.");
            }

            token = apiKey.OpenAiApiKey;
        }


        var kernel = KernelFactory.CreateKernel(input.Model, ConsoleOptions.OpenAIEndpoint, token);

        var result = new StringBuilder();

        await foreach (var item in kernel.InvokeStreamingAsync(kernel.Plugins["Generate"]["Suggestion"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = MaxToken(input.Model),
                                   Temperature = 0.7f,
                               })
                           {
                               { "prompt", input.Prompt },
                               { "newPrompt", input.NewPrompt }
                           }))
        {
            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }

                result.Append(chatMessageContent.Content);
            }
        }

        return result.ToString();
    }

    private static int MaxToken(string model)
    {
        if (model.StartsWith("gpt-4.1"))
        {
            return 128000;
        }

        if (model.StartsWith("o"))
        {
            return 100000; // OpenAI模型通常支持更高的Token限制
        }

        if (model.StartsWith("claude"))
        {
            return 100000; // Claude模型通常支持更高的Token限制
        }

        if (model.StartsWith("gemini"))
        {
            return 100000; // Gemini模型通常支持更高的Token限制
        }

        if (model.Equals("Qwen3-235B-A22B", StringComparison.OrdinalIgnoreCase))
        {
            return 8192; // Qwen3-235B-A22B模型通常支持更高的Token限制
        }

        if (model.Equals("Qwen3-30B-A3B", StringComparison.OrdinalIgnoreCase))
        {
            return 8192; // Qwen3-30B-A3B模型通常支持更高的Token限制
        }

        if (model.Equals("Qwen3-32B", StringComparison.OrdinalIgnoreCase))
        {
            return 4096;
        }


        // 根据模型返回最大Token数
        return model switch
        {
            "gpt-3.5-turbo" => 4096,
            "gpt-4o" => 8192,
            "gpt-4" => 8192,
            "gpt-4-32k" => 32768,
            "gpt-4-1106-preview" => 8192,
            "gpt-4-vision-preview" => 8192,
            _ => 8192
        };
    }
}