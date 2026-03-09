using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Sales;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Entities;
using BarcodePos.Domain.Enums;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Services;

public class SaleService : ISaleService
{
    private readonly AppDbContext _context;

    public SaleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SaleResponseDto>> CreateAsync(CreateSaleRequest request, int storeId, int userId)
    {
        if (!Enum.TryParse<PaymentType>(request.PaymentType, out var paymentType))
            return Result<SaleResponseDto>.Fail("Geçersiz ödeme türü.");

        // Veresiye ise müşteri kontrolü
        Customer? customer = null;
        if (paymentType == PaymentType.Veresiye)
        {
            if (!request.CustomerId.HasValue)
                return Result<SaleResponseDto>.Fail("Veresiye satışında müşteri seçimi zorunludur.");

            customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == request.CustomerId.Value && c.StoreId == storeId && c.IsActive);

            if (customer is null)
                return Result<SaleResponseDto>.Fail("Müşteri bulunamadı veya aktif değil.");
        }

        // Ürünleri toplu yükle
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id) && p.StoreId == storeId)
            .ToListAsync();

        // Doğrulama
        foreach (var item in request.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            if (product is null)
                return Result<SaleResponseDto>.Fail($"Ürün bulunamadı (Id={item.ProductId}).");
            if (!product.IsActive)
                return Result<SaleResponseDto>.Fail($"Ürün aktif değil: {product.Name}");
            if (product.StockQuantity < item.Quantity)
                return Result<SaleResponseDto>.Fail($"Yetersiz stok: {product.Name} (Mevcut: {product.StockQuantity}, İstenen: {item.Quantity})");
        }

        // ExecutionStrategy ile transaction — retry-safe
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Fiş numarası üret
            var receiptNumber = await GenerateReceiptNumberAsync(storeId);

            // SaleItem'ları oluştur ve hesapla
            var saleItems = new List<SaleItem>();
            decimal subTotal = 0;
            decimal taxTotal = 0;
            decimal itemDiscountTotal = 0;

            foreach (var item in request.Items)
            {
                var product = products.First(p => p.Id == item.ProductId);

                var lineGross = product.SalePrice * item.Quantity;
                var lineNet = lineGross - item.DiscountAmount;
                var lineTax = lineNet * product.TaxRate;
                var lineTotal = lineNet;

                subTotal += lineGross;
                taxTotal += lineTax;
                itemDiscountTotal += item.DiscountAmount;

                saleItems.Add(new SaleItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Barcode = product.Barcode,
                    Quantity = item.Quantity,
                    UnitPrice = product.SalePrice,
                    CostPrice = product.CostPrice,
                    TaxRate = product.TaxRate,
                    DiscountAmount = item.DiscountAmount,
                    LineTotal = lineTotal
                });
            }

            var totalDiscount = request.DiscountTotal + itemDiscountTotal;
            var grandTotal = subTotal - totalDiscount + taxTotal;

            // Sale oluştur
            var sale = new Sale
            {
                StoreId = storeId,
                UserId = userId,
                CustomerId = request.CustomerId,
                ReceiptNumber = receiptNumber,
                SaleDate = DateTime.UtcNow,
                SubTotal = subTotal,
                TaxTotal = taxTotal,
                DiscountTotal = totalDiscount,
                GrandTotal = grandTotal,
                PaymentType = paymentType,
                Status = SaleStatus.Tamamlandi,
                Items = saleItems
            };

            _context.Sales.Add(sale);

            // Stok güncelle + stok hareketi oluştur
            foreach (var item in request.Items)
            {
                var product = products.First(p => p.Id == item.ProductId);
                product.StockQuantity -= item.Quantity;

                _context.StockMovements.Add(new StockMovement
                {
                    ProductId = product.Id,
                    UserId = userId,
                    Type = MovementType.Satis,
                    Quantity = -item.Quantity,
                    StockAfter = product.StockQuantity,
                    Note = $"Satış: {receiptNumber}"
                });
            }

            // Veresiye ise müşteri bakiyesini güncelle
            if (paymentType == PaymentType.Veresiye && customer is not null)
            {
                customer.Balance += grandTotal;

                // SaveChanges sonrası SaleId'yi alacağız, şimdilik transaction'a ekle
                await _context.SaveChangesAsync();

                _context.CustomerTransactions.Add(new CustomerTransaction
                {
                    CustomerId = customer.Id,
                    SaleId = sale.Id,
                    Type = TransactionType.Borc,
                    Amount = grandTotal,
                    BalanceAfter = customer.Balance,
                    Note = $"Veresiye satış: {receiptNumber}"
                });

                await _context.SaveChangesAsync();
            }
            else
            {
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            // Response oluştur
            var user = await _context.Users.AsNoTracking().FirstAsync(u => u.Id == userId);
            return Result<SaleResponseDto>.Ok(MapToResponse(sale, user.FullName, customer?.FullName), "Satış başarıyla tamamlandı.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
        }); // end ExecutionStrategy
    }

    public async Task<Result<SaleResponseDto>> GetByIdAsync(int id, int storeId)
    {
        var sale = await _context.Sales
            .AsNoTracking()
            .Include(s => s.Items)
            .Include(s => s.User)
            .Include(s => s.Customer)
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (sale is null)
            return Result<SaleResponseDto>.Fail("Satış bulunamadı.");

        return Result<SaleResponseDto>.Ok(MapToResponse(sale, sale.User.FullName, sale.Customer?.FullName));
    }

    public async Task<Result<PagedResult<SaleListDto>>> GetAllAsync(SaleListFilter filter, int storeId)
    {
        var query = _context.Sales
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Customer)
            .Where(s => s.StoreId == storeId);

        if (filter.DateFrom.HasValue)
            query = query.Where(s => s.SaleDate >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue)
            query = query.Where(s => s.SaleDate <= filter.DateTo.Value);
        if (!string.IsNullOrEmpty(filter.PaymentType) && Enum.TryParse<PaymentType>(filter.PaymentType, out var pt))
            query = query.Where(s => s.PaymentType == pt);
        if (!string.IsNullOrEmpty(filter.Status) && Enum.TryParse<SaleStatus>(filter.Status, out var ss))
            query = query.Where(s => s.Status == ss);
        if (filter.CustomerId.HasValue)
            query = query.Where(s => s.CustomerId == filter.CustomerId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.SaleDate)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => new SaleListDto
            {
                Id = s.Id,
                ReceiptNumber = s.ReceiptNumber,
                SaleDate = s.SaleDate,
                GrandTotal = s.GrandTotal,
                PaymentTypeName = MapPaymentTypeName(s.PaymentType),
                StatusName = MapStatusName(s.Status),
                CashierName = s.User.FullName,
                CustomerName = s.Customer != null ? s.Customer.FullName : null
            })
            .ToListAsync();

        return Result<PagedResult<SaleListDto>>.Ok(
            PagedResult<SaleListDto>.Create(items, totalCount, filter.Page, filter.PageSize));
    }

    public async Task<Result<SaleResponseDto>> GetByReceiptNumberAsync(string receiptNumber, int storeId)
    {
        var sale = await _context.Sales
            .AsNoTracking()
            .Include(s => s.Items)
            .Include(s => s.User)
            .Include(s => s.Customer)
            .FirstOrDefaultAsync(s => s.ReceiptNumber == receiptNumber && s.StoreId == storeId);

        if (sale is null)
            return Result<SaleResponseDto>.Fail("Satış bulunamadı.");

        return Result<SaleResponseDto>.Ok(MapToResponse(sale, sale.User.FullName, sale.Customer?.FullName));
    }

    public async Task<Result> CancelAsync(int id, int storeId)
    {
        var sale = await _context.Sales
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (sale is null)
            return Result.Fail("Satış bulunamadı.");

        if (sale.Status != SaleStatus.Tamamlandi)
            return Result.Fail("Sadece tamamlanmış satışlar iptal edilebilir.");

        sale.Status = SaleStatus.Iptal;
        await _context.SaveChangesAsync();

        return Result.Ok("Satış iptal edildi.");
    }

    public async Task<Result> ReturnAsync(int id, int storeId, int userId)
    {
        var sale = await _context.Sales
            .Include(s => s.Items)
            .Include(s => s.Customer)
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (sale is null)
            return Result.Fail("Satış bulunamadı.");

        if (sale.Status != SaleStatus.Tamamlandi)
            return Result.Fail("Sadece tamamlanmış satışlar iade edilebilir.");

        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            sale.Status = SaleStatus.Iade;

            // Stok iadesi
            foreach (var item in sale.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product is not null)
                {
                    product.StockQuantity += item.Quantity;

                    _context.StockMovements.Add(new StockMovement
                    {
                        ProductId = product.Id,
                        UserId = userId,
                        Type = MovementType.Iade,
                        Quantity = item.Quantity,
                        StockAfter = product.StockQuantity,
                        Note = $"İade: {sale.ReceiptNumber}"
                    });
                }
            }

            // Veresiye ise bakiye iadesi
            if (sale.PaymentType == PaymentType.Veresiye && sale.Customer is not null)
            {
                sale.Customer.Balance -= sale.GrandTotal;

                _context.CustomerTransactions.Add(new CustomerTransaction
                {
                    CustomerId = sale.Customer.Id,
                    SaleId = sale.Id,
                    Type = TransactionType.Odeme,
                    Amount = sale.GrandTotal,
                    BalanceAfter = sale.Customer.Balance,
                    Note = $"İade: {sale.ReceiptNumber}"
                });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Result.Ok("Satış iade edildi ve stok güncellendi.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
        }); // end ExecutionStrategy
    }

    private async Task<string> GenerateReceiptNumberAsync(int storeId)
    {
        var today = DateTime.UtcNow.Date;
        var prefix = $"FIS-{today:yyyyMMdd}-";

        var lastReceipt = await _context.Sales
            .AsNoTracking()
            .Where(s => s.StoreId == storeId && s.ReceiptNumber.StartsWith(prefix))
            .OrderByDescending(s => s.ReceiptNumber)
            .Select(s => s.ReceiptNumber)
            .FirstOrDefaultAsync();

        var sequence = 1;
        if (lastReceipt is not null)
        {
            var lastSeq = lastReceipt.Split('-').Last();
            if (int.TryParse(lastSeq, out var parsed))
                sequence = parsed + 1;
        }

        return $"{prefix}{sequence:D4}";
    }

    private static SaleResponseDto MapToResponse(Sale sale, string cashierName, string? customerName) => new()
    {
        Id = sale.Id,
        ReceiptNumber = sale.ReceiptNumber,
        SaleDate = sale.SaleDate,
        SubTotal = sale.SubTotal,
        TaxTotal = sale.TaxTotal,
        DiscountTotal = sale.DiscountTotal,
        GrandTotal = sale.GrandTotal,
        PaymentType = sale.PaymentType.ToString(),
        PaymentTypeName = MapPaymentTypeName(sale.PaymentType),
        Status = sale.Status.ToString(),
        StatusName = MapStatusName(sale.Status),
        CashierName = cashierName,
        CustomerName = customerName,
        Items = sale.Items.Select(i => new SaleItemResponseDto
        {
            ProductName = i.ProductName,
            Barcode = i.Barcode,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            TaxRate = i.TaxRate,
            DiscountAmount = i.DiscountAmount,
            LineTotal = i.LineTotal
        }).ToList()
    };

    private static string MapPaymentTypeName(PaymentType type) => type switch
    {
        PaymentType.Nakit => "Nakit",
        PaymentType.Kart => "Kredi Kartı",
        PaymentType.Veresiye => "Veresiye",
        _ => type.ToString()
    };

    private static string MapStatusName(SaleStatus status) => status switch
    {
        SaleStatus.Tamamlandi => "Tamamlandı",
        SaleStatus.Iptal => "İptal",
        SaleStatus.Iade => "İade",
        _ => status.ToString()
    };
}
