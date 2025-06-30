using System.ComponentModel.DataAnnotations;

namespace Console.Service.Dto;

/// <summary>
/// AI服务配置数据传输对象
/// </summary>
public class AIServiceConfigDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ApiEndpoint { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty; // 解密后的API密钥（仅在创建/编辑时使用）
    public List<string> ChatModels { get; set; } = new();
    public List<string> ImageModels { get; set; } = new();
    public string? DefaultChatModel { get; set; }
    public string? DefaultImageModel { get; set; }
    public bool IsEnabled { get; set; }
    public bool IsDefault { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, object>? ExtraConfig { get; set; }
    public string ConnectionStatus { get; set; } = "Unknown";
    public DateTime? LastTestTime { get; set; }
    public string? LastTestError { get; set; }
    public int UsageCount { get; set; }
    public DateTime? LastUsedTime { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>
/// AI服务配置列表项DTO（不包含敏感信息）
/// </summary>
public class AIServiceConfigListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ApiEndpoint { get; set; } = string.Empty;
    public string MaskedApiKey { get; set; } = string.Empty; // 隐藏的API密钥
    public List<string> ChatModels { get; set; } = new();
    public List<string> ImageModels { get; set; } = new();
    public string? DefaultChatModel { get; set; }
    public string? DefaultImageModel { get; set; }
    public bool IsEnabled { get; set; }
    public bool IsDefault { get; set; }
    public string? Description { get; set; }
    public string ConnectionStatus { get; set; } = "Unknown";
    public DateTime? LastTestTime { get; set; }
    public string? LastTestError { get; set; }
    public int UsageCount { get; set; }
    public DateTime? LastUsedTime { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>
/// 创建AI服务配置输入
/// </summary>
public class CreateAIServiceConfigInput
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Provider { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string ApiEndpoint { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string ApiKey { get; set; } = string.Empty;

    public List<string> ChatModels { get; set; } = new();
    public List<string> ImageModels { get; set; } = new();
    public string? DefaultChatModel { get; set; }
    public string? DefaultImageModel { get; set; }
    public bool IsEnabled { get; set; } = true;
    public bool IsDefault { get; set; } = false;

    [StringLength(500)]
    public string? Description { get; set; }

    public Dictionary<string, object>? ExtraConfig { get; set; }
    public int SortOrder { get; set; } = 0;
}

/// <summary>
/// 更新AI服务配置输入
/// </summary>
public class UpdateAIServiceConfigInput
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Provider { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string ApiEndpoint { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ApiKey { get; set; } // 可选，如果为空则不更新

    public List<string> ChatModels { get; set; } = new();
    public List<string> ImageModels { get; set; } = new();
    public string? DefaultChatModel { get; set; }
    public string? DefaultImageModel { get; set; }
    public bool IsEnabled { get; set; }
    public bool IsDefault { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public Dictionary<string, object>? ExtraConfig { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>
/// AI服务配置搜索输入
/// </summary>
public class AIServiceConfigSearchInput
{
    public string? SearchText { get; set; }
    public string? Provider { get; set; }
    public bool? IsEnabled { get; set; }
    public string? ConnectionStatus { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "CreatedTime";
    public string SortOrder { get; set; } = "desc";
}

/// <summary>
/// AI服务配置搜索响应
/// </summary>
public class AIServiceConfigSearchResponse
{
    public List<AIServiceConfigListDto> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

/// <summary>
/// 连接测试输入
/// </summary>
public class TestConnectionInput
{
    [Required]
    public string Provider { get; set; } = string.Empty;

    [Required]
    public string ApiEndpoint { get; set; } = string.Empty;

    [Required]
    public string ApiKey { get; set; } = string.Empty;

    public string? TestModel { get; set; }
}

/// <summary>
/// 连接测试响应
/// </summary>
public class TestConnectionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? AvailableModels { get; set; }
    public Dictionary<string, object>? Details { get; set; }
}

/// <summary>
/// AI服务提供商信息
/// </summary>
public class AIProviderInfo
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DefaultEndpoint { get; set; } = string.Empty;
    public List<string> SupportedFeatures { get; set; } = new();
    public Dictionary<string, object>? ConfigTemplate { get; set; }
}
