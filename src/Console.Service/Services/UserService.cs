using System.Security.Cryptography;
using System.Text;
using Console.Core;
using Console.Service.Dto;
using Console.Service.Entities;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Console.Service.Services;

[FastService.Route("/v1/auth")]
[Tags("用户认证")]
public class UserService(IDbContext dbContext, JwtService jwtService) : FastApi
{
    /// <summary>
    /// 用户登录
    /// </summary>
    [EndpointSummary("用户登录")]
    [HttpPost("login")]
    public async Task<object> LoginAsync(LoginInput input, HttpContext context)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(input.Username) || string.IsNullOrWhiteSpace(input.Password))
            {
                context.Response.StatusCode = 400;
                return new { success = false, message = "用户名和密码不能为空" };
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u =>
                u.Username == input.Username && u.IsActive);

            if (user == null)
            {
                context.Response.StatusCode = 401;
                return new { success = false, message = "用户名或密码错误" };
            }

            if (!User.VerifyPassword(input.Password, user.PasswordHash))
            {
                context.Response.StatusCode = 401;
                return new { success = false, message = "用户名或密码错误" };
            }

            // 更新最后登录时间
            user.LastLoginTime = DateTime.Now;

            var ip = context.Connection.RemoteIpAddress?.ToString();

            if (context.Request.Headers.ContainsKey("X-Forwarded-For"))
            {
                // 如果使用了代理，获取真实IP
                ip = context.Request.Headers["X-Forwarded-For"].ToString().Split(',').FirstOrDefault()?.Trim();
            }
            else if (context.Request.Headers.ContainsKey("X-Real-IP"))
            {
                // 如果使用了代理，获取真实IP
                ip = context.Request.Headers["X-Real-IP"].ToString();
            }

            user.IpAddress = ip ?? string.Empty;
            await dbContext.SaveChangesAsync();

            // 生成JWT Token
            var token = jwtService.GenerateToken(
                user.Id.ToString(),
                user.Username,
                user.DisplayName ?? user.Username,
                user.Role,
                24 * 7 // 7天有效期
            );

            var userInfo = new UserInfo
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                Email = user.Email,
                CreatedTime = user.CreatedTime,
                LastLoginTime = user.LastLoginTime
            };

            var response = new LoginResponse
            {
                Token = token,
                User = userInfo
            };

            return new { success = true, data = response, message = "登录成功" };
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            return new { success = false, message = $"登录失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 用户注册
    /// </summary>
    [EndpointSummary("用户注册")]
    [HttpPost("register")]
    public async Task<object> RegisterAsync(RegisterInput input, HttpContext context)
    {
        try
        {
            // 验证输入
            if (string.IsNullOrWhiteSpace(input.Username) || string.IsNullOrWhiteSpace(input.Password))
            {
                context.Response.StatusCode = 400;
                return new { success = false, message = "用户名和密码不能为空" };
            }

            if (input.Username.Length < 3 || input.Username.Length > 50)
            {
                context.Response.StatusCode = 400;
                return new { success = false, message = "用户名长度必须在3-50个字符之间" };
            }

            if (input.Password.Length < 6)
            {
                context.Response.StatusCode = 400;
                return new { success = false, message = "密码长度至少为6个字符" };
            }

            // 检查用户名是否已存在
            var existingUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == input.Username);
            if (existingUser != null)
            {
                context.Response.StatusCode = 409;
                return new { success = false, message = "用户名已存在" };
            }

            // 检查邮箱是否已存在（如果提供了邮箱）
            if (!string.IsNullOrWhiteSpace(input.Email))
            {
                var existingEmail = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == input.Email);
                if (existingEmail != null)
                {
                    context.Response.StatusCode = 409;
                    return new { success = false, message = "邮箱已被使用" };
                }
            }

            // 创建新用户
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = input.Username,
                PasswordHash = User.HashPassword(input.Password),
                DisplayName = string.IsNullOrWhiteSpace(input.DisplayName) ? input.Username : input.DisplayName,
                Email = input.Email ?? string.Empty,
                CreatedTime = DateTime.Now,
                IsActive = true,
                Role = "User", // 默认角色为普通用户
            };

            await dbContext.Users.AddAsync(user);
            await dbContext.SaveChangesAsync();

            // 生成JWT Token
            var token = jwtService.GenerateToken(
                user.Id.ToString(),
                user.Username,
                user.DisplayName,
                user.Role,
                24 * 7 // 7天有效期
            );

            var userInfo = new UserInfo
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                Email = user.Email,
                CreatedTime = user.CreatedTime,
                LastLoginTime = user.LastLoginTime
            };

            var response = new LoginResponse
            {
                Token = token,
                User = userInfo
            };

            return new { success = true, data = response, message = "注册成功" };
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            return new { success = false, message = $"注册失败: {ex.Message}" };
        }
    }

    /// <summary>
    /// 检查用户名是否可用
    /// </summary>
    [EndpointSummary("检查用户名是否可用")]
    [HttpGet("check-username/{username}")]
    public async Task<object> CheckUsernameAsync(string username, HttpContext context)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                context.Response.StatusCode = 400;
                return new { success = false, message = "用户名不能为空" };
            }

            var exists = await dbContext.Users.AnyAsync(u => u.Username == username);
            return new { success = true, data = new { isAvailable = !exists } };
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            return new { success = false, message = $"检查失败: {ex.Message}" };
        }
    }
}