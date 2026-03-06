# 👥 FAZ 2-A: Müşteri Yönetimi ve Veresiye Sistemi

> Önkoşul: `06-PRODUCT-CATEGORY-CRUD.md` fazı tamamlanmış olmalı.

---

```plaintext
Generate the Customer and Credit Account module for the POS backend.

Build:
- Customer CRUD
- Customer search (for POS cashier screen)
- Balance summary
- Customer transaction history
- Manual payment collection endpoint

═══════════════════════════════════════
CUSTOMER MODULE
═══════════════════════════════════════

DTOs:
- CustomerDto { Id, FullName, Phone, Email, Address, Balance, IsActive, CreatedAt }
- CreateCustomerRequest { FullName, Phone?, Email?, Address? }
- UpdateCustomerRequest { FullName, Phone?, Email?, Address? }
- CustomerBalanceDto { CustomerId, FullName, Balance, TotalDebt, TotalPayment }
- CustomerTransactionDto { Id, SaleId?, Type, TypeName, Amount, BalanceAfter, Note, CreatedAt }
- CustomerPaymentRequest { Amount, Note? }
- CustomerSearchResult { Id, FullName, Phone, Balance }

Validators:
- CreateCustomerRequestValidator:
  - FullName required, max 200
  - Phone max 20 (if provided)
  - Email valid format (if provided)
- CustomerPaymentRequestValidator:
  - Amount > 0

Endpoints:
- GET    /api/customers                       → Kasiyer+ (list, paged)
- GET    /api/customers/{id}                  → Kasiyer+
- POST   /api/customers                       → Yonetici+
- PUT    /api/customers/{id}                  → Yonetici+
- GET    /api/customers/{id}/balance          → Kasiyer+ (balance summary)
- GET    /api/customers/{id}/transactions     → Yonetici+ (transaction history, paged)
- GET    /api/customers/search?q={query}      → Kasiyer+ (POS müşteri arama)
- POST   /api/customers/{id}/payment          → Yonetici+ (veresiye tahsilat)

Rules:
- All queries filter by current user's StoreId
- Search should match FullName OR Phone (contains, case-insensitive)
- Customer.Balance > 0 means customer owes money (borçlu)
- Manual payment flow:
  1. Validate payment Amount > 0
  2. Validate Amount <= Customer.Balance (cannot overpay in v1)
  3. Decrease Customer.Balance by Amount
  4. Create CustomerTransaction:
     - Type = Odeme
     - Amount = payment amount
     - BalanceAfter = new balance
     - Note = optional note
- Balance summary should show:
  - Current balance
  - Total debt amount (sum of Borc transactions)
  - Total payment amount (sum of Odeme transactions)
- Anonymous sale is allowed (no customer required) — this module just manages named customers

Note: Credit sale transactions (Borc type) will be created by the Sales module in a later phase.

Output:
1. Application layer: DTOs, Validators, ICustomerService
2. Infrastructure layer: CustomerService implementation
3. API layer: CustomersController
4. Example request/response JSON for each endpoint
5. Build verification notes
```
