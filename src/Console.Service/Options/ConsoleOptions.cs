namespace Console.Service.Options;

public class ConsoleOptions
{
    public static string OpenAIEndpoint { get; set; }

    public static void Initialize(IConfiguration configuration)
    {
        OpenAIEndpoint = configuration["OpenAIEndpoint"] ??
                         throw new ArgumentNullException("请配置环境变量：OpenAIEndpoint 示例：https://api.openai.com/v1");
    }
}