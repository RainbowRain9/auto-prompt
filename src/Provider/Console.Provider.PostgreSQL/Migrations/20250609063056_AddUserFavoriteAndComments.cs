using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Console.Provider.PostgreSQL.Migrations
{
    /// <inheritdoc />
    public partial class AddUserFavoriteAndComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CommentCount",
                table: "PromptTemplates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "PromptComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PromptTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UserName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ParentCommentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromptComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromptComments_PromptComments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "PromptComments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PromptComments_PromptTemplates_PromptTemplateId",
                        column: x => x.PromptTemplateId,
                        principalTable: "PromptTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserFavorites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PromptTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFavorites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserFavorites_PromptTemplates_PromptTemplateId",
                        column: x => x.PromptTemplateId,
                        principalTable: "PromptTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PromptTemplates_CommentCount",
                table: "PromptTemplates",
                column: "CommentCount");

            migrationBuilder.CreateIndex(
                name: "IX_PromptComments_CreatedTime",
                table: "PromptComments",
                column: "CreatedTime");

            migrationBuilder.CreateIndex(
                name: "IX_PromptComments_IsDeleted",
                table: "PromptComments",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_PromptComments_ParentCommentId",
                table: "PromptComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_PromptComments_PromptTemplateId",
                table: "PromptComments",
                column: "PromptTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_PromptComments_UserId",
                table: "PromptComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_PromptTemplateId",
                table: "UserFavorites",
                column: "PromptTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_UserId",
                table: "UserFavorites",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_UserId_PromptTemplateId",
                table: "UserFavorites",
                columns: new[] { "UserId", "PromptTemplateId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PromptComments");

            migrationBuilder.DropTable(
                name: "UserFavorites");

            migrationBuilder.DropIndex(
                name: "IX_PromptTemplates_CommentCount",
                table: "PromptTemplates");

            migrationBuilder.DropColumn(
                name: "CommentCount",
                table: "PromptTemplates");
        }
    }
}
