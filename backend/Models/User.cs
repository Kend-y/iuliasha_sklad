using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

/// <summary>
/// Модель пользователя системы
/// </summary>
public class User
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    
    /// <summary>
    /// Роль пользователя: "Admin" или "Client"
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "Client";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;
    
    // Навигационные свойства
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
