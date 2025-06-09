namespace Console.Service.Entities;

public class PromptComment
{
    public Guid Id { get; set; }

    /// <summary>
    /// 提示词模板ID
    /// </summary>
    public Guid PromptTemplateId { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// 用户名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// 评论内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 父评论ID（用于回复功能）
    /// </summary>
    public Guid? ParentCommentId { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedTime { get; set; }

    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// 关联的提示词模板
    /// </summary>
    public PromptTemplate PromptTemplate { get; set; } = null!;

    /// <summary>
    /// 父评论
    /// </summary>
    public PromptComment? ParentComment { get; set; }

    /// <summary>
    /// 子评论列表
    /// </summary>
    public ICollection<PromptComment> Replies { get; set; } = new List<PromptComment>();
} 