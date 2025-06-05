namespace Console.Service.Entities;

public class PromptHistory
{
    public Guid Id { get; set; }

    /// <summary>
    /// 需要优化的提示词
    /// </summary>
    public string Prompt { get; set; }

    /// <summary>
    /// 用户需求
    /// </summary>
    public string Requirement { get; set; }

    /// <summary>
    /// 深入推理的结果
    /// </summary>
    public string? DeepReasoning { get; set; }

    /// <summary>
    /// 优化结果
    /// </summary>
    public string Result { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }
}