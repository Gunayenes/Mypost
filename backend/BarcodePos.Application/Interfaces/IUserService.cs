using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Users;

namespace BarcodePos.Application.Interfaces;

public interface IUserService
{
    Task<Result<List<UserDto>>> GetAllAsync(int storeId);
    Task<Result<UserDto>> GetByIdAsync(int id, int storeId);
    Task<Result<UserDto>> CreateAsync(CreateUserRequest request, int storeId);
    Task<Result<UserDto>> UpdateAsync(int id, UpdateUserRequest request, int storeId);
    Task<Result> ChangeRoleAsync(int id, ChangeRoleRequest request, int storeId);
    Task<Result> ToggleStatusAsync(int id, int storeId);
}
