using Console.Core;
using Microsoft.EntityFrameworkCore;

namespace Console.Provider.PostgreSQL;

public class PostgreSQLDbContext(DbContextOptions<PostgreSQLDbContext> options)
    : ConsoleDbContext<PostgreSQLDbContext>(options)
{
}