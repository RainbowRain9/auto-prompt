namespace Console.Service.Dto;

public class PostTestInput
{
    public string[] Models { get; set; } = [];

    public required string ApiKey { get; set; }

    /// <summary>
    /// 测试提示词
    /// </summary>
    /// <returns></returns>
    public string Prompt { get; set; } =
        "你是一个写作助手，帮我写一些营销文案。我需要推广我的产品，让更多人知道并购买。产品是智能手表，功能很多，价格还可以。请写一些吸引人的文案，要有创意，让人印象深刻。文案要好，不要太长也不要太短，写得专业一点：\n";

    public string Request { get; set; } = "写一个彩色钢笔的营销文案";
}