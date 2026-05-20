# Cari Soft - Tek Magaza icin JSON Yedek Filtreleyici
# Multi-tenant SaaS yedeginden tek bir StoreId'ye ait verileri ayiklar.
# Kullanim: .\filter-store-data.ps1 -InputPath "yedek.json" -StoreId 5

param(
    [Parameter(Mandatory=$true)][string]$InputPath,
    [Parameter(Mandatory=$true)][int]$StoreId,
    [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $InputPath)) {
    Write-Error "Giris dosyasi bulunamadi: $InputPath"
    exit 1
}

if (-not $OutputPath) {
    $dir = Split-Path $InputPath -Parent
    $base = [IO.Path]::GetFileNameWithoutExtension($InputPath)
    $OutputPath = Join-Path $dir "$base.store$StoreId.json"
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Tek Magaza Filtreleme - StoreId=$StoreId" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] JSON okunuyor..." -ForegroundColor Yellow
$json = Get-Content $InputPath -Raw | ConvertFrom-Json

$store = $json.stores | Where-Object { $_.id -eq $StoreId }
if (-not $store) {
    Write-Error "StoreId=$StoreId yedek icinde bulunamadi."
    exit 1
}
Write-Host "  Magaza: $($store.name)" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] StoreId=$StoreId'ye ait kayitlar ayriliyor..." -ForegroundColor Yellow

$stores       = @($store)
$users        = @($json.users          | Where-Object { $_.storeId -eq $StoreId })
$categories   = @($json.categories     | Where-Object { $_.storeId -eq $StoreId })
$customers    = @($json.customers      | Where-Object { $_.storeId -eq $StoreId })
$products     = @($json.products       | Where-Object { $_.storeId -eq $StoreId })
$sales        = @($json.sales          | Where-Object { $_.storeId -eq $StoreId })
$serviceRec   = @($json.serviceRecords | Where-Object { $_.storeId -eq $StoreId })

$saleIds      = @($sales      | ForEach-Object { $_.id })
$productIds   = @($products   | ForEach-Object { $_.id })
$customerIds  = @($customers  | ForEach-Object { $_.id })
$svcRecIds    = @($serviceRec | ForEach-Object { $_.id })

$saleItems    = @($json.saleItems            | Where-Object { $saleIds       -contains $_.saleId })
$stockMov     = @($json.stockMovements       | Where-Object { $productIds    -contains $_.productId })
$custTx       = @($json.customerTransactions | Where-Object { $customerIds   -contains $_.customerId })
$svcLogs      = @($json.serviceLogs          | Where-Object { $svcRecIds     -contains $_.serviceRecordId })
$svcParts     = @($json.serviceParts         | Where-Object { $svcRecIds     -contains $_.serviceRecordId })

Write-Host "  Bulunan kayitlar:" -ForegroundColor Gray
Write-Host ("    Stores               : {0}" -f $stores.Count)
Write-Host ("    Users                : {0}" -f $users.Count)
Write-Host ("    Categories           : {0}" -f $categories.Count)
Write-Host ("    Customers            : {0}" -f $customers.Count)
Write-Host ("    Products             : {0}" -f $products.Count)
Write-Host ("    Sales                : {0}" -f $sales.Count)
Write-Host ("    SaleItems            : {0}" -f $saleItems.Count)
Write-Host ("    StockMovements       : {0}" -f $stockMov.Count)
Write-Host ("    CustomerTransactions : {0}" -f $custTx.Count)
Write-Host ("    ServiceRecords       : {0}" -f $serviceRec.Count)
Write-Host ("    ServiceLogs          : {0}" -f $svcLogs.Count)
Write-Host ("    ServiceParts         : {0}" -f $svcParts.Count)
Write-Host ""

Write-Host "[3/4] Cikarilan multi-tenant alanlar (bos yazilir):" -ForegroundColor Yellow
Write-Host "    - WebCustomers (SaaS musterileri)" -ForegroundColor DarkGray
Write-Host "    - Subscriptions (SaaS abonelikler)" -ForegroundColor DarkGray
Write-Host "    - SubscriptionPlans" -ForegroundColor DarkGray
Write-Host "    - ContactMessages" -ForegroundColor DarkGray
Write-Host "    - Diger magazalarin tum verisi" -ForegroundColor DarkGray
Write-Host ""

Write-Host "[4/4] Yeni JSON dosyasi yaziliyor..." -ForegroundColor Yellow

$output = [ordered]@{
    version              = "1.0"
    exportedAt           = (Get-Date).ToUniversalTime().ToString("o")
    stores               = $stores
    subscriptionPlans    = @()
    users                = $users
    categories           = $categories
    customers            = $customers
    webCustomers         = @()
    subscriptions        = @()
    products             = $products
    sales                = $sales
    saleItems            = $saleItems
    stockMovements       = $stockMov
    customerTransactions = $custTx
    serviceRecords       = $serviceRec
    serviceLogs          = $svcLogs
    serviceParts         = $svcParts
    contactMessages      = @()
}

$output | ConvertTo-Json -Depth 20 -Compress:$false | Out-File -FilePath $OutputPath -Encoding UTF8

$outFile = Get-Item $OutputPath
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "  TAMAMLANDI!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host ("  Dosya : $OutputPath") -ForegroundColor White
Write-Host ("  Boyut : {0:N1} KB" -f ($outFile.Length/1KB)) -ForegroundColor White
Write-Host ""
Write-Host "  Musterinin PC'sinde masaustu Cari Soft acin," -ForegroundColor Yellow
Write-Host "  sol menuden Yedekleme'ye gidin, Yedek Yukle butonuna basin," -ForegroundColor Yellow
Write-Host "  bu JSON dosyasini secip yukleyin." -ForegroundColor Yellow
Write-Host ""
