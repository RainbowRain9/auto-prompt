using System.ComponentModel.DataAnnotations;

namespace Console.Core.Entities;

public class ApiKey
{
    public Guid Id { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// API Key 名称
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 生成的 API Key（平台密钥）
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// 绑定的 OpenAI API Key
    /// </summary>
    [Required]
    [StringLength(200)]
    public string OpenAiApiKey { get; set; } = string.Empty;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 最后使用时间
    /// </summary>
    public DateTime? LastUsedTime { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 使用次数
    /// </summary>
    public int UsageCount { get; set; } = 0;

    /// <summary>
    /// 备注
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// 到期时间（可选）
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
} 