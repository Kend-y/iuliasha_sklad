using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

/// <summary>
/// История действий в системе
/// </summary>
public class ActionHistory
{
    [Key]
    public int Id { get; set; }
    
    /// <summary>
    /// Тип действия: order_created, order_approved, order_rejected, 
    /// warehouse_created, warehouse_suspended, warehouse_deleted
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ActionType { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // ID пользователя, выполнившего действие
    public int? UserId { get; set; }
    
    // ID связанного заказа (если применимо)
    public int? OrderId { get; set; }
    
    // ID связанного склада (если применимо)
    public int? WarehouseId { get; set; }
    
    // Навигационные свойства
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
    
    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }
    
    [ForeignKey("WarehouseId")]
    public virtual Warehouse? Warehouse { get; set; }
}
