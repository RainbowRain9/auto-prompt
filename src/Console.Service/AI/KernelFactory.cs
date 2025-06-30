using Console.Service.Infrastructure;
using Console.Service.Options;
using Microsoft.SemanticKernel;
using Serilog;

namespace Console.Service.AI;

public class KernelFactory
{
    public static Kernel CreateKernel(string chatModel, string apiUrl, string token)
    {
        return CreateKernel(chatModel, apiUrl, token, null);
    }

    public static Kernel CreateKernel(string chatModel, string apiUrl, string token, Dictionary<string, string> customHeaders)
    {
        if (!string.IsNullOrWhiteSpace(ConsoleOptions.DefaultAPIKey))
        {
            token = ConsoleOptions.DefaultAPIKey;
        }

        Log.Logger.Information("Creating Semantic Kernel with Chat Model: {ChatModel}, API URL: {ApiUrl} Token:{token}",
            chatModel,
            apiUrl, token);

        var httpClient = new HttpClient(new KernelHttpClientHandler())
        {
            Timeout = TimeSpan.FromSeconds(600),
        };

        // 添加默认头
        httpClient.DefaultRequestHeaders.Add("User-Agent", "PromptAI");
        httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

        // 添加自定义头
        if (customHeaders != null)
        {
            foreach (var header in customHeaders)
            {
                httpClient.DefaultRequestHeaders.Add(header.Key, header.Value);
            }
        }

        var kernelBuilder = Kernel.CreateBuilder()
            // 如果配置了API密钥，则使用API密钥
            .AddOpenAIChatCompletion(chatModel, new Uri(apiUrl), token, httpClient: httpClient);

        kernelBuilder.Services.AddSerilog(Log.Logger);

        kernelBuilder.Services.AddSingleton<IPromptRenderFilter>(new LanguagePromptFilter());

        kernelBuilder.Plugins.AddFromPromptDirectory(Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
            "Generate");

        var kernel = kernelBuilder.Build();

        return kernel;
    }
}