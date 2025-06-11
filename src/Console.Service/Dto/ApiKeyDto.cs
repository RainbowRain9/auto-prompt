using System.ComponentModel.DataAnnotations;

namespace Console.Service.Dto;

/// <summary>
/// API Key 数据传输对象
/// </summary>
public class ApiKeyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string OpenAiApiKey { get; set; } = string.Empty;
    public DateTime CreatedTime { get; set; }
    public DateTime? LastUsedTime { get; set; }
    public bool IsEnabled { get; set; }
    public int UsageCount { get; set; }
    public string? Description { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// API Key 列表项（隐藏敏感信息）
/// </summary>
public class ApiKeyListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty; // 显示部分密钥
    public DateTime CreatedTime { get; set; }
    public DateTime? LastUsedTime { get; set; }
    public bool IsEnabled { get; set; }
    public int UsageCount { get; set; }
    public string? Description { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsExpired { get; set; }
}

/// <summary>
/// 创建 API Key 输入
/// </summary>
public class CreateApiKeyInput
{
    [Required(ErrorMessage = "名称不能为空")]
    [StringLength(100, ErrorMessage = "名称长度不能超过100个字符")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "OpenAI API Key 不能为空")]
    [StringLength(200, ErrorMessage = "OpenAI API Key 长度不能超过200个字符")]
    public string OpenAiApiKey { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "描述长度不能超过500个字符")]
    public string? Description { get; set; }

    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// 更新 API Key 输入
/// </summary>
public class UpdateApiKeyInput
{
    [Required]
    public Guid Id { get; set; }

    [Required(ErrorMessage = "名称不能为空")]
    [StringLength(100, ErrorMessage = "名称长度不能超过100个字符")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "OpenAI API Key 不能为空")]
    [StringLength(200, ErrorMessage = "OpenAI API Key 长度不能超过200个字符")]
    public string OpenAiApiKey { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "描述长度不能超过500个字符")]
    public string? Description { get; set; }

    public bool IsEnabled { get; set; }

    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// API Key 搜索输入
/// </summary>
public class ApiKeySearchInput
{
    public string? SearchText { get; set; }
    public bool? IsEnabled { get; set; }
    public bool? IsExpired { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "CreatedTime";
    public string? SortOrder { get; set; } = "desc";
} 