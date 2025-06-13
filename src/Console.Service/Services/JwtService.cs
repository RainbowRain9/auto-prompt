using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Console.Service.Services;

public class JwtService
{
    private const string DefaultSecretKey = "PromptOptimizationPlatformSecretKey2024ConsoleService123456789";

    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;

    public JwtService(IConfiguration configuration)
    {
        _secretKey = configuration["Jwt:Key"] ?? DefaultSecretKey;
        _issuer = configuration["Jwt:Issuer"] ?? "prompt-console";
        _audience = configuration["Jwt:Audience"] ?? "prompt-console-users";
    }

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

    public string? GetUserRoleFromTokenOrDefault(string token)
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
            var userRole = jsonToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Role)?.Value;

            return userRole ?? string.Empty;
        }
        catch (Exception)
        {
            // 如果解析失���，返回空字符串
            return string.Empty;
        }
    }

    public string GetUserNameFromToken(string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
                return string.Empty;

            var handler = new JwtSecurityTokenHandler();

            // 验证token格式
            if (!handler.CanReadToken(token))
                return string.Empty;

            var jsonToken = handler.ReadJwtToken(token);

            // 尝试从不同的claim中获取用户名
            var userName = jsonToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;

            return userName ?? string.Empty;
        }
        catch (Exception)
        {
            // 如果解析失败，返回空字符串
            return string.Empty;
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

    /// <summary>
    /// 生成JWT Token
    /// </summary>
    /// <param name="userId">用户ID</param>
    /// <param name="username">用户名</param>
    /// <param name="displayName">显示名称</param>
    /// <param name="expiryHours">过期时间（小时）</param>
    /// <returns>JWT Token</returns>
    public string GenerateToken(string userId, string username, string displayName,
        string role, int expiryHours = 24)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Sid, userId), // 用户ID
            new Claim(ClaimTypes.NameIdentifier, username), // 用户名
            new Claim(ClaimTypes.Name, displayName), // 显示名称
            new Claim(ClaimTypes.Role, role), // 角色
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 验证JWT Token并获取用户信息
    /// </summary>
    /// <param name="token">JWT Token</param>
    /// <returns>验证结果和用户信息</returns>
    public (bool IsValid, string? UserId, string? Username, string? DisplayName) ValidateToken(string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
                return (false, null, null, null);

            var handler = new JwtSecurityTokenHandler();

            if (!handler.CanReadToken(token))
                return (false, null, null, null);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _issuer,
                ValidAudience = _audience,
                IssuerSigningKey = key,
                ClockSkew = TimeSpan.Zero
            };

            var principal = handler.ValidateToken(token, validationParameters, out var validatedToken);

            var userId = principal.FindFirst(ClaimTypes.Sid)?.Value;
            var username = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var displayName = principal.FindFirst(ClaimTypes.Name)?.Value;

            return (true, userId, username, displayName);
        }
        catch (Exception)
        {
            return (false, null, null, null);
        }
    }
}