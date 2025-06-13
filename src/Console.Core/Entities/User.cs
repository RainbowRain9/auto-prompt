using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace Console.Core.Entities;

public class User
{
    public Guid Id { get; set; }

    /// <summary>
    /// 用户名（登录用）
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码哈希
    /// </summary>
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    [StringLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱
    /// </summary>
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginTime { get; set; }

    /// <summary>
    /// 是否激活
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    public string Role { get; set; } = "User"; // 默认角色为普通用户
    
    public DateTime? LastPasswordChangeTime { get; set; } // 最后密码修改时间
    
    public string? IpAddress { get; set; } = string.Empty; // 最后登录IP地址
    
    /// <summary>
    /// 哈希密码
    /// </summary>
    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var saltedPassword = password + "ConsoleServiceSalt2024";
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
        return Convert.ToBase64String(hashedBytes);
    }

    /// <summary>
    /// 验证密码
    /// </summary>
    public  static bool VerifyPassword(string password, string hash)
    {
        var hashedInput = HashPassword(password);
        return hashedInput == hash;
    }
} 