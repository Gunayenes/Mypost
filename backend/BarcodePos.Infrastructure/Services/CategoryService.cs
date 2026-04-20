using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Categories;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Entities;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<CategoryDto>>> GetAllAsync(int storeId)
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Where(c => c.StoreId == storeId)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();

        return Result<List<CategoryDto>>.Ok(categories);
    }

    public async Task<Result<CategoryDto>> GetByIdAsync(int id, int storeId)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Where(c => c.Id == id && c.StoreId == storeId)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .FirstOrDefaultAsync();

        if (category is null)
            return Result<CategoryDto>.Fail("Kategori bulunamadı.");

        return Result<CategoryDto>.Ok(category);
    }

    public async Task<Result<CategoryDto>> CreateAsync(CreateCategoryRequest request, int storeId)
    {
        // Aynı mağazada aynı isimde kategori kontrolü
        var exists = await _context.Categories
            .AnyAsync(c => c.StoreId == storeId && c.Name == request.Name && c.IsActive);

        if (exists)
            return Result<CategoryDto>.Fail("Bu isimde bir kategori zaten mevcut.");

        var category = new Category
        {
            StoreId = storeId,
            Name = request.Name,
            Description = request.Description,
            IsActive = true
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Result<CategoryDto>.Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            ProductCount = 0
        }, "Kategori oluşturuldu.");
    }

    public async Task<Result<CategoryDto>> UpdateAsync(int id, UpdateCategoryRequest request, int storeId)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

        if (category is null)
            return Result<CategoryDto>.Fail("Kategori bulunamadı.");

        // İsim benzersizlik kontrolü (kendisi hariç)
        var nameExists = await _context.Categories
            .AnyAsync(c => c.StoreId == storeId && c.Name == request.Name && c.Id != id && c.IsActive);

        if (nameExists)
            return Result<CategoryDto>.Fail("Bu isimde bir kategori zaten mevcut.");

        category.Name = request.Name;
        category.Description = request.Description;
        await _context.SaveChangesAsync();

        var productCount = await _context.Products.CountAsync(p => p.CategoryId == id && p.IsActive);

        return Result<CategoryDto>.Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            ProductCount = productCount
        }, "Kategori güncellendi.");
    }

    public async Task<Result> DeleteAsync(int id, int storeId)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

        if (category is null)
            return Result.Fail("Kategori bulunamadı.");

        // Aktif ürünü olan kategori silinemez
        var hasActiveProducts = await _context.Products
            .AnyAsync(p => p.CategoryId == id && p.IsActive);

        if (hasActiveProducts)
            return Result.Fail("Bu kategoride aktif ürünler bulunduğu için silinemez.");

        category.IsActive = false;
        await _context.SaveChangesAsync();

        return Result.Ok("Kategori pasif yapıldı.");
    }
}
