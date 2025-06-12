using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Console.Core;
using Console.Service.Dto;
using Console.Service.Entities;
using Console.Service.Infrastructure;
using FastService;

namespace Console.Service.Services;

[FastService.Route("/v1/api-keys")]
[Tags("API Key管理")]
public class ApiKeyService(IDbContext dbContext, JwtService jwtService) : FastApi
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

    /// <summary>
    /// 生成安全的 API Key
    /// </summary>
    private static string GenerateApiKey()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[32];
        rng.GetBytes(bytes);
        return $"tk-{Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "")}";
    }

    /// <summary>
    /// 隐藏敏感信息的 API Key
    /// </summary>
    private static string MaskApiKey(string apiKey)
    {
        if (string.IsNullOrEmpty(apiKey) || apiKey.Length < 8)
            return "****";
        
        return $"{apiKey[..4]}****{apiKey[^4..]}";
    }

    /// <summary>
    /// 隐藏 OpenAI API Key
    /// </summary>
    private static string MaskOpenAiApiKey(string openAiApiKey)
    {
        if (string.IsNullOrEmpty(openAiApiKey) || openAiApiKey.Length < 8)
            return "sk-****";
        
        return $"sk-****{openAiApiKey[^4..]}";
    }

    private ApiKeyListDto MapToListDto(ApiKey entity)
    {
        var now = DateTime.Now;
        return new ApiKeyListDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Key = entity.Key,
            CreatedTime = entity.CreatedTime,
            LastUsedTime = entity.LastUsedTime,
            IsEnabled = entity.IsEnabled,
            UsageCount = entity.UsageCount,
            Description = entity.Description,
            ExpiresAt = entity.ExpiresAt,
            IsExpired = entity.ExpiresAt.HasValue && entity.ExpiresAt.Value <= now
        };
    }

    private ApiKeyDto MapToDto(ApiKey entity)
    {
        return new ApiKeyDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Key = entity.Key,
            OpenAiApiKey = entity.OpenAiApiKey,
            CreatedTime = entity.CreatedTime,
            LastUsedTime = entity.LastUsedTime,
            IsEnabled = entity.IsEnabled,
            UsageCount = entity.UsageCount,
            Description = entity.Description,
            ExpiresAt = entity.ExpiresAt
        };
    }

    [EndpointSummary("获取 API Key 列表")]
    [HttpPost("search")]
    public async Task<object> SearchApiKeysAsync(ApiKeySearchInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var query = dbContext.ApiKeys.Where(a => a.UserId == userId);

            // 搜索过滤
            if (!string.IsNullOrEmpty(input.SearchText))
            {
                var searchText = input.SearchText.ToLower();
                query = query.Where(a =>
                    a.Name.ToLower().Contains(searchText) ||
                    (a.Description != null && a.Description.ToLower().Contains(searchText)));
            }

            // 启用状态过滤
            if (input.IsEnabled.HasValue)
            {
                query = query.Where(a => a.IsEnabled == input.IsEnabled.Value);
            }

            // 过期状态过滤
            if (input.IsExpired.HasValue)
            {
                var now = DateTime.Now;
                if (input.IsExpired.Value)
                {
                    query = query.Where(a => a.ExpiresAt.HasValue && a.ExpiresAt.Value <= now);
                }
                else
                {
                    query = query.Where(a => !a.ExpiresAt.HasValue || a.ExpiresAt.Value > now);
                }
            }

            // 排序
            query = input.SortBy?.ToLower() switch
            {
                "name" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(a => a.Name)
                    : query.OrderByDescending(a => a.Name),
                "lastusedtime" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(a => a.LastUsedTime)
                    : query.OrderByDescending(a => a.LastUsedTime),
                "usagecount" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(a => a.UsageCount)
                    : query.OrderByDescending(a => a.UsageCount),
                _ => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(a => a.CreatedTime)
                    : query.OrderByDescending(a => a.CreatedTime)
            };

            // 分页
            var total = await query.CountAsync();
            var items = await query
                .Skip((input.Page - 1) * input.PageSize)
                .Take(input.PageSize)
                .ToListAsync();

            var result = items.Select(MapToListDto).ToList();

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

    [EndpointSummary("创建 API Key")]
    [HttpPost("create")]
    public async Task<object> CreateApiKeyAsync(CreateApiKeyInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            // 检查名称是否重复
            var existingApiKey = await dbContext.ApiKeys
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Name == input.Name);
            if (existingApiKey != null)
            {
                return new { success = false, message = "API Key 名称已存在" };
            }

            var entity = new ApiKey
            {
                Id = Guid.NewGuid(),
                UserId = userId!,
                Name = input.Name,
                Key = GenerateApiKey(),
                OpenAiApiKey = input.OpenAiApiKey,
                Description = input.Description,
                ExpiresAt = input.ExpiresAt,
                CreatedTime = DateTime.Now,
                IsEnabled = true,
                UsageCount = 0
            };

            await dbContext.ApiKeys.AddAsync(entity);
            await dbContext.SaveChangesAsync();

            var result = MapToDto(entity);

            return new { success = true, data = result, message = "创建成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"创建失败: {ex.Message}" };
        }
    }

    [EndpointSummary("更新 API Key")]
    [HttpPost("update")]
    public async Task<object> UpdateApiKeyAsync(UpdateApiKeyInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.ApiKeys.FirstOrDefaultAsync(a => a.Id == input.Id && a.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "API Key 不存在或无权限访问" };
            }

            // 检查名称是否重复（排除自己）
            var existingApiKey = await dbContext.ApiKeys
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Name == input.Name && a.Id != input.Id);
            if (existingApiKey != null)
            {
                return new { success = false, message = "API Key 名称已存在" };
            }

            entity.Name = input.Name;
            entity.OpenAiApiKey = input.OpenAiApiKey;
            entity.Description = input.Description;
            entity.IsEnabled = input.IsEnabled;
            entity.ExpiresAt = input.ExpiresAt;

            await dbContext.SaveChangesAsync();

            var result = MapToDto(entity);

            return new { success = true, data = result, message = "更新成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"更新失败: {ex.Message}" };
        }
    }

    [EndpointSummary("删除 API Key")]
    [HttpPost("delete/{id}")]
    public async Task<object> DeleteApiKeyAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.ApiKeys.FirstOrDefaultAsync(a => 
                a.Id.ToString().ToLower() == id.ToLower() && a.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "API Key 不存在或无权限访问" };
            }

            dbContext.ApiKeys.Remove(entity);
            await dbContext.SaveChangesAsync();

            return new { success = true, message = "删除成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"删除失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取单个 API Key")]
    [HttpGet("{id}")]
    public async Task<object> GetApiKeyAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.ApiKeys.FirstOrDefaultAsync(a => 
                a.Id.ToString().ToLower() == id.ToLower() && a.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "API Key 不存在或无权限访问" };
            }

            var result = MapToDto(entity);

            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"查询失败: {ex.Message}" };
        }
    }

    [EndpointSummary("切换 API Key 启用状态")]
    [HttpPost("toggle-enabled/{id}")]
    public async Task<object> ToggleEnabledAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.ApiKeys.FirstOrDefaultAsync(a => 
                a.Id.ToString().ToLower() == id.ToLower() && a.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "API Key 不存在或无权限访问" };
            }

            entity.IsEnabled = !entity.IsEnabled;
            await dbContext.SaveChangesAsync();

            return new
            {
                success = true,
                data = new { isEnabled = entity.IsEnabled },
                message = entity.IsEnabled ? "启用成功" : "禁用成功"
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"操作失败: {ex.Message}" };
        }
    }

    [EndpointSummary("重新生成 API Key")]
    [HttpPost("regenerate/{id}")]
    public async Task<object> RegenerateApiKeyAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.ApiKeys.FirstOrDefaultAsync(a => 
                a.Id.ToString().ToLower() == id.ToLower() && a.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "API Key 不存在或无权限访问" };
            }

            entity.Key = GenerateApiKey();
            entity.UsageCount = 0; // 重置使用次数
            entity.LastUsedTime = null; // 重置最后使用时间

            await dbContext.SaveChangesAsync();

            var result = MapToDto(entity);

            return new { success = true, data = result, message = "重新生成成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"重新生成失败: {ex.Message}" };
        }
    }
} 