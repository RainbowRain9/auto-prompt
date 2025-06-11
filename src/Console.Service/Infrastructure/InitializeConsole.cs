namespace Console.Service.Infrastructure;

public class InitializeConsole
{
    public static async Task Initialize()
    {
        System.Console.Clear();

        // 显示ASCII艺术标志
        System.Console.ForegroundColor = ConsoleColor.Cyan;
        System.Console.WriteLine(
            """
                      (\(\
                      ( -.-)  Token AI
                     o_(")(")
            """);
        System.Console.WriteLine();
        System.Console.WriteLine();
        System.Console.ResetColor();

        // 显示服务信息
        System.Console.ForegroundColor = ConsoleColor.Green;
        System.Console.WriteLine($"Token AI Console 服务已启动! - {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        System.Console.WriteLine("版本: 1.0.0");
        System.Console.ResetColor();

        // 显示联系方式
        System.Console.WriteLine("\n==================================================");
        System.Console.WriteLine("联系我们: 239573049@qq.com");
        System.Console.WriteLine("官方网站: https://console.token-ai.cn");
        System.Console.WriteLine("==================================================\n");

        await Task.Delay(1000); // 延时1秒以便用户看到信息
    }
}