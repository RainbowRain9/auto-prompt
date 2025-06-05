using Console.Core;
using Microsoft.EntityFrameworkCore;

namespace Console.Provider.Sqlite;

public class SqliteDbContext(DbContextOptions<SqliteDbContext> options) : ConsoleDbContext<SqliteDbContext>(options)
{
    
}