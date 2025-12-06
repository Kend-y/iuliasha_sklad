namespace Backend.DTOs;

// ========== Auth DTOs ==========

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public UserDto? User { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

// ========== Order DTOs ==========

public class CreateOrderRequest
{
    public string Description { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty; // approved, rejected
}

public class OrderDto
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
}

// ========== Warehouse DTOs ==========

public class CreateWarehouseRequest
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UpdateWarehouseRequest
{
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; } // active, suspended
}

public class WarehouseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int OrdersCount { get; set; }
}

// ========== Notification DTOs ==========

public class NotificationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? OrderId { get; set; }
    public int? WarehouseId { get; set; }
}

// ========== History DTOs ==========

public class ActionHistoryDto
{
    public int Id { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public int? OrderId { get; set; }
    public int? WarehouseId { get; set; }
}

// ========== Common DTOs ==========

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
}

public class PaginatedResponse<T>
{
    public bool Success { get; set; }
    public List<T> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
