using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для управления вещами на хранении
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly NotificationService _notificationService;
    
    public ItemsController(AppDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }
    
    private int GetUserId() => int.Parse(User.FindFirst("userId")?.Value ?? "0");
    private string GetUserRole() => User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
    
    private ItemDto MapToDto(Item item)
    {
        var storageDays = item.IntakeDate.HasValue 
            ? (int)(DateTime.UtcNow - item.IntakeDate.Value).TotalDays 
            : 0;
        
        return new ItemDto
        {
            Id = item.Id,
            UniqueCode = item.UniqueCode,
            Name = item.Name,
            Description = item.Description,
            Condition = item.Condition,
            Status = item.Status,
            PhotoUrl = item.PhotoUrl,
            EstimatedValue = item.EstimatedValue,
            DailyStorageCost = item.DailyStorageCost,
            IntakeDate = item.IntakeDate,
            PlannedReleaseDate = item.PlannedReleaseDate,
            ActualReleaseDate = item.ActualReleaseDate,
            Notes = item.Notes,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
            OwnerId = item.OwnerId,
            OwnerName = item.Owner?.FullName ?? "",
            OwnerEmail = item.Owner?.Email ?? "",
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Name ?? "",
            CategoryIcon = item.Category?.Icon ?? "",
            StorageLocationId = item.StorageLocationId,
            StorageLocationCode = item.StorageLocation?.Code,
            WarehouseId = item.WarehouseId,
            WarehouseName = item.Warehouse?.Name ?? "",
            StorageDays = storageDays,
            TotalStorageCost = storageDays * item.DailyStorageCost
        };
    }
    
    /// <summary>
    /// Получить мои вещи (для клиента)
    /// </summary>
    [HttpGet("my")]
    public async Task<ActionResult<PaginatedResponse<ItemDto>>> GetMyItems(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] int? categoryId = null)
    {
        var userId = GetUserId();
        
        var query = _context.Items
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.StorageLocation)
            .Include(i => i.Warehouse)
            .Where(i => i.OwnerId == userId);
        
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(i => i.Status == status);
        }
        
        if (categoryId.HasValue)
        {
            query = query.Where(i => i.CategoryId == categoryId.Value);
        }
        
        var totalCount = await query.CountAsync();
        
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        return Ok(new PaginatedResponse<ItemDto>
        {
            Success = true,
            Data = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }
    
    /// <summary>
    /// Получить все вещи (Admin/Employee)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<PaginatedResponse<ItemDto>>> GetAllItems(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? warehouseId = null,
        [FromQuery] int? ownerId = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Items
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.StorageLocation)
            .Include(i => i.Warehouse)
            .AsQueryable();
        
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(i => i.Status == status);
        }
        
        if (categoryId.HasValue)
        {
            query = query.Where(i => i.CategoryId == categoryId.Value);
        }
        
        if (warehouseId.HasValue)
        {
            query = query.Where(i => i.WarehouseId == warehouseId.Value);
        }
        
        if (ownerId.HasValue)
        {
            query = query.Where(i => i.OwnerId == ownerId.Value);
        }
        
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(i => 
                i.Name.Contains(search) || 
                i.UniqueCode.Contains(search) ||
                i.Description.Contains(search));
        }
        
        var totalCount = await query.CountAsync();
        
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        return Ok(new PaginatedResponse<ItemDto>
        {
            Success = true,
            Data = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }
    
    /// <summary>
    /// Получить вещь по ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ItemDto>>> GetItem(int id)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        
        var item = await _context.Items
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.StorageLocation)
            .Include(i => i.Warehouse)
            .FirstOrDefaultAsync(i => i.Id == id);
        
        if (item == null)
        {
            return NotFound(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не найдена"
            });
        }
        
        // Клиент может видеть только свои вещи
        if (role == "Client" && item.OwnerId != userId)
        {
            return Forbid();
        }
        
        return Ok(new ApiResponse<ItemDto>
        {
            Success = true,
            Data = MapToDto(item)
        });
    }
    
    /// <summary>
    /// Создать заявку на хранение вещи (клиент)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ItemDto>>> CreateItem([FromBody] CreateItemRequest request)
    {
        var userId = GetUserId();
        
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Название вещи обязательно"
            });
        }
        
        var category = await _context.Categories.FindAsync(request.CategoryId);
        if (category == null)
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Категория не найдена"
            });
        }
        
        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null)
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Склад не найден"
            });
        }
        
        // Генерируем уникальный код
        var uniqueCode = $"ITM-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        
        var item = new Item
        {
            UniqueCode = uniqueCode,
            Name = request.Name,
            Description = request.Description ?? string.Empty,
            Condition = request.Condition ?? "good",
            Status = "pending_intake",
            PhotoUrl = request.PhotoUrl,
            EstimatedValue = request.EstimatedValue,
            PlannedReleaseDate = request.PlannedReleaseDate,
            Notes = request.Notes,
            OwnerId = userId,
            CategoryId = request.CategoryId,
            WarehouseId = request.WarehouseId,
            StorageLocationId = request.StorageLocationId
        };
        
        _context.Items.Add(item);
        await _context.SaveChangesAsync();
        
        // Уведомляем сотрудников о новой заявке
        await _notificationService.NotifyAboutNewItemAsync(item);
        
        // Загружаем связи для ответа
        await _context.Entry(item).Reference(i => i.Owner).LoadAsync();
        await _context.Entry(item).Reference(i => i.Category).LoadAsync();
        await _context.Entry(item).Reference(i => i.Warehouse).LoadAsync();
        
        return Ok(new ApiResponse<ItemDto>
        {
            Success = true,
            Message = "Заявка на хранение создана",
            Data = MapToDto(item)
        });
    }
    
    /// <summary>
    /// Обновить информацию о вещи
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ItemDto>>> UpdateItem(int id, [FromBody] UpdateItemRequest request)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        
        var item = await _context.Items
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.StorageLocation)
            .Include(i => i.Warehouse)
            .FirstOrDefaultAsync(i => i.Id == id);
        
        if (item == null)
        {
            return NotFound(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не найдена"
            });
        }
        
        // Клиент может редактировать только свои вещи в статусе pending
        if (role == "Client" && (item.OwnerId != userId || item.Status != "pending_intake"))
        {
            return Forbid();
        }
        
        if (request.Name != null) item.Name = request.Name;
        if (request.Description != null) item.Description = request.Description;
        if (request.PhotoUrl != null) item.PhotoUrl = request.PhotoUrl;
        if (request.EstimatedValue.HasValue) item.EstimatedValue = request.EstimatedValue.Value;
        if (request.PlannedReleaseDate.HasValue) item.PlannedReleaseDate = request.PlannedReleaseDate.Value;
        if (request.Notes != null) item.Notes = request.Notes;
        
        if (request.CategoryId.HasValue)
        {
            var category = await _context.Categories.FindAsync(request.CategoryId.Value);
            if (category != null) item.CategoryId = request.CategoryId.Value;
        }
        
        // Изменение состояния - только для сотрудников
        if (request.Condition != null && (role == "Admin" || role == "Employee"))
        {
            var oldCondition = item.Condition;
            item.Condition = request.Condition;
            
            // Записываем в историю
            _context.ItemMovements.Add(new ItemMovement
            {
                ActionType = "condition_change",
                Description = $"Изменено состояние: {oldCondition} → {request.Condition}",
                PreviousCondition = oldCondition,
                NewCondition = request.Condition,
                ItemId = item.Id,
                PerformedById = userId,
                Notes = request.Notes
            });
        }
        
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<ItemDto>
        {
            Success = true,
            Message = "Вещь обновлена",
            Data = MapToDto(item)
        });
    }
    
    /// <summary>
    /// Принять вещь на хранение (Employee/Admin)
    /// </summary>
    [HttpPost("{id}/intake")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ApiResponse<ItemDto>>> IntakeItem(int id, [FromBody] ItemIntakeRequest request)
    {
        var userId = GetUserId();
        
        var item = await _context.Items
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Warehouse)
            .FirstOrDefaultAsync(i => i.Id == id);
        
        if (item == null)
        {
            return NotFound(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не найдена"
            });
        }
        
        if (item.Status != "pending_intake")
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не ожидает приёма"
            });
        }
        
        var location = await _context.StorageLocations.FindAsync(request.StorageLocationId);
        if (location == null)
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Место хранения не найдено"
            });
        }
        
        if (location.IsOccupied)
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Место хранения уже занято"
            });
        }
        
        var oldStatus = item.Status;
        var oldCondition = item.Condition;
        
        item.Status = "stored";
        item.StorageLocationId = request.StorageLocationId;
        item.IntakeDate = DateTime.UtcNow;
        item.DailyStorageCost = location.DailyRate;
        item.UpdatedAt = DateTime.UtcNow;
        
        // Обновляем состояние если передано
        if (!string.IsNullOrEmpty(request.ActualCondition))
        {
            item.Condition = request.ActualCondition;
        }
        
        location.IsOccupied = true;
        
        // Записываем в историю
        var description = $"Вещь принята на хранение, размещена в {location.Code}";
        if (!string.IsNullOrEmpty(request.ActualCondition) && request.ActualCondition != oldCondition)
        {
            description += $". Состояние: {oldCondition} → {request.ActualCondition}";
        }
        
        _context.ItemMovements.Add(new ItemMovement
        {
            ActionType = "intake",
            Description = description,
            ToLocationId = location.Id,
            PreviousStatus = oldStatus,
            NewStatus = "stored",
            PreviousCondition = oldCondition,
            NewCondition = item.Condition,
            ItemId = item.Id,
            PerformedById = userId,
            Notes = request.Notes
        });
        
        await _context.SaveChangesAsync();
        
        // Уведомляем владельца
        await _notificationService.NotifyOwnerAboutItemStatusAsync(item, oldStatus);
        
        await _context.Entry(item).Reference(i => i.StorageLocation).LoadAsync();
        
        return Ok(new ApiResponse<ItemDto>
        {
            Success = true,
            Message = "Вещь принята на хранение",
            Data = MapToDto(item)
        });
    }
    
    /// <summary>
    /// Выдать вещь (Employee/Admin)
    /// </summary>
    [HttpPost("{id}/release")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ApiResponse<ItemDto>>> ReleaseItem(int id, [FromBody] ItemReleaseRequest request)
    {
        var userId = GetUserId();
        
        var item = await _context.Items
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.StorageLocation)
            .Include(i => i.Warehouse)
            .FirstOrDefaultAsync(i => i.Id == id);
        
        if (item == null)
        {
            return NotFound(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не найдена"
            });
        }
        
        if (item.Status != "stored" && item.Status != "pending_release")
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не может быть выдана в текущем статусе"
            });
        }
        
        var oldStatus = item.Status;
        var oldLocationId = item.StorageLocationId;
        var oldLocationCode = item.StorageLocation?.Code;
        
        item.Status = "released";
        item.ActualReleaseDate = DateTime.UtcNow;
        item.UpdatedAt = DateTime.UtcNow;
        
        // Освобождаем место
        if (item.StorageLocation != null)
        {
            item.StorageLocation.IsOccupied = false;
        }
        item.StorageLocationId = null;
        
        // Записываем в историю
        _context.ItemMovements.Add(new ItemMovement
        {
            ActionType = "release",
            Description = $"Вещь выдана владельцу из {oldLocationCode}",
            FromLocationId = oldLocationId,
            PreviousStatus = oldStatus,
            NewStatus = "released",
            ItemId = item.Id,
            PerformedById = userId,
            Notes = request.Notes
        });
        
        await _context.SaveChangesAsync();
        
        // Уведомляем владельца
        await _notificationService.NotifyOwnerAboutItemStatusAsync(item, oldStatus);
        
        return Ok(new ApiResponse<ItemDto>
        {
            Success = true,
            Message = "Вещь выдана",
            Data = MapToDto(item)
        });
    }
    
    /// <summary>
    /// Запросить выдачу вещи (клиент)
    /// </summary>
    [HttpPost("{id}/request-release")]
    public async Task<ActionResult<ApiResponse<ItemDto>>> RequestRelease(int id)
    {
        var userId = GetUserId();
        
        var item = await _context.Items
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.StorageLocation)
            .Include(i => i.Warehouse)
            .FirstOrDefaultAsync(i => i.Id == id);
        
        if (item == null)
        {
            return NotFound(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не найдена"
            });
        }
        
        if (item.OwnerId != userId)
        {
            return Forbid();
        }
        
        if (item.Status != "stored")
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не на хранении"
            });
        }
        
        var oldStatus = item.Status;
        item.Status = "pending_release";
        item.UpdatedAt = DateTime.UtcNow;
        
        // Записываем в историю
        _context.ItemMovements.Add(new ItemMovement
        {
            ActionType = "status_change",
            Description = "Клиент запросил выдачу вещи",
            PreviousStatus = oldStatus,
            NewStatus = "pending_release",
            ItemId = item.Id,
            PerformedById = userId
        });
        
        await _context.SaveChangesAsync();
        
        // Уведомляем сотрудников
        await _notificationService.NotifyAboutReleaseRequestAsync(item);
        
        return Ok(new ApiResponse<ItemDto>
        {
            Success = true,
            Message = "Запрос на выдачу отправлен",
            Data = MapToDto(item)
        });
    }
    
    /// <summary>
    /// Переместить вещь на другое место (Employee/Admin)
    /// </summary>
    [HttpPost("{id}/move")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ApiResponse<ItemDto>>> MoveItem(int id, [FromBody] ItemMoveRequest request)
    {
        var userId = GetUserId();
        
        var item = await _context.Items
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.StorageLocation)
            .Include(i => i.Warehouse)
            .FirstOrDefaultAsync(i => i.Id == id);
        
        if (item == null)
        {
            return NotFound(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь не найдена"
            });
        }
        
        if (item.Status != "stored")
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Вещь должна быть на хранении для перемещения"
            });
        }
        
        var newLocation = await _context.StorageLocations.FindAsync(request.NewStorageLocationId);
        if (newLocation == null)
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Новое место хранения не найдено"
            });
        }
        
        if (newLocation.IsOccupied)
        {
            return BadRequest(new ApiResponse<ItemDto>
            {
                Success = false,
                Message = "Новое место уже занято"
            });
        }
        
        var oldLocationId = item.StorageLocationId;
        var oldLocationCode = item.StorageLocation?.Code;
        
        // Освобождаем старое место
        if (item.StorageLocation != null)
        {
            item.StorageLocation.IsOccupied = false;
        }
        
        // Занимаем новое место
        item.StorageLocationId = newLocation.Id;
        newLocation.IsOccupied = true;
        item.DailyStorageCost = newLocation.DailyRate;
        item.UpdatedAt = DateTime.UtcNow;
        
        // Записываем в историю
        _context.ItemMovements.Add(new ItemMovement
        {
            ActionType = "move",
            Description = $"Вещь перемещена: {oldLocationCode} → {newLocation.Code}",
            FromLocationId = oldLocationId,
            ToLocationId = newLocation.Id,
            ItemId = item.Id,
            PerformedById = userId,
            Notes = request.Notes
        });
        
        await _context.SaveChangesAsync();
        
        await _context.Entry(item).Reference(i => i.StorageLocation).LoadAsync();
        
        return Ok(new ApiResponse<ItemDto>
        {
            Success = true,
            Message = "Вещь перемещена",
            Data = MapToDto(item)
        });
    }
    
    /// <summary>
    /// Получить историю перемещений вещи
    /// </summary>
    [HttpGet("{id}/history")]
    public async Task<ActionResult<ApiResponse<List<ItemMovementDto>>>> GetItemHistory(int id)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        
        var item = await _context.Items.FindAsync(id);
        
        if (item == null)
        {
            return NotFound(new ApiResponse<List<ItemMovementDto>>
            {
                Success = false,
                Message = "Вещь не найдена"
            });
        }
        
        // Клиент может видеть историю только своих вещей
        if (role == "Client" && item.OwnerId != userId)
        {
            return Forbid();
        }
        
        var movements = await _context.ItemMovements
            .Include(m => m.PerformedBy)
            .Include(m => m.FromLocation)
            .Include(m => m.ToLocation)
            .Where(m => m.ItemId == id)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new ItemMovementDto
            {
                Id = m.Id,
                ActionType = m.ActionType,
                Description = m.Description,
                FromLocationId = m.FromLocationId,
                FromLocationCode = m.FromLocation != null ? m.FromLocation.Code : null,
                ToLocationId = m.ToLocationId,
                ToLocationCode = m.ToLocation != null ? m.ToLocation.Code : null,
                PreviousCondition = m.PreviousCondition,
                NewCondition = m.NewCondition,
                PreviousStatus = m.PreviousStatus,
                NewStatus = m.NewStatus,
                Notes = m.Notes,
                CreatedAt = m.CreatedAt,
                ItemId = m.ItemId,
                ItemName = item.Name,
                PerformedById = m.PerformedById,
                PerformedByName = m.PerformedBy!.FullName
            })
            .ToListAsync();
        
        return Ok(new ApiResponse<List<ItemMovementDto>>
        {
            Success = true,
            Data = movements
        });
    }
}
