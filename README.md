# Barcode POS System

A modern **barcode-based Point of Sale (POS) and inventory management system** designed for small and medium-sized retail stores.

This project is built with **ASP.NET Core Clean Architecture** on the backend and **React + TypeScript** on the frontend.
The system supports **fast cashier workflow, barcode scanning, stock management, customer credit tracking, and reporting**.

---

# Project Goals

The goal of this project is to build a **production-ready POS system** with a clean architecture that can be extended to support:

* multiple stores
* online synchronization
* device integrations
* SaaS deployment

---

# System Overview

The system consists of four main parts:

1. POS Application (Cashier screen)
2. Admin Panel (Management dashboard)
3. Backend API (Business logic and data access)
4. Database and reporting layer

```
Admin Panel (React)
       │
       │ HTTP / JSON
       ▼
ASP.NET Core Web API
       │
       │ EF Core
       ▼
SQL Server Database
       │
       ▼
Reports / Excel Export
```

Optional desktop deployment:

```
Electron Wrapper
     │
     ▼
React POS Application
```

---

# Tech Stack

## Backend

* ASP.NET Core Web API
* Clean Architecture
* Entity Framework Core
* SQL Server
* JWT Authentication
* FluentValidation
* AutoMapper

## Frontend

* React
* TypeScript
* TailwindCSS
* Zustand
* React Router
* React Query

## Desktop Support

* Electron

---

# Core Features

## POS Sales

* barcode scanning
* fast cashier workflow
* product search
* cart system
* multiple payment types

Payment types supported:

* Cash
* Card
* Credit (customer account)

---

## Inventory Management

* product catalog
* product categories
* stock quantity tracking
* stock movement logs
* minimum stock alerts

---

## Customer Management

Optional customer support for sales:

* customer records
* credit balance tracking
* customer transaction history

---

## Reporting

The system provides business insights such as:

* daily sales
* top selling products
* low stock products
* profit calculations

Reports can be exported to:

* Excel

---

# System Architecture

The backend follows a **Clean Architecture** approach.

```
API Layer
│
├── Controllers
├── Middleware
└── Authentication

Application Layer
│
├── Services
├── DTOs
├── Validators
└── Use Cases

Domain Layer
│
├── Entities
├── Enums
└── Core business rules

Infrastructure Layer
│
├── EF Core
├── DbContext
├── Repositories
└── External services
```

---

# Database Overview

Main entities:

```
Store
 ├── Users
 ├── Products
 ├── Categories
 ├── Customers
 ├── Sales
 └── StockMovements

Product
 ├── SaleItems
 └── StockMovements

Sale
 ├── SaleItems
 └── Customer (optional)

Customer
 └── CustomerTransactions
```

---

# Sales Workflow

```
Scan Barcode
     │
     ▼
Product Found?
 ├─ No → show warning
 └─ Yes → add to cart
            │
            ▼
Select Payment Type
            │
            ▼
POST /api/sales
            │
            ▼
Create Sale + SaleItems
            │
            ▼
Decrease Product Stock
            │
            ▼
Create StockMovement record
            │
            ▼
Return receipt to frontend
```

---

# Project Structure

```
MyPost
├── backend
│   ├── BarcodePos.API
│   ├── BarcodePos.Application
│   ├── BarcodePos.Domain
│   ├── BarcodePos.Infrastructure
│   ├── BarcodePos.UnitTests
│   ├── BarcodePos.IntegrationTests
│   └── BarcodePos.slnx
│
├── frontend
│   └── barcode-pos-frontend
│
├── docs
│   ├── architecture
│   ├── prompt-pack
│   └── notes
│
├── reference
│   ├── qpos
│   ├── react-pos-management-system
│   └── tgipos
│
└── tools
```

---

# Development Setup

## Backend

```
cd backend
dotnet build
dotnet run --project BarcodePos.API
```

Swagger will be available at:

```
https://localhost:5001/swagger
```

---

## Frontend

```
cd frontend/barcode-pos-frontend
npm install
npm run dev
```
---

# Future Improvements

Planned improvements include:

* multi-store support
* advanced offline synchronization
* payment terminal integration
* receipt printer support
* loyalty system
* advanced analytics

---

# License

This project is currently intended for **educational and prototype purposes**.

---

# Author

Developed as a modular POS system architecture project.
