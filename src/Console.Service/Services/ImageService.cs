using System.Text.Json;
using Console.Core;
using Console.Core.Entities;
using Console.Service.Dto;
using Console.Service.Infrastructure;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Console.Service.Services;

[FastService.Route("/v1/images")]
[Tags("图片生成管理")]
public class ImageService(IDbContext dbContext, JwtService jwtService) : FastApi
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

    private GeneratedImageDto MapToDto(GeneratedImage entity)
    {
        return new GeneratedImageDto
        {
            Id = entity.Id,
            ImageUrl = entity.ImageUrl,
            Prompt = entity.Prompt,
            RevisedPrompt = entity.RevisedPrompt,
            Type = entity.Type,
            Model = entity.Model,
            Size = entity.Size,
            Quality = entity.Quality,
            Style = entity.Style,
            IsFavorite = entity.IsFavorite,
            CreatedTime = entity.CreatedTime,
            UserId = entity.UserId,
            UserName = entity.UserName,
            Tags = JsonSerializer.Deserialize<List<string>>(entity.Tags) ?? new List<string>(),
            GenerationParams = string.IsNullOrEmpty(entity.GenerationParams) 
                ? null 
                : JsonSerializer.Deserialize<object>(entity.GenerationParams)
        };
    }

    /// <summary>
    /// 保存生成的图片
    /// </summary>
    [EndpointSummary("保存生成的图片")]
    [HttpPost("save")]
    public async Task<object> SaveGeneratedImageAsync(SaveGeneratedImageInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = new GeneratedImage
            {
                Id = Guid.NewGuid(),
                ImageUrl = input.ImageUrl,
                Prompt = input.Prompt,
                RevisedPrompt = input.RevisedPrompt,
                Type = input.Type,
                Model = input.Model,
                Size = input.Size,
                Quality = input.Quality,
                Style = input.Style,
                IsFavorite = false,
                CreatedTime = DateTime.Now,
                UserId = userId!,
                UserName = userName,
                Tags = JsonSerializer.Serialize(input.Tags),
                GenerationParams = input.GenerationParams != null 
                    ? JsonSerializer.Serialize(input.GenerationParams) 
                    : null
            };

            await dbContext.GeneratedImages.AddAsync(entity);
            await dbContext.SaveChangesAsync();

            var result = MapToDto(entity);

            return new { success = true, data = result, message = "保存成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"保存失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 批量保存生成的图片
    /// </summary>
    [EndpointSummary("批量保存生成的图片")]
    [HttpPost("save-batch")]
    public async Task<object> SaveGeneratedImagesAsync(List<SaveGeneratedImageInput> inputs, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entities = inputs.Select(input => new GeneratedImage
            {
                Id = Guid.NewGuid(),
                ImageUrl = input.ImageUrl,
                Prompt = input.Prompt,
                RevisedPrompt = input.RevisedPrompt,
                Type = input.Type,
                Model = input.Model,
                Size = input.Size,
                Quality = input.Quality,
                Style = input.Style,
                IsFavorite = false,
                CreatedTime = DateTime.Now,
                UserId = userId!,
                UserName = userName,
                Tags = JsonSerializer.Serialize(input.Tags),
                GenerationParams = input.GenerationParams != null 
                    ? JsonSerializer.Serialize(input.GenerationParams) 
                    : null
            }).ToList();

            await dbContext.GeneratedImages.AddRangeAsync(entities);
            await dbContext.SaveChangesAsync();

            var results = entities.Select(MapToDto).ToList();

            return new { success = true, data = results, message = $"成功保存 {results.Count} 张图片" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"批量保存失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 搜索图片
    /// </summary>
    [EndpointSummary("搜索图片")]
    [HttpPost("search")]
    public async Task<object> SearchImagesAsync(ImageSearchInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var query = dbContext.GeneratedImages.Where(p => p.UserId == userId);

            // 搜索过滤
            if (!string.IsNullOrEmpty(input.SearchText))
            {
                var searchText = input.SearchText.ToLower();
                query = query.Where(p =>
                    p.Prompt.ToLower().Contains(searchText) ||
                    (p.RevisedPrompt != null && p.RevisedPrompt.ToLower().Contains(searchText)) ||
                    p.Tags.Contains(searchText));
            }

            // 类型过滤
            if (!string.IsNullOrEmpty(input.Type))
            {
                query = query.Where(p => p.Type == input.Type);
            }

            // 模型过滤
            if (!string.IsNullOrEmpty(input.Model))
            {
                query = query.Where(p => p.Model == input.Model);
            }

            // 收藏过滤
            if (input.IsFavorite.HasValue)
            {
                query = query.Where(p => p.IsFavorite == input.IsFavorite.Value);
            }

            // 标签过滤
            if (input.Tags != null && input.Tags.Any())
            {
                foreach (var tag in input.Tags)
                {
                    query = query.Where(p => p.Tags.Contains(tag));
                }
            }

            // 排序
            query = input.SortBy?.ToLower() switch
            {
                "isfavorite" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.IsFavorite).ThenByDescending(p => p.CreatedTime)
                    : query.OrderByDescending(p => p.IsFavorite).ThenByDescending(p => p.CreatedTime),
                _ => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.CreatedTime)
                    : query.OrderByDescending(p => p.CreatedTime)
            };

            // 分页
            var total = await query.CountAsync();
            var items = await query
                .Skip((input.Page - 1) * input.PageSize)
                .Take(input.PageSize)
                .ToListAsync();

            var results = items.Select(MapToDto).ToList();

            return new
            {
                success = true,
                data = new
                {
                    items = results,
                    total,
                    page = input.Page,
                    pageSize = input.PageSize
                }
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"搜索失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 更新图片信息
    /// </summary>
    [EndpointSummary("更新图片信息")]
    [HttpPost("update")]
    public async Task<object> UpdateImageAsync(UpdateImageInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.GeneratedImages.FirstOrDefaultAsync(p =>
                p.Id == input.Id && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "图片不存在或无权限访问" };
            }

            if (input.IsFavorite.HasValue)
            {
                entity.IsFavorite = input.IsFavorite.Value;
            }

            if (input.Tags != null)
            {
                entity.Tags = JsonSerializer.Serialize(input.Tags);
            }

            await dbContext.SaveChangesAsync();

            var result = MapToDto(entity);

            return new { success = true, data = result, message = "更新成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"更新失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 删除图片
    /// </summary>
    [EndpointSummary("删除图片")]
    [HttpDelete("{id}")]
    public async Task<object> DeleteImageAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.GeneratedImages.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "图片不存在或无权限访问" };
            }

            dbContext.GeneratedImages.Remove(entity);
            await dbContext.SaveChangesAsync();

            return new { success = true, message = "删除成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"删除失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 获取单张图片信息
    /// </summary>
    [EndpointSummary("获取单张图片信息")]
    [HttpGet("{id}")]
    public async Task<object> GetImageAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.GeneratedImages.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "图片不存在或无权限访问" };
            }

            var result = MapToDto(entity);

            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"查询失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 切换收藏状态
    /// </summary>
    [EndpointSummary("切换收藏状态")]
    [HttpPost("{id}/toggle-favorite")]
    public async Task<object> ToggleFavoriteAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.GeneratedImages.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "图片不存在或无权限访问" };
            }

            entity.IsFavorite = !entity.IsFavorite;
            await dbContext.SaveChangesAsync();

            return new { success = true, data = new { isFavorite = entity.IsFavorite }, message = "操作成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"操作失败: {ex.Message}" };
        }
    }
} 