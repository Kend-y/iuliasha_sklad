using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

/// <summary>
/// Контекст базы данных Entity Framework
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<ActionHistory> ActionHistories { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Уникальный индекс для email пользователя
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        
        // Связь Order -> User
        modelBuilder.Entity<Order>()
            .HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Связь Order -> Warehouse
        modelBuilder.Entity<Order>()
            .HasOne(o => o.Warehouse)
            .WithMany(w => w.Orders)
            .HasForeignKey(o => o.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Seed данные: админ по умолчанию
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Email = "admin@warehouse.com",
            FullName = "Администратор",
            // Пароль: admin123
            PasswordHash = "$2a$11$rICk8xV5vqLz9miVL5z5/.2hGw4UVAJVowLY.wLvlPCXJZTMcXjHu",
            Role = "Admin",
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true
        });
        
        // Seed данные: тестовые склады
        modelBuilder.Entity<Warehouse>().HasData(
            new Warehouse
            {
                Id = 1,
                Name = "Центральный склад",
                Address = "г. Москва, ул. Складская, д. 1",
                Description = "Основной склад для хранения товаров",
                Status = "active",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Warehouse
            {
                Id = 2,
                Name = "Северный склад",
                Address = "г. Санкт-Петербург, ул. Промышленная, д. 15",
                Description = "Склад для северного региона",
                Status = "active",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Warehouse
            {
                Id = 3,
                Name = "Южный склад",
                Address = "г. Краснодар, ул. Логистическая, д. 8",
                Description = "Склад для южного региона",
                Status = "active",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
