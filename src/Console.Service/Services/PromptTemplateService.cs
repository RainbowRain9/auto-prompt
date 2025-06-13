using System.Text.Json;
using Console.Core;
using Console.Core.Entities;
using Console.Service.Dto;
using Console.Service.Infrastructure;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Console.Service.Services;

[FastService.Route("/v1/prompt-templates")]
[Tags("提示词模板管理")]
public class PromptTemplateService(IDbContext dbContext, JwtService jwtService, UserContext userContext) : FastApi
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

    private async Task<PromptTemplateDto> MapToDto(PromptTemplate entity, string? currentUserId = null)
    {
        var dto = new PromptTemplateDto
        {
            Id = entity.Id,
            Title = entity.Title,
            Description = entity.Description,
            Content = entity.Content,
            Tags = JsonSerializer.Deserialize<List<string>>(entity.Tags) ?? new List<string>(),
            IsFavorite = entity.IsFavorite,
            UsageCount = entity.UsageCount,
            IsShared = entity.IsShared,
            ShareTime = entity.ShareTime,
            ViewCount = entity.ViewCount,
            LikeCount = entity.LikeCount,
            CommentCount = entity.CommentCount,
            CreatorName = entity.CreatorName,
            CreatedTime = entity.CreatedTime,
            UpdatedTime = entity.UpdatedTime
        };

        if (string.IsNullOrEmpty(currentUserId))
        {
            currentUserId = userContext.UserId;
        }

        // 检查当前用户是否点赞了这个模板
        if (!string.IsNullOrEmpty(currentUserId))
        {
            dto.IsLikedByCurrentUser = await dbContext.UserLikes
                .AnyAsync(ul => ul.UserId == currentUserId && ul.PromptTemplateId == entity.Id);

            // 检查当前用户是否收藏了这个模板
            dto.IsFavoritedByCurrentUser = await dbContext.UserFavorites
                .AnyAsync(uf => uf.UserId == currentUserId && uf.PromptTemplateId == entity.Id);
        }

        return dto;
    }

    [EndpointSummary("获取提示词模板列表")]
    [HttpPost("search")]
    public async Task<object> SearchPromptTemplatesAsync(PromptTemplateSearchInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var query = dbContext.PromptTemplates.Where(p => p.UserId == userId);

            // 搜索过滤
            if (!string.IsNullOrEmpty(input.SearchText))
            {
                var searchText = input.SearchText.ToLower();
                query = query.Where(p =>
                    p.Title.ToLower().Contains(searchText) ||
                    p.Description.ToLower().Contains(searchText) ||
                    p.Tags.Contains(searchText));
            }

            // 收藏过滤
            if (input.IsFavorite.HasValue)
            {
                query = query.Where(p => p.IsFavorite == input.IsFavorite.Value);
            }

            // 分享过滤
            if (input.IsShared.HasValue)
            {
                query = query.Where(p => p.IsShared == input.IsShared.Value);
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
                "viewcount" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.ViewCount)
                    : query.OrderByDescending(p => p.ViewCount),
                "likecount" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.LikeCount)
                    : query.OrderByDescending(p => p.LikeCount),
                "createdtime" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.CreatedTime)
                    : query.OrderByDescending(p => p.CreatedTime),
                _ => query.OrderByDescending(p => p.UpdatedTime)
            };

            // 分页
            var total = await query.CountAsync();
            var items = await query
                .Skip((input.Page - 1) * input.PageSize)
                .Take(input.PageSize)
                .ToListAsync();

            var result = new List<PromptTemplateDto>();
            foreach (var item in items)
            {
                result.Add(await MapToDto(item, userId));
            }

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

    [EndpointSummary("获取分享的提示词模板列表")]
    [HttpPost("shared/search")]
    public async Task<object> SearchSharedPromptTemplatesAsync(SharedPromptTemplateSearchInput input)
    {
        try
        {
            var query = dbContext.PromptTemplates.Where(p => p.IsShared);

            // 搜索过滤
            if (!string.IsNullOrEmpty(input.SearchText))
            {
                var searchText = input.SearchText.ToLower();
                query = query.Where(p =>
                    p.Title.ToLower().Contains(searchText) ||
                    p.Description.ToLower().Contains(searchText) ||
                    p.Tags.Contains(searchText) ||
                    (p.CreatorName != null && p.CreatorName.ToLower().Contains(searchText)));
            }

            // 标签过滤
            if (input.Tags != null && input.Tags.Any())
            {
                foreach (var tag in input.Tags)
                {
                    query = query.Where(p => p.Tags.Contains(tag));
                }
            }

            // 排序（默认按热度排序）
            query = input.SortBy?.ToLower() switch
            {
                "likecount" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.LikeCount)
                    : query.OrderByDescending(p => p.LikeCount),
                "sharetime" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.ShareTime)
                    : query.OrderByDescending(p => p.ShareTime),
                "createdtime" => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.CreatedTime)
                    : query.OrderByDescending(p => p.CreatedTime),
                _ => input.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(p => p.ViewCount)
                    : query.OrderByDescending(p => p.ViewCount)
            };

            // 分页
            var total = await query.CountAsync();
            var items = await query
                .Skip((input.Page - 1) * input.PageSize)
                .Take(input.PageSize)
                // 只需要prompt的100个字符
                .Select(p => new PromptTemplate
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Content = p.Content.Length > 100 ? p.Content.Substring(0, 100) + "..." : p.Content,
                    Tags = p.Tags,
                    IsFavorite = p.IsFavorite,
                    UsageCount = p.UsageCount,
                    IsShared = p.IsShared,
                    ShareTime = p.ShareTime,
                    ViewCount = p.ViewCount,
                    LikeCount = p.LikeCount,
                    CreatorName = p.CreatorName,
                    CreatedTime = p.CreatedTime,
                    UpdatedTime = p.UpdatedTime
                })
                .ToListAsync();

            var result = new List<PromptTemplateDto>();
            foreach (var item in items)
            {
                result.Add(await MapToDto(item));
            }

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

    [EndpointSummary("创建提示词模板")]
    [HttpPost("create")]
    public async Task<object> CreatePromptTemplateAsync(CreatePromptTemplateInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            // 获取用户名（这里简化处理，实际应该从用户服务获取）
            var creatorName = userId; // 可以从JWT中获取用户名或从用户服务查询

            var entity = new PromptTemplate
            {
                Id = Guid.NewGuid(),
                Title = input.Title,
                Description = input.Description,
                Content = input.Content,
                Tags = JsonSerializer.Serialize(input.Tags),
                IsFavorite = false,
                UsageCount = 0,
                IsShared = false,
                ViewCount = 0,
                LikeCount = 0,
                CreatedTime = DateTime.Now,
                UpdatedTime = DateTime.Now,
                UserId = userId!,
                CreatorName = creatorName
            };

            await dbContext.PromptTemplates.AddAsync(entity);
            await dbContext.SaveChangesAsync();

            var result = await MapToDto(entity, userId);

            return new { success = true, data = result, message = "创建成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"创建失败: {ex.Message}" };
        }
    }

    [EndpointSummary("更新提示词模板")]
    [HttpPost("update")]
    public async Task<object> UpdatePromptTemplateAsync(UpdatePromptTemplateInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity =
                await dbContext.PromptTemplates.FirstOrDefaultAsync(p => p.Id == input.Id && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "提示词模板不存在或无权限访问" };
            }

            entity.Title = input.Title;
            entity.Description = input.Description;
            entity.Content = input.Content;
            entity.Tags = JsonSerializer.Serialize(input.Tags);
            entity.IsFavorite = input.IsFavorite;
            entity.UpdatedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            var result = await MapToDto(entity, userId);

            return new { success = true, data = result, message = "更新成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"更新失败: {ex.Message}" };
        }
    }

    [EndpointSummary("分享/取消分享提示词模板")]
    [HttpPost("toggle-share/{id}")]
    public async Task<object> ToggleShareAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.PromptTemplates.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "提示词模板不存在或无权限访问" };
            }

            entity.IsShared = !entity.IsShared;
            entity.ShareTime = entity.IsShared ? DateTime.Now : null;
            entity.UpdatedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            return new
            {
                success = true,
                data = new
                {
                    isShared = entity.IsShared,
                    shareTime = entity.ShareTime
                },
                message = entity.IsShared ? "分享成功" : "取消分享成功"
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"操作失败: {ex.Message}" };
        }
    }

    [EndpointSummary("点赞/取消点赞提示词模板")]
    [HttpPost("toggle-like/{id}")]
    public async Task<object> ToggleLikeAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var template =
                await dbContext.PromptTemplates.FirstOrDefaultAsync(p => p.Id.ToString().ToLower() == id.ToLower());
            if (template == null)
            {
                return new { success = false, message = "提示词模板不存在" };
            }

            var existingLike = await dbContext.UserLikes
                .FirstOrDefaultAsync(ul =>
                    ul.UserId == userId && ul.PromptTemplateId.ToString().ToLower() == id.ToLower());

            if (existingLike != null)
            {
                // 取消点赞
                dbContext.UserLikes.Remove(existingLike);
                template.LikeCount = Math.Max(0, template.LikeCount - 1);
            }
            else
            {
                // 添加点赞
                var newLike = new UserLike
                {
                    Id = Guid.NewGuid(),
                    UserId = userId!,
                    PromptTemplateId = Guid.Parse(id),
                    CreatedTime = DateTime.Now
                };
                await dbContext.UserLikes.AddAsync(newLike);
                template.LikeCount++;
            }

            template.UpdatedTime = DateTime.Now;
            await dbContext.SaveChangesAsync();

            return new
            {
                success = true,
                data = new
                {
                    likeCount = template.LikeCount,
                    isLiked = existingLike == null
                },
                message = existingLike == null ? "点赞成功" : "取消点赞成功"
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"操作失败: {ex.Message}" };
        }
    }

    [EndpointSummary("增加查看次数")]
    [HttpPost("increment-view/{id}")]
    public async Task<object> IncrementViewAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity =
                await dbContext.PromptTemplates.FirstOrDefaultAsync(p => p.Id.ToString().ToLower() == id.ToLower());
            if (entity == null)
            {
                return new { success = false, message = "提示词模板不存在" };
            }

            entity.ViewCount++;
            entity.UpdatedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            return new { success = true, data = new { viewCount = entity.ViewCount }, message = "操作成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"操作失败: {ex.Message}" };
        }
    }

    [EndpointSummary("删除提示词模板")]
    [HttpPost("delete/{id}")]
    public async Task<object> DeletePromptTemplateAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.PromptTemplates.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "提示词模板不存在或无权限访问" };
            }

            dbContext.PromptTemplates.Remove(entity);
            await dbContext.SaveChangesAsync();

            return new { success = true, message = "删除成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"删除失败: {ex.Message}" };
        }
    }

    [EndpointSummary("切换收藏状态")]
    [HttpPost("toggle-favorite/{id}")]
    public async Task<object> ToggleFavoriteAsync(Guid id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.PromptTemplates.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "提示词模板不存在或无权限访问" };
            }

            entity.IsFavorite = !entity.IsFavorite;
            entity.UpdatedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            return new { success = true, data = new { isFavorite = entity.IsFavorite }, message = "操作成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"操作失败: {ex.Message}" };
        }
    }

    [EndpointSummary("增加使用次数")]
    [HttpPost("increment-usage/{id}")]
    public async Task<object> IncrementUsageAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.PromptTemplates.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "提示词模板不存在或无权限访问" };
            }

            entity.UsageCount++;
            entity.UpdatedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            return new { success = true, data = new { usageCount = entity.UsageCount }, message = "操作成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"操作失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取单个提示词模板")]
    [HttpGet("{id}")]
    public async Task<object> GetPromptTemplateAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var entity = await dbContext.PromptTemplates.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.UserId == userId);
            if (entity == null)
            {
                return new { success = false, message = "提示词模板不存在或无权限访问" };
            }

            var result = await MapToDto(entity, userId);

            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"查询失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取分享的提示词模板详情")]
    [HttpGet("shared/{id}")]
    public async Task<object> GetSharedPromptTemplateAsync(string id)
    {
        try
        {
            var entity = await dbContext.PromptTemplates.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.IsShared);
            if (entity == null || (entity.UserId != userContext.UserId && !entity.IsShared))
            {
                return new { success = false, message = "分享的提示词模板不存在" };
            }

            var result = await MapToDto(entity);

            return new { success = true, data = result };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"查询失败: {ex.Message}" };
        }
    }

    [EndpointSummary("收藏/取消收藏提示词模板")]
    [HttpPost("toggle-favorite-shared/{id}")]
    public async Task<object> ToggleFavoriteSharedAsync(string id, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var template = await dbContext.PromptTemplates.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.IsShared);
            if (template == null)
            {
                return new { success = false, message = "提示词模板不存在" };
            }

            var existingFavorite = await dbContext.UserFavorites
                .FirstOrDefaultAsync(uf =>
                    uf.UserId == userId && uf.PromptTemplateId.ToString().ToLower() == id.ToLower());

            if (existingFavorite != null)
            {
                // 取消收藏
                dbContext.UserFavorites.Remove(existingFavorite);
            }
            else
            {
                // 添加收藏
                var newFavorite = new UserFavorite
                {
                    Id = Guid.NewGuid(),
                    UserId = userId!,
                    PromptTemplateId = Guid.Parse(id),
                    CreatedTime = DateTime.Now
                };
                await dbContext.UserFavorites.AddAsync(newFavorite);
            }

            await dbContext.SaveChangesAsync();

            return new
            {
                success = true,
                data = new
                {
                    isFavorited = existingFavorite == null
                },
                message = existingFavorite == null ? "收藏成功" : "取消收藏成功"
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"操作失败: {ex.Message}" };
        }
    }

    [EndpointSummary("获取提示词评论列表")]
    [HttpGet("{id}/comments")]
    public async Task<object> GetCommentsAsync(string id, int page = 1, int pageSize = 20)
    {
        try
        {
            var template = await dbContext.PromptTemplates.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.IsShared);
            if (template == null)
            {
                return new { success = false, message = "提示词模板不存在" };
            }

            var query = dbContext.PromptComments
                .Where(c => c.PromptTemplateId.ToString().ToLower() == id.ToLower() && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedTime);

            var total = await query.CountAsync();
            var comments = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    id = c.Id,
                    content = c.Content,
                    userName = c.UserName,
                    userId = c.UserId,
                    parentCommentId = c.ParentCommentId,
                    createdTime = c.CreatedTime,
                    updatedTime = c.UpdatedTime
                })
                .ToListAsync();

            return new
            {
                success = true,
                data = new
                {
                    items = comments,
                    total = total,
                    page = page,
                    pageSize = pageSize
                }
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"查询失败: {ex.Message}" };
        }
    }

    [EndpointSummary("添加评论")]
    [HttpPost("{id}/comments")]
    public async Task<object> AddCommentAsync(string id, AddCommentInput input, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var template = await dbContext.PromptTemplates.FirstOrDefaultAsync(p =>
                p.Id.ToString().ToLower() == id.ToLower() && p.IsShared);
            if (template == null)
            {
                return new { success = false, message = "提示词模板不存在" };
            }

            // 验证父评论是否存在（如果是回复）
            if (input.ParentCommentId.HasValue)
            {
                var parentComment = await dbContext.PromptComments.FirstOrDefaultAsync(c =>
                    c.Id == input.ParentCommentId.Value && !c.IsDeleted);
                if (parentComment == null)
                {
                    return new { success = false, message = "父评论不存在" };
                }
            }

            var comment = new PromptComment
            {
                Id = Guid.NewGuid(),
                PromptTemplateId = Guid.Parse(id),
                UserId = userId!,
                UserName = userName!,
                Content = input.Content,
                ParentCommentId = input.ParentCommentId,
                CreatedTime = DateTime.Now,
                UpdatedTime = DateTime.Now,
                IsDeleted = false
            };

            await dbContext.PromptComments.AddAsync(comment);

            // 更新提示词的评论数
            template.CommentCount++;
            template.UpdatedTime = DateTime.Now;

            await dbContext.SaveChangesAsync();

            return new
            {
                success = true,
                data = new
                {
                    id = comment.Id,
                    content = comment.Content,
                    userName = comment.UserName,
                    userId = comment.UserId,
                    parentCommentId = comment.ParentCommentId,
                    createdTime = comment.CreatedTime,
                    updatedTime = comment.UpdatedTime
                },
                message = "评论成功"
            };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"评论失败: {ex.Message}" };
        }
    }

    [EndpointSummary("删除评论")]
    [HttpPost("comments/{commentId}/delete")]
    public async Task<object> DeleteCommentAsync(string commentId, HttpContext context)
    {
        var (isValid, userId, errorResponse, userName) = ValidateTokenAndGetUserId(context);
        if (!isValid)
            return errorResponse!;

        try
        {
            var comment = await dbContext.PromptComments.FirstOrDefaultAsync(c =>
                c.Id.ToString().ToLower() == commentId.ToLower() && c.UserId == userId && !c.IsDeleted);
            if (comment == null)
            {
                return new { success = false, message = "评论不存在或无权限删除" };
            }

            // 软删除
            comment.IsDeleted = true;
            comment.UpdatedTime = DateTime.Now;

            // 更新提示词的评论数
            var template = await dbContext.PromptTemplates.FirstOrDefaultAsync(p => p.Id == comment.PromptTemplateId);
            if (template != null)
            {
                template.CommentCount = Math.Max(0, template.CommentCount - 1);
                template.UpdatedTime = DateTime.Now;
            }

            await dbContext.SaveChangesAsync();

            return new { success = true, message = "删除成功" };
        }
        catch (Exception ex)
        {
            return new { success = false, message = $"删除失败: {ex.Message}" };
        }
    }
}