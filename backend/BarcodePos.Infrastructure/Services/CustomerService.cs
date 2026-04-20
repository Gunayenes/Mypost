using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Customers;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Entities;
using BarcodePos.Domain.Enums;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _context;

    public CustomerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<CustomerDto>>> GetAllAsync(CustomerListFilter filter, int storeId)
    {
        var query = _context.Customers
            .AsNoTracking()
            .Where(c => c.StoreId == storeId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(search)
                                  || (c.Phone != null && c.Phone.Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.FullName)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(c => MapToDto(c))
            .ToListAsync();

        return Result<PagedResult<CustomerDto>>.Ok(
            PagedResult<CustomerDto>.Create(items, totalCount, filter.Page, filter.PageSize));
    }

    public async Task<Result<CustomerDto>> GetByIdAsync(int id, int storeId)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

        if (customer is null)
            return Result<CustomerDto>.Fail("Müşteri bulunamadı.");

        return Result<CustomerDto>.Ok(MapToDto(customer));
    }

    public async Task<Result<CustomerDto>> CreateAsync(CreateCustomerRequest request, int storeId)
    {
        var customer = new Customer
        {
            StoreId = storeId,
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            Balance = 0,
            IsActive = true
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return Result<CustomerDto>.Ok(MapToDto(customer), "Müşteri oluşturuldu.");
    }

    public async Task<Result<CustomerDto>> UpdateAsync(int id, UpdateCustomerRequest request, int storeId)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

        if (customer is null)
            return Result<CustomerDto>.Fail("Müşteri bulunamadı.");

        customer.FullName = request.FullName;
        customer.Phone = request.Phone;
        customer.Email = request.Email;
        customer.Address = request.Address;

        await _context.SaveChangesAsync();

        return Result<CustomerDto>.Ok(MapToDto(customer), "Müşteri güncellendi.");
    }

    public async Task<Result<CustomerBalanceDto>> GetBalanceAsync(int id, int storeId)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

        if (customer is null)
            return Result<CustomerBalanceDto>.Fail("Müşteri bulunamadı.");

        var totalDebt = await _context.CustomerTransactions
            .Where(ct => ct.CustomerId == id && ct.Type == TransactionType.Borc)
            .SumAsync(ct => (decimal?)ct.Amount) ?? 0;

        var totalPayment = await _context.CustomerTransactions
            .Where(ct => ct.CustomerId == id && ct.Type == TransactionType.Odeme)
            .SumAsync(ct => (decimal?)ct.Amount) ?? 0;

        return Result<CustomerBalanceDto>.Ok(new CustomerBalanceDto
        {
            CustomerId = customer.Id,
            FullName = customer.FullName,
            Balance = customer.Balance,
            TotalDebt = totalDebt,
            TotalPayment = totalPayment
        });
    }

    public async Task<Result<PagedResult<CustomerTransactionDto>>> GetTransactionsAsync(
        int id, int storeId, int page, int pageSize)
    {
        // Müşteri varlık kontrolü
        var exists = await _context.Customers
            .AnyAsync(c => c.Id == id && c.StoreId == storeId);

        if (!exists)
            return Result<PagedResult<CustomerTransactionDto>>.Fail("Müşteri bulunamadı.");

        var query = _context.CustomerTransactions
            .AsNoTracking()
            .Where(ct => ct.CustomerId == id);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(ct => ct.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ct => new CustomerTransactionDto
            {
                Id = ct.Id,
                SaleId = ct.SaleId,
                Type = ct.Type.ToString(),
                TypeName = ct.Type == TransactionType.Borc ? "Borç" : "Ödeme",
                Amount = ct.Amount,
                BalanceAfter = ct.BalanceAfter,
                Note = ct.Note,
                CreatedAt = ct.CreatedAt
            })
            .ToListAsync();

        return Result<PagedResult<CustomerTransactionDto>>.Ok(
            PagedResult<CustomerTransactionDto>.Create(items, totalCount, page, pageSize));
    }

    public async Task<Result<List<CustomerSearchResult>>> SearchAsync(string query, int storeId)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Result<List<CustomerSearchResult>>.Ok([]);

        var search = query.ToLower();

        var results = await _context.Customers
            .AsNoTracking()
            .Where(c => c.StoreId == storeId
                     && c.IsActive
                     && (c.FullName.ToLower().Contains(search)
                         || (c.Phone != null && c.Phone.Contains(search))))
            .OrderBy(c => c.FullName)
            .Take(20)
            .Select(c => new CustomerSearchResult
            {
                Id = c.Id,
                FullName = c.FullName,
                Phone = c.Phone,
                Balance = c.Balance
            })
            .ToListAsync();

        return Result<List<CustomerSearchResult>>.Ok(results);
    }

    public async Task<Result> CollectPaymentAsync(int id, CustomerPaymentRequest request, int storeId)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

        if (customer is null)
            return Result.Fail("Müşteri bulunamadı.");

        if (request.Amount > customer.Balance)
            return Result.Fail("Ödeme tutarı mevcut borçtan fazla olamaz.");

        // Bakiyeyi güncelle
        customer.Balance -= request.Amount;

        // Ödeme hareketi oluştur
        var transaction = new CustomerTransaction
        {
            CustomerId = customer.Id,
            SaleId = null,
            Type = TransactionType.Odeme,
            Amount = request.Amount,
            BalanceAfter = customer.Balance,
            Note = request.Note
        };

        _context.CustomerTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Result.Ok($"Tahsilat başarılı. Yeni bakiye: {customer.Balance:C2}");
    }

    private static CustomerDto MapToDto(Customer c) => new()
    {
        Id = c.Id,
        FullName = c.FullName,
        Phone = c.Phone,
        Email = c.Email,
        Address = c.Address,
        Balance = c.Balance,
        IsActive = c.IsActive,
        CreatedAt = c.CreatedAt
    };
}
