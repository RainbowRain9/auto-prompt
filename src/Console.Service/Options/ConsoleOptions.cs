using System.ClientModel;
using System.Net.Http.Headers;
using System.Text.Json;
using Console.Service.Dto;
using Console.Core.Entities;
using OpenAI;

namespace Console.Service.Options;

public class ConsoleOptions
{
    public static string OpenAIEndpoint { get; set; }

    public static string[] ChatModel { get; set; }

    public static string[] ImageGenerationModel { get; set; }

    public static string DefaultChatModel { get; set; }

    /// <summary>
    /// 默认优化的图像生成模型
    /// </summary>
    public static string DefaultImageGenerationModel { get; set; }

    /// <summary>
    /// 用于评分模型的名称
    /// </summary>
    public static string ScoreModel { get; set; }

    /// <summary>
    /// 默认的API密钥
    /// </summary>
    public static string? DefaultAPIKey { get; set; } = null;

    /// <summary>
    /// 当前全局默认AI服务配置ID
    /// </summary>
    public static string? GlobalDefaultConfigId { get; set; } = null;

    /// <summary>
    /// 配置更新锁，确保线程安全
    /// </summary>
    private static readonly object _configLock = new object();

    public static async Task Initialize(IConfiguration configuration)
    {
        OpenAIEndpoint = configuration["OpenAIEndpoint"] ??
                         throw new ArgumentNullException("请配置环境变量：OpenAIEndpoint 示例：https://api.openai.com/v1");

        ChatModel = configuration.GetSection("CHAT_MODEL").Get<string>()?.Split(',') ??
                    throw new ArgumentNullException("请配置环境变量：ChatModel 示例：gpt-4.1-mini,gpt-3.5-turbo");

        ImageGenerationModel = configuration.GetSection("IMAGE_GENERATION_MODEL").Get<string>()?.Split(',') ??
                               throw new ArgumentNullException("请配置环境变量：IMAGE_GENERATION_MODEL 示例：dall-e-3,midjourney");

        DefaultChatModel = configuration["DEFAULT_CHAT_MODEL"] ?? "gpt-4.1-mini";

        DefaultImageGenerationModel = configuration["DEFAULT_IMAGE_GENERATION_MODEL"] ?? "o4-mini";

        ScoreModel = configuration["SCORE_MODEL"] ?? "gpt-4.1";

        if (!string.IsNullOrWhiteSpace(configuration["API_KEY"]))
        {
            DefaultAPIKey = configuration["API_KEY"];
        }

        // 如果DefaultAPIKey和OpenAIEndpoint都配置了则自动获取模型列表
        if (!string.IsNullOrEmpty(DefaultAPIKey) && !string.IsNullOrEmpty(OpenAIEndpoint) &&
            DefaultChatModel.Length == 0)
        {
            using var client = new HttpClient();
            client.BaseAddress = new Uri(OpenAIEndpoint);
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", DefaultAPIKey);

            var response = await client.GetFromJsonAsync<ModelDto>("/models");


            if (response?.Data == null)
            {
                throw new Exception("无法获取模型列表，请检查API密钥和端点配置是否正确。");
            }

            ChatModel = response.Data.Select(x => x.Id).ToArray();
        }
    }

    /// <summary>
    /// 动态更新全局配置
    /// </summary>
    /// <param name="config">AI服务配置</param>
    /// <param name="decryptedApiKey">解密后的API密钥</param>
    public static void UpdateGlobalConfig(AIServiceConfig config, string decryptedApiKey)
    {
        lock (_configLock)
        {
            try
            {
                // 更新API密钥和端点
                DefaultAPIKey = decryptedApiKey;
                OpenAIEndpoint = config.ApiEndpoint;
                GlobalDefaultConfigId = config.Id.ToString();

                // 解析并更新聊天模型列表
                if (!string.IsNullOrEmpty(config.ChatModels))
                {
                    var chatModels = JsonSerializer.Deserialize<string[]>(config.ChatModels);
                    if (chatModels != null && chatModels.Length > 0)
                    {
                        ChatModel = chatModels;

                        // 设置默认聊天模型
                        if (!string.IsNullOrEmpty(config.DefaultChatModel) &&
                            chatModels.Contains(config.DefaultChatModel))
                        {
                            DefaultChatModel = config.DefaultChatModel;
                        }
                        else
                        {
                            DefaultChatModel = chatModels[0];
                        }
                    }
                }

                // 解析并更新图像生成模型列表
                if (!string.IsNullOrEmpty(config.ImageModels))
                {
                    var imageModels = JsonSerializer.Deserialize<string[]>(config.ImageModels);
                    if (imageModels != null && imageModels.Length > 0)
                    {
                        ImageGenerationModel = imageModels;

                        // 设置默认图像生成模型
                        if (!string.IsNullOrEmpty(config.DefaultImageModel) &&
                            imageModels.Contains(config.DefaultImageModel))
                        {
                            DefaultImageGenerationModel = config.DefaultImageModel;
                        }
                        else
                        {
                            DefaultImageGenerationModel = imageModels[0];
                        }
                    }
                }

                System.Console.WriteLine($"[ConsoleOptions] 全局配置已更新: Provider={config.Provider}, Endpoint={config.ApiEndpoint}, ChatModel={DefaultChatModel}");
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ConsoleOptions] 更新全局配置失败: {ex.Message}");
                throw;
            }
        }
    }

    /// <summary>
    /// 清除全局配置，回退到系统默认设置
    /// </summary>
    public static void ClearGlobalConfig()
    {
        lock (_configLock)
        {
            DefaultAPIKey = null;
            GlobalDefaultConfigId = null;
            System.Console.WriteLine("[ConsoleOptions] 全局配置已清除，回退到系统默认设置");
        }
    }

    /// <summary>
    /// 获取当前全局配置状态
    /// </summary>
    public static object GetGlobalConfigStatus()
    {
        lock (_configLock)
        {
            return new
            {
                HasGlobalConfig = !string.IsNullOrEmpty(GlobalDefaultConfigId),
                ConfigId = GlobalDefaultConfigId,
                Endpoint = OpenAIEndpoint,
                DefaultChatModel = DefaultChatModel,
                DefaultImageModel = DefaultImageGenerationModel,
                HasApiKey = !string.IsNullOrEmpty(DefaultAPIKey)
            };
        }
    }
}