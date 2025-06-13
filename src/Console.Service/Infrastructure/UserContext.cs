using Console.Service.Services;

namespace Console.Service.Infrastructure;

public class UserContext(IHttpContextAccessor httpContextAccessor, JwtService jwtService)
{
    public string? UserId
    {
        get
        {
            var token = httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();

            if (string.IsNullOrEmpty(token))
            {
                return null;
            }

            token = token.Replace("Bearer ", "");

            var userId = jwtService.GetUserIdFromToken(token);

            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            return userId;
        }
    }

    public string[]? Roles
    {
        get
        {
            var token = httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();

            if (string.IsNullOrEmpty(token))
            {
                return null;
            }

            token = token.Replace("Bearer ", "");

            var roles = jwtService.GetUserRoleFromTokenOrDefault(token)?.Split(",");

            if (roles == null || roles.Length == 0)
            {
                return null;
            }

            return roles;
        }
    }

    public bool IsAuthenticated
    {
        get
        {
            var token = httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();

            if (string.IsNullOrEmpty(token))
            {
                return false;
            }

            token = token.Replace("Bearer ", "");

            return jwtService.IsTokenValid(token);
        }
    }
}