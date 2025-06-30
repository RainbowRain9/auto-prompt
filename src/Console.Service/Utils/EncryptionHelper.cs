using System.Security.Cryptography;
using System.Text;

namespace Console.Service.Utils;

/// <summary>
/// 加密工具类，用于安全存储API密钥
/// </summary>
public static class EncryptionHelper
{
    // 使用固定的密钥和IV用于演示，生产环境应该使用更安全的密钥管理
    private static readonly byte[] Key = Encoding.UTF8.GetBytes("AutoPromptAIServiceConfigKey2024"); // 32字节
    private static readonly byte[] IV = Encoding.UTF8.GetBytes("AutoPromptIV2024"); // 16字节

    /// <summary>
    /// 加密API密钥
    /// </summary>
    /// <param name="plainText">明文API密钥</param>
    /// <returns>加密后的Base64字符串</returns>
    public static string EncryptApiKey(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;

        try
        {
            using var aes = Aes.Create();
            aes.Key = Key;
            aes.IV = IV;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var encryptor = aes.CreateEncryptor();
            using var msEncrypt = new MemoryStream();
            using var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write);
            using var swEncrypt = new StreamWriter(csEncrypt);

            swEncrypt.Write(plainText);
            swEncrypt.Close();

            return Convert.ToBase64String(msEncrypt.ToArray());
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"加密API密钥失败: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// 解密API密钥
    /// </summary>
    /// <param name="cipherText">加密的Base64字符串</param>
    /// <returns>解密后的明文API密钥</returns>
    public static string DecryptApiKey(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return string.Empty;

        try
        {
            var cipherBytes = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = Key;
            aes.IV = IV;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            using var msDecrypt = new MemoryStream(cipherBytes);
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var srDecrypt = new StreamReader(csDecrypt);

            return srDecrypt.ReadToEnd();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"解密API密钥失败: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// 隐藏API密钥敏感信息
    /// </summary>
    /// <param name="apiKey">API密钥</param>
    /// <returns>隐藏敏感信息的API密钥</returns>
    public static string MaskApiKey(string apiKey)
    {
        if (string.IsNullOrEmpty(apiKey))
            return "****";

        if (apiKey.Length <= 8)
            return "****";

        // 显示前4位和后4位，中间用*号替代
        return $"{apiKey[..4]}****{apiKey[^4..]}";
    }

    /// <summary>
    /// 验证API密钥格式
    /// </summary>
    /// <param name="apiKey">API密钥</param>
    /// <param name="provider">AI服务提供商</param>
    /// <returns>是否为有效格式</returns>
    public static bool ValidateApiKeyFormat(string apiKey, string provider)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return false;

        return provider.ToLower() switch
        {
            "openai" => apiKey.StartsWith("sk-") && apiKey.Length >= 20,
            "deepseek" => apiKey.StartsWith("sk-") && apiKey.Length >= 20,
            "googleai" => apiKey.Length >= 20, // Google AI API keys vary in format
            "ollama" => true, // Ollama通常不需要API密钥或格式灵活
            "volcengine" => apiKey.Length >= 20,
            _ => apiKey.Length >= 10 // 通用最小长度要求
        };
    }

    /// <summary>
    /// 生成安全的配置ID
    /// </summary>
    /// <returns>安全的配置ID</returns>
    public static string GenerateConfigId()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[16];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "")[..16];
    }
}
