using Console.Service.Infrastructure;
using Microsoft.SemanticKernel;
using Serilog;

namespace Console.Service.AI;

public class KernelFactory
{
    public static Kernel CreateKernel(string chatModel, string apiUrl, string token)
    {
        var kernelBuilder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(chatModel, new Uri(apiUrl), token,
                httpClient: new HttpClient(new KernelHttpClientHandler()
                {
                })
                {
                    Timeout = TimeSpan.FromSeconds(600),
                    DefaultRequestHeaders =
                    {
                        { "User-Agent", "KoalaAI" },
                        { "Accept", "application/json" }
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