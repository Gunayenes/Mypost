using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Users;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Enums;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Services;

/// <summary>
/// Kullanıcı yönetim servisi. CRUD, rol değiştirme ve durum toggle işlemlerini yönetir.
/// Sadece Admin tarafından kullanılır.
/// </summary>
public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<UserDto>>> GetAllAsync(int storeId)
    {
        var users = await _context.Users
            .AsNoTracking()
            .Where(u => u.StoreId == storeId)
            .OrderBy(u => u.FullName)
            .Select(u => MapToDto(u))
            .ToListAsync();

        return Result<List<UserDto>>.Ok(users);
    }

    public async Task<Result<UserDto>> GetByIdAsync(int id, int storeId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id && u.StoreId == storeId);

        if (user is null)
            return Result<UserDto>.Fail("Kullanıcı bulunamadı.");

        return Result<UserDto>.Ok(MapToDto(user));
    }

    public async Task<Result<UserDto>> CreateAsync(CreateUserRequest request, int storeId)
    {
        // Kullanıcı adı benzersizlik kontrolü
        var exists = await _context.Users
            .AnyAsync(u => u.Username == request.Username && u.StoreId == storeId);

        if (exists)
            return Result<UserDto>.Fail("Bu kullanıcı adı zaten kullanılıyor.");

        if (!Enum.TryParse<UserRole>(request.Role, out var role))
            return Result<UserDto>.Fail("Geçersiz rol.");

        var user = new Domain.Entities.User
        {
            StoreId = storeId,
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = role,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Result<UserDto>.Ok(MapToDto(user), "Kullanıcı başarıyla oluşturuldu.");
    }

    public async Task<Result<UserDto>> UpdateAsync(int id, UpdateUserRequest request, int storeId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.StoreId == storeId);

        if (user is null)
            return Result<UserDto>.Fail("Kullanıcı bulunamadı.");

        user.FullName = request.FullName;
        await _context.SaveChangesAsync();

        return Result<UserDto>.Ok(MapToDto(user), "Kullanıcı güncellendi.");
    }

    public async Task<Result> ChangeRoleAsync(int id, ChangeRoleRequest request, int storeId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.StoreId == storeId);

        if (user is null)
            return Result.Fail("Kullanıcı bulunamadı.");

        if (!Enum.TryParse<UserRole>(request.Role, out var role))
            return Result.Fail("Geçersiz rol.");

        user.Role = role;
        await _context.SaveChangesAsync();

        return Result.Ok("Kullanıcı rolü güncellendi.");
    }

    public async Task<Result> ToggleStatusAsync(int id, int storeId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.StoreId == storeId);

        if (user is null)
            return Result.Fail("Kullanıcı bulunamadı.");

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();

        var status = user.IsActive ? "aktif" : "pasif";
        return Result.Ok($"Kullanıcı {status} yapıldı.");
    }

    private static UserDto MapToDto(Domain.Entities.User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        FullName = user.FullName,
        Role = user.Role.ToString(),
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt
    };
}
