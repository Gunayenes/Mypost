# 📦 FAZ 1-E: Ürün ve Kategori CRUD

> Önkoşul: `05-AUTH-JWT-KULLANICI.md` fazı tamamlanmış ve login çalışıyor olmalı.

---

```plaintext
Generate Product and Category modules for the POS backend.

Build:
- DTOs
- FluentValidation validators
- Service interfaces (Application layer) + implementations (Infrastructure layer)
- Controllers (API layer)
- Pagination support with PagedResult<T>
- Filtering and search support

═══════════════════════════════════════
CATEGORY MODULE
═══════════════════════════════════════

DTOs:
- CategoryDto { Id, Name, Description, IsActive, ProductCount }
- CreateCategoryRequest { Name, Description }
- UpdateCategoryRequest { Name, Description }

Endpoints:
- GET    /api/categories              → Yonetici+ (list all for current store)
- GET    /api/categories/{id}         → Yonetici+
- POST   /api/categories              → Yonetici+
- PUT    /api/categories/{id}         → Yonetici+
- DELETE /api/categories/{id}         → Admin only (soft delete: IsActive=false)

Rules:
- All queries filter by current user's StoreId
- Category name must be unique within same store
- Cannot delete category that has active products (return error)

═══════════════════════════════════════
PRODUCT MODULE
═══════════════════════════════════════

DTOs:
- ProductDto { Id, CategoryId, CategoryName, Barcode, Name, Description, CostPrice, SalePrice, TaxRate, StockQuantity, MinStockLevel, IsActive, CreatedAt, UpdatedAt }
- CreateProductRequest { CategoryId, Barcode, Name, Description?, CostPrice, SalePrice, TaxRate, StockQuantity, MinStockLevel }
- UpdateProductRequest { CategoryId, Barcode, Name, Description?, CostPrice, SalePrice, TaxRate, MinStockLevel }
- ProductListFilter { Search?, CategoryId?, LowStockOnly?, IsActive?, Page, PageSize }

Validators:
- CreateProductRequestValidator:
  - Barcode required, max 50
  - Name required, max 200
  - SalePrice > 0
  - CostPrice >= 0
  - TaxRate between 0 and 1
  - StockQuantity >= 0
  - MinStockLevel >= 0
- UpdateProductRequestValidator: same rules minus StockQuantity

Endpoints:
- GET    /api/products                     → Yonetici+ (paged, filtered)
- GET    /api/products/{id}                → Yonetici+
- GET    /api/products/barcode/{barcode}   → Kasiyer+ (POS ana sorgu)
- GET    /api/products/search?q={query}    → Kasiyer+ (isim/barkod arama)
- GET    /api/products/low-stock           → Yonetici+ (MinStockLevel altındakiler)
- POST   /api/products                     → Yonetici+
- PUT    /api/products/{id}                → Yonetici+
- DELETE /api/products/{id}                → Admin only (soft delete)

Rules:
- All queries filter by current user's StoreId
- Barcode must be unique per store
- Barcode lookup (GET /barcode/{barcode}) must be fast — use indexed query
- Only active products should appear in POS barcode lookup
- Product search should match Name OR Barcode (contains)
- Low stock: StockQuantity <= MinStockLevel AND IsActive = true
- StockQuantity is NOT updated via product CRUD — only via stock movements and sales

Output:
1. Application layer: DTOs, Validators, ICategoryService, IProductService
2. Infrastructure layer: CategoryService, ProductService implementations
3. API layer: CategoriesController, ProductsController
4. Mapping configuration (Mapster)
5. Example request/response JSON for each endpoint
6. Build verification notes
```
