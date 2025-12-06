using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

/// <summary>
/// Категория вещей (одежда, техника, мебель и др.)
/// </summary>
public class Category
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Иконка категории (название иконки или emoji)
    /// </summary>
    [MaxLength(50)]
    public string Icon { get; set; } = "📦";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;
    
    // Навигационные свойства
    public virtual ICollection<Item> Items { get; set; } = new List<Item>();
}
