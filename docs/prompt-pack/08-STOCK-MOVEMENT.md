# 📊 FAZ 2-B: Stok Hareketi Takibi

> Önkoşul: `07-CUSTOMER-VERESIYE.md` fazı tamamlanmış olmalı.

---

```plaintext
Generate the Stock Movement module for the POS backend.

Create:
- StockMovement DTOs
- Service layer
- Controller
- Low stock reporting helper

═══════════════════════════════════════
STOCK MOVEMENT MODULE
═══════════════════════════════════════

DTOs:
- StockMovementDto { Id, ProductId, ProductName, ProductBarcode, UserId, UserFullName, Type, TypeName, Quantity, StockAfter, Note, CreatedAt }
- CreateStockMovementRequest { ProductId, Type, Quantity, Note? }
- StockMovementFilter { ProductId?, Type?, DateFrom?, DateTo?, Page, PageSize }
- LowStockProductDto { ProductId, Barcode, Name, CategoryName, StockQuantity, MinStockLevel, Difference }

Validators:
- CreateStockMovementRequestValidator:
  - ProductId required, > 0
  - Type must be valid (Giris, Cikis, Duzeltme — manual types only)
  - Quantity > 0
  - Note max 500

Endpoints:
- GET  /api/stock-movements                  → Yonetici+ (paged, filtered)
- GET  /api/stock-movements/product/{id}     → Yonetici+ (movements for specific product)
- POST /api/stock-movements                  → Yonetici+ (manual stock entry)
- GET  /api/products/low-stock               → Yonetici+ (already exists from product module, enhance if needed)

Supported movement types for MANUAL entry:
- Giris (1)  → increases stock
- Cikis (2)  → decreases stock
- Duzeltme (5) → sets stock to specific level (adjustment)

Auto-created by system (NOT via this endpoint):
- Satis (3)  → created by Sales module
- Iade (4)   → created by Sales return module

Rules:
- Manual stock movement must update Product.StockQuantity
- For Giris: StockQuantity += Quantity
- For Cikis: StockQuantity -= Quantity
  - Validate: resulting stock must not go below 0
- For Duzeltme: StockQuantity = Quantity (set absolute value)
  - Record the difference in the movement
- Every movement must record StockAfter (stock level after movement)
- Every movement records the UserId who performed it
- Use transaction for atomicity (update product + insert movement)
- Movement list supports filtering by:
  - productId
  - movement type
  - date range (DateFrom, DateTo)
  - pagination (page, pageSize)

Low stock helper:
- Query products where StockQuantity <= MinStockLevel AND IsActive = true
- Return sorted by difference ascending (most critical first)
- Include category name for grouping

Output:
1. Application layer: DTOs, Validators, IStockMovementService
2. Infrastructure layer: StockMovementService implementation
3. API layer: StockMovementsController
4. Low stock enhancement in ProductService if needed
5. Example request/response JSON
6. Build verification notes
```
