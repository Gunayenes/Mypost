# 🔐 FAZ 1-D: Authentication, JWT ve Kullanıcı Yönetimi

> Önkoşul: `04-DBCONTEXT-CONFIG-MIGRATION.md` fazı tamamlanmış ve migration başarılı olmalı.

---

```plaintext
Generate the authentication and authorization module for the POS backend.

Build:
- Login endpoint with JWT token generation
- Password hashing with BCrypt (using BCrypt.Net-Next)
- ICurrentUser service implementation
- Role-based authorization setup
- User CRUD endpoints (Admin only)

Roles:
- Admin (tam yetki)
- Yonetici (ürün, stok, rapor, müşteri)
- Kasiyer (sadece satış + müşteri arama)

JWT Configuration (appsettings.json):
{
  "JwtSettings": {
    "Secret": "BarcodePos-SuperSecret-Key-2025-Min32Chars!!",
    "Issuer": "BarcodePos",
    "Audience": "BarcodePosClients",
    "ExpirationInMinutes": 480
  }
}

Claims to include in token:
- UserId (int)
- Username (string)
- FullName (string)
- Role (string)
- StoreId (int)

ICurrentUser interface (Domain layer):
- int UserId
- string Username
- string Role
- int StoreId
- bool IsAdmin
- bool IsManagerOrAbove

CurrentUser implementation (Infrastructure or API layer):
- Read from HttpContext.User claims

Login rules:
- Reject inactive users (IsActive = false)
- Reject wrong password
- Return JWT token + user info on success

DTOs:
- LoginRequest { Username, Password }
- LoginResponse { Token, UserId, Username, FullName, Role, ExpiresAt }
- UserDto { Id, Username, FullName, Role, IsActive, CreatedAt }
- CreateUserRequest { Username, Password, FullName, Role }
- UpdateUserRequest { FullName }
- ChangePasswordRequest { CurrentPassword, NewPassword }

Validators (FluentValidation):
- LoginRequestValidator
- CreateUserRequestValidator (password min 6 chars, username required)
- UpdateUserRequestValidator

Endpoints:
- POST /api/auth/login              → Public
- POST /api/auth/change-password    → Authenticated
- GET  /api/users                   → Admin only
- GET  /api/users/{id}              → Admin only
- POST /api/users                   → Admin only
- PUT  /api/users/{id}              → Admin only
- PUT  /api/users/{id}/role         → Admin only
- PUT  /api/users/{id}/status       → Admin only (toggle IsActive)

Include:
- JWT service registration in DI
- [Authorize] and [Authorize(Roles = "Admin")] usage
- FluentValidation auto-registration
- Proper error responses for:
  - Invalid credentials
  - Inactive user
  - Duplicate username
  - Unauthorized access

Output:
1. Application layer: DTOs, Validators, Services (IAuthService, IUserService)
2. Infrastructure layer: AuthService, UserService implementations
3. API layer: AuthController, UsersController
4. DI registration updates
5. appsettings.json JWT section
6. Program.cs authentication/authorization setup
7. Example Swagger test flow
```
