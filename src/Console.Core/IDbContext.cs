using Console.Service.Entities;
using Microsoft.EntityFrameworkCore;

namespace Console.Core;

public interface IDbContext
{
    public DbSet<PromptHistory> PromptHistory { get; set; }

    public DbSet<PromptTemplate> PromptTemplates { get; set; }

    public DbSet<UserLike> UserLikes { get; set; }

    public Task SaveChangesAsync();
}