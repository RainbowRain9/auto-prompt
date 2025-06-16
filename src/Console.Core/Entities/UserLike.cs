namespace Console.Core.Entities;

public class UserLike
{
    public Guid Id { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// 提示词模板ID
    /// </summary>
    public Guid PromptTemplateId { get; set; }

    /// <summary>
    /// 点赞时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 关联的提示词模板
    /// </summary>
    public PromptTemplate PromptTemplate { get; set; } = null!;
} 