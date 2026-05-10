using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Products;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Entities;
using BarcodePos.Domain.Enums;
using BarcodePos.Infrastructure.Persistence;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _context;
    private readonly IExchangeRateService _exchangeRateService;

    public ProductService(AppDbContext context, IExchangeRateService exchangeRateService)
    {
        _context = context;
        _exchangeRateService = exchangeRateService;
    }

    /// <summary>
    /// USD'li ürünlerde anlık güncel kurla TL fiyatları hesaplar.
    /// </summary>
    private void ApplyCurrentRate(ProductDto dto, decimal currentRate)
    {
        if (dto.SalePriceUsd is > 0 && currentRate > 0)
        {
            dto.CurrentExchangeRate = currentRate;
            dto.CurrentSalePrice = Math.Round(dto.SalePriceUsd.Value * currentRate, 2);
            if (dto.CostPriceUsd is > 0)
                dto.CurrentCostPrice = Math.Round(dto.CostPriceUsd.Value * currentRate, 2);
        }
    }

    /// <summary>
    /// Birden fazla DTO için tek seferde kur uygulanır.
    /// </summary>
    private async Task ApplyCurrentRateToAllAsync(IEnumerable<ProductDto> dtos)
    {
        if (!dtos.Any(d => d.SalePriceUsd is > 0)) return;
        var rate = await _exchangeRateService.GetUsdTryRateAsync();
        if (rate <= 0) return;
        foreach (var dto in dtos) ApplyCurrentRate(dto, rate);
    }

    public async Task<Result<PagedResult<ProductDto>>> GetAllAsync(ProductListFilter filter, int storeId)
    {
        var query = _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.StoreId == storeId);

        // Filtreler
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(search)
                                  || p.Barcode.ToLower().Contains(search));
        }

        if (filter.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

        if (filter.IsActive.HasValue)
            query = query.Where(p => p.IsActive == filter.IsActive.Value);

        if (filter.LowStockOnly == true)
            query = query.Where(p => p.StockQuantity <= p.MinStockLevel && p.IsActive);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(p => p.Name)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => MapToDto(p))
            .ToListAsync();

        await ApplyCurrentRateToAllAsync(items);

        return Result<PagedResult<ProductDto>>.Ok(
            PagedResult<ProductDto>.Create(items, totalCount, filter.Page, filter.PageSize));
    }

    public async Task<Result<ProductDto>> GetByIdAsync(int id, int storeId)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id && p.StoreId == storeId);

        if (product is null)
            return Result<ProductDto>.Fail("Ürün bulunamadı.");

        var dto = MapToDto(product);
        await ApplyCurrentRateToAllAsync([dto]);
        return Result<ProductDto>.Ok(dto);
    }

    public async Task<Result<ProductDto>> GetByBarcodeAsync(string barcode, int storeId)
    {
        // POS barkod sorgusu — sadece aktif ürünler, indeksli sorgu
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Barcode == barcode && p.StoreId == storeId && p.IsActive);

        if (product is null)
            return Result<ProductDto>.Fail("Ürün bulunamadı.");

        var dto = MapToDto(product);
        await ApplyCurrentRateToAllAsync([dto]);
        return Result<ProductDto>.Ok(dto);
    }

    public async Task<Result<List<ProductDto>>> SearchAsync(string query, int storeId)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Result<List<ProductDto>>.Ok([]);

        var search = query.ToLower();

        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.StoreId == storeId
                     && p.IsActive
                     && (p.Name.ToLower().Contains(search) || p.Barcode.ToLower().Contains(search)))
            .OrderBy(p => p.Name)
            .Take(20)
            .Select(p => MapToDto(p))
            .ToListAsync();

        await ApplyCurrentRateToAllAsync(products);
        return Result<List<ProductDto>>.Ok(products);
    }

    public async Task<Result<List<LowStockProductDto>>> GetLowStockAsync(int storeId)
    {
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.StoreId == storeId && p.IsActive && p.StockQuantity <= p.MinStockLevel)
            .OrderBy(p => p.StockQuantity - p.MinStockLevel)
            .Select(p => new LowStockProductDto
            {
                ProductId = p.Id,
                Barcode = p.Barcode,
                Name = p.Name,
                CategoryName = p.Category.Name,
                StockQuantity = p.StockQuantity,
                MinStockLevel = p.MinStockLevel,
                Difference = p.StockQuantity - p.MinStockLevel
            })
            .ToListAsync();

        return Result<List<LowStockProductDto>>.Ok(products);
    }

    public async Task<Result<string>> GenerateBarcodeAsync(int storeId)
    {
        try
        {
            // Dahili barkod üretme — EAN-13 uyumlu "20" prefix (GS1 mağaza içi kullanım)
            // Format: 20 + storeId(2) + sıra(8) + kontrol(1) = 13 haneli
            if (storeId <= 0)
                return Result<string>.Fail($"Geçersiz mağaza kimliği ({storeId}). Lütfen tekrar giriş yapın.");

            var storePrefix = $"20{storeId % 100:D2}";

            // Mevcut prefix'le başlayan tüm barkodları al
            var existingBarcodes = await _context.Products
                .AsNoTracking()
                .Where(p => p.StoreId == storeId && p.Barcode.StartsWith(storePrefix))
                .Select(p => p.Barcode)
                .ToListAsync();

            // Sequence kısmını sayı olarak parse edip max'ı bul (12 ve 13 char destekli)
            long maxSequence = 0;
            foreach (var bc in existingBarcodes)
            {
                if (bc.Length < 12) continue;
                var seqLen = Math.Min(8, bc.Length - 4);
                if (seqLen <= 0) continue;
                var seqStr = bc.Substring(4, seqLen);
                if (long.TryParse(seqStr, out var seq) && seq > maxSequence)
                    maxSequence = seq;
            }

            var existingSet = new HashSet<string>(existingBarcodes);

            // Sıradakini üret; çakışırsa ileri kayarak tekrar dene (200 deneme yeterli)
            for (var i = 1; i <= 200; i++)
            {
                var nextSequence = maxSequence + i;
                if (nextSequence > 99_999_999) break; // 8 haneli sequence sınırı

                var barcodeWithoutCheck = $"{storePrefix}{nextSequence:D8}";
                var checkDigit = CalculateEan13CheckDigit(barcodeWithoutCheck);
                var barcode = $"{barcodeWithoutCheck}{checkDigit}";

                if (existingSet.Contains(barcode)) continue;

                // Son güvenlik: yarış durumuna karşı DB'de gerçekten var mı?
                var dbExists = await _context.Products.AsNoTracking()
                    .AnyAsync(p => p.StoreId == storeId && p.Barcode == barcode);
                if (!dbExists) return Result<string>.Ok(barcode);
            }

            return Result<string>.Fail($"Barkod üretilemedi (200 deneme tükendi). " +
                $"Mevcut: {existingBarcodes.Count} barkod, Max sıra: {maxSequence}, Prefix: {storePrefix}");
        }
        catch (Exception ex)
        {
            return Result<string>.Fail($"Barkod üretilirken hata: {ex.GetType().Name} - {ex.Message}");
        }
    }

    private static int CalculateEan13CheckDigit(string code12)
    {
        var sum = 0;
        for (var i = 0; i < 12; i++)
        {
            var digit = code12[i] - '0';
            sum += i % 2 == 0 ? digit : digit * 3;
        }
        var remainder = sum % 10;
        return remainder == 0 ? 0 : 10 - remainder;
    }

    public async Task<Result<ProductDto>> CreateAsync(CreateProductRequest request, int storeId)
    {
        // Barkod benzersizlik kontrolü (mağaza bazında)
        var barcodeExists = await _context.Products
            .AnyAsync(p => p.StoreId == storeId && p.Barcode == request.Barcode);

        if (barcodeExists)
            return Result<ProductDto>.Fail("Bu barkod numarası zaten kullanılıyor.");

        // Kategori varlık kontrolü
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId && c.StoreId == storeId && c.IsActive);

        if (!categoryExists)
            return Result<ProductDto>.Fail("Geçersiz kategori.");

        var product = new Product
        {
            StoreId = storeId,
            CategoryId = request.CategoryId,
            Barcode = request.Barcode,
            Name = request.Name,
            Description = request.Description,
            CostPriceUsd = request.CostPriceUsd,
            SalePriceUsd = request.SalePriceUsd,
            ExchangeRate = request.ExchangeRate,
            CostPrice = request.CostPriceUsd.HasValue && request.ExchangeRate.HasValue
                ? Math.Round(request.CostPriceUsd.Value * request.ExchangeRate.Value, 2)
                : request.CostPrice,
            SalePrice = request.SalePriceUsd.HasValue && request.ExchangeRate.HasValue
                ? Math.Round(request.SalePriceUsd.Value * request.ExchangeRate.Value, 2)
                : request.SalePrice,
            TaxRate = request.TaxRate,
            StockQuantity = request.StockQuantity,
            MinStockLevel = request.MinStockLevel,
            IsActive = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Kategori adını yükle
        await _context.Entry(product).Reference(p => p.Category).LoadAsync();

        return Result<ProductDto>.Ok(MapToDto(product), "Ürün oluşturuldu.");
    }

    public async Task<Result<ProductDto>> UpdateAsync(int id, UpdateProductRequest request, int storeId, int userId)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id && p.StoreId == storeId);

        if (product is null)
            return Result<ProductDto>.Fail("Ürün bulunamadı.");

        // Barkod benzersizlik kontrolü (kendisi hariç)
        var barcodeExists = await _context.Products
            .AnyAsync(p => p.StoreId == storeId && p.Barcode == request.Barcode && p.Id != id);

        if (barcodeExists)
            return Result<ProductDto>.Fail("Bu barkod numarası zaten kullanılıyor.");

        // Kategori varlık kontrolü
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId && c.StoreId == storeId && c.IsActive);

        if (!categoryExists)
            return Result<ProductDto>.Fail("Geçersiz kategori.");

        product.CategoryId = request.CategoryId;
        product.Barcode = request.Barcode;
        product.Name = request.Name;
        product.Description = request.Description;
        product.CostPriceUsd = request.CostPriceUsd;
        product.SalePriceUsd = request.SalePriceUsd;
        product.ExchangeRate = request.ExchangeRate;
        product.CostPrice = request.CostPriceUsd.HasValue && request.ExchangeRate.HasValue
            ? Math.Round(request.CostPriceUsd.Value * request.ExchangeRate.Value, 2)
            : request.CostPrice;
        product.SalePrice = request.SalePriceUsd.HasValue && request.ExchangeRate.HasValue
            ? Math.Round(request.SalePriceUsd.Value * request.ExchangeRate.Value, 2)
            : request.SalePrice;
        product.TaxRate = request.TaxRate;
        product.MinStockLevel = request.MinStockLevel;

        // Stok düzeltmesi — yeni miktar mevcuttan farklıysa Duzeltme hareketi kaydet
        if (request.StockQuantity.HasValue && request.StockQuantity.Value != product.StockQuantity)
        {
            var diff = request.StockQuantity.Value - product.StockQuantity;
            product.StockQuantity = request.StockQuantity.Value;
            _context.StockMovements.Add(new StockMovement
            {
                ProductId = product.Id,
                UserId = userId,
                Type = MovementType.Duzeltme,
                Quantity = diff,
                StockAfter = product.StockQuantity,
                Note = "Ürün düzenleme ekranından güncellendi."
            });
        }

        await _context.SaveChangesAsync();

        // Kategori değişmiş olabilir, yeniden yükle
        await _context.Entry(product).Reference(p => p.Category).LoadAsync();

        return Result<ProductDto>.Ok(MapToDto(product), "Ürün güncellendi.");
    }

    public async Task<Result> DeleteAsync(int id, int storeId)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.StoreId == storeId);

        if (product is null)
            return Result.Fail("Ürün bulunamadı.");

        product.IsActive = false;
        await _context.SaveChangesAsync();

        return Result.Ok("Ürün pasif yapıldı.");
    }

    private static ProductDto MapToDto(Product p) => new()
    {
        Id = p.Id,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? string.Empty,
        Barcode = p.Barcode,
        Name = p.Name,
        Description = p.Description,
        CostPrice = p.CostPrice,
        SalePrice = p.SalePrice,
        CostPriceUsd = p.CostPriceUsd,
        SalePriceUsd = p.SalePriceUsd,
        ExchangeRate = p.ExchangeRate,
        TaxRate = p.TaxRate,
        StockQuantity = p.StockQuantity,
        MinStockLevel = p.MinStockLevel,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    public async Task<Result<BulkImportResultDto>> BulkImportAsync(Stream excelStream, int storeId)
    {
        using var workbook = new XLWorkbook(excelStream);
        var ws = workbook.Worksheets.First();

        // Mevcut kategori ve barkodları ön-yükle
        var categories = await _context.Categories
            .Where(c => c.StoreId == storeId && c.IsActive)
            .ToDictionaryAsync(c => c.Name.ToLower(), c => c.Id);

        var existingBarcodes = await _context.Products
            .Where(p => p.StoreId == storeId)
            .Select(p => p.Barcode.ToLower())
            .ToHashSetAsync();

        var result = new BulkImportResultDto();
        var newProducts = new List<Product>();

        // Başlık satırını atla (1. satır), 2'den başla
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
        result.TotalRows = Math.Max(0, lastRow - 1);

        for (int row = 2; row <= lastRow; row++)
        {
            var barcode = ws.Cell(row, 1).GetString().Trim();
            var name = ws.Cell(row, 2).GetString().Trim();
            var categoryName = ws.Cell(row, 3).GetString().Trim();

            // Boş satırları atla
            if (string.IsNullOrEmpty(barcode) && string.IsNullOrEmpty(name))
            {
                result.SkippedCount++;
                continue;
            }

            // Zorunlu alan kontrolü
            if (string.IsNullOrEmpty(barcode) || string.IsNullOrEmpty(name) || string.IsNullOrEmpty(categoryName))
            {
                result.ErrorCount++;
                result.Errors.Add(new BulkImportError { Row = row, Barcode = barcode, Message = "Barkod, ürün adı ve kategori zorunludur." });
                continue;
            }

            // Tekrar barkod kontrolü (dosya içi + DB)
            if (existingBarcodes.Contains(barcode.ToLower()))
            {
                result.SkippedCount++;
                result.Errors.Add(new BulkImportError { Row = row, Barcode = barcode, Message = "Bu barkod zaten mevcut, atlandı." });
                continue;
            }

            // Kategori bul veya oluştur
            if (!categories.TryGetValue(categoryName.ToLower(), out var categoryId))
            {
                var newCategory = new Category
                {
                    StoreId = storeId,
                    Name = categoryName,
                    IsActive = true
                };
                _context.Categories.Add(newCategory);
                await _context.SaveChangesAsync();
                categoryId = newCategory.Id;
                categories[categoryName.ToLower()] = categoryId;
            }

            // Sayısal alanları parse et
            if (!decimal.TryParse(ws.Cell(row, 4).GetString().Replace(',', '.'), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var costPrice))
                costPrice = 0;
            if (!decimal.TryParse(ws.Cell(row, 5).GetString().Replace(',', '.'), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var salePrice))
                salePrice = 0;
            if (!decimal.TryParse(ws.Cell(row, 6).GetString().Replace(',', '.'), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var taxRate))
                taxRate = 20;
            if (!int.TryParse(ws.Cell(row, 7).GetString(), out var stockQuantity))
                stockQuantity = 0;
            if (!int.TryParse(ws.Cell(row, 8).GetString(), out var minStockLevel))
                minStockLevel = 5;

            if (salePrice <= 0)
            {
                result.ErrorCount++;
                result.Errors.Add(new BulkImportError { Row = row, Barcode = barcode, Message = "Satış fiyatı 0'dan büyük olmalıdır." });
                continue;
            }

            newProducts.Add(new Product
            {
                StoreId = storeId,
                CategoryId = categoryId,
                Barcode = barcode,
                Name = name,
                CostPrice = costPrice,
                SalePrice = salePrice,
                TaxRate = taxRate,
                StockQuantity = stockQuantity,
                MinStockLevel = minStockLevel,
                IsActive = true
            });

            existingBarcodes.Add(barcode.ToLower());
            result.SuccessCount++;
        }

        if (newProducts.Count > 0)
        {
            _context.Products.AddRange(newProducts);
            await _context.SaveChangesAsync();
        }

        return Result<BulkImportResultDto>.Ok(result,
            $"{result.SuccessCount} ürün başarıyla eklendi. {result.SkippedCount} atlandı, {result.ErrorCount} hatalı.");
    }

    public Task<byte[]> GetImportTemplateAsync()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Ürünler");

        var headers = new[] { "Barkod*", "Ürün Adı*", "Kategori*", "Alış Fiyatı", "Satış Fiyatı*", "KDV %", "Stok", "Min Stok" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        // Örnek satır
        ws.Cell(2, 1).Value = "8690000000001";
        ws.Cell(2, 2).Value = "Örnek Ürün";
        ws.Cell(2, 3).Value = "Genel";
        ws.Cell(2, 4).Value = 10.00;
        ws.Cell(2, 5).Value = 15.50;
        ws.Cell(2, 6).Value = 20;
        ws.Cell(2, 7).Value = 100;
        ws.Cell(2, 8).Value = 10;

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return Task.FromResult(stream.ToArray());
    }

    public async Task<byte[]> ExportToExcelAsync(int storeId)
    {
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.StoreId == storeId && p.IsActive)
            .OrderBy(p => p.Category.Name).ThenBy(p => p.Name)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Ürünler");

        // İçe aktarma ile aynı sütun sırası — export edip tekrar import edilebilir
        var headers = new[] { "Barkod*", "Ürün Adı*", "Kategori*", "Alış Fiyatı", "Satış Fiyatı*", "KDV %", "Stok", "Min Stok" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        var row = 2;
        foreach (var p in products)
        {
            ws.Cell(row, 1).Value = p.Barcode;
            ws.Cell(row, 2).Value = p.Name;
            ws.Cell(row, 3).Value = p.Category?.Name ?? "";
            ws.Cell(row, 4).Value = p.CostPrice;
            ws.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 5).Value = p.SalePrice;
            ws.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 6).Value = p.TaxRate;
            ws.Cell(row, 7).Value = p.StockQuantity;
            ws.Cell(row, 8).Value = p.MinStockLevel;
            row++;
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<Result<BulkUsdUpdateResult>> BulkUpdateUsdPricesAsync(int storeId)
    {
        var rate = await _exchangeRateService.RefreshAsync();
        if (rate <= 0)
            return Result<BulkUsdUpdateResult>.Fail("Güncel döviz kuru alınamadı. Lütfen daha sonra tekrar deneyin.");

        // USD'li ürünleri bul
        var usdProducts = await _context.Products
            .Where(p => p.StoreId == storeId && p.SalePriceUsd.HasValue && p.SalePriceUsd > 0)
            .ToListAsync();

        if (usdProducts.Count == 0)
            return Result<BulkUsdUpdateResult>.Ok(new BulkUsdUpdateResult
            {
                UpdatedCount = 0,
                NewExchangeRate = rate,
                UpdatedAt = DateTime.UtcNow
            });

        foreach (var p in usdProducts)
        {
            if (p.SalePriceUsd.HasValue)
                p.SalePrice = Math.Round(p.SalePriceUsd.Value * rate, 2);
            if (p.CostPriceUsd.HasValue)
                p.CostPrice = Math.Round(p.CostPriceUsd.Value * rate, 2);
            p.ExchangeRate = rate;
        }

        await _context.SaveChangesAsync();

        return Result<BulkUsdUpdateResult>.Ok(new BulkUsdUpdateResult
        {
            UpdatedCount = usdProducts.Count,
            NewExchangeRate = rate,
            UpdatedAt = DateTime.UtcNow
        });
    }
}
