# 🧱 FAZ 1-B: Domain Entities

> Önkoşul: `02-SOLUTION-ISKELETI.md` fazı tamamlanmış ve build başarılı olmalı.

---

```plaintext
Using the fixed POS decisions, generate the complete Domain layer.

Create:
- BaseEntity (Id, CreatedAt)
- AuditableEntity : BaseEntity (UpdatedAt nullable)
- Entities:
  - Store
  - User
  - Category
  - Product
  - Sale
  - SaleItem
  - Customer
  - CustomerTransaction
  - StockMovement
- Enums:
  - UserRole (Admin = 1, Yonetici = 2, Kasiyer = 3)
  - PaymentType (Nakit = 1, Kart = 2, Veresiye = 3)
  - SaleStatus (Tamamlandi = 1, Iptal = 2, Iade = 3)
  - MovementType (Giris = 1, Cikis = 2, Satis = 3, Iade = 4, Duzeltme = 5)
  - TransactionType (Borc = 1, Odeme = 2)
- Interfaces (in Domain/Interfaces):
  - IRepository<T>
  - IUnitOfWork
  - ICurrentUser

Important domain rules:
- All critical entities must include StoreId for future multi-store support
- Anonymous sale must be supported (CustomerId nullable in Sale)
- Credit sale must update Customer.Balance (app logic handles this)
- Product must include:
  - Barcode (string, unique per store)
  - Name
  - Description (nullable)
  - SalePrice (decimal)
  - CostPrice (decimal)
  - StockQuantity (int)
  - MinStockLevel (int)
  - TaxRate (decimal, e.g. 0.18 for %18)
  - IsActive (bool)
- SaleItem must snapshot product data at time of sale:
  - ProductName
  - Barcode
  - UnitPrice
  - CostPrice
  - TaxRate
- Sale must include:
  - ReceiptNumber (unique, auto-generated)
  - SubTotal, TaxTotal, DiscountTotal, GrandTotal
  - PaymentType, SaleStatus
- CustomerTransaction tracks:
  - Type (Borc = credit sale debt, Odeme = payment)
  - Amount
  - BalanceAfter
- StockMovement tracks:
  - Type (Giris, Cikis, Satis, Iade, Duzeltme)
  - Quantity (signed: + for in, - for out)
  - StockAfter
- User must support Admin / Yonetici / Kasiyer roles
- Keep entity design simple and EF Core friendly
- Include navigation properties with proper collection initializers

Output:
1. Entity list with brief purpose description
2. File-by-file code for the Domain project (full path, full file)
3. Notes about extensibility for future phases
```
