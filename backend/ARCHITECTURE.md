# 🔧 Архитектура Backend

## Общее описание

Backend построен на **ASP.NET Core 8.0** с использованием паттерна **Web API**. Приложение использует **Entity Framework Core** для работы с базой данных SQLite и **SignalR** для real-time коммуникации.

---

## 📂 Структура проекта

```
backend/
├── Controllers/          # API контроллеры (обработка HTTP запросов)
├── Models/               # Модели данных (сущности БД)
├── Data/                 # Контекст базы данных
├── DTOs/                 # Data Transfer Objects (объекты для передачи данных)
├── Services/             # Бизнес-логика (сервисы)
├── Hubs/                 # SignalR хабы (real-time)
├── Program.cs            # Точка входа и конфигурация
├── appsettings.json      # Настройки приложения
└── backend.csproj        # Файл проекта
```

---

## 🔄 Поток данных

```
┌─────────────────┐     HTTP Request      ┌──────────────────┐
│                 │ ───────────────────►  │                  │
│    Frontend     │                       │   Controller     │
│   (Next.js)     │  ◄───────────────────  │                  │
│                 │     JSON Response     │                  │
└─────────────────┘                       └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │                  │
                                          │    Services      │
                                          │  (Бизнес-логика) │
                                          │                  │
                                          └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │                  │
                                          │   DbContext      │
                                          │ (Entity Framework)│
                                          │                  │
                                          └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │                  │
                                          │     SQLite       │
                                          │   (warehouse.db) │
                                          │                  │
                                          └──────────────────┘
```

---

## 📋 Компоненты

### 1. Program.cs - Точка входа

Главный файл конфигурации приложения. Здесь настраиваются:

```csharp
// 1. Dependency Injection (внедрение зависимостей)
builder.Services.AddDbContext<AppDbContext>();    // База данных
builder.Services.AddScoped<JwtService>();          // JWT сервис
builder.Services.AddScoped<NotificationService>(); // Сервис уведомлений

// 2. Аутентификация JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { ... });

// 3. CORS (разрешаем запросы с frontend)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 4. SignalR для real-time
builder.Services.AddSignalR();

// 5. Middleware pipeline
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
```

### 2. Models - Модели данных

Модели представляют таблицы в базе данных:

#### User (Пользователь)

```csharp
public class User
{
    public int Id { get; set; }
    public string Email { get; set; }        // Уникальный email
    public string FullName { get; set; }     // Полное имя
    public string PasswordHash { get; set; } // Хеш пароля (BCrypt)
    public string Role { get; set; }         // "admin" или "client"
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }

    // Навигация
    public ICollection<Order> Orders { get; set; }
}
```

#### Warehouse (Склад)

```csharp
public class Warehouse
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }  // "active", "suspended", "deleted"
    public DateTime CreatedAt { get; set; }
}
```

#### Order (Заказ)

```csharp
public class Order
{
    public int Id { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }  // "pending", "approved", "rejected"
    public DateTime CreatedAt { get; set; }

    // Связи
    public int UserId { get; set; }      // Кто создал
    public int WarehouseId { get; set; } // На какой склад
}
```

### 3. Controllers - API контроллеры

Контроллеры обрабатывают HTTP запросы:

#### AuthController - Аутентификация

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // POST /api/auth/register - Регистрация нового пользователя
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        // 1. Валидация данных
        // 2. Проверка существования email
        // 3. Хеширование пароля (BCrypt)
        // 4. Сохранение в БД
        // 5. Генерация JWT токена
        // 6. Возврат токена и данных пользователя
    }

    // POST /api/auth/login - Вход в систему
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        // 1. Поиск пользователя по email
        // 2. Проверка пароля
        // 3. Генерация JWT токена
        // 4. Возврат токена
    }
}
```

#### OrdersController - Заказы

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]  // Требуется аутентификация
public class OrdersController : ControllerBase
{
    // GET /api/orders/my - Заказы текущего пользователя
    [HttpGet("my")]
    public async Task<ActionResult> GetMyOrders() { ... }

    // GET /api/orders - Все заказы (только админ)
    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> GetAllOrders() { ... }

    // POST /api/orders - Создать заказ
    [HttpPost]
    public async Task<ActionResult> CreateOrder(CreateOrderRequest request)
    {
        // 1. Валидация
        // 2. Создание заказа в БД
        // 3. Запись в историю
        // 4. Уведомление админов через SignalR
    }

    // PUT /api/orders/{id}/status - Изменить статус (только админ)
    [HttpPut("{id}/status")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> UpdateOrderStatus(int id, UpdateOrderStatusRequest request)
    {
        // 1. Обновление статуса
        // 2. Запись в историю
        // 3. Уведомление клиента через SignalR
    }
}
```

### 4. Services - Сервисы

#### JwtService - Работа с JWT токенами

```csharp
public class JwtService
{
    // Генерация токена
    public string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),  // Роль для авторизации
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

#### NotificationService - Уведомления

```csharp
public class NotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    // Уведомить всех админов о новом заказе
    public async Task NotifyAdminsAboutNewOrderAsync(Order order)
    {
        // 1. Создать уведомления в БД для каждого админа
        // 2. Отправить real-time через SignalR
        await _hubContext.Clients
            .Group("admins")
            .SendAsync("ReceiveNotification", notification);
    }

    // Уведомить клиента об изменении статуса
    public async Task NotifyClientAboutOrderStatusAsync(Order order)
    {
        // 1. Создать уведомление в БД
        // 2. Отправить клиенту через SignalR
        await _hubContext.Clients
            .User(order.UserId.ToString())
            .SendAsync("OrderStatusChanged", data);
    }
}
```

### 5. Hubs - SignalR

#### NotificationHub - Real-time соединения

```csharp
public class NotificationHub : Hub
{
    // При подключении клиента
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;

        // Добавляем в персональную группу
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

        // Если админ - добавляем в группу админов
        if (role == "admin")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
        }
    }
}
```

### 6. Data - Контекст БД

#### AppDbContext

```csharp
public class AppDbContext : DbContext
{
    // Таблицы
    public DbSet<User> Users { get; set; }
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<ActionHistory> ActionHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Уникальный индекс для email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Seed данные (создаются при первом запуске)
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Email = "admin@warehouse.com",
            PasswordHash = BCrypt.HashPassword("admin123"),
            Role = "admin"
        });

        modelBuilder.Entity<Warehouse>().HasData(
            new Warehouse { Id = 1, Name = "Центральный склад", ... },
            new Warehouse { Id = 2, Name = "Северный склад", ... },
            new Warehouse { Id = 3, Name = "Южный склад", ... }
        );
    }
}
```

---

## 🔐 Аутентификация и авторизация

### JWT Token Flow

```
1. Клиент отправляет логин/пароль
   POST /api/auth/login
   { "email": "...", "password": "..." }

2. Сервер проверяет и возвращает JWT
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": { "id": 1, "role": "client" }
   }

3. Клиент сохраняет токен в localStorage

4. При каждом запросе клиент добавляет заголовок:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

5. Сервер валидирует токен и извлекает данные пользователя
```

### Авторизация по ролям

```csharp
// Только для авторизованных пользователей
[Authorize]
public class OrdersController { }

// Только для админов
[Authorize(Roles = "admin")]
public async Task<ActionResult> GetAllOrders() { }

// Получение текущего пользователя
var userId = User.FindFirst("userId")?.Value;
var role = User.FindFirst(ClaimTypes.Role)?.Value;
```

---

## 🔔 Real-time уведомления (SignalR)

### Как это работает

```
┌─────────────┐  WebSocket   ┌───────────────┐
│   Frontend  │ ◄──────────► │  SignalR Hub  │
│  (Browser)  │   /hubs/     │               │
└─────────────┘ notifications└───────┬───────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Group: admins  │       │ Group: user_1   │       │ Group: user_2   │
│  (все админы)   │       │ (клиент #1)     │       │ (клиент #2)     │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Сценарии использования

1. **Клиент создаёт заказ:**

   - Сервер сохраняет заказ в БД
   - Вызывает `NotifyAdminsAboutNewOrderAsync()`
   - Все админы получают уведомление мгновенно

2. **Админ одобряет заказ:**
   - Сервер обновляет статус в БД
   - Вызывает `NotifyClientAboutOrderStatusAsync()`
   - Клиент получает уведомление и видит новый статус

---

## 📊 DTOs (Data Transfer Objects)

DTOs используются для структурирования запросов и ответов API:

```csharp
// Запрос на создание заказа
public class CreateOrderRequest
{
    public string Description { get; set; }
    public int WarehouseId { get; set; }
}

// Ответ API
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T? Data { get; set; }
}

// Пагинированный ответ
public class PaginatedResponse<T>
{
    public bool Success { get; set; }
    public List<T> Data { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
```

---

## 🗄️ База данных

### Схема

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      Users       │     │     Orders       │     │   Warehouses     │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ Id (PK)          │◄────┤ UserId (FK)      │     │ Id (PK)          │
│ Email (UNIQUE)   │     │ WarehouseId (FK) │────►│ Name             │
│ FullName         │     │ Description      │     │ Address          │
│ PasswordHash     │     │ Status           │     │ Description      │
│ Role             │     │ CreatedAt        │     │ Status           │
│ CreatedAt        │     │ UpdatedAt        │     │ CreatedAt        │
│ IsActive         │     └──────────────────┘     └──────────────────┘
└──────────────────┘
         │
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Notifications   │     │  ActionHistories │
├──────────────────┤     ├──────────────────┤
│ Id (PK)          │     │ Id (PK)          │
│ Title            │     │ ActionType       │
│ Message          │     │ Description      │
│ Type             │     │ CreatedAt        │
│ IsRead           │     │ UserId (FK)      │
│ UserId (FK)      │     │ OrderId (FK)     │
│ OrderId (FK)     │     │ WarehouseId (FK) │
│ WarehouseId (FK) │     └──────────────────┘
└──────────────────┘
```

### Миграции

База данных создаётся автоматически при первом запуске:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated(); // Создаёт БД и таблицы
}
```

---

## 🔧 Конфигурация

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=warehouse.db"
  },
  "Jwt": {
    "SecretKey": "YourSuperSecretKeyForJWTTokenGeneration123!",
    "Issuer": "WarehouseAPI",
    "Audience": "WarehouseClient"
  },
  "Urls": "http://localhost:5000"
}
```

---

## 📝 Примеры запросов

### Регистрация

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"123456","fullName":"Тест"}'
```

### Вход

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@warehouse.com","password":"admin123"}'
```

### Создание заказа (с токеном)

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"description":"Заказ товаров","warehouseId":1}'
```

### Получение заказов

```bash
curl http://localhost:5000/api/orders/my \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🚀 Запуск

```bash
cd backend
dotnet restore
dotnet run
```

Сервер запустится на `http://localhost:5000`

Swagger документация: `http://localhost:5000/swagger`
