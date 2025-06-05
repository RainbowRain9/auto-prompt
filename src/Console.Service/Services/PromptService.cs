using System.Text;
using System.Text.Json;
using Console.Core;
using Console.Service.Dto;
using Console.Service.Entities;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel.PromptTemplates.Handlebars;

namespace Console.Service.Services;

[FastService.Route("/v1/prompt")]
[Tags("提示词生成")]
public class PromptService(IDbContext dbContext) : FastApi
{
    [EndpointSummary("优化提示词")]
    [HttpPost("generate")]
    public async Task GeneratePromptAsync(GeneratePromptInput input, HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].ToString().Trim().Replace("Bearer ", "");

        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            return;
        }

        if (input.EnableDeepReasoning)
        {
            await DeepReasoningAsync(input, context, token);
        }
        else
        {
            bool isFirst = true;

            var kernelBuilder = Kernel.CreateBuilder()
                .AddOpenAIChatCompletion(input.ChatModel, new Uri("https://api.token-ai.cn/v1"),
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
                                       MaxTokens = 63000,
                                       Temperature = 0.7f,
                                   })
                               {
                                   { "prompt", input.Prompt },
                                   { "requirement", input.Requirement }
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
                Requirement = input.Requirement ?? "",
                Result = result.ToString(),
                CreatedTime = DateTime.Now,
                DeepReasoning = "",
                Prompt = input.Prompt
            };

            await dbContext.PromptHistory.AddAsync(entity);

            await dbContext.SaveChangesAsync();
        }
    }

    private async Task DeepReasoningAsync(GeneratePromptInput input, HttpContext context, string token)
    {
        var kernelBuilder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(input.ChatModel, new Uri("https://api.token-ai.cn/v1"), token);

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
                                   MaxTokens = 63000,
                                   Temperature = 0.7f,
                               })
                           {
                               { "date", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") },
                               { "prompt", input.Prompt },
                               { "requirement", input.Requirement }
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
                                   MaxTokens = 63000,
                                   Temperature = 0.7f,
                               })
                           {
                               { "prompt", input.Prompt },
                               { "requirement", input.Requirement },
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
            Requirement = input.Requirement ?? "",
            Result = result.ToString(),
            CreatedTime = DateTime.Now,
            DeepReasoning = deepReasoning.ToString(),
            Prompt = input.Prompt
        };

        await dbContext.PromptHistory.AddAsync(entity);

        await dbContext.SaveChangesAsync();
    }
}