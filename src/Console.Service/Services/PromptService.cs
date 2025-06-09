using System.Text;
using System.Text.Json;
using Console.Core;
using Console.Service.Dto;
using Console.Service.Entities;
using Console.Service.Options;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel.PromptTemplates.Handlebars;

namespace Console.Service.Services;

[FastService.Route("/v1/prompt")]
[Tags("提示词生成")]
public class PromptService(IDbContext dbContext, ILogger<PromptService> logger) : FastApi
{
    [EndpointSummary("自动生成提示词模板参数")]
    public async Task<PromptTemplateParameterDto> GeneratePromptTemplateParametersAsync(
        [FromBody] GeneratePromptTemplateParameterInput input, HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].ToString().Trim().Replace("Bearer ", "");

        var apiUrl = context.Request.Headers["X-Api-Url"].ToString();

        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            throw new UnauthorizedAccessException("未授权访问，请提供有效的API令牌。");
        }

        if (string.IsNullOrEmpty(apiUrl) || apiUrl.Contains("/openai"))
        {
            apiUrl = ConsoleOptions.OpenAIEndpoint;
        }

        var kernelBuilder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(ConsoleOptions.GenerationChatModel, new Uri(apiUrl), token);

        var kernel = kernelBuilder.Build();

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
        var regex = new System.Text.RegularExpressions.Regex(@"<data>(.*?)<\/data>",
            System.Text.RegularExpressions.RegexOptions.Singleline);
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

    [EndpointSummary("优化提示词")]
    [HttpPost("generate")]
    public async Task GeneratePromptAsync(GeneratePromptInput input, HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].ToString().Trim().Replace("Bearer ", "");

        var apiUrl = context.Request.Headers["X-Api-Url"].ToString();

        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            return;
        }

        if (string.IsNullOrEmpty(apiUrl) || apiUrl.Contains("/openai"))
        {
            apiUrl = ConsoleOptions.OpenAIEndpoint;
        }

        if (input.EnableDeepReasoning)
        {
            await DeepReasoningAsync(input, context, token, apiUrl);
        }
        else
        {
            bool isFirst = true;

            var kernelBuilder = Kernel.CreateBuilder()
                .AddOpenAIChatCompletion(input.ChatModel, new Uri(apiUrl),
                    token);


            var kernel = kernelBuilder.Build();

            var plugins = kernel.CreatePluginFromPromptDirectory(
                Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
                "Generate");

            var result = new StringBuilder();

            await foreach (var item in kernel.InvokeStreamingAsync(plugins["OptimizeInitialPrompt"],
                               new KernelArguments(
                                   new OpenAIPromptExecutionSettings()
                                   {
                                       MaxTokens = 32000,
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

            await dbContext.SaveChangesAsync();
        }
    }

    private async Task DeepReasoningAsync(GeneratePromptInput input, HttpContext context, string token, string apiUrl)
    {
        var kernelBuilder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(input.ChatModel, new Uri(apiUrl), token);

        var kernel = kernelBuilder.Build();

        var plugins = kernel.CreatePluginFromPromptDirectory(
            Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
            "Generate");

        var isFirst = true;

        context.Response.Headers.ContentType = "text/event-stream";
        context.Response.Headers.CacheControl = "no-cache";
        context.Response.Headers.Connection = "keep-alive";


        await context.Response.WriteAsync($"data: {JsonSerializer.Serialize(new
        {
            type = "deep-reasoning-start",
        }, JsonSerializerOptions.Web)}\n\n");

        var deepReasoning = new StringBuilder();

        await foreach (var item in kernel.InvokeStreamingAsync(plugins["DeepReasoning"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = 32000,
                                   Temperature = 0.7f,
                               })
                           {
                               { "date", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") },
                               { "prompt", input.Prompt },
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

        await foreach (var item in kernel.InvokeStreamingAsync(plugins["DeepReasoningPrompt"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = 32000,
                                   Temperature = 0.7f,
                               })
                           {
                               { "prompt", input.Prompt },
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

                deepReasoning.Append(chatMessageContent.Content);

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
            DeepReasoning = deepReasoning.ToString(),
            Prompt = input.Prompt
        };

        await dbContext.PromptHistory.AddAsync(entity);

        await dbContext.SaveChangesAsync();
    }
}