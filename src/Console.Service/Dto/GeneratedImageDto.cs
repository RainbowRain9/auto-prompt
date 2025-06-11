namespace Console.Service.Dto;

public class GeneratedImageDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string? RevisedPrompt { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string? Quality { get; set; }
    public string? Style { get; set; }
    public bool IsFavorite { get; set; }
    public DateTime CreatedTime { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public List<string> Tags { get; set; } = new();
    public object? GenerationParams { get; set; }
}

public class SaveGeneratedImageInput
{
    public string ImageUrl { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string? RevisedPrompt { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string? Quality { get; set; }
    public string? Style { get; set; }
    public List<string> Tags { get; set; } = new();
    public object? GenerationParams { get; set; }
}

public class ImageSearchInput
{
    public string? SearchText { get; set; }
    public string? Type { get; set; } // generate, edit
    public string? Model { get; set; }
    public bool? IsFavorite { get; set; }
    public List<string>? Tags { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "CreatedTime"; // CreatedTime, IsFavorite
    public string? SortOrder { get; set; } = "desc"; // asc, desc
}

public class UpdateImageInput
{
    public Guid Id { get; set; }
    public bool? IsFavorite { get; set; }
    public List<string>? Tags { get; set; }
} 