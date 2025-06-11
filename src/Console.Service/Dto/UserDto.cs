using System.ComponentModel.DataAnnotations;

namespace Console.Service.Dto;

/// <summary>
/// 用户登录输入
/// </summary>
public class LoginInput
{
    /// <summary>
    /// 用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// 用户注册输入
/// </summary>
public class RegisterInput
{
    /// <summary>
    /// 用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "用户名长度必须在3-50个字符之间")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "密码长度必须在6-100个字符之间")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    [StringLength(100, ErrorMessage = "显示名称不能超过100个字符")]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱
    /// </summary>
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    [StringLength(200, ErrorMessage = "邮箱不能超过200个字符")]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// 用户登录响应
/// </summary>
public class LoginResponse
{
    /// <summary>
    /// JWT Token
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// 用户信息
    /// </summary>
    public UserInfo User { get; set; } = new();
}

/// <summary>
/// 用户信息
/// </summary>
public class UserInfo
{
    /// <summary>
    /// 用户ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginTime { get; set; }
} 