using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

/// <summary>
/// Уведомления для пользователей
/// </summary>
public class Notification
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Тип уведомления: new_order, order_status_changed, warehouse_update
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;
    
    public bool IsRead { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // ID пользователя, которому предназначено уведомление
    [Required]
    public int UserId { get; set; }
    
    // Связанные сущности
    public int? OrderId { get; set; }
    public int? WarehouseId { get; set; }
    
    // Навигационные свойства
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
    
    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }
    
    [ForeignKey("WarehouseId")]
    public virtual Warehouse? Warehouse { get; set; }
}
