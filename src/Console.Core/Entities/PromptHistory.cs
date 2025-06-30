using System.ComponentModel.DataAnnotations;

namespace Console.Core.Entities;

public class PromptHistory
{
    public Guid Id { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    [Required]
    [StringLength(100)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// 需要优化的提示词
    /// </summary>
    [Required]
    public string Prompt { get; set; } = string.Empty;

    /// <summary>
    /// 原始提示词（保持向后兼容）
    /// </summary>
    public string? OriginalPrompt { get; set; }

    /// <summary>
    /// 优化后的提示词
    /// </summary>
    public string? OptimizedPrompt { get; set; }

    /// <summary>
    /// 用户需求
    /// </summary>
    public string Requirement { get; set; } = string.Empty;

    /// <summary>
    /// 用户需求（新字段名，保持一致性）
    /// </summary>
    public string? Requirements { get; set; }

    /// <summary>
    /// 深入推理的结果
    /// </summary>
    public string? DeepReasoning { get; set; }

    /// <summary>
    /// 优化结果
    /// </summary>
    public string Result { get; set; } = string.Empty;

    /// <summary>
    /// 使用的聊天模型
    /// </summary>
    [StringLength(100)]
    public string? ChatModel { get; set; }

    /// <summary>
    /// 使用的AI服务配置ID
    /// </summary>
    public Guid? ConfigId { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }
}