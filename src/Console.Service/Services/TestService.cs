using System.Collections.Concurrent;
using System.ComponentModel;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Console.Service.AI;
using Console.Service.Dto;
using Console.Service.Infrastructure;
using Console.Service.Options;
using FastService;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Serilog;
using Polly.CircuitBreaker;
using CircuitBreakerPolicy = Console.Service.AI.CircuitBreakerPolicy;

namespace Console.Service.Services;

public class TestService(PromptService promptService, UserContext userContext) : FastApi
{
    public async Task PostTestAsync(PostTestInput input)
    {
        if (userContext.Roles?.Contains("Admin", StringComparer.OrdinalIgnoreCase) == null)
        {
            input.Models = input.Models?.Where(x => !string.IsNullOrEmpty(x)).Distinct().ToArray();

            Log.Logger.Information("开始执行测试任务 PostTestAsync，模型数量: {ModelsCount}", input.Models?.Length);
            var scorePrompts = new ConcurrentDictionary<string, ScorePrompt>();

            // 获取原始提示词得到的结果
            Log.Logger.Debug("创建评分内核实例，评分模型: {ScoreModel}", ConsoleOptions.ScoreModel);
            var kernel =
                KernelFactory.CreateKernel(ConsoleOptions.ScoreModel, ConsoleOptions.OpenAIEndpoint, input.ApiKey);

            // 使用并行处理多个模型
            var tasks = input.Models.Select(async model =>
            {
                try
                {
                    Log.Logger.Information("处理模型 {Model}", model);
                    var sb = new StringBuilder();

                    // 获取原始提示词得到的结果
                    Log.Logger.Debug("为模型 {Model} 创建内核实例", model);
                    var kernelModel = KernelFactory.CreateKernel(model, ConsoleOptions.OpenAIEndpoint,
                        input.ApiKey);

                    Log.Logger.Debug("开始优化提示词");
                    
                    // 使用熔断器包装提示词优化过程
                    try
                    {
                        await foreach (var (deep, value) in promptService.GenerateDeepReasoningPromptAsync(model,
                                       input.Prompt, string.Empty, input.ApiKey))
                        {
                            if (deep == false)
                            {
                                sb.Append(value);
                            }
                        }
                    }
                    catch (BrokenCircuitException bcex)
                    {
                        Log.Error("模型 {Model} 的提示词优化请求被熔断器阻止: {Error}", model, bcex.Message);
                        throw;
                    }

                    Log.Logger.Debug("提示词优化完成，优化后长度: {Length}", sb.Length);

                    // 使用熔断器包装原始提示词执行请求
                    Log.Logger.Debug("使用原始提示词执行请求");
                    var prompt = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(model, async () =>
                        await kernelModel.InvokePromptAsync(input.Prompt + input.Request));

                    // 使用熔断器包装优化提示词执行请求
                    Log.Logger.Debug("使用优化后的提示词执行请求");
                    var optimization = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(model, async () =>
                        await kernelModel.InvokePromptAsync(sb + input.Request));

                    // 使用熔断器包装评分请求
                    Log.Logger.Information("执行提示词评分");
                    var result = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(ConsoleOptions.ScoreModel, async () =>
                        await kernel.InvokeAsync(kernel.Plugins["Generate"]["ScorePrompt"],
                        new KernelArguments(
                            new OpenAIPromptExecutionSettings()
                            {
                                ResponseFormat = typeof(ScorePrompt)
                            })
                        {
                            ["prompt"] = input.Prompt,
                            ["prompt_output"] = prompt.ToString(),
                            ["OptimizePromptWords"] = sb.ToString(),
                            ["OptimizePromptWords_output"] = optimization.ToString()
                        }));

                    var scorePrompt = JsonSerializer.Deserialize<ScorePrompt>(result.ToString());
                    Log.Logger.Information("评分结果: {Score}, 描述: {Description}", scorePrompt?.Score,
                        scorePrompt?.Description);

                    scorePrompts.TryAdd(model, scorePrompt);
                }
                catch (BrokenCircuitException bcex)
                {
                    Log.Error("模型 {Model} 处理被熔断器阻止: {Error}", model, bcex.Message);
                    scorePrompts.TryAdd(model, new ScorePrompt 
                    { 
                        Description = $"模型暂时不可用 - 熔断器触发", 
                        Score = 0,
                        Comment = $"由于连续多次失败，熔断器已触发。错误: {bcex.Message}"
                    });
                }
                catch (Exception e)
                {
                    Log.Logger.Error(e, "处理模型 {Model} 时发生错误", model);
                    scorePrompts.TryAdd(model, new ScorePrompt 
                    { 
                        Description = "处理失败", 
                        Score = 0,
                        Comment = $"错误: {e.Message}"
                    });
                }
            }).ToArray();

            // 等待所有任务完成
            await Task.WhenAll(tasks);

            // 将评分结果保存 wwwroot/score.json
            var scoreFilePath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "score.json");
            if (!Directory.Exists(Path.GetDirectoryName(scoreFilePath)))
            {
                Log.Logger.Debug("创建评分结果目录: {Directory}", Path.GetDirectoryName(scoreFilePath));
                Directory.CreateDirectory(Path.GetDirectoryName(scoreFilePath)!);
            }

            Log.Logger.Information("保存评分结果到文件: {FilePath}", scoreFilePath);
            await File.WriteAllTextAsync(scoreFilePath, JsonSerializer.Serialize(scorePrompts, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            }));

            Log.Logger.Information("测试任务完成");
            return;
        }

        throw new UnauthorizedAccessException("无权限执行测试任务");
    }

    public class ScorePrompt
    {
        [Description("评分简短描述")] public string Description { get; set; } = null!;

        [Description("评分范围：0-100")] public int Score { get; set; }

        [Description("评分理由")] public string? Comment { get; set; }
    }
}