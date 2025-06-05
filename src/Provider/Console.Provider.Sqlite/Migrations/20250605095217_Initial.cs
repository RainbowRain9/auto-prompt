using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Console.Provider.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PromptHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Prompt = table.Column<string>(type: "TEXT", nullable: false),
                    Requirement = table.Column<string>(type: "TEXT", nullable: false),
                    DeepReasoning = table.Column<string>(type: "TEXT", nullable: true),
                    Result = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromptHistory", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PromptTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    Tags = table.Column<string>(type: "TEXT", nullable: false),
                    IsFavorite = table.Column<bool>(type: "INTEGER", nullable: false),
                    UsageCount = table.Column<int>(type: "INTEGER", nullable: false),
                    IsShared = table.Column<bool>(type: "INTEGER", nullable: false),
                    ShareTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ViewCount = table.Column<int>(type: "INTEGER", nullable: false),
                    LikeCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CreatorName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromptTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserLikes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PromptTemplateId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserLikes_PromptTemplates_PromptTemplateId",
                        column: x => x.PromptTemplateId,
                        principalTable: "PromptTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PromptHistory_Id",
                table: "PromptHistory",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_PromptHistory_Prompt",
                table: "PromptHistory",
                column: "Prompt");

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_CreatedTime",
                table: "PromptTemplates",
                column: "CreatedTime");

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_IsFavorite",
                table: "PromptTemplates",
                column: "IsFavorite");

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_IsShared",
                table: "PromptTemplates",
                column: "IsShared");

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_LikeCount",
                table: "PromptTemplates",
                column: "LikeCount");

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_ShareTime",
                table: "PromptTemplates",
                column: "ShareTime");

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_Title",
                table: "PromptTemplates",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_UserId",
                table: "PromptTemplates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_ViewCount",
                table: "PromptTemplates",
                column: "ViewCount");

            migrationBuilder.CreateIndex(
                name: "IX_UserLikes_PromptTemplateId",
                table: "UserLikes",
                column: "PromptTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLikes_UserId",
                table: "UserLikes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLikes_UserId_PromptTemplateId",
                table: "UserLikes",
                columns: new[] { "UserId", "PromptTemplateId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PromptHistory");

            migrationBuilder.DropTable(
                name: "UserLikes");

            migrationBuilder.DropTable(
                name: "PromptTemplates");
        }
    }
}
