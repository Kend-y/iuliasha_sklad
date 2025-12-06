using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

/// <summary>
/// Место хранения на складе (секция, стеллаж, ячейка)
/// </summary>
public class StorageLocation
{
    [Key]
    public int Id { get; set; }
    
    /// <summary>
    /// Код места (например: A1-01, B2-15)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Название/описание места
    /// </summary>
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Секция склада
    /// </summary>
    [MaxLength(50)]
    public string Section { get; set; } = string.Empty;
    
    /// <summary>
    /// Номер стеллажа
    /// </summary>
    [MaxLength(50)]
    public string Shelf { get; set; } = string.Empty;
    
    /// <summary>
    /// Номер ячейки
    /// </summary>
    [MaxLength(50)]
    public string Cell { get; set; } = string.Empty;
    
    /// <summary>
    /// Размер места (small, medium, large, xlarge)
    /// </summary>
    [MaxLength(20)]
    public string Size { get; set; } = "medium";
    
    /// <summary>
    /// Занято ли место
    /// </summary>
    public bool IsOccupied { get; set; } = false;
    
    /// <summary>
    /// Стоимость хранения в день (руб.)
    /// </summary>
    public decimal DailyRate { get; set; } = 0;
    
    /// <summary>
    /// Статус: active, maintenance, reserved
    /// </summary>
    [MaxLength(20)]
    public string Status { get; set; } = "active";
    
    /// <summary>
    /// Дата окончания резервации (если зарезервировано)
    /// </summary>
    public DateTime? ReservedUntil { get; set; }
    
    /// <summary>
    /// Активно ли место хранения
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Внешние ключи
    [Required]
    public int WarehouseId { get; set; }
    
    // Навигационные свойства
    [ForeignKey("WarehouseId")]
    public virtual Warehouse? Warehouse { get; set; }
    
    public virtual ICollection<Item> Items { get; set; } = new List<Item>();
}
