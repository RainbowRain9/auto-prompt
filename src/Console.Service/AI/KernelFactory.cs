using Console.Service.Infrastructure;
using Microsoft.SemanticKernel;
using Serilog;

namespace Console.Service.AI;

public class KernelFactory
{
    public static Kernel CreateKernel(string chatModel, string apiUrl, string token, string language = "zh-CN")
    {
        var kernelBuilder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(chatModel, new Uri(apiUrl), token,
                httpClient: new HttpClient(new KernelHttpClientHandler()));

        kernelBuilder.Services.AddSerilog(Log.Logger);

        kernelBuilder.Services.AddSingleton<IPromptRenderFilter>(new LanguagePromptFilter(language));

        kernelBuilder.Plugins.AddFromPromptDirectory(Path.Combine(AppContext.BaseDirectory, "plugins", "Generate"),
            "Generate");

        var kernel = kernelBuilder.Build();

        return kernel;
    }
}