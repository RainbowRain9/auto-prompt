namespace Console.Service.Dto;

public class PromptTemplateDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public bool IsFavorite { get; set; }
    public int UsageCount { get; set; }
    public bool IsShared { get; set; }
    public DateTime? ShareTime { get; set; }
    public int ViewCount { get; set; }
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public bool IsFavoritedByCurrentUser { get; set; }
    public string? CreatorName { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}

public class CreatePromptTemplateInput
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
}

public class UpdatePromptTemplateInput
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public bool IsFavorite { get; set; }
}

public class PromptTemplateSearchInput
{
    public string? SearchText { get; set; }
    public bool? IsFavorite { get; set; }
    public bool? IsShared { get; set; }
    public List<string>? Tags { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "UpdatedTime"; // UpdatedTime, ViewCount, LikeCount, CreatedTime
    public string? SortOrder { get; set; } = "desc"; // asc, desc
}

public class SharedPromptTemplateSearchInput
{
    public string? SearchText { get; set; }
    public List<string>? Tags { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "ViewCount"; // ViewCount, LikeCount, ShareTime, CreatedTime
    public string? SortOrder { get; set; } = "desc"; // asc, desc
}

public class AddCommentInput
{
    public string Content { get; set; } = string.Empty;
    public Guid? ParentCommentId { get; set; }
} 