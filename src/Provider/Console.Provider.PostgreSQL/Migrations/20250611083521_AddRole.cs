using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Console.Provider.PostgreSQL.Migrations
{
    /// <inheritdoc />
    public partial class AddRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPasswordChangeTime",
                table: "Users",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastPasswordChangeTime",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }
    }
}
