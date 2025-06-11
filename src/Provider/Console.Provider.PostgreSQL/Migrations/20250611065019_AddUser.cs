using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Console.Provider.PostgreSQL.Migrations
{
    /// <inheritdoc />
    public partial class AddUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GeneratedImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    Prompt = table.Column<string>(type: "text", nullable: false),
                    RevisedPrompt = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Size = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Quality = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Style = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IsFavorite = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UserName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: false),
                    GenerationParams = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GeneratedImages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    LastLoginTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedImages_CreatedTime",
                table: "GeneratedImages",
                column: "CreatedTime");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedImages_IsFavorite",
                table: "GeneratedImages",
                column: "IsFavorite");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedImages_Model",
                table: "GeneratedImages",
                column: "Model");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedImages_Type",
                table: "GeneratedImages",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedImages_UserId",
                table: "GeneratedImages",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_CreatedTime",
                table: "Users",
                column: "CreatedTime");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsActive",
                table: "Users",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Users_LastLoginTime",
                table: "Users",
                column: "LastLoginTime");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GeneratedImages");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
