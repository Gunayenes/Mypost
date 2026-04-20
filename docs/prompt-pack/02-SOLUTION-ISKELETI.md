# 🏗️ FAZ 1-A: Solution İskeleti

> Önkoşul: `01-MASTER-KURALLAR.md` içeriğini AI'a vermiş ol.

---

```plaintext
Using the system decisions above, generate the complete backend solution skeleton for Visual Studio 2022+.

I want:
1. Solution structure
2. Project references
3. Minimal compile-ready files
4. Dependency injection setup
5. appsettings structure
6. Program.cs
7. Global exception middleware
8. Basic Result/Error response model
9. Folder layout for:
   - BarcodePos.Domain
   - BarcodePos.Application
   - BarcodePos.Infrastructure
   - BarcodePos.API
   - BarcodePos.UnitTests
   - BarcodePos.IntegrationTests

Requirements:
- Target .NET 10
- Use Clean Architecture
- Show the exact folder tree first
- Then generate the file contents
- Include package/library recommendations with exact versions
- Include extension methods for service registration:
  - AddApplication() in Application project
  - AddInfrastructure(IConfiguration) in Infrastructure project
  - UsePresentation() or similar in API project
- Include Swagger/OpenAPI setup
- Include Serilog setup (console + file sink)
- Include health check endpoint: GET /health
- Include a sample secured endpoint for testing JWT later: GET /api/test/secure
- Include CORS configuration for frontend (http://localhost:5173)
- Include global exception handling middleware that returns:
  {
    "success": false,
    "message": "...",
    "errors": []
  }
- Include a generic Result<T> wrapper:
  {
    "success": true,
    "data": T,
    "message": null
  }
- Include PagedResult<T> for paginated endpoints

Return the output in this order:
1. Folder tree (complete)
2. Project reference map (which project references which)
3. NuGet packages per project
4. File-by-file code (with full path comment at top)
5. docker-compose.yml for SQL Server
6. Build and run notes
```
