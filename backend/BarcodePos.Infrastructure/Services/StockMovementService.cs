using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.StockMovements;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Entities;
using BarcodePos.Domain.Enums;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Services;

public class StockMovementService : IStockMovementService
{
    private readonly AppDbContext _context;

    public StockMovementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<StockMovementDto>>> GetAllAsync(StockMovementFilter filter, int storeId)
    {
        var query = _context.StockMovements
            .AsNoTracking()
            .Include(sm => sm.Product)
            .Include(sm => sm.User)
            .Where(sm => sm.Product.StoreId == storeId);

        if (filter.ProductId.HasValue)
            query = query.Where(sm => sm.ProductId == filter.ProductId.Value);

        if (!string.IsNullOrEmpty(filter.Type) && Enum.TryParse<MovementType>(filter.Type, out var movementType))
            query = query.Where(sm => sm.Type == movementType);

        if (filter.DateFrom.HasValue)
            query = query.Where(sm => sm.CreatedAt >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(sm => sm.CreatedAt <= filter.DateTo.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(sm => sm.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(sm => MapToDto(sm))
            .ToListAsync();

        return Result<PagedResult<StockMovementDto>>.Ok(
            PagedResult<StockMovementDto>.Create(items, totalCount, filter.Page, filter.PageSize));
    }

    public async Task<Result<PagedResult<StockMovementDto>>> GetByProductAsync(int productId, int storeId, int page, int pageSize)
    {
        var productExists = await _context.Products
            .AnyAsync(p => p.Id == productId && p.StoreId == storeId);

        if (!productExists)
            return Result<PagedResult<StockMovementDto>>.Fail("Ürün bulunamadı.");

        var query = _context.StockMovements
            .AsNoTracking()
            .Include(sm => sm.Product)
            .Include(sm => sm.User)
            .Where(sm => sm.ProductId == productId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(sm => sm.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(sm => MapToDto(sm))
            .ToListAsync();

        return Result<PagedResult<StockMovementDto>>.Ok(
            PagedResult<StockMovementDto>.Create(items, totalCount, page, pageSize));
    }

    public async Task<Result<StockMovementDto>> CreateManualAsync(CreateStockMovementRequest request, int storeId, int userId)
    {
        if (!Enum.TryParse<MovementType>(request.Type, out var movementType))
            return Result<StockMovementDto>.Fail("Geçersiz hareket türü.");

        // Sadece manuel türler kabul edilir
        if (movementType is MovementType.Satis or MovementType.Iade)
            return Result<StockMovementDto>.Fail("Satış ve iade hareketleri manuel oluşturulamaz.");

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.StoreId == storeId);

        if (product is null)
            return Result<StockMovementDto>.Fail("Ürün bulunamadı.");

        // Stok hesapla
        int signedQuantity;
        switch (movementType)
        {
            case MovementType.Giris:
                signedQuantity = request.Quantity;
                product.StockQuantity += request.Quantity;
                break;

            case MovementType.Cikis:
                if (product.StockQuantity < request.Quantity)
                    return Result<StockMovementDto>.Fail(
                        $"Yetersiz stok. Mevcut: {product.StockQuantity}, İstenen çıkış: {request.Quantity}");
                signedQuantity = -request.Quantity;
                product.StockQuantity -= request.Quantity;
                break;

            case MovementType.Duzeltme:
                signedQuantity = request.Quantity - product.StockQuantity;
                product.StockQuantity = request.Quantity;
                break;

            default:
                return Result<StockMovementDto>.Fail("Desteklenmeyen hareket türü.");
        }

        var movement = new StockMovement
        {
            ProductId = product.Id,
            UserId = userId,
            Type = movementType,
            Quantity = signedQuantity,
            StockAfter = product.StockQuantity,
            Note = request.Note
        };

        _context.StockMovements.Add(movement);
        await _context.SaveChangesAsync();

        // Navigation property'leri yükle
        await _context.Entry(movement).Reference(m => m.Product).LoadAsync();
        await _context.Entry(movement).Reference(m => m.User).LoadAsync();

        return Result<StockMovementDto>.Ok(MapToDto(movement), "Stok hareketi oluşturuldu.");
    }

    private static StockMovementDto MapToDto(StockMovement sm) => new()
    {
        Id = sm.Id,
        ProductId = sm.ProductId,
        ProductName = sm.Product?.Name ?? string.Empty,
        ProductBarcode = sm.Product?.Barcode ?? string.Empty,
        UserId = sm.UserId,
        UserFullName = sm.User?.FullName ?? string.Empty,
        Type = sm.Type.ToString(),
        TypeName = sm.Type switch
        {
            MovementType.Giris => "Giriş",
            MovementType.Cikis => "Çıkış",
            MovementType.Satis => "Satış",
            MovementType.Iade => "İade",
            MovementType.Duzeltme => "Düzeltme",
            _ => sm.Type.ToString()
        },
        Quantity = sm.Quantity,
        StockAfter = sm.StockAfter,
        Note = sm.Note,
        CreatedAt = sm.CreatedAt
    };
}
