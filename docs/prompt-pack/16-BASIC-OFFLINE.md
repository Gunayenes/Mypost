# 📴 FAZ 5: Temel Offline Destek

> Bu fazda sadece TEMEL offline altyapı kurulur. Tam senkronizasyon motoru YAPILMAZ.

---

```plaintext
Generate only a BASIC offline support module for the frontend POS app.

Do NOT build a full sync engine.
Do NOT implement conflict resolution.
Do NOT implement background sync workers.
Do NOT implement multi-store sync logic.

═══════════════════════════════════════
SCOPE — Only These Features
═══════════════════════════════════════

1. IndexedDB setup using Dexie.js
2. Product cache (for offline barcode lookup)
3. Category cache
4. Online/offline status detection
5. Pending sales queue structure (placeholder, not full processor)

═══════════════════════════════════════
FOLDER STRUCTURE
═══════════════════════════════════════

src/offline/
├── db.ts                 # Dexie database definition
├── productCache.ts       # Product cache helpers
├── categoryCache.ts      # Category cache helpers
├── pendingSaleQueue.ts   # Placeholder for offline sale queue
└── useOnlineStatus.ts    # Online/offline detection hook

═══════════════════════════════════════
DEXIE DATABASE SETUP (db.ts)
═══════════════════════════════════════

import Dexie, { Table } from 'dexie';

interface CachedProduct {
  id: number;
  barcode: string;
  name: string;
  salePrice: number;
  costPrice: number;
  taxRate: number;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  cachedAt: number;  // timestamp
}

interface CachedCategory {
  id: number;
  name: string;
  cachedAt: number;
}

interface PendingSale {
  id?: number;         // auto-increment
  saleData: object;    // CreateSaleRequest serialized
  createdAt: number;
  synced: boolean;
}

Database name: "BarcodePosDB"
Version: 1
Tables:
  - products: "id, barcode, categoryId, isActive"
  - categories: "id"
  - pendingSales: "++id, synced, createdAt"

═══════════════════════════════════════
PRODUCT CACHE HELPERS (productCache.ts)
═══════════════════════════════════════

Functions:
- cacheAllProducts(products: ProductDto[]) → clear and bulk insert
- getProductByBarcode(barcode: string) → query by barcode index
- getProductById(id: number) → query by id
- searchProducts(query: string) → filter by name or barcode contains
- getCacheTimestamp() → return oldest cachedAt or null
- clearProductCache() → delete all products
- getProductCount() → count cached products

═══════════════════════════════════════
CATEGORY CACHE HELPERS (categoryCache.ts)
═══════════════════════════════════════

Functions:
- cacheAllCategories(categories: CategoryDto[]) → clear and bulk insert
- getAllCategories() → return all cached
- clearCategoryCache()

═══════════════════════════════════════
PENDING SALE QUEUE (pendingSaleQueue.ts)
═══════════════════════════════════════

Placeholder functions (NOT a full processor):
- addPendingSale(saleData: CreateSaleRequest) → insert into queue
- getPendingSales() → return all unsynced
- markSynced(id: number) → update synced = true
- getPendingCount() → count unsynced
- clearSyncedSales() → delete synced records

Note: The actual sync processor that calls the API will be built in a future phase.

═══════════════════════════════════════
ONLINE STATUS HOOK (useOnlineStatus.ts)
═══════════════════════════════════════

function useOnlineStatus(): boolean
- Use navigator.onLine
- Listen to window "online" and "offline" events
- Return current status

═══════════════════════════════════════
USAGE IN POS SCREEN
═══════════════════════════════════════

When scanning barcode in POS:
  if (isOnline) {
    // Normal flow: call API
    product = await productService.getByBarcode(barcode);
  } else {
    // Offline fallback: search IndexedDB
    product = await getProductByBarcode(barcode);
    if (!product) {
      toast.error("Ürün bulunamadı (offline mod)");
    }
  }

Show indicator in POS header:
  - 🟢 Online
  - 🔴 Çevrimdışı

Cache refresh trigger:
  - On login success, cache all products and categories
  - Show "Veriler güncelleniyor..." toast during cache

═══════════════════════════════════════
npm PACKAGE
═══════════════════════════════════════

npm install dexie

Output:
1. offline/db.ts — Dexie database setup
2. offline/productCache.ts — product cache functions
3. offline/categoryCache.ts — category cache functions
4. offline/pendingSaleQueue.ts — placeholder queue
5. hooks/useOnlineStatus.ts — online detection hook
6. POS screen integration example
7. Cache refresh on login example
```
