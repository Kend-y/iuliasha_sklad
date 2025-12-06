using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

/// <summary>
/// Вещь/предмет на хранении
/// </summary>
public class Item
{
    [Key]
    public int Id { get; set; }
    
    /// <summary>
    /// Уникальный идентификатор вещи (штрих-код)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string UniqueCode { get; set; } = string.Empty;
    
    /// <summary>
    /// Наименование вещи
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Описание вещи
    /// </summary>
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Состояние вещи: new, good, fair, poor, damaged
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Condition { get; set; } = "good";
    
    /// <summary>
    /// Статус хранения: pending_intake, stored, pending_release, released, disposed
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "pending_intake";
    
    /// <summary>
    /// Фото вещи (URL или base64)
    /// </summary>
    public string? PhotoUrl { get; set; }
    
    /// <summary>
    /// Оценочная стоимость вещи (руб.)
    /// </summary>
    public decimal? EstimatedValue { get; set; }
    
    /// <summary>
    /// Стоимость хранения в день (руб.)
    /// </summary>
    public decimal DailyStorageCost { get; set; } = 0;
    
    /// <summary>
    /// Дата приёма на хранение
    /// </summary>
    public DateTime? IntakeDate { get; set; }
    
    /// <summary>
    /// Планируемая дата выдачи
    /// </summary>
    public DateTime? PlannedReleaseDate { get; set; }
    
    /// <summary>
    /// Фактическая дата выдачи
    /// </summary>
    public DateTime? ActualReleaseDate { get; set; }
    
    /// <summary>
    /// Примечания
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Внешние ключи
    
    /// <summary>
    /// Владелец/арендатор вещи
    /// </summary>
    [Required]
    public int OwnerId { get; set; }
    
    /// <summary>
    /// Категория вещи
    /// </summary>
    [Required]
    public int CategoryId { get; set; }
    
    /// <summary>
    /// Место хранения (может быть null, если еще не размещена)
    /// </summary>
    public int? StorageLocationId { get; set; }
    
    /// <summary>
    /// Склад
    /// </summary>
    [Required]
    public int WarehouseId { get; set; }
    
    // Навигационные свойства
    [ForeignKey("OwnerId")]
    public virtual User? Owner { get; set; }
    
    [ForeignKey("CategoryId")]
    public virtual Category? Category { get; set; }
    
    [ForeignKey("StorageLocationId")]
    public virtual StorageLocation? StorageLocation { get; set; }
    
    [ForeignKey("WarehouseId")]
    public virtual Warehouse? Warehouse { get; set; }
    
    public virtual ICollection<ItemMovement> Movements { get; set; } = new List<ItemMovement>();
}
