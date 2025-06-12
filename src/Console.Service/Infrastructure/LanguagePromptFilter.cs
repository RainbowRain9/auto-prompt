using Microsoft.SemanticKernel;

namespace Console.Service.Infrastructure;

public class LanguagePromptFilter(string language) : IPromptRenderFilter
{
    public async Task OnPromptRenderAsync(PromptRenderContext context, Func<PromptRenderContext, Task> next)
    {
        await next(context);

        context.RenderedPrompt = context.RenderedPrompt + Environment.NewLine + "请使用" + language + "与我交流";
    }
}