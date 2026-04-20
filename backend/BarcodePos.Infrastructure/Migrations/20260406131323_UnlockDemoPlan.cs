using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarcodePos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UnlockDemoPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SubscriptionPlans",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "HasBackup", "HasReports", "HasSupport", "MaxProducts", "MaxUsers" },
                values: new object[] { true, true, true, 2147483647, 2147483647 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SubscriptionPlans",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "HasBackup", "HasReports", "HasSupport", "MaxProducts", "MaxUsers" },
                values: new object[] { false, false, false, 50, 1 });
        }
    }
}
