using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для аутентификации и регистрации
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;
    
    public AuthController(AppDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }
    
    /// <summary>
    /// Регистрация нового пользователя (клиента)
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        // Валидация
        if (string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new AuthResponse 
            { 
                Success = false, 
                Message = "Все поля обязательны для заполнения" 
            });
        }
        
        if (request.Password.Length < 6)
        {
            return BadRequest(new AuthResponse 
            { 
                Success = false, 
                Message = "Пароль должен содержать минимум 6 символов" 
            });
        }
        
        // Проверка существования пользователя
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        
        if (existingUser != null)
        {
            return BadRequest(new AuthResponse 
            { 
                Success = false, 
                Message = "Пользователь с таким email уже существует" 
            });
        }
        
        // Создание пользователя
        var user = new User
        {
            Email = request.Email.ToLower(),
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Client"
        };
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        
        // Генерация токена
        var token = _jwtService.GenerateToken(user);
        
        // Нормализуем роль для ответа
        var normalizedRole = char.ToUpper(user.Role[0]) + user.Role.Substring(1).ToLower();
        
        return Ok(new AuthResponse
        {
            Success = true,
            Message = "Регистрация успешна",
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = normalizedRole
            }
        });
    }
    
    /// <summary>
    /// Вход в систему
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        // Валидация
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new AuthResponse 
            { 
                Success = false, 
                Message = "Email и пароль обязательны" 
            });
        }
        
        // Поиск пользователя
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        
        if (user == null)
        {
            return Unauthorized(new AuthResponse 
            { 
                Success = false, 
                Message = "Неверный email или пароль" 
            });
        }
        
        // Проверка активности
        if (!user.IsActive)
        {
            return Unauthorized(new AuthResponse 
            { 
                Success = false, 
                Message = "Аккаунт деактивирован" 
            });
        }
        
        // Проверка пароля
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new AuthResponse 
            { 
                Success = false, 
                Message = "Неверный email или пароль" 
            });
        }
        
        // Генерация токена
        var token = _jwtService.GenerateToken(user);
        
        // Нормализуем роль для ответа
        var normalizedRole = char.ToUpper(user.Role[0]) + user.Role.Substring(1).ToLower();
        
        return Ok(new AuthResponse
        {
            Success = true,
            Message = "Вход выполнен успешно",
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = normalizedRole
            }
        });
    }
    
    /// <summary>
    /// Получение информации о текущем пользователе
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser()
    {
        var userId = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<UserDto> 
            { 
                Success = false, 
                Message = "Не авторизован" 
            });
        }
        
        var user = await _context.Users.FindAsync(int.Parse(userId));
        if (user == null)
        {
            return NotFound(new ApiResponse<UserDto> 
            { 
                Success = false, 
                Message = "Пользователь не найден" 
            });
        }
        
        // Нормализуем роль для ответа
        var normalizedRole = char.ToUpper(user.Role[0]) + user.Role.Substring(1).ToLower();
        
        return Ok(new ApiResponse<UserDto>
        {
            Success = true,
            Data = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = normalizedRole
            }
        });
    }
    
    /// <summary>
    /// Сброс пароля для тестирования (только development)
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new ApiResponse<object> 
            { 
                Success = false, 
                Message = "Email и новый пароль обязательны" 
            });
        }
        
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        
        if (user == null)
        {
            return NotFound(new ApiResponse<object> 
            { 
                Success = false, 
                Message = "Пользователь не найден" 
            });
        }
        
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Пароль успешно обновлён"
        });
    }
}
