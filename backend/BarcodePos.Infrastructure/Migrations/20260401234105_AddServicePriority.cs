using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarcodePos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddServicePriority : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "ServiceRecords",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Priority",
                table: "ServiceRecords");
        }
    }
}
