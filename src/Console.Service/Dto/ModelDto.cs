namespace Console.Service.Dto;

public class ModelDto
{
    [System.Text.Json.Serialization.JsonPropertyName("data")]
    public ModelData[] Data { get; set; }
}

public class ModelData
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public string Id { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("created")]
    public int Created { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("owned_by")]
    public string OwnedBy { get; set; }
}