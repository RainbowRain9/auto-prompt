using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace Console.Service.Services;

public class JwtService
{
    public string? GetUserIdFromToken(string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
                return null;

            var handler = new JwtSecurityTokenHandler();
            
            // 验证token格式
            if (!handler.CanReadToken(token))
                return null;

            var jsonToken = handler.ReadJwtToken(token);
            
            // 尝试从不同的claim中获取用户ID
            var userId = jsonToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Sid)?.Value;

            return userId;
        }
        catch (Exception)
        {
            // 如果解析失败，返回null
            return null;
        }
    }

    public bool IsTokenValid(string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
                return false;

            var handler = new JwtSecurityTokenHandler();
            
            if (!handler.CanReadToken(token))
                return false;

            var jsonToken = handler.ReadJwtToken(token);
            
            // 检查token是否过期
            return jsonToken.ValidTo > DateTime.UtcNow;
        }
        catch (Exception)
        {
            return false;
        }
    }
} 