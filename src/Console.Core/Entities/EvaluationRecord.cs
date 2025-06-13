namespace Console.Core.Entities;

public class EvaluationRecord
{
    public Guid Id { get; set; }

    /// <summary>
    /// 时间戳
    /// </summary>
    public long Timestamp { get; set; }

    /// <summary>
    /// 日期（YYYY-MM-DD格式）
    /// </summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>
    /// 评估标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 评估配置（JSON格式）
    /// </summary>
    public string Config { get; set; } = "{}";

    /// <summary>
    /// 评估结果（JSON格式）
    /// </summary>
    public string Results { get; set; } = "{}";

    /// <summary>
    /// 统计信息（JSON格式）
    /// </summary>
    public string Statistics { get; set; } = "{}";

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedTime { get; set; }

    /// <summary>
    /// 用户ID
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// 创建者用户名
    /// </summary>
    public string? CreatorName { get; set; }
} 