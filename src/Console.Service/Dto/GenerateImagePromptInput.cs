namespace Console.Service.Dto;

public class GenerateImagePromptInput
{
    /// <summary>
    /// 需要优化的提示词
    /// </summary>
    public required string Prompt { get; set; }

    /// <summary>
    /// 用户需求
    /// </summary>
    public string? Requirements { get; set; }

}