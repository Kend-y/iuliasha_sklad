using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

/// <summary>
/// Модель склада
/// </summary>
public class Warehouse
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Статус склада: active, suspended, deleted
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "active";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Навигационные свойства
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
