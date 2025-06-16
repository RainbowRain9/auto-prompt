namespace Console.Service.Dto;

public class ExecuteTestInput
{
    public string[] Models { get; set; } = [];

    public string ApiKey { get; set; }

    /// <summary>
    /// 测试提示词
    /// </summary>
    /// <returns></returns>
    public string Prompt { get; set; } =
        "你是一个写作助手，帮我写一些营销文案。请写一些吸引人的文案，要有创意，让人印象深刻。文案要好，不要太长也不要太短，写得专业一点：\n";

    private string request = "写一个彩色钢笔的营销文案";

    public string Request
    {
        get
        {
            return $"<query>\n{request}\n</query>";
        }
        set => request = value;
    }

    /// <summary>
    /// 每个模型的执行次数
    /// </summary>
    public int ExecutionCount { get; set; } = 1;

    /// <summary>
    /// 是否启用提示词优化
    /// </summary>
    public bool EnableOptimization { get; set; } = true;

    /// <summary>
    /// 提示词优化的需求参数（可选）
    /// </summary>
    public string? Requirements { get; set; }
}