using Console.Service.Infrastructure;
using Console.Service.Options;
using Microsoft.SemanticKernel;
using Serilog;

namespace Console.Service.AI;

public class KernelFactory
{
    public static Kernel CreateKernel(string chatModel, string apiUrl, string token)
    {
        if (!string.IsNullOrWhiteSpace(ConsoleOptions.DefaultAPIKey))
        {
            token = ConsoleOptions.DefaultAPIKey;
        }

        Log.Logger.Information("Creating Semantic Kernel with Chat Model: {ChatModel}, API URL: {ApiUrl} Token:{token}",
            chatModel,
            apiUrl, token);

        var kernelBuilder = Kernel.CreateBuilder()
            // 如果配置了API密钥，则使用API密钥
            .AddOpenAIChatCompletion(chatModel, new Uri(apiUrl), token,
                httpClient: new HttpClient(new KernelHttpClientHandler()
                {
                })
                {
                    Timeout = TimeSpan.FromSeconds(600),
                    DefaultRequestHeaders =
                    {
                        { "User-Agent", "PromptAI" },
                        { "Accept", "application/json" },
                    }
                });

        kernelBuilder.Services.AddSerilog(Log.Logger);

        kernelBuilder.Services.AddSingleton<IPromptRenderFilter>(new LanguagePromptFilter());

        kernelBuilder.Plugins.AddFromPromptDirectory(Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
            "Generate");

        var kernel = kernelBuilder.Build();

        return kernel;
    }
}