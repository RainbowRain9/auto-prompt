namespace Console.Service.Entities;

public class PromptTemplate
{
    public Guid Id { get; set; }

    /// <summary>
    /// 提示词标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 提示词描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 提示词内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 标签（JSON数组格式）
    /// </summary>
    public string Tags { get; set; } = "[]";

    /// <summary>
    /// 是否收藏
    /// </summary>
    public bool IsFavorite { get; set; } = false;

    /// <summary>
    /// 使用次数
    /// </summary>
    public int UsageCount { get; set; } = 0;

    /// <summary>
    /// 是否分享
    /// </summary>
    public bool IsShared { get; set; } = false;

    /// <summary>
    /// 分享时间
    /// </summary>
    public DateTime? ShareTime { get; set; }

    /// <summary>
    /// 查看次数（用于热度计算）
    /// </summary>
    public int ViewCount { get; set; } = 0;

    /// <summary>
    /// 点赞次数（用于热度计算）
    /// </summary>
    public int LikeCount { get; set; } = 0;

    /// <summary>
    /// 评论次数
    /// </summary>
    public int CommentCount { get; set; } = 0;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedTime { get; set; }

    /// <summary>
    /// 用户ID（可选，用于多用户支持）
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// 创建者用户名（用于显示分享者信息）
    /// </summary>
    public string? CreatorName { get; set; }
} 