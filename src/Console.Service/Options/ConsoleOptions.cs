namespace Console.Service.Options;

public class ConsoleOptions
{
    public static string OpenAIEndpoint { get; set; }

    public static string GenerationChatModel { get; set; } = "gpt-4.1-mini";

    public static string[] ChatModel { get; set; }

    public static string[] ImageGenerationModel { get; set; }

    public static string DefaultChatModel { get; set; }

    /// <summary>
    /// 默认优化的图像生成模型
    /// </summary>
    public static string DefaultImageGenerationModel { get; set; }

    public static void Initialize(IConfiguration configuration)
    {
        OpenAIEndpoint = configuration["OpenAIEndpoint"] ??
                         throw new ArgumentNullException("请配置环境变量：OpenAIEndpoint 示例：https://api.openai.com/v1");

        GenerationChatModel = configuration["GenerationChatModel"] ?? "gpt-4.1-mini";

        ChatModel = configuration.GetSection("CHAT_MODEL").Get<string>()?.Split(',') ??
                    throw new ArgumentNullException("请配置环境变量：ChatModel 示例：gpt-4.1-mini,gpt-3.5-turbo");

        ImageGenerationModel = configuration.GetSection("IMAGE_GENERATION_MODEL").Get<string>()?.Split(',') ??
                               throw new ArgumentNullException("请配置环境变量：IMAGE_GENERATION_MODEL 示例：dall-e-3,midjourney");

        DefaultChatModel = configuration["DEFAULT_CHAT_MODEL"] ?? "gpt-4.1-mini";

        DefaultImageGenerationModel = configuration["DEFAULT_IMAGE_GENERATION_MODEL"] ?? "o4-mini";
    }
}