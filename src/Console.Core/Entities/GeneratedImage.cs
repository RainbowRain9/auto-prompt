using System.ComponentModel.DataAnnotations;

namespace Console.Core.Entities;

public class GeneratedImage
{
    public Guid Id { get; set; }

    /// <summary>
    /// 图片URL
    /// </summary>
    [Required]
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>
    /// 原始提示词
    /// </summary>
    [Required]
    public string Prompt { get; set; } = string.Empty;

    /// <summary>
    /// 修订后的提示词
    /// </summary>
    public string? RevisedPrompt { get; set; }

    /// <summary>
    /// 生成类型：generate 或 edit
    /// </summary>
    [Required]
    [StringLength(10)]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 使用的模型
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// 图片尺寸
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Size { get; set; } = string.Empty;

    /// <summary>
    /// 图片质量
    /// </summary>
    [StringLength(20)]
    public string? Quality { get; set; }

    /// <summary>
    /// 图片风格
    /// </summary>
    [StringLength(20)]
    public string? Style { get; set; }

    /// <summary>
    /// 是否收藏
    /// </summary>
    public bool IsFavorite { get; set; } = false;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    [Required]
    [StringLength(100)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// 用户名
    /// </summary>
    [StringLength(100)]
    public string? UserName { get; set; }

    /// <summary>
    /// 标签（JSON格式存储）
    /// </summary>
    public string Tags { get; set; } = "[]";

    /// <summary>
    /// 生成参数（JSON格式存储）
    /// </summary>
    public string? GenerationParams { get; set; }
} 