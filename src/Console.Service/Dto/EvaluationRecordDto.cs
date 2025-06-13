namespace Console.Service.Dto;

public class EvaluationRecordDto
{
    public string Id { get; set; } = string.Empty;
    public long Timestamp { get; set; }
    public string Date { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public EvaluationConfigDto Config { get; set; } = new();
    public Dictionary<string, EvaluationResultDto> Results { get; set; } = new();
    public EvaluationStatisticsDto Statistics { get; set; } = new();
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
    public string? CreatorName { get; set; }
}

public class EvaluationConfigDto
{
    public string[] Models { get; set; } = Array.Empty<string>();
    public string Prompt { get; set; } = string.Empty;
    public string Request { get; set; } = string.Empty;
    public int ExecutionCount { get; set; } = 1;
    public bool EnableOptimization { get; set; } = true;
    public string? ExampleId { get; set; }
    public string? ExampleTitle { get; set; }
    public string? ExampleCategory { get; set; }
}

public class EvaluationResultDto
{
    public int Score { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string[] Tags { get; set; } = Array.Empty<string>();
    public int ExecutionCount { get; set; } = 1;
    public long StartTime { get; set; }
    public long EndTime { get; set; }
    public long Duration { get; set; }
}

public class EvaluationStatisticsDto
{
    public int TotalModels { get; set; }
    public int CompletedModels { get; set; }
    public double AvgScore { get; set; }
    public long TotalTime { get; set; }
    public Dictionary<string, int> ScoreDistribution { get; set; } = new();
    public Dictionary<string, int> TagDistribution { get; set; } = new();
}

public class CreateEvaluationRecordInput
{
    public string Title { get; set; } = string.Empty;
    public EvaluationConfigDto Config { get; set; } = new();
    public Dictionary<string, EvaluationResultDto> Results { get; set; } = new();
    public EvaluationStatisticsDto Statistics { get; set; } = new();
}

public class EvaluationRecordSearchInput
{
    public string? SearchText { get; set; }
    public string? Category { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string SortBy { get; set; } = "CreatedTime";
    public string SortOrder { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
} 