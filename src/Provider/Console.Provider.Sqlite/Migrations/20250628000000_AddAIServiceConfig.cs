using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Console.Provider.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddAIServiceConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AIServiceConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Provider = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ApiEndpoint = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    EncryptedApiKey = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    ChatModels = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    ImageModels = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    DefaultChatModel = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    DefaultImageModel = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ExtraConfig = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    ConnectionStatus = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    LastTestTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastTestError = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    UsageCount = table.Column<int>(type: "INTEGER", nullable: false),
                    LastUsedTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIServiceConfigs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIServiceConfigs_ConnectionStatus",
                table: "AIServiceConfigs",
                column: "ConnectionStatus");

            migrationBuilder.CreateIndex(
                name: "IX_AIServiceConfigs_CreatedTime",
                table: "AIServiceConfigs",
                column: "CreatedTime");

            migrationBuilder.CreateIndex(
                name: "IX_AIServiceConfigs_IsEnabled",
                table: "AIServiceConfigs",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_AIServiceConfigs_Provider",
                table: "AIServiceConfigs",
                column: "Provider");

            migrationBuilder.CreateIndex(
                name: "IX_AIServiceConfigs_SortOrder",
                table: "AIServiceConfigs",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_AIServiceConfigs_UserId",
                table: "AIServiceConfigs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AIServiceConfigs_UserId_IsDefault",
                table: "AIServiceConfigs",
                columns: new[] { "UserId", "IsDefault" });

            migrationBuilder.CreateIndex(
                name: "IX_AIServiceConfigs_UserId_Name",
                table: "AIServiceConfigs",
                columns: new[] { "UserId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIServiceConfigs");
        }
    }
}
