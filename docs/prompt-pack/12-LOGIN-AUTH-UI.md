# 🔑 FAZ 2-E: Login Sayfası ve Auth UI

> Önkoşul: `11-FRONTEND-ISKELET.md` fazı tamamlanmış ve `npm run dev` çalışıyor olmalı.

---

```plaintext
Generate the authentication UI for the POS frontend.

═══════════════════════════════════════
AUTH STORE (Zustand)
═══════════════════════════════════════

store/authStore.ts:
- State:
  - token: string | null
  - user: { userId, username, fullName, role, storeId } | null
  - isAuthenticated: boolean (computed from token)
- Actions:
  - login(username, password) → call API, store token + user, persist to localStorage
  - logout() → clear token + user, remove from localStorage, redirect to /login
  - loadFromStorage() → check localStorage on app startup, restore session
- Token persistence: localStorage key "pos_token"
- User info persistence: localStorage key "pos_user"

═══════════════════════════════════════
LOGIN PAGE
═══════════════════════════════════════

pages/LoginPage.tsx:
- Centered card layout (AuthLayout)
- App logo/title: "BARCODE POS"
- Form fields:
  - Kullanıcı Adı (username input, autofocus)
  - Şifre (password input)
  - Giriş Yap button (primary, full width)
- Behavior:
  - Submit on Enter key
  - Show loading state on button during API call
  - Show error message below form on failure
  - On success:
    - Kasiyer → redirect to /pos
    - Yonetici → redirect to /admin
    - Admin → redirect to /admin
- Validation:
  - Both fields required
  - Show inline errors

═══════════════════════════════════════
AXIOS INTERCEPTOR
═══════════════════════════════════════

services/api.ts:
- Request interceptor:
  - Read token from authStore or localStorage
  - Add header: Authorization: Bearer {token}
- Response interceptor:
  - On 401 response:
    - Call authStore.logout()
    - Show toast: "Oturum süresi doldu, lütfen tekrar giriş yapın"

═══════════════════════════════════════
ROUTE GUARDS
═══════════════════════════════════════

PrivateRoute component:
- If not authenticated → redirect to /login
- If authenticated → render children

RoleRoute component:
- Accepts: allowedRoles: string[]
- If user role not in allowedRoles → redirect to default page for their role
- If authorized → render children

App.tsx startup:
- Call authStore.loadFromStorage() on mount
- Show loading screen while checking auth state

═══════════════════════════════════════
LOGOUT FLOW
═══════════════════════════════════════

- Logout button in POS and Admin layouts
- Clear all auth state
- Redirect to /login
- Show toast: "Çıkış yapıldı"

═══════════════════════════════════════
STYLING
═══════════════════════════════════════

- Desktop-first design
- Login card: max-w-md, centered both axes, shadow-lg, rounded-xl
- Dark header bar with app name
- Professional color scheme:
  - Primary: blue-600
  - Background: gray-50
  - Card: white
- Keyboard-friendly: Tab order, Enter submit

Output:
1. Auth store (store/authStore.ts)
2. Auth service (services/authService.ts)
3. Login page (pages/LoginPage.tsx)
4. Auth layout (layouts/AuthLayout.tsx)
5. Route guard components (PrivateRoute, RoleRoute)
6. Updated router.tsx
7. Updated App.tsx with auth initialization
8. Updated api.ts with interceptors
```
