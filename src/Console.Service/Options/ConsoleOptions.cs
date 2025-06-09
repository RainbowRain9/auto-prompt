namespace Console.Service.Options;

public class ConsoleOptions
{
    public static string OpenAIEndpoint { get; set; }

    public static string GenerationChatModel { get; set; } = "gpt-4.1-mini";

    public static void Initialize(IConfiguration configuration)
    {
        OpenAIEndpoint = configuration["OpenAIEndpoint"] ??
                         throw new ArgumentNullException("请配置环境变量：OpenAIEndpoint 示例：https://api.openai.com/v1");

        GenerationChatModel = configuration["GenerationChatModel"] ?? "gpt-4.1-mini";
    }
}