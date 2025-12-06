using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

/// <summary>
/// Модель заказа
/// </summary>
public class Order
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Статус заказа: pending, approved, rejected
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Внешние ключи
    [Required]
    public int UserId { get; set; }
    
    [Required]
    public int WarehouseId { get; set; }
    
    // Навигационные свойства
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
    
    [ForeignKey("WarehouseId")]
    public virtual Warehouse? Warehouse { get; set; }
}
