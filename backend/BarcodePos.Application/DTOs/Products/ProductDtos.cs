namespace BarcodePos.Application.DTOs.Products;

public class ProductDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? CostPriceUsd { get; set; }
    public decimal? SalePriceUsd { get; set; }
    public decimal? ExchangeRate { get; set; }
    /// <summary>USD'li ürünlerde günlük güncel kurla anlık hesaplanmış TL fiyat.</summary>
    public decimal? CurrentSalePrice { get; set; }
    /// <summary>USD'li ürünlerde günlük güncel kurla anlık hesaplanmış TL alış.</summary>
    public decimal? CurrentCostPrice { get; set; }
    /// <summary>Anlık fiyat hesaplanırken kullanılan güncel kur.</summary>
    public decimal? CurrentExchangeRate { get; set; }
    public decimal TaxRate { get; set; }
    public int StockQuantity { get; set; }
    public int MinStockLevel { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateProductRequest
{
    public int CategoryId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? CostPriceUsd { get; set; }
    public decimal? SalePriceUsd { get; set; }
    public decimal? ExchangeRate { get; set; }
    public decimal TaxRate { get; set; }
    public int StockQuantity { get; set; }
    public int MinStockLevel { get; set; }
}

public class UpdateProductRequest
{
    public int CategoryId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? CostPriceUsd { get; set; }
    public decimal? SalePriceUsd { get; set; }
    public decimal? ExchangeRate { get; set; }
    public decimal TaxRate { get; set; }
    public int MinStockLevel { get; set; }
}

public class ProductListFilter
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public bool? LowStockOnly { get; set; }
    public bool? IsActive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class LowStockProductDto
{
    public int ProductId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public int MinStockLevel { get; set; }
    public int Difference { get; set; }
}

public class BulkImportResultDto
{
    public int TotalRows { get; set; }
    public int SuccessCount { get; set; }
    public int SkippedCount { get; set; }
    public int ErrorCount { get; set; }
    public List<BulkImportError> Errors { get; set; } = [];
}

public class BulkImportError
{
    public int Row { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
