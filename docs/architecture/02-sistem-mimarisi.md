# 🏗️ Sistem Mimarisi

## Genel Mimari Diyagramı

```mermaid
graph TB
    subgraph "POS Terminal - Electron + React"
        BC[🔫 USB Barkod Okuyucu]
        UI[React Frontend<br/>TypeScript + Tailwind]
        LDB[(IndexedDB<br/>Offline Cache)]
        BC -->|Klavye Input| UI
        UI <-->|Offline mod| LDB
    end

    subgraph "Backend Server"
        API[ASP.NET Core Web API<br/>.NET 10]
        AUTH[JWT Authentication]
        API --- AUTH
    end

    subgraph "Data Layer"
        DB[(SQL Server<br/>Ana Veritabanı)]
    end

    UI <-->|REST API / HTTPS| API
    API <-->|EF Core| DB

    style BC fill:#f59e0b,color:#000
    style UI fill:#3b82f6,color:#fff
    style API fill:#8b5cf6,color:#fff
    style DB fill:#10b981,color:#fff
    style LDB fill:#6b7280,color:#fff
```

---

## Katmanlı Mimari (Clean Architecture)

```mermaid
graph LR
    subgraph "API Layer"
        C[Controllers]
        MW[Middleware<br/>Auth - Error - Logging]
    end

    subgraph "Application Layer"
        S[Services / Handlers]
        DTO[DTOs]
        V[Validators - FluentValidation]
        MAP[Mapping - Mapster]
    end

    subgraph "Domain Layer"
        E[Entities]
        I[Interfaces]
        EN[Enums]
    end

    subgraph "Infrastructure Layer"
        R[Repositories]
        EF[EF Core DbContext]
        EXT[External Services]
    end

    C --> S
    S --> I
    I -.->|implemented by| R
    R --> EF

    style C fill:#ef4444,color:#fff
    style S fill:#f59e0b,color:#000
    style E fill:#3b82f6,color:#fff
    style R fill:#10b981,color:#fff
```

### Bağımlılık Kuralı

```
API → Application → Domain ← Infrastructure
```

- **Domain** hiçbir katmana bağımlı değildir (saf entity ve interface)
- **Application** sadece Domain'e bağımlıdır
- **Infrastructure** Domain interface'lerini implement eder
- **API** her şeyi DI ile birleştirir

---

## Proje Klasör Yapısı

```
/barcode-pos-system
│
├── /src
│   ├── /backend
│   │   ├── BarcodePos.sln
│   │   ├── /src
│   │   │   ├── /BarcodePos.Domain            # Entity + Interface
│   │   │   ├── /BarcodePos.Application        # Services, DTOs, Validators
│   │   │   ├── /BarcodePos.Infrastructure     # EF Core, Repositories
│   │   │   └── /BarcodePos.API                # Controllers, Middleware
│   │   └── /tests
│   │       ├── /BarcodePos.UnitTests
│   │       └── /BarcodePos.IntegrationTests
│   │
│   └── /frontend
│       ├── package.json
│       ├── /public
│       ├── /src
│       │   ├── /components
│       │   │   ├── /pos                       # Satış ekranı bileşenleri
│       │   │   ├── /admin                     # Admin panel bileşenleri
│       │   │   └── /shared                    # Ortak bileşenler
│       │   ├── /pages
│       │   │   ├── /pos                       # POS sayfaları
│       │   │   └── /admin                     # Admin sayfaları
│       │   ├── /hooks                         # Custom hooks (useBarcodeScanner)
│       │   ├── /services                      # API istemcileri (axios)
│       │   ├── /store                         # Zustand state management
│       │   ├── /types                         # TypeScript tipleri
│       │   ├── /utils                         # Yardımcı fonksiyonlar
│       │   └── /offline                       # Offline sync modülü
│       └── /electron                          # Electron shell yapılandırması
│
├── /database
│   ├── /migrations                            # EF Core migrations
│   └── /seed                                  # Başlangıç verileri
│
├── /docs                                      # Mimari dokümanlar
├── docker-compose.yml
└── README.md
```

---

## Deployment Mimarisi

```mermaid
graph LR
    subgraph "Mağaza İçi - LAN"
        PT1[🖥️ POS Terminal 1<br/>Electron App]
        PT2[🖥️ POS Terminal 2<br/>Electron App]
        BS[🔫 Barkod Okuyucu]
    end

    subgraph "Sunucu"
        API[ASP.NET Core API<br/>Docker Container]
        DB[(SQL Server<br/>Docker Container)]
    end

    BS --> PT1
    PT1 -->|HTTP/REST| API
    PT2 -->|HTTP/REST| API
    API --> DB

    style PT1 fill:#3b82f6,color:#fff
    style PT2 fill:#3b82f6,color:#fff
    style API fill:#8b5cf6,color:#fff
    style DB fill:#10b981,color:#fff
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  api:
    build: ./src/backend
    ports:
      - "5000:8080"
    environment:
      - ConnectionStrings__Default=Server=db;Database=BarcodePos;User=sa;Password=${DB_PASSWORD};TrustServerCertificate=true
      - Jwt__Secret=${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    ports:
      - "1433:1433"
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=${DB_PASSWORD}
    volumes:
      - sqldata:/var/opt/mssql
    restart: unless-stopped

volumes:
  sqldata:
```

---

## Çoklu Mağaza Ölçeklendirme (Gelecek Faz)

```mermaid
graph TB
    subgraph "Mağaza 1"
        P1[POS Terminalleri]
        L1[(Local Cache)]
    end
    subgraph "Mağaza 2"
        P2[POS Terminalleri]
        L2[(Local Cache)]
    end
    subgraph "Merkez Sunucu"
        CAPI[Central API + Load Balancer]
        CDB[(Central SQL Server)]
    end

    P1 -->|Sync| CAPI
    P2 -->|Sync| CAPI
    CAPI --> CDB

    style CAPI fill:#8b5cf6,color:#fff
    style CDB fill:#10b981,color:#fff
```

| Strateji | Açıklama |
|----------|----------|
| **StoreId filtreleme** | Tüm sorgular `StoreId` ile filtrelenir, tek DB'de çoklu mağaza |
| **Tenant isolation** | Her mağaza kendi verisini görür, API middleware ile zorunlu |
| **Offline-first sync** | Her mağaza local çalışır, merkeze periyodik senkronize eder |
| **Horizontal scaling** | API katmanı Docker ile çoğaltılır, load balancer arkasında |
