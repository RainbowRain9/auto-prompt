using System.ComponentModel.DataAnnotations;

namespace Console.Core.Entities;

/// <summary>
/// AI服务配置实体
/// </summary>
public class AIServiceConfig
{
    public Guid Id { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    [Required]
    [StringLength(100)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// 配置名称（用户自定义）
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// AI服务提供商类型
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Provider { get; set; } = string.Empty; // OpenAI, DeepSeek, GoogleAI, Ollama, VolcEngine

    /// <summary>
    /// API端点地址
    /// </summary>
    [Required]
    [StringLength(500)]
    public string ApiEndpoint { get; set; } = string.Empty;

    /// <summary>
    /// 加密的API密钥
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string EncryptedApiKey { get; set; } = string.Empty;

    /// <summary>
    /// 支持的聊天模型列表（JSON格式）
    /// </summary>
    [StringLength(2000)]
    public string ChatModels { get; set; } = "[]";

    /// <summary>
    /// 支持的图像生成模型列表（JSON格式）
    /// </summary>
    [StringLength(2000)]
    public string ImageModels { get; set; } = "[]";

    /// <summary>
    /// 默认聊天模型
    /// </summary>
    [StringLength(100)]
    public string? DefaultChatModel { get; set; }

    /// <summary>
    /// 默认图像生成模型
    /// </summary>
    [StringLength(100)]
    public string? DefaultImageModel { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 是否为默认配置
    /// </summary>
    public bool IsDefault { get; set; } = false;

    /// <summary>
    /// 配置描述
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// 额外配置参数（JSON格式）
    /// </summary>
    [StringLength(2000)]
    public string? ExtraConfig { get; set; }

    /// <summary>
    /// 连接状态
    /// </summary>
    [StringLength(20)]
    public string ConnectionStatus { get; set; } = "Unknown"; // Unknown, Connected, Failed

    /// <summary>
    /// 最后连接测试时间
    /// </summary>
    public DateTime? LastTestTime { get; set; }

    /// <summary>
    /// 连接测试错误信息
    /// </summary>
    [StringLength(1000)]
    public string? LastTestError { get; set; }

    /// <summary>
    /// 使用次数统计
    /// </summary>
    public int UsageCount { get; set; } = 0;

    /// <summary>
    /// 最后使用时间
    /// </summary>
    public DateTime? LastUsedTime { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedTime { get; set; }

    /// <summary>
    /// 排序权重
    /// </summary>
    public int SortOrder { get; set; } = 0;
}
