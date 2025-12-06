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

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
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

// ========== Category DTOs ==========

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "📦";
}

public class UpdateCategoryRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public bool? IsActive { get; set; }
}

// ========== StorageLocation DTOs ==========

public class StorageLocationDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string Shelf { get; set; } = string.Empty;
    public string Cell { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public bool IsOccupied { get; set; }
    public bool IsActive { get; set; }
    public decimal DailyRate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ReservedUntil { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
    public string? CurrentItemName { get; set; }
}

public class CreateStorageLocationRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string Shelf { get; set; } = string.Empty;
    public string Cell { get; set; } = string.Empty;
    public string Size { get; set; } = "medium";
    public decimal DailyRate { get; set; } = 0;
    public int WarehouseId { get; set; }
}

public class UpdateStorageLocationRequest
{
    public string? Name { get; set; }
    public string? Size { get; set; }
    public decimal? DailyRate { get; set; }
    public string? Status { get; set; }
}

public class ReserveLocationRequest
{
    public int? ReserveHours { get; set; } = 24;
}

// ========== Item DTOs ==========

public class ItemDto
{
    public int Id { get; set; }
    public string UniqueCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public decimal? EstimatedValue { get; set; }
    public decimal DailyStorageCost { get; set; }
    public DateTime? IntakeDate { get; set; }
    public DateTime? PlannedReleaseDate { get; set; }
    public DateTime? ActualReleaseDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Связи
    public int OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = string.Empty;
    public int? StorageLocationId { get; set; }
    public string? StorageLocationCode { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    
    // Вычисляемые поля
    public int StorageDays { get; set; }
    public decimal TotalStorageCost { get; set; }
}

public class CreateItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Condition { get; set; } = "good";
    public string? PhotoUrl { get; set; }
    public decimal? EstimatedValue { get; set; }
    public DateTime? PlannedReleaseDate { get; set; }
    public string? Notes { get; set; }
    public int CategoryId { get; set; }
    public int WarehouseId { get; set; }
    public int? StorageLocationId { get; set; }
}

public class UpdateItemRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Condition { get; set; }
    public string? PhotoUrl { get; set; }
    public decimal? EstimatedValue { get; set; }
    public DateTime? PlannedReleaseDate { get; set; }
    public string? Notes { get; set; }
    public int? CategoryId { get; set; }
}

public class ItemIntakeRequest
{
    public int StorageLocationId { get; set; }
    public string? ActualCondition { get; set; }
    public string? Notes { get; set; }
}

public class ItemReleaseRequest
{
    public string? Notes { get; set; }
}

public class ItemMoveRequest
{
    public int NewStorageLocationId { get; set; }
    public string? Notes { get; set; }
}

public class ItemConditionChangeRequest
{
    public string NewCondition { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

// ========== ItemMovement DTOs ==========

public class ItemMovementDto
{
    public int Id { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? FromLocationId { get; set; }
    public string? FromLocationCode { get; set; }
    public int? ToLocationId { get; set; }
    public string? ToLocationCode { get; set; }
    public string? PreviousCondition { get; set; }
    public string? NewCondition { get; set; }
    public string? PreviousStatus { get; set; }
    public string? NewStatus { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int PerformedById { get; set; }
    public string PerformedByName { get; set; } = string.Empty;
}
