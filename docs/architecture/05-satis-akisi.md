# 🛒 POS Satış Ekranı Akış Mantığı

## Ana Satış Akışı

```mermaid
sequenceDiagram
    participant BO as 🔫 Barkod Okuyucu
    participant UI as React Frontend
    participant LC as Local Cache
    participant API as .NET API
    participant DB as SQL Server

    Note over BO,UI: USB okuyucu klavye gibi çalışır

    BO->>UI: Barkod stringi + Enter tuşu
    UI->>UI: useBarcodeScanner hook event yakalama

    alt Online Mod
        UI->>API: GET /api/products/barcode/{barcode}
        API->>DB: SELECT * FROM Products WHERE Barcode = @barcode AND StoreId = @storeId
        DB-->>API: Product entity
        API-->>UI: ProductDto (JSON)
    else Offline Mod
        UI->>LC: IndexedDB'den ürün ara
        LC-->>UI: Cached product data
    end

    UI->>UI: Ürünü sepete ekle (Zustand state güncelle)
    UI->>UI: Adet artır / fiyat hesapla

    Note over UI: Kasiyer "Ödeme" butonuna basar

    UI->>UI: Ödeme tipi seç (Nakit / Kart / Veresiye)

    alt Veresiye seçildi
        UI->>UI: Müşteri seçim ekranı göster
        UI->>API: GET /api/customers/search?q={query}
        API-->>UI: Müşteri listesi
        UI->>UI: Müşteri seç
    end

    UI->>API: POST /api/sales (sepet + ödeme bilgisi)

    Note over API,DB: Transaction başlatılır

    API->>DB: INSERT INTO Sales (...)
    API->>DB: INSERT INTO SaleItems (... her ürün için)
    API->>DB: UPDATE Products SET StockQuantity -= @qty (her ürün için)
    API->>DB: INSERT INTO StockMovements (Satış tipi, her ürün için)

    alt Veresiye ise
        API->>DB: UPDATE Customers SET Balance += @total
        API->>DB: INSERT INTO CustomerTransactions (Borç tipi)
    end

    Note over API,DB: Transaction commit

    API-->>UI: SaleResponse (fiş no, toplam, detaylar)
    UI->>UI: Fiş göster / yazdır
    UI->>UI: Sepeti temizle, yeni satışa hazırla
```

---

## Barkod Okuyucu Hook'u (useBarcodeScanner)

USB barkod okuyucu klavye gibi davranır — karakterleri çok hızlı art arda basar ve sonunda Enter gönderir.

### Ayrıştırma Mantığı

```
Normal klavye: tuşlar arası > 100ms
Barkod okuyucu: tuşlar arası < 30ms

Filtre: maxDelay = 50ms
→ 50ms içinde peş peşe gelen karakterler = barkod
→ Enter gelince → onScan tetiklenir
```

### Hook Kodu

```typescript
import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeOptions {
  onScan: (barcode: string) => void;
  minLength?: number;    // Minimum barkod uzunluğu
  maxDelay?: number;     // Tuşlar arası max süre (ms)
}

export function useBarcodeScanner({
  onScan,
  minLength = 4,
  maxDelay = 50
}: UseBarcodeOptions) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const now = Date.now();

    // Tuşlar arası süre çok uzunsa → manuel klavye, buffer sıfırla
    if (now - lastKeyTimeRef.current > maxDelay) {
      bufferRef.current = '';
    }
    lastKeyTimeRef.current = now;

    if (e.key === 'Enter') {
      const barcode = bufferRef.current.trim();
      if (barcode.length >= minLength) {
        e.preventDefault();
        onScan(barcode);
      }
      bufferRef.current = '';
      return;
    }

    // Sadece yazdırılabilir karakterleri buffer'a ekle
    if (e.key.length === 1) {
      bufferRef.current += e.key;
    }
  }, [onScan, minLength, maxDelay]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

---

## Satış Ekranı UI Düzeni

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  BARCODE POS          Kasiyer: Ahmet    [Çıkış]    │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│  🔍 Barkod / Ürün Ara...        │    SEPET                 │
│  ─────────────────────────       │    ──────────────────    │
│                                  │                          │
│  Son eklenen:                    │    1. Coca Cola 1L       │
│  ┌─────────────────────────┐     │       2 x ₺15.00 = ₺30  │
│  │  Coca Cola 1L           │     │                          │
│  │  Barkod: 869000001      │     │    2. Ülker Çikolata     │
│  │  Fiyat: ₺15.00          │     │       1 x ₺15.50 = ₺16  │
│  │  Stok: 45               │     │                          │
│  └─────────────────────────┘     │    ──────────────────    │
│                                  │    Ara Toplam:  ₺45.50   │
│                                  │    KDV:         ₺8.19    │
│                                  │    İndirim:    -₺1.50    │
│                                  │    ──────────────────    │
│                                  │    TOPLAM:     ₺52.19    │
│                                  │                          │
│                                  │    [NAKİT]  [KART]      │
│                                  │    [VERESİYE]            │
│                                  │                          │
│                                  │    [🗑️ Sepeti Temizle]   │
├──────────────────────────────────┴──────────────────────────┤
│  F1:Ürün Ara  F2:Müşteri  F3:Son Satışlar  F4:Gün Sonu    │
└─────────────────────────────────────────────────────────────┘
```

---

## Sepet State Yönetimi (Zustand)

```typescript
interface CartItem {
  productId: number;
  barcode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
}

interface CartState {
  items: CartItem[];
  customerId: number | null;
  paymentType: PaymentType | null;

  // Actions
  addItem: (product: ProductDto) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDiscount: (productId: number, discount: number) => void;
  setCustomer: (customerId: number | null) => void;
  setPaymentType: (type: PaymentType) => void;
  clearCart: () => void;

  // Computed
  subTotal: () => number;
  taxTotal: () => number;
  discountTotal: () => number;
  grandTotal: () => number;
}
```

---

## Klavye Kısayolları

| Kısayol | İşlem |
|---------|-------|
| **Barkod + Enter** | Ürün ekle |
| **F1** | Manuel ürün arama |
| **F2** | Müşteri seçimi |
| **F3** | Son satışları göster |
| **F4** | Gün sonu raporu |
| **F8** | Nakit ödeme |
| **F9** | Kart ödeme |
| **F10** | Veresiye ödeme |
| **Esc** | Sepeti temizle (onay ile) |
| **Delete** | Seçili ürünü sil |
| **+/-** | Adet artır/azalt |
