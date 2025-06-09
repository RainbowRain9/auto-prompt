namespace Console.Service.Dto;

public class PromptTemplateParameterDto
{
    /// <summary>
    /// 提示词标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 提示词描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 标签（JSON数组格式）
    /// </summary>
    public string Tags { get; set; } 
}