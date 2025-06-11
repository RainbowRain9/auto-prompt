using Console.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Console.Provider.Sqlite.Extensions;

public static class SqliteExtensions
{
    public static IServiceCollection AddSqlite(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<IDbContext, SqliteDbContext>(options =>
        {
            options.UseSqlite(connectionString);
            
            // 不输出日志
            options.EnableSensitiveDataLogging(false);
        });
        
        return services;
    }
}