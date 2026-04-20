# 💾 FAZ 1-C: DbContext, Configuration ve Migration

> Önkoşul: `03-DOMAIN-ENTITIES.md` fazı tamamlanmış ve build başarılı olmalı.

---

```plaintext
Generate the Infrastructure data layer for the POS system.

I want:
- AppDbContext inheriting DbContext
- IEntityTypeConfiguration<T> classes for ALL entities (one file per entity)
- Generic Repository implementation
- UnitOfWork implementation
- Proper DI registration

Configuration rules per entity:

Store:
  - Table: "Stores"
  - Name: required, max 200

User:
  - Table: "Users"
  - Username: required, max 50, unique index
  - PasswordHash: required
  - FullName: required, max 100
  - Composite index on (StoreId, Username)

Category:
  - Table: "Categories"
  - Name: required, max 100
  - Index on StoreId

Product:
  - Table: "Products"
  - Barcode: required, max 50
  - Name: required, max 200
  - CostPrice: decimal(18,2)
  - SalePrice: decimal(18,2)
  - TaxRate: decimal(5,2)
  - UNIQUE composite index on (StoreId, Barcode)
  - Index on CategoryId

Sale:
  - Table: "Sales"
  - ReceiptNumber: required, max 50, unique index
  - SubTotal, TaxTotal, DiscountTotal, GrandTotal: all decimal(18,2)
  - Index on (StoreId, SaleDate)
  - CustomerId: optional FK

SaleItem:
  - Table: "SaleItems"
  - ProductName: required, max 200
  - Barcode: max 50
  - UnitPrice, CostPrice: decimal(18,2)
  - TaxRate: decimal(5,2)
  - DiscountAmount, LineTotal: decimal(18,2)

Customer:
  - Table: "Customers"
  - FullName: required, max 200
  - Phone: max 20
  - Balance: decimal(18,2), default 0

CustomerTransaction:
  - Table: "CustomerTransactions"
  - Amount, BalanceAfter: decimal(18,2)

StockMovement:
  - Table: "StockMovements"
  - Index on (ProductId, CreatedAt)

Seed data:
  - Default Store: Id=1, Name="Ana Mağaza"
  - Default Admin: Id=1, StoreId=1, Username="admin", PasswordHash=BCrypt("Admin123!"), FullName="Sistem Yöneticisi", Role=Admin

Migration ready:
  - Use HasData() for seeding
  - Include migration creation commands

Output:
1. Infrastructure/Persistence folder tree
2. AppDbContext with all DbSet properties
3. Each entity configuration file
4. Repository and UnitOfWork implementations
5. DI registration extension method (AddInfrastructure)
6. Seed data configuration
7. CLI commands for creating and applying migration:
   dotnet ef migrations add InitialCreate --project src/BarcodePos.Infrastructure --startup-project src/BarcodePos.API
   dotnet ef database update --project src/BarcodePos.Infrastructure --startup-project src/BarcodePos.API
```
