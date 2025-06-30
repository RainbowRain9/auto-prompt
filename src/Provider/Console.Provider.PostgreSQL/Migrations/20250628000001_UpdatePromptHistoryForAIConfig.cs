using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Console.Provider.PostgreSQL.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePromptHistoryForAIConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 添加新字段
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "PromptHistory",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OriginalPrompt",
                table: "PromptHistory",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptimizedPrompt",
                table: "PromptHistory",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Requirements",
                table: "PromptHistory",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChatModel",
                table: "PromptHistory",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConfigId",
                table: "PromptHistory",
                type: "uuid",
                nullable: true);

            // 创建新索引
            migrationBuilder.CreateIndex(
                name: "IX_PromptHistory_UserId",
                table: "PromptHistory",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PromptHistory_CreatedTime",
                table: "PromptHistory",
                column: "CreatedTime");

            migrationBuilder.CreateIndex(
                name: "IX_PromptHistory_ConfigId",
                table: "PromptHistory",
                column: "ConfigId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 删除索引
            migrationBuilder.DropIndex(
                name: "IX_PromptHistory_UserId",
                table: "PromptHistory");

            migrationBuilder.DropIndex(
                name: "IX_PromptHistory_CreatedTime",
                table: "PromptHistory");

            migrationBuilder.DropIndex(
                name: "IX_PromptHistory_ConfigId",
                table: "PromptHistory");

            // 删除字段
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "PromptHistory");

            migrationBuilder.DropColumn(
                name: "OriginalPrompt",
                table: "PromptHistory");

            migrationBuilder.DropColumn(
                name: "OptimizedPrompt",
                table: "PromptHistory");

            migrationBuilder.DropColumn(
                name: "Requirements",
                table: "PromptHistory");

            migrationBuilder.DropColumn(
                name: "ChatModel",
                table: "PromptHistory");

            migrationBuilder.DropColumn(
                name: "ConfigId",
                table: "PromptHistory");
        }
    }
}
