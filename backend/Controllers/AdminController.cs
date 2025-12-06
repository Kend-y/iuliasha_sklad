using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/admin/admins
    [HttpGet("admins")]
    public async Task<IActionResult> GetAdmins()
    {
        var admins = await _context.Users
            .Where(u => u.Role == "Admin")
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(new { success = true, data = admins });
    }

    // POST: api/admin/admins
    [HttpPost("admins")]
    public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.FullName))
        {
            return BadRequest(new { success = false, message = "Все поля обязательны" });
        }

        // Проверяем, не существует ли уже пользователь с таким email
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());
        if (existingUser != null)
        {
            return BadRequest(new { success = false, message = "Пользователь с таким email уже существует" });
        }

        var admin = new User
        {
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName,
            Role = "Admin",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Users.Add(admin);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Администратор создан",
            data = new
            {
                admin.Id,
                admin.Email,
                admin.FullName,
                admin.CreatedAt
            }
        });
    }

    // DELETE: api/admin/admins/{id}
    [HttpDelete("admins/{id}")]
    public async Task<IActionResult> DeleteAdmin(int id)
    {
        // Получаем текущего пользователя
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (id == currentUserId)
        {
            return BadRequest(new { success = false, message = "Нельзя удалить самого себя" });
        }

        var admin = await _context.Users.FindAsync(id);

        if (admin == null)
        {
            return NotFound(new { success = false, message = "Администратор не найден" });
        }

        if (admin.Role != "Admin")
        {
            return BadRequest(new { success = false, message = "Этот пользователь не является администратором" });
        }

        // Проверяем, что это не последний администратор
        var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");
        if (adminCount <= 1)
        {
            return BadRequest(new { success = false, message = "Нельзя удалить последнего администратора" });
        }

        _context.Users.Remove(admin);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Администратор удалён" });
    }
}

public class CreateAdminDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}
