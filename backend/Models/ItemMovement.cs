using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

/// <summary>
/// История перемещений и изменений состояния вещи
/// </summary>
public class ItemMovement
{
    [Key]
    public int Id { get; set; }
    
    /// <summary>
    /// Тип действия: intake, release, move, condition_change, status_change
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string ActionType { get; set; } = string.Empty;
    
    /// <summary>
    /// Описание действия
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Предыдущее место хранения (для перемещений)
    /// </summary>
    public int? FromLocationId { get; set; }
    
    /// <summary>
    /// Новое место хранения (для перемещений)
    /// </summary>
    public int? ToLocationId { get; set; }
    
    /// <summary>
    /// Предыдущее состояние
    /// </summary>
    [MaxLength(30)]
    public string? PreviousCondition { get; set; }
    
    /// <summary>
    /// Новое состояние
    /// </summary>
    [MaxLength(30)]
    public string? NewCondition { get; set; }
    
    /// <summary>
    /// Предыдущий статус
    /// </summary>
    [MaxLength(30)]
    public string? PreviousStatus { get; set; }
    
    /// <summary>
    /// Новый статус
    /// </summary>
    [MaxLength(30)]
    public string? NewStatus { get; set; }
    
    /// <summary>
    /// Примечания
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Внешние ключи
    
    /// <summary>
    /// Вещь
    /// </summary>
    [Required]
    public int ItemId { get; set; }
    
    /// <summary>
    /// Сотрудник, выполнивший действие
    /// </summary>
    [Required]
    public int PerformedById { get; set; }
    
    // Навигационные свойства
    [ForeignKey("ItemId")]
    public virtual Item? Item { get; set; }
    
    [ForeignKey("PerformedById")]
    public virtual User? PerformedBy { get; set; }
    
    [ForeignKey("FromLocationId")]
    public virtual StorageLocation? FromLocation { get; set; }
    
    [ForeignKey("ToLocationId")]
    public virtual StorageLocation? ToLocation { get; set; }
}
