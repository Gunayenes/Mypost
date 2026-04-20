namespace BarcodePos.Application.DTOs.Sales;

public class CreateSaleRequest
{
    public int? CustomerId { get; set; }
    public string PaymentType { get; set; } = string.Empty;
    public decimal PaidAmount { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal PaidCash { get; set; }
    public decimal PaidCard { get; set; }
    public List<CreateSaleItemRequest> Items { get; set; } = [];
}

public class CreateSaleItemRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal DiscountAmount { get; set; }
}

public class SaleResponseDto
{
    public int Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime SaleDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public string PaymentType { get; set; } = string.Empty;
    public string PaymentTypeName { get; set; } = string.Empty;
    public decimal PaidCash { get; set; }
    public decimal PaidCard { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string CashierName { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public List<SaleItemResponseDto> Items { get; set; } = [];
}

public class SaleItemResponseDto
{
    public string ProductName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TaxRate { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal LineTotal { get; set; }
}

public class SaleListDto
{
    public int Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime SaleDate { get; set; }
    public decimal GrandTotal { get; set; }
    public string PaymentTypeName { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string CashierName { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string ItemsSummary { get; set; } = string.Empty;
    public int ItemCount { get; set; }
}

public class SaleListFilter
{
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? PaymentType { get; set; }
    public string? Status { get; set; }
    public int? CustomerId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
