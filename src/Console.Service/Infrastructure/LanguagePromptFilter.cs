using Microsoft.SemanticKernel;

namespace Console.Service.Infrastructure;

public class LanguagePromptFilter : IPromptRenderFilter
{
    public async Task OnPromptRenderAsync(PromptRenderContext context, Func<PromptRenderContext, Task> next)
    {
        await next(context);

    }
}