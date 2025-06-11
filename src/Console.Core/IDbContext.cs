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

    public DbSet<User> Users { get; set; }

    public DbSet<GeneratedImage> GeneratedImages { get; set; }

    public DbSet<ApiKey> ApiKeys { get; set; }

    public Task SaveChangesAsync();
 
    Task BeginMigrationAsync();
}