# ⚛️ FAZ 2-D: Frontend İskelet Kurulumu

> Bu fazda React + TypeScript + Tailwind frontend iskeleti oluşturulur.

---

```plaintext
Generate the frontend project skeleton for the POS system using:
- React 18
- TypeScript (strict mode)
- Vite as build tool
- Tailwind CSS v3
- React Router v6+
- Zustand for state management
- Axios for HTTP client
- React Hot Toast for notifications
- Electron shell structure (placeholder only)

═══════════════════════════════════════
FOLDER STRUCTURE
═══════════════════════════════════════

src/frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── shared/          # Button, Input, Modal, Table, Loading, ErrorAlert
│   │   ├── pos/             # POS-specific components
│   │   └── admin/           # Admin-specific components
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── pos/
│   │   │   ├── PosPage.tsx
│   │   │   ├── PosHistoryPage.tsx
│   │   │   └── EndOfDayPage.tsx
│   │   └── admin/
│   │       ├── DashboardPage.tsx
│   │       ├── ProductListPage.tsx
│   │       ├── ProductFormPage.tsx
│   │       ├── CategoryListPage.tsx
│   │       ├── CustomerListPage.tsx
│   │       ├── CustomerDetailPage.tsx
│   │       ├── UserListPage.tsx
│   │       ├── SalesListPage.tsx
│   │       ├── ReportPage.tsx
│   │       └── StockMovementPage.tsx
│   ├── layouts/
│   │   ├── AuthLayout.tsx       # Centered card for login
│   │   ├── PosLayout.tsx        # Full-screen POS layout
│   │   └── AdminLayout.tsx      # Sidebar + header admin layout
│   ├── hooks/
│   │   ├── useBarcodeScanner.ts
│   │   └── useOnlineStatus.ts
│   ├── services/
│   │   ├── api.ts               # Axios instance with interceptor
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── categoryService.ts
│   │   ├── customerService.ts
│   │   ├── saleService.ts
│   │   ├── stockService.ts
│   │   ├── reportService.ts
│   │   └── userService.ts
│   ├── store/
│   │   ├── authStore.ts         # Zustand auth state
│   │   └── cartStore.ts         # Zustand cart state
│   ├── types/
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── category.ts
│   │   ├── customer.ts
│   │   ├── sale.ts
│   │   ├── stock.ts
│   │   ├── report.ts
│   │   └── common.ts            # ApiResult<T>, PagedResult<T>
│   ├── utils/
│   │   ├── formatters.ts        # Currency, date formatters
│   │   └── constants.ts
│   ├── offline/                  # Placeholder for Dexie.js (later phase)
│   ├── router.tsx               # Route definitions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                # Tailwind directives
├── electron/                     # Placeholder for Electron shell (later phase)
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── .env

═══════════════════════════════════════
CORE SETUP REQUIREMENTS
═══════════════════════════════════════

Axios instance (services/api.ts):
- Base URL from env: VITE_API_URL (default: http://localhost:5000/api)
- Request interceptor: add Authorization: Bearer {token} from localStorage
- Response interceptor: on 401 → clear auth store, redirect to /login
- Generic request helpers: get<T>, post<T>, put<T>, del<T>

Router setup:
- / → redirect to /pos or /admin based on role
- /login → LoginPage (public)
- /pos → PosLayout (Kasiyer+)
  - /pos → PosPage
  - /pos/history → PosHistoryPage
  - /pos/end-of-day → EndOfDayPage
- /admin → AdminLayout (Yonetici+)
  - /admin → DashboardPage
  - /admin/products → ProductListPage
  - /admin/products/new → ProductFormPage
  - /admin/products/:id/edit → ProductFormPage
  - /admin/categories → CategoryListPage
  - /admin/customers → CustomerListPage
  - /admin/customers/:id → CustomerDetailPage
  - /admin/users → UserListPage (Admin only)
  - /admin/sales → SalesListPage
  - /admin/reports → ReportPage
  - /admin/stock → StockMovementPage

Route guards:
- PrivateRoute: check if authenticated
- RoleRoute: check if user role matches required role
- Redirect unauthenticated users to /login
- Redirect unauthorized role to appropriate default page

Shared components to scaffold:
- Button (primary, secondary, danger, ghost variants + size)
- Input (label, error message support)
- Modal (overlay, title, close button, children)
- DataTable (headers, rows, loading state)
- LoadingSpinner
- ErrorAlert
- ConfirmDialog
- PageHeader (title + optional action buttons)
- Pagination

Type definitions (types/common.ts):
- ApiResult<T> { success: boolean, data: T, message: string | null }
- PagedResult<T> { items: T[], totalCount: number, page: number, pageSize: number, totalPages: number }

Environment variables (.env):
- VITE_API_URL=http://localhost:5000/api

Output:
1. Full folder tree
2. package.json with all dependencies
3. Vite, Tailwind, PostCSS, TypeScript config files
4. Core files: main.tsx, App.tsx, router.tsx, index.css
5. Axios setup with interceptors
6. Type definitions
7. Layout components (Auth, POS, Admin)
8. Shared components (at least Button, Input, Modal, DataTable, LoadingSpinner)
9. Route guard components
10. Store skeletons (authStore, cartStore)
11. npm install and dev run commands
```
