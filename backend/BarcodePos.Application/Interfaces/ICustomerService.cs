using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Customers;

namespace BarcodePos.Application.Interfaces;

public interface ICustomerService
{
    Task<Result<PagedResult<CustomerDto>>> GetAllAsync(CustomerListFilter filter, int storeId);
    Task<Result<CustomerDto>> GetByIdAsync(int id, int storeId);
    Task<Result<CustomerDto>> CreateAsync(CreateCustomerRequest request, int storeId);
    Task<Result<CustomerDto>> UpdateAsync(int id, UpdateCustomerRequest request, int storeId);
    Task<Result<CustomerBalanceDto>> GetBalanceAsync(int id, int storeId);
    Task<Result<PagedResult<CustomerTransactionDto>>> GetTransactionsAsync(int id, int storeId, int page, int pageSize);
    Task<Result<List<CustomerSearchResult>>> SearchAsync(string query, int storeId);
    Task<Result> CollectPaymentAsync(int id, CustomerPaymentRequest request, int storeId);
}
