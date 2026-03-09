using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Categories;

namespace BarcodePos.Application.Interfaces;

public interface ICategoryService
{
    Task<Result<List<CategoryDto>>> GetAllAsync(int storeId);
    Task<Result<CategoryDto>> GetByIdAsync(int id, int storeId);
    Task<Result<CategoryDto>> CreateAsync(CreateCategoryRequest request, int storeId);
    Task<Result<CategoryDto>> UpdateAsync(int id, UpdateCategoryRequest request, int storeId);
    Task<Result> DeleteAsync(int id, int storeId);
}
