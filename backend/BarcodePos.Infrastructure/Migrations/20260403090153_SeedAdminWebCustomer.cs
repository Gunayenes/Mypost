using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarcodePos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedAdminWebCustomer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "WebCustomers",
                columns: new[] { "Id", "BusinessName", "CreatedAt", "Email", "EmailConfirmExpiry", "EmailConfirmToken", "EmailConfirmed", "FirstName", "IsActive", "LastName", "PasswordHash", "PasswordResetExpiry", "PasswordResetToken", "Phone", "StoreId", "UpdatedAt" },
                values: new object[] { 1, "Ana Mağaza", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin", null, null, true, "Sistem", true, "Yöneticisi", "$2a$11$GBrDulOzslTYDkE9UmrYg.eyFLfqWXNkYE4g9Qn7HMxnFyDy198AK", null, null, null, 1, null });

            migrationBuilder.InsertData(
                table: "Subscriptions",
                columns: new[] { "Id", "CreatedAt", "ExpiresAt", "IsActive", "PlanId", "StartsAt", "WebCustomerId" },
                values: new object[] { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2099, 12, 31, 0, 0, 0, 0, DateTimeKind.Utc), true, 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Subscriptions",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "WebCustomers",
                keyColumn: "Id",
                keyValue: 1);
        }
    }
}
