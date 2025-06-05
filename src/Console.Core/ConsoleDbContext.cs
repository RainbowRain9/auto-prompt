using Console.Service.Entities;
using Microsoft.EntityFrameworkCore;

namespace Console.Core;

public class ConsoleDbContext<TDbContext>(DbContextOptions<TDbContext> options)
    : DbContext(options), IDbContext where TDbContext : DbContext
{
    public DbSet<PromptHistory> PromptHistory { get; set; } = null!;

    public DbSet<PromptTemplate> PromptTemplates { get; set; } = null!;

    public DbSet<UserLike> UserLikes { get; set; } = null!;

    public Task SaveChangesAsync()
    {
        return base.SaveChangesAsync(CancellationToken.None);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PromptHistory>(options =>
        {
            options.HasKey(e => e.Id);

            options.Property(x => x.Prompt)
                .IsRequired();

            options.HasIndex(e => e.Prompt);

            options.HasIndex(e => e.Id);
        });

        modelBuilder.Entity<PromptTemplate>(options =>
        {
            options.HasKey(e => e.Id);

            options.Property(x => x.Title)
                .IsRequired()
                .HasMaxLength(200);

            options.Property(x => x.Description)
                .HasMaxLength(500);

            options.Property(x => x.Content)
                .IsRequired();

            options.Property(x => x.Tags);

            options.Property(x => x.UserId)
                .HasMaxLength(100);

            options.Property(x => x.CreatorName)
                .HasMaxLength(100);

            options.HasIndex(e => e.Title);
            options.HasIndex(e => e.UserId);
            options.HasIndex(e => e.IsFavorite);
            options.HasIndex(e => e.IsShared);
            options.HasIndex(e => e.ShareTime);
            options.HasIndex(e => e.ViewCount);
            options.HasIndex(e => e.LikeCount);
            options.HasIndex(e => e.CreatedTime);
        });

        modelBuilder.Entity<UserLike>(options =>
        {
            options.HasKey(e => e.Id);

            options.Property(x => x.UserId)
                .IsRequired()
                .HasMaxLength(100);

            options.HasIndex(e => e.UserId);
            options.HasIndex(e => e.PromptTemplateId);
            options.HasIndex(e => new { e.UserId, e.PromptTemplateId }).IsUnique();

            options.HasOne(e => e.PromptTemplate)
                .WithMany()
                .HasForeignKey(e => e.PromptTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}