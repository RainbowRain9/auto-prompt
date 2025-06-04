namespace Console.Service.Dto;

public class GeneratePromptInput
{
    /// <summary>
    /// 需要优化的提示词
    /// </summary>
    public required string Prompt { get; set; }

    /// <summary>
    /// 用户需求
    /// </summary>
    public string? Requirement { get; set; }

    /// <summary>
    /// 是否启用深入推理
    /// </summary>
    /// <returns></returns>
    public bool EnableDeepReasoning { get; set; } = false;

    /// <summary>
    /// 用于生成的模型
    /// </summary>
    public string ChatModel { get; set; } = "claude-sonnet-4-20250514";
}