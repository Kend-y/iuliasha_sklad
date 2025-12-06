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
    public DbSet<Category> Categories { get; set; }
    public DbSet<StorageLocation> StorageLocations { get; set; }
    public DbSet<Item> Items { get; set; }
    public DbSet<ItemMovement> ItemMovements { get; set; }
    
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
        
        // Связь Item -> Owner (User)
        modelBuilder.Entity<Item>()
            .HasOne(i => i.Owner)
            .WithMany()
            .HasForeignKey(i => i.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Связь Item -> Category
        modelBuilder.Entity<Item>()
            .HasOne(i => i.Category)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Связь Item -> StorageLocation
        modelBuilder.Entity<Item>()
            .HasOne(i => i.StorageLocation)
            .WithMany(s => s.Items)
            .HasForeignKey(i => i.StorageLocationId)
            .OnDelete(DeleteBehavior.SetNull);
        
        // Связь Item -> Warehouse
        modelBuilder.Entity<Item>()
            .HasOne(i => i.Warehouse)
            .WithMany()
            .HasForeignKey(i => i.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Связь StorageLocation -> Warehouse
        modelBuilder.Entity<StorageLocation>()
            .HasOne(s => s.Warehouse)
            .WithMany()
            .HasForeignKey(s => s.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Уникальный код места хранения
        modelBuilder.Entity<StorageLocation>()
            .HasIndex(s => s.Code)
            .IsUnique();
        
        // Уникальный код вещи
        modelBuilder.Entity<Item>()
            .HasIndex(i => i.UniqueCode)
            .IsUnique();
        
        // Связь ItemMovement -> Item
        modelBuilder.Entity<ItemMovement>()
            .HasOne(m => m.Item)
            .WithMany(i => i.Movements)
            .HasForeignKey(m => m.ItemId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Связь ItemMovement -> PerformedBy
        modelBuilder.Entity<ItemMovement>()
            .HasOne(m => m.PerformedBy)
            .WithMany()
            .HasForeignKey(m => m.PerformedById)
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
        
        // Seed данные: категории вещей
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Одежда", Description = "Одежда и текстиль", Icon = "👕", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 2, Name = "Техника", Description = "Электроника и бытовая техника", Icon = "💻", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 3, Name = "Мебель", Description = "Мебель и предметы интерьера", Icon = "🪑", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 4, Name = "Документы", Description = "Документы и архивы", Icon = "📄", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 5, Name = "Спорттовары", Description = "Спортивный инвентарь", Icon = "⚽", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 6, Name = "Личные вещи", Description = "Прочие личные вещи", Icon = "📦", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        // Seed данные: места хранения для центрального склада
        modelBuilder.Entity<StorageLocation>().HasData(
            new StorageLocation { Id = 1, Code = "A1-01", Name = "Секция A, Стеллаж 1, Ячейка 1", Section = "A", Shelf = "1", Cell = "01", Size = "small", WarehouseId = 1, DailyRate = 50, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new StorageLocation { Id = 2, Code = "A1-02", Name = "Секция A, Стеллаж 1, Ячейка 2", Section = "A", Shelf = "1", Cell = "02", Size = "small", WarehouseId = 1, DailyRate = 50, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new StorageLocation { Id = 3, Code = "A2-01", Name = "Секция A, Стеллаж 2, Ячейка 1", Section = "A", Shelf = "2", Cell = "01", Size = "medium", WarehouseId = 1, DailyRate = 100, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new StorageLocation { Id = 4, Code = "B1-01", Name = "Секция B, Стеллаж 1, Ячейка 1", Section = "B", Shelf = "1", Cell = "01", Size = "large", WarehouseId = 1, DailyRate = 200, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new StorageLocation { Id = 5, Code = "B1-02", Name = "Секция B, Стеллаж 1, Ячейка 2", Section = "B", Shelf = "1", Cell = "02", Size = "xlarge", WarehouseId = 1, DailyRate = 350, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        // Seed данные: сотрудник склада
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 2,
            Email = "employee@warehouse.com",
            FullName = "Сотрудник Склада",
            // Пароль: employee123
            PasswordHash = "$2a$11$rICk8xV5vqLz9miVL5z5/.2hGw4UVAJVowLY.wLvlPCXJZTMcXjHu",
            Role = "Employee",
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true
        });
    }
}
