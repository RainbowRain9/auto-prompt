using Console.Service.MCP.Tools;

namespace Console.Service.MCP;

public static class MCPExtensions
{
    public static IServiceCollection AddMcp(this IServiceCollection services)
    {
        services.AddMcpServer()
            .WithTools<PromptTool>()
            .WithHttpTransport(options =>
            {
                options.ConfigureSessionOptions += async (context, serverOptions, _) =>
                {
                    var token = context.Request.Query["token"].ToString();

                    serverOptions.InitializationTimeout = TimeSpan.FromSeconds(300);
                    serverOptions.Capabilities!.Experimental = new Dictionary<string, object>();
                    serverOptions.Capabilities.Experimental.Add("token", token);
                    await Task.CompletedTask;
                };
            });
        
        return services;
    }
}