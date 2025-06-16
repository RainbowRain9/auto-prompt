using System.Text.Json;
using Console.Core;
using Console.Core.Entities;
using Console.Service.Dto;
using Console.Service.Infrastructure;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Console.Service.Services;

[FastService.Route("/v1/evaluation-history")]
[Tags("评估历史管理")]
public class EvaluationHistoryService(IDbContext dbContext, JwtService jwtService, UserContext userContext) : FastApi
{
    private (bool IsValid, string? UserId, object? ErrorResponse, string? userName) ValidateTokenAndGetUserId(
        HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].ToString().Trim().Replace("Bearer ", "");
        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            return (false, null, new { success = false, message = "未授权访问" }, null);
        }

        var userId = jwtService.GetUserIdFromToken(token);
        if (string.IsNullOrEmpty(userId))
        {
            context.Response.StatusCode = 401;
            return (false, null, new { success = false, message = "无效的访问令牌" }, null);
        }

        if (!jwtService.IsTokenValid(token))
        {
            context.Response.StatusCode = 401;
            return (false, null, new { success = false, message = "访问令牌已过期" }, null);
        }

        return (true, userId, null, jwtService.GetUserNameFromToken(token));
    }

    private EvaluationRecordDto MapToDto(EvaluationRecord entity)
    {
        var dto = new EvaluationRecordDto
        {
            Id = entity.Id.ToString(),
            Timestamp = entity.Timestamp,
            Date = entity.Date,
            Title = entity.Title,
            CreatedTime = entity.CreatedTime,
            UpdatedTime = entity.UpdatedTime,
            CreatorName = entity.CreatorName
        };

        // 反序列化 JSON 字段
        try
        {
            dto.Config = JsonSerializer.Deserialize<EvaluationConfigDto>(entity.Config,JsonSerializerOptions.Web) ?? new EvaluationConfigDto();
            dto.Results = JsonSerializer.Deserialize<Dictionary<string, EvaluationResultDto>>(entity.Results,JsonSerializerOptions.Web) ??
                          new Dictionary<string, EvaluationResultDto>();
            dto.Statistics = JsonSerializer.Deserialize<EvaluationStatisticsDto>(entity.Statistics,JsonSerializerOptions.Web) ??
                             new EvaluationStatisticsDto();
        }
        catch (JsonException)
        {
            // 如果反序列化失败，使用默认值
            dto.Config = new EvaluationConfigDto();
            dto.Results = new Dictionary<string, EvaluationResultDto>();
            dto.Statistics = new EvaluationStatisticsDto();
        }

        return dto;
    }

    [EndpointSummary("获取评估历史列表")]
    [HttpPost("search")]
    public async Task<object> SearchEvaluationRecordsAsync(EvaluationRecordSearchInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var query = dbContext.EvaluationRecords.Where(e => e.UserId == userId);

            // 搜索过滤
            if (!string.IsNullOrEmpty(input.SearchText))
            {
                var searchText = input.SearchText.ToLower();
                query = query.Where(e =>
                    e.Title.ToLower().Contains(searchText) ||
                    e.Config.Contains(searchText));
            }

            // 分类过滤
            if (!string.IsNullOrEmpty(input.Category))
            {
                query = query.Where(e => e.Config.Contains(input.Category));
            }

            // 日期过滤
            if (input.StartDate.HasValue)
            {
                query = query.Where(e => e.CreatedTime >= input.StartDate.Value);
            }

            if (input.EndDate.HasValue)
            {
                query = query.Where(e => e.CreatedTime <= input.EndDate.Value);
            }

            // 排序
            query = input.SortBy?.ToLower() switch
            {
                "timestamp" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(e => e.Timestamp)
                    : query.OrderByDescending(e => e.Timestamp),
                "title" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(e => e.Title)
                    : query.OrderByDescending(e => e.Title),
                _ => query.OrderByDescending(e => e.CreatedTime)
            };

            // 分页
            var total = await query.CountAsync();
            var items = await query
                .Skip((input.Page - 1) * input.PageSize)
                .Take(input.PageSize)
                .ToListAsync();

            var result = items.Select(MapToDto).ToList();

            return new
            {
                success = true,
                data = new
                {
                    items = result,
                    total = total,
                    page = input.Page,
                    pageSize = input.PageSize
                }
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"查询失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取所有评估历史")]
    [HttpGet("all")]
    public async Task<object> GetAllEvaluationRecordsAsync(HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var records = await dbContext.EvaluationRecords
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.Timestamp)
                .ToListAsync();

            var result = records.Select(MapToDto).ToList();

            return new
            {
                success = true,
                data = result
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"获取失败: {ex.Message}" };
        }
    }

    [EndpointSummary("创建评估记录")]
    [HttpPost("create")]
    public async Task<object> CreateEvaluationRecordAsync(CreateEvaluationRecordInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var record = new EvaluationRecord
            {
                Id = Guid.NewGuid(),
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Title = input.Title,
                Config = JsonSerializer.Serialize(input.Config, JsonSerializerOptions.Web),
                Results = JsonSerializer.Serialize(input.Results, JsonSerializerOptions.Web),
                Statistics = JsonSerializer.Serialize(input.Statistics, JsonSerializerOptions.Web),
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow,
                UserId = userId!,
                CreatorName = userName
            };

            dbContext.EvaluationRecords.Add(record);
            await dbContext.SaveChangesAsync();

            return new
            {
                success = true,
                data = MapToDto(record)
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"创建失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取单个评估记录")]
    [HttpGet("{id}")]
    public async Task<object> GetEvaluationRecordAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            if (!Guid.TryParse(id, out var recordId))
            {
                return new { success = false, message = "无效的记录ID" };
            }

            var record = await dbContext.EvaluationRecords
                .FirstOrDefaultAsync(e => e.Id == recordId && e.UserId == userId);

            if (record == null)
            {
                return new { success = false, message = "记录不存在" };
            }

            return new
            {
                success = true,
                data = MapToDto(record)
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"获取失败: {ex.Message}" };
        }
    }

    [EndpointSummary("删除评估记录")]
    [HttpPost("delete/{id}")]
    public async Task<object> DeleteEvaluationRecordAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            if (!Guid.TryParse(id, out var recordId))
            {
                return new { success = false, message = "无效的记录ID" };
            }

            var record = await dbContext.EvaluationRecords
                .FirstOrDefaultAsync(e => e.Id == recordId && e.UserId == userId);

            if (record == null)
            {
                return new { success = false, message = "记录不存在" };
            }

            dbContext.EvaluationRecords.Remove(record);
            await dbContext.SaveChangesAsync();

            return new { success = true, message = "删除成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"删除失败: {ex.Message}" };
        }
    }

    [EndpointSummary("清空所有评估记录")]
    [HttpPost("clear-all")]
    public async Task<object> ClearAllEvaluationRecordsAsync(HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var records = await dbContext.EvaluationRecords
                .Where(e => e.UserId == userId)
                .ToListAsync();

            dbContext.EvaluationRecords.RemoveRange(records);
            await dbContext.SaveChangesAsync();

            return new { success = true, message = $"已清空 {records.Count} 条记录" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"清空失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取评估统计信息")]
    [HttpGet("statistics")]
    public async Task<object> GetStatisticsAsync(HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var records = await dbContext.EvaluationRecords
                .Where(e => e.UserId == userId)
                .ToListAsync();

            var statistics = new
            {
                totalEvaluations = records.Count,
                totalModelsEvaluated = 0,
                avgScore = 0.0,
                mostUsedModels = new Dictionary<string, int>(),
                scoreDistribution = new Dictionary<string, int>
                {
                    ["90-100"] = 0,
                    ["80-89"] = 0,
                    ["70-79"] = 0,
                    ["60-69"] = 0,
                    ["0-59"] = 0
                },
                categoryDistribution = new Dictionary<string, int>()
            };

            if (records.Count == 0)
            {
                return new { success = true, data = statistics };
            }

            var totalScore = 0.0;
            var totalScoreCount = 0;
            var modelUsage = new Dictionary<string, int>();
            var categoryCount = new Dictionary<string, int>();
            var scoreRanges = new Dictionary<string, int>
            {
                ["90-100"] = 0,
                ["80-89"] = 0,
                ["70-79"] = 0,
                ["60-69"] = 0,
                ["0-59"] = 0
            };

            foreach (var record in records)
            {
                try
                {
                    var config =
                        JsonSerializer.Deserialize<EvaluationConfigDto>(record.Config, JsonSerializerOptions.Web);
                    var results =
                        JsonSerializer.Deserialize<Dictionary<string, EvaluationResultDto>>(record.Results,
                            JsonSerializerOptions.Web);
                    var stats = JsonSerializer.Deserialize<EvaluationStatisticsDto>(record.Statistics,
                        JsonSerializerOptions.Web);

                    if (config != null)
                    {
                        // 统计模型使用次数
                        foreach (var model in config.Models)
                        {
                            modelUsage[model] = modelUsage.GetValueOrDefault(model, 0) + 1;
                        }

                        // 统计分类分布
                        if (!string.IsNullOrEmpty(config.ExampleCategory))
                        {
                            categoryCount[config.ExampleCategory] =
                                categoryCount.GetValueOrDefault(config.ExampleCategory, 0) + 1;
                        }
                    }

                    if (results != null)
                    {
                        // 统计评分分布
                        foreach (var result in results.Values)
                        {
                            totalScore += result.Score;
                            totalScoreCount++;

                            if (result.Score >= 90) scoreRanges["90-100"]++;
                            else if (result.Score >= 80) scoreRanges["80-89"]++;
                            else if (result.Score >= 70) scoreRanges["70-79"]++;
                            else if (result.Score >= 60) scoreRanges["60-69"]++;
                            else scoreRanges["0-59"]++;
                        }
                    }
                }
                catch (JsonException)
                {
                    // 忽略反序列化失败的记录
                }
            }

            var finalStatistics = new
            {
                totalEvaluations = records.Count,
                totalModelsEvaluated = totalScoreCount,
                avgScore = totalScoreCount > 0 ? totalScore / totalScoreCount : 0.0,
                mostUsedModels = modelUsage,
                scoreDistribution = scoreRanges,
                categoryDistribution = categoryCount
            };

            return new { success = true, data = finalStatistics };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"获取统计信息失败: {ex.Message}" };
        }
    }
}