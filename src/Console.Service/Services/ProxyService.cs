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

                // 使用动态更新的全局配置
                if (!string.IsNullOrWhiteSpace(ConsoleOptions.DefaultAPIKey))
                {
                    context.Request.Headers["Authorization"] =
                        $"Bearer {ConsoleOptions.DefaultAPIKey}";
                }
                else
                {
                    // 如果没有全局API Key，返回401错误
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("未配置API密钥，请先设置AI服务配置为全局默认");
                    return;
                }

                // 确保端点地址有效
                if (string.IsNullOrWhiteSpace(ConsoleOptions.OpenAIEndpoint))
                {
                    context.Response.StatusCode = 500;
                    await context.Response.WriteAsync("未配置API端点，请先设置AI服务配置为全局默认");
                    return;
                }

                try
                {
                    await httpForwarder.SendAsync(context, ConsoleOptions.OpenAIEndpoint, new HttpMessageInvoker(
                        new HttpClientHandler()
                        {
                            AllowAutoRedirect = true,
                            UseCookies = true,
                        }));
                }
                catch (Exception ex)
                {
                    context.Response.StatusCode = 500;
                    await context.Response.WriteAsync($"代理请求失败: {ex.Message}");
                }
            }));
        });

        return builder;
    }
}