namespace Console.Service.Dto;

public class GeneratePromptOptimizationSuggestionInput
{
    public string Prompt { get; set; }
    
    public string? NewPrompt { get; set; }

    public string Model { get; set; }
}