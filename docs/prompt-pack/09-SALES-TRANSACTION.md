# 🧾 FAZ 2-C: Satış İşlemi (Ana Transaction)

> Önkoşul: `08-STOCK-MOVEMENT.md` fazı tamamlanmış olmalı.
> Bu modül sistemin en kritik parçasıdır.

---

```plaintext
Generate the Sales transaction module for the POS backend.

This is the most important module. Build it production-style with proper transaction handling.

═══════════════════════════════════════
SALES MODULE
═══════════════════════════════════════

DTOs:
- CreateSaleRequest { CustomerId?, PaymentType, DiscountTotal, Items[] }
- CreateSaleItemRequest { ProductId, Quantity, DiscountAmount }
- SaleResponseDto { Id, ReceiptNumber, SaleDate, SubTotal, TaxTotal, DiscountTotal, GrandTotal, PaymentType, PaymentTypeName, Status, StatusName, CashierName, CustomerName, Items[] }
- SaleItemResponseDto { ProductName, Barcode, Quantity, UnitPrice, TaxRate, DiscountAmount, LineTotal }
- SaleListDto { Id, ReceiptNumber, SaleDate, GrandTotal, PaymentTypeName, StatusName, CashierName, CustomerName }
- SaleListFilter { DateFrom?, DateTo?, PaymentType?, Status?, CustomerId?, Page, PageSize }

Validators:
- CreateSaleRequestValidator:
  - PaymentType must be valid enum
  - DiscountTotal >= 0
  - Items must have at least 1 item
  - Each item: ProductId > 0, Quantity > 0, DiscountAmount >= 0
  - If PaymentType = Veresiye, CustomerId is REQUIRED

Endpoints:
- POST /api/sales                          → Kasiyer+ (yeni satış oluştur)
- GET  /api/sales/{id}                     → Kasiyer+
- GET  /api/sales                          → Yonetici+ (paged, filtered)
- POST /api/sales/{id}/cancel              → Yonetici+ (satış iptal)
- POST /api/sales/{id}/return              → Yonetici+ (iade işlemi)
- GET  /api/sales/receipt/{receiptNumber}  → Kasiyer+ (fiş no ile arama)

═══════════════════════════════════════
POST /api/sales — CORE FLOW
═══════════════════════════════════════

Inside a DB transaction:

1. VALIDATE:
   - All products must exist and belong to current StoreId
   - All products must be active (IsActive = true)
   - Sufficient stock for each item (StockQuantity >= requested Quantity)
   - If Veresiye → CustomerId required and customer must exist

2. GENERATE ReceiptNumber:
   - Format: "FIS-{yyyyMMdd}-{dailySequence:0000}"
   - Example: "FIS-20250706-0042"
   - Must be unique

3. SNAPSHOT product data into SaleItem:
   - ProductName = current product name
   - Barcode = current barcode
   - UnitPrice = current SalePrice
   - CostPrice = current CostPrice
   - TaxRate = current TaxRate

4. CALCULATE per SaleItem:
   - LineTotal = (UnitPrice * Quantity) - DiscountAmount

5. CALCULATE Sale totals:
   - SubTotal = sum of (UnitPrice * Quantity) for all items
   - TaxTotal = sum of ((UnitPrice * Quantity - DiscountAmount) * TaxRate) for all items
   - DiscountTotal = request.DiscountTotal + sum of item discounts
   - GrandTotal = SubTotal - DiscountTotal + TaxTotal

6. INSERT Sale record

7. INSERT SaleItem records (one per item)

8. UPDATE Product.StockQuantity -= Quantity (for each item)

9. INSERT StockMovement per item:
   - Type = Satis
   - Quantity = -sold quantity
   - StockAfter = new stock level

10. IF PaymentType = Veresiye:
    - Customer.Balance += GrandTotal
    - INSERT CustomerTransaction:
      - Type = Borc
      - Amount = GrandTotal
      - BalanceAfter = new balance
      - SaleId = created sale id

11. COMMIT transaction

12. RETURN SaleResponseDto with receipt number and full details

═══════════════════════════════════════
CANCEL FLOW (POST /api/sales/{id}/cancel)
═══════════════════════════════════════

- Sale must be in Tamamlandi status
- Change status to Iptal
- Do NOT restore stock in cancel (v1 simplicity — use return for stock restore)
- If was Veresiye: do NOT adjust balance in cancel

═══════════════════════════════════════
RETURN FLOW (POST /api/sales/{id}/return)
═══════════════════════════════════════

Inside a DB transaction:

- Sale must be in Tamamlandi status
- Change status to Iade
- Restore stock for each item:
  - Product.StockQuantity += item.Quantity
  - Insert StockMovement with Type = Iade
- If was Veresiye:
  - Customer.Balance -= sale.GrandTotal
  - Insert CustomerTransaction with Type = Odeme (refund)

═══════════════════════════════════════

Output:
1. Application layer: DTOs, Validators, ISaleService
2. Infrastructure layer: SaleService implementation with transaction
3. API layer: SalesController
4. Receipt number generation strategy (helper/service)
5. Example JSON request and response for POST /api/sales
6. Example JSON for cancel and return
7. Transaction handling details and error scenarios
8. Build verification notes
```
