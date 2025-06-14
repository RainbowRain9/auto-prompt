using Console.Service.Options;
using FastService;

namespace Console.Service.Services;

[FastService.Route("/v1/system")]
[Tags("系统服务")]
public class SystemService : FastApi
{
    /// <summary>
    /// 获取系统配置
    /// </summary>
    /// <returns></returns>
    [EndpointSummary("获取系统提配置")]
    public async Task<object> GetInfoAsync()
    {
        return new
        {
            BuiltInApiKey = !string.IsNullOrWhiteSpace(ConsoleOptions.DefaultAPIKey),
            Version = typeof(SystemService).Assembly.GetName().Version?.ToString() ?? "未知版本",
        };
    }
}