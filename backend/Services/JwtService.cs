using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Backend.Models;

namespace Backend.Services;

/// <summary>
/// Сервис для генерации JWT токенов
/// </summary>
public class JwtService
{
    private readonly IConfiguration _configuration;
    
    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    /// <summary>
    /// Генерирует JWT токен для пользователя
    /// </summary>
    public string GenerateToken(User user)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "YourSuperSecretKeyForJWTTokenGeneration123!";
        var issuer = _configuration["Jwt:Issuer"] ?? "WarehouseAPI";
        var audience = _configuration["Jwt:Audience"] ?? "WarehouseClient";
        
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        // Нормализуем роль: первая буква заглавная
        var normalizedRole = char.ToUpper(user.Role[0]) + user.Role.Substring(1).ToLower();
        
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, normalizedRole),
            new Claim("userId", user.Id.ToString())
        };
        
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    /// <summary>
    /// Валидирует JWT токен и возвращает claims
    /// </summary>
    public ClaimsPrincipal? ValidateToken(string token)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "YourSuperSecretKeyForJWTTokenGeneration123!";
        
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(secretKey);
        
        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out _);
            
            return principal;
        }
        catch
        {
            return null;
        }
    }
}
