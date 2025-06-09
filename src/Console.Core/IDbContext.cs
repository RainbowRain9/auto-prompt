using Console.Service.Entities;
using Microsoft.EntityFrameworkCore;

namespace Console.Core;

public interface IDbContext
{
    public DbSet<PromptHistory> PromptHistory { get; set; }

    public DbSet<PromptTemplate> PromptTemplates { get; set; }

    public DbSet<UserLike> UserLikes { get; set; }

    public DbSet<UserFavorite> UserFavorites { get; set; }

    public DbSet<PromptComment> PromptComments { get; set; }

    public Task SaveChangesAsync();
 
    Task BeginMigrationAsync();
}