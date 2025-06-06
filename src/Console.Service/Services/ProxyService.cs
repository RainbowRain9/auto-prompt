using Console.Service.Options;
using Yarp.ReverseProxy.Forwarder;

namespace Console.Service.Services;

public static class ProxyService
{
    public static IEndpointRouteBuilder MapOpenAiProxy(this WebApplication builder)
    {
        builder.Map("/openai", (builder) =>
        {
            builder.Run((async (context) =>
            {
                context.Request.PathBase = "/";
                var httpForwarder = context.RequestServices.GetRequiredService<IHttpForwarder>();

                await httpForwarder.SendAsync(context, ConsoleOptions.OpenAIEndpoint, new HttpMessageInvoker(
                    new HttpClientHandler()
                    {
                        AllowAutoRedirect = true,
                        UseCookies = true,
                    }));
            }));
        });

        return builder;
    }
}