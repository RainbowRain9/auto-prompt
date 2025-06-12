using System.ComponentModel;
using System.Text;
using Console.Core;
using Console.Service.Dto;
using Console.Service.Entities;
using Console.Service.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using ModelContextProtocol.Server;

namespace Console.Service.MCP.Tools;

[McpServerToolType]
public class PromptTool(IDbContext dbContext)
{
    [McpServerTool,
     Description(
         "Optimizes and enhances image generation prompts for improved visual output quality, specificity, and artistic coherence")]
    public async Task<string> OptimizeImagePromptAsync(
        IMcpServer server,
        [Description(
            "Original image generation prompt text to be analyzed, refined, and enhanced for better visual results")]
        string prompt,
        [Description(
            "Specific optimization criteria and requirements including desired style, quality level, detail enhancement, artistic direction, technical parameters, and output specifications")]
        string requirements)
    {
        var token = server.ServerOptions.Capabilities!.Experimental["token"].ToString().Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token))
        {
            throw new InvalidOperationException("Token is required for this operation.");
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

        var kernelBuilder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(ConsoleOptions.DefaultImageGenerationModel, new Uri(ConsoleOptions.OpenAIEndpoint),
                token);
        var kernel = kernelBuilder.Build();
        var plugins = kernel.CreatePluginFromPromptDirectory(
            Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
            "Generate");

        var result = new StringBuilder();

        await foreach (var item in kernel.InvokeStreamingAsync(plugins["OptimizeImagePrompt"],
                           new KernelArguments(
                               new OpenAIPromptExecutionSettings()
                               {
                                   MaxTokens = 32000,
                                   Temperature = 0.7f,
                               })
                           {
                               { "prompt", prompt },
                               { "requirement", requirements }
                           }))
        {
            if (isFirst)
            {
                isFirst = false;
            }

            if (item is OpenAIStreamingChatMessageContent chatMessageContent)
            {
                if (chatMessageContent.Content == null)
                {
                    continue;
                }


                result.Append(chatMessageContent.Content);
            }
        }

        var entity = new PromptHistory()
        {
            Id = Guid.NewGuid(),
            Requirement = requirements ?? "",
            Result = result.ToString(),
            CreatedTime = DateTime.Now,
            DeepReasoning = "",
            Prompt = prompt
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

        return result.ToString();
    }

    [McpServerTool,
     Description(
         "Systematically analyzes, restructures, and enhances AI prompts using advanced optimization methodologies to maximize model performance, response accuracy, and task completion effectiveness")]
    public async Task<string> GeneratePromptAsync(
        IMcpServer server,
        [Description(
            "Source prompt content requiring optimization - accepts natural language instructions, structured prompts, conversational queries, or multi-component prompt frameworks that need enhancement for improved AI model comprehension")]
        string prompt,
        [Description(
            "Detailed optimization criteria structured as: response_style=[formal|conversational|technical|academic], detail_level=[concise|comprehensive|exhaustive], context_scope=[domain_expertise|general_knowledge|specialized_field], output_format=[structured|narrative|bullet_points|json], performance_goals=[accuracy|creativity|efficiency|clarity], and constraint_parameters=[length_limits|tone_requirements|audience_specifications]")]
        string requirements,
        [Description(
            "Activates comprehensive multi-layer analysis including cognitive load optimization, semantic coherence enhancement, logical flow restructuring, attention mechanism targeting, and advanced reasoning pattern integration for complex prompt engineering scenarios")]
        bool enableDeepReasoning = false,
        [Description(
            "Target AI model identifier for optimization compatibility and performance tuning - defaults to 'claude-sonnet-4-20250514' for optimal prompt-model alignment and response quality")]
        string chatModel = "claude-sonnet-4-20250514")
    {
        var token = server.ServerOptions.Capabilities!.Experimental["token"].ToString().Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token))
        {
            throw new InvalidOperationException("Token is required for this operation.");
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


        if (enableDeepReasoning)
        {
            return await DeepReasoningAsync(new GeneratePromptInput()
            {
                Prompt = prompt,
                Requirements = requirements,
                ChatModel = chatModel,
                EnableDeepReasoning = enableDeepReasoning
            }, token, ConsoleOptions.OpenAIEndpoint);
        }
        else
        {
            bool isFirst = true;

            var kernelBuilder = Kernel.CreateBuilder()
                .AddOpenAIChatCompletion(chatModel, new Uri(ConsoleOptions.OpenAIEndpoint),
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
                                   { "prompt", prompt },
                                   { "requirement", requirements }
                               }))
            {
                if (isFirst)
                {
                    isFirst = false;
                }

                if (item is OpenAIStreamingChatMessageContent chatMessageContent)
                {
                    if (chatMessageContent.Content == null)
                    {
                        continue;
                    }

                    result.Append(chatMessageContent.Content);
                }
            }


            var entity = new PromptHistory()
            {
                Id = Guid.NewGuid(),
                Requirement = requirements,
                Result = result.ToString(),
                CreatedTime = DateTime.Now,
                DeepReasoning = "",
                Prompt = prompt
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

            return result.ToString();
        }
    }


    private async Task<string> DeepReasoningAsync(GeneratePromptInput input, string token, string apiUrl)
    {
        var kernelBuilder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(input.ChatModel, new Uri(apiUrl), token);

        var kernel = kernelBuilder.Build();

        var plugins = kernel.CreatePluginFromPromptDirectory(
            Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
            "Generate");

        var isFirst = true;


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
            }
        }

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

                result.Append(chatMessageContent.Content);
            }
        }

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

        return result.ToString();
    }
}