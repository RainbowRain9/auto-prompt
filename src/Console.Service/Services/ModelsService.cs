using Console.Service.Options;
using FastService;
using Microsoft.AspNetCore.Mvc;

namespace Console.Service.Services;

[FastService.Route("/v1/models")]
[Tags("模型管理")]
public class ModelsService : FastApi
{
    [HttpGet("/")]
    public async Task<object> GetModelsAsync()
    {
        return new
        {
            imageModels = ConsoleOptions.ImageGenerationModel.Select(x => new
            {
                id = x,
                objectType = "model",
                created = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            }),
            chatModels = ConsoleOptions.ChatModel.Select(x => new
            {
                id = x,
                objectType = "model",
                created = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            }),
        };
    }
}