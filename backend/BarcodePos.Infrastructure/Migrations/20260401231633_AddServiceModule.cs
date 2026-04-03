using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarcodePos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    StoreId = table.Column<int>(type: "INTEGER", nullable: false),
                    CustomerId = table.Column<int>(type: "INTEGER", nullable: false),
                    AssignedUserId = table.Column<int>(type: "INTEGER", nullable: true),
                    ReceivedByUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ServiceNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DeviceName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    DeviceBrand = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    DeviceModel = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    DeviceSerial = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    DeviceAccessories = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    DeviceCondition = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    FaultDescription = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    CustomerNote = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    EstimatedCompletionDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DeliveredDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LaborCost = table.Column<decimal>(type: "TEXT", nullable: false),
                    PartsCost = table.Column<decimal>(type: "TEXT", nullable: false),
                    TotalCost = table.Column<decimal>(type: "TEXT", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    PaymentStatus = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceRecords_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServiceRecords_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServiceRecords_Users_AssignedUserId",
                        column: x => x.AssignedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServiceRecords_Users_ReceivedByUserId",
                        column: x => x.ReceivedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ServiceLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceRecordId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    OldStatus = table.Column<int>(type: "INTEGER", nullable: true),
                    NewStatus = table.Column<int>(type: "INTEGER", nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    IsInternal = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceLogs_ServiceRecords_ServiceRecordId",
                        column: x => x.ServiceRecordId,
                        principalTable: "ServiceRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServiceLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ServiceParts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceRecordId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductId = table.Column<int>(type: "INTEGER", nullable: true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    PartName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    UnitCost = table.Column<decimal>(type: "TEXT", nullable: false),
                    TotalCost = table.Column<decimal>(type: "TEXT", nullable: false),
                    DeductedFromStock = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceParts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceParts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServiceParts_ServiceRecords_ServiceRecordId",
                        column: x => x.ServiceRecordId,
                        principalTable: "ServiceRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServiceParts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLogs_ServiceRecordId",
                table: "ServiceLogs",
                column: "ServiceRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLogs_UserId",
                table: "ServiceLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceParts_ProductId",
                table: "ServiceParts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceParts_ServiceRecordId",
                table: "ServiceParts",
                column: "ServiceRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceParts_UserId",
                table: "ServiceParts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRecords_AssignedUserId",
                table: "ServiceRecords",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRecords_CustomerId",
                table: "ServiceRecords",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRecords_ReceivedByUserId",
                table: "ServiceRecords",
                column: "ReceivedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRecords_ServiceNumber",
                table: "ServiceRecords",
                column: "ServiceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRecords_StoreId_CustomerId",
                table: "ServiceRecords",
                columns: new[] { "StoreId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRecords_StoreId_Status",
                table: "ServiceRecords",
                columns: new[] { "StoreId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceLogs");

            migrationBuilder.DropTable(
                name: "ServiceParts");

            migrationBuilder.DropTable(
                name: "ServiceRecords");
        }
    }
}
