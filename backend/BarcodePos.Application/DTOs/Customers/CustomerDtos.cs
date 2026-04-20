namespace BarcodePos.Application.DTOs.Customers;

public class CustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public decimal Balance { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCustomerRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
}

public class UpdateCustomerRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
}

public class CustomerBalanceDto
{
    public int CustomerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal TotalDebt { get; set; }
    public decimal TotalPayment { get; set; }
}

public class CustomerTransactionDto
{
    public int Id { get; set; }
    public int? SaleId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CustomerPaymentRequest
{
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class CustomerSearchResult
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public decimal Balance { get; set; }
}

public class CustomerListFilter
{
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
