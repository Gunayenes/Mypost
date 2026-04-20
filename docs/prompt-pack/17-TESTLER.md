# 🧪 FAZ 6-A: Testler

> Önkoşul: Backend modülleri ve frontend tamamlanmış olmalı.

---

```plaintext
Generate the testing skeleton and core tests for the POS backend.

═══════════════════════════════════════
TEST PROJECTS
═══════════════════════════════════════

1. BarcodePos.UnitTests
   - Target: .NET 10
   - Packages: xUnit, FluentAssertions, NSubstitute (or Moq)
   - Test naming: MethodName_Scenario_ExpectedResult

2. BarcodePos.IntegrationTests
   - Target: .NET 10
   - Packages: xUnit, FluentAssertions, Microsoft.AspNetCore.Mvc.Testing, Testcontainers, Testcontainers.MsSql
   - Uses real SQL Server via Testcontainers
   - Custom WebApplicationFactory

═══════════════════════════════════════
UNIT TESTS (BarcodePos.UnitTests)
═══════════════════════════════════════

Test categories to create:

1. SaleCalculationTests:
   - Calculate_SubTotal_ShouldSumUnitPriceTimesQuantity
   - Calculate_TaxTotal_ShouldApplyTaxRatePerItem
   - Calculate_GrandTotal_ShouldBeSubTotalMinusDiscountPlusTax
   - Calculate_LineTotal_ShouldBeUnitPriceTimesQuantityMinusDiscount
   - Calculate_WithZeroDiscount_ShouldMatchSubTotalPlusTax
   - Calculate_WithMultipleItems_ShouldSumCorrectly

2. SaleValidationTests:
   - CreateSale_WithEmptyItems_ShouldFail
   - CreateSale_WithCreditPayment_WithoutCustomer_ShouldFail
   - CreateSale_WithCreditPayment_WithCustomer_ShouldPass
   - CreateSale_WithInvalidProductId_ShouldFail
   - CreateSale_WithInsufficientStock_ShouldFail

3. ProductServiceTests:
   - GetByBarcode_ExistingBarcode_ShouldReturnProduct
   - GetByBarcode_NonExistingBarcode_ShouldReturnNull
   - GetByBarcode_InactiveProduct_ShouldReturnNull
   - GetByBarcode_DifferentStore_ShouldReturnNull
   - Create_DuplicateBarcode_ShouldThrowError

4. CustomerBalanceTests:
   - Payment_ShouldDecreaseBalance
   - Payment_ExceedingBalance_ShouldFail
   - CreditSale_ShouldIncreaseBalance
   - Return_CreditSale_ShouldDecreaseBalance

5. StockMovementTests:
   - StockIn_ShouldIncreaseQuantity
   - StockOut_ShouldDecreaseQuantity
   - StockOut_BelowZero_ShouldFail
   - Adjustment_ShouldSetAbsoluteQuantity
   - Sale_ShouldCreateMovementRecord

6. ReceiptNumberTests:
   - Generate_ShouldFollowFormat
   - Generate_ShouldIncrement_ForSameDay
   - Generate_ShouldResetSequence_ForNewDay

═══════════════════════════════════════
INTEGRATION TESTS (BarcodePos.IntegrationTests)
═══════════════════════════════════════

Infrastructure setup:

CustomWebApplicationFactory:
- Use Testcontainers to spin up SQL Server
- Replace connection string
- Run migrations
- Seed test data
- Provide HttpClient helper

Base test class:
- IntegrationTestBase : IClassFixture<CustomWebApplicationFactory>
- Helper methods:
  - AuthenticateAsAdmin() → login and get token
  - AuthenticateAsManager()
  - AuthenticateAsCashier()
  - GetAuthenticatedClient(role) → HttpClient with Bearer token

Test categories:

1. AuthTests:
   - Login_ValidCredentials_ShouldReturnToken
   - Login_InvalidPassword_ShouldReturn401
   - Login_InactiveUser_ShouldReturn401
   - SecureEndpoint_WithoutToken_ShouldReturn401
   - SecureEndpoint_WithToken_ShouldReturn200
   - AdminEndpoint_AsCashier_ShouldReturn403

2. ProductCrudTests:
   - CreateProduct_ValidData_ShouldReturn201
   - CreateProduct_DuplicateBarcode_ShouldReturn400
   - GetByBarcode_ShouldReturnCorrectProduct
   - UpdateProduct_ShouldPersistChanges
   - DeleteProduct_ShouldSoftDelete

3. SaleTests:
   - CreateSale_CashPayment_ShouldSucceed
   - CreateSale_CreditPayment_ShouldUpdateCustomerBalance
   - CreateSale_ShouldDecreaseStock
   - CreateSale_ShouldCreateStockMovements
   - CreateSale_InsufficientStock_ShouldReturn400
   - CancelSale_ShouldChangeStatus
   - ReturnSale_ShouldRestoreStock

4. CustomerPaymentTests:
   - MakePayment_ShouldDecreaseBalance
   - MakePayment_ShouldCreateTransaction
   - MakePayment_ExceedingBalance_ShouldReturn400

═══════════════════════════════════════
TEST DATA SEEDING
═══════════════════════════════════════

For integration tests, seed:
- Store (Id=1)
- Admin user
- Manager user
- Cashier user
- 2-3 Categories
- 5-10 Products with various stock levels
- 2-3 Customers with varying balances

═══════════════════════════════════════

Output:
1. Unit test project structure and .csproj
2. Integration test project structure and .csproj
3. CustomWebApplicationFactory
4. IntegrationTestBase
5. All unit test classes
6. All integration test classes
7. Test data seeding helpers
8. Commands to run tests:
   dotnet test src/backend/tests/BarcodePos.UnitTests
   dotnet test src/backend/tests/BarcodePos.IntegrationTests
```
