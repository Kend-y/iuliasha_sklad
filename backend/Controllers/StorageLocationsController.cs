using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для управления местами хранения
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StorageLocationsController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public StorageLocationsController(AppDbContext context)
    {
        _context = context;
    }
    
    /// <summary>
    /// Получить все места хранения
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<StorageLocationDto>>>> GetStorageLocations(
        [FromQuery] int? warehouseId = null,
        [FromQuery] bool? availableOnly = null,
        [FromQuery] string? size = null)
    {
        var query = _context.StorageLocations
            .Include(s => s.Warehouse)
            .Include(s => s.Items)
            .AsQueryable();
        
        if (warehouseId.HasValue)
        {
            query = query.Where(s => s.WarehouseId == warehouseId.Value);
        }
        
        if (availableOnly == true)
        {
            query = query.Where(s => !s.IsOccupied && s.Status == "active");
        }
        
        if (!string.IsNullOrEmpty(size))
        {
            query = query.Where(s => s.Size == size);
        }
        
        var locations = await query
            .OrderBy(s => s.Section)
            .ThenBy(s => s.Shelf)
            .ThenBy(s => s.Cell)
            .Select(s => new StorageLocationDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Section = s.Section,
                Shelf = s.Shelf,
                Cell = s.Cell,
                Size = s.Size,
                IsOccupied = s.IsOccupied,
                IsActive = s.IsActive,
                DailyRate = s.DailyRate,
                Status = s.Status,
                ReservedUntil = s.ReservedUntil,
                WarehouseId = s.WarehouseId,
                WarehouseName = s.Warehouse!.Name,
                ItemsCount = s.Items.Count,
                CurrentItemName = s.Items.FirstOrDefault(i => i.Status == "stored") != null 
                    ? s.Items.First(i => i.Status == "stored").Name 
                    : null
            })
            .ToListAsync();
        
        return Ok(new ApiResponse<List<StorageLocationDto>>
        {
            Success = true,
            Data = locations
        });
    }
    
    /// <summary>
    /// Получить место хранения по ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<StorageLocationDto>>> GetStorageLocation(int id)
    {
        var location = await _context.StorageLocations
            .Include(s => s.Warehouse)
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id);
        
        if (location == null)
        {
            return NotFound(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Место хранения не найдено"
            });
        }
        
        return Ok(new ApiResponse<StorageLocationDto>
        {
            Success = true,
            Data = new StorageLocationDto
            {
                Id = location.Id,
                Code = location.Code,
                Name = location.Name,
                Section = location.Section,
                Shelf = location.Shelf,
                Cell = location.Cell,
                Size = location.Size,
                IsOccupied = location.IsOccupied,
                DailyRate = location.DailyRate,
                Status = location.Status,
                WarehouseId = location.WarehouseId,
                WarehouseName = location.Warehouse!.Name,
                ItemsCount = location.Items.Count
            }
        });
    }
    
    /// <summary>
    /// Создать новое место хранения (Admin/Employee)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ApiResponse<StorageLocationDto>>> CreateStorageLocation([FromBody] CreateStorageLocationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Код места хранения обязателен"
            });
        }
        
        var exists = await _context.StorageLocations.AnyAsync(s => s.Code == request.Code);
        if (exists)
        {
            return BadRequest(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Место с таким кодом уже существует"
            });
        }
        
        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null)
        {
            return BadRequest(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Склад не найден"
            });
        }
        
        var location = new StorageLocation
        {
            Code = request.Code,
            Name = request.Name ?? string.Empty,
            Section = request.Section ?? string.Empty,
            Shelf = request.Shelf ?? string.Empty,
            Cell = request.Cell ?? string.Empty,
            Size = request.Size ?? "medium",
            DailyRate = request.DailyRate,
            WarehouseId = request.WarehouseId
        };
        
        _context.StorageLocations.Add(location);
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<StorageLocationDto>
        {
            Success = true,
            Message = "Место хранения создано",
            Data = new StorageLocationDto
            {
                Id = location.Id,
                Code = location.Code,
                Name = location.Name,
                Section = location.Section,
                Shelf = location.Shelf,
                Cell = location.Cell,
                Size = location.Size,
                IsOccupied = location.IsOccupied,
                DailyRate = location.DailyRate,
                Status = location.Status,
                WarehouseId = location.WarehouseId,
                WarehouseName = warehouse.Name,
                ItemsCount = 0
            }
        });
    }
    
    /// <summary>
    /// Обновить место хранения (Admin/Employee)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ApiResponse<StorageLocationDto>>> UpdateStorageLocation(int id, [FromBody] UpdateStorageLocationRequest request)
    {
        var location = await _context.StorageLocations
            .Include(s => s.Warehouse)
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id);
        
        if (location == null)
        {
            return NotFound(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Место хранения не найдено"
            });
        }
        
        if (request.Name != null) location.Name = request.Name;
        if (request.Size != null) location.Size = request.Size;
        if (request.DailyRate.HasValue) location.DailyRate = request.DailyRate.Value;
        if (request.Status != null) location.Status = request.Status;
        
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<StorageLocationDto>
        {
            Success = true,
            Message = "Место хранения обновлено",
            Data = new StorageLocationDto
            {
                Id = location.Id,
                Code = location.Code,
                Name = location.Name,
                Section = location.Section,
                Shelf = location.Shelf,
                Cell = location.Cell,
                Size = location.Size,
                IsOccupied = location.IsOccupied,
                DailyRate = location.DailyRate,
                Status = location.Status,
                WarehouseId = location.WarehouseId,
                WarehouseName = location.Warehouse!.Name,
                ItemsCount = location.Items.Count
            }
        });
    }
    
    /// <summary>
    /// Удалить место хранения (только Admin)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteStorageLocation(int id)
    {
        var location = await _context.StorageLocations
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id);
        
        if (location == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Место хранения не найдено"
            });
        }
        
        if (location.Items.Any())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Нельзя удалить место с вещами. Сначала переместите вещи."
            });
        }
        
        _context.StorageLocations.Remove(location);
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Место хранения удалено"
        });
    }
    
    /// <summary>
    /// Автоматический подбор оптимального места хранения
    /// Учитывает размер, склад и минимизирует стоимость
    /// </summary>
    [HttpGet("suggest")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<StorageLocationDto>>> SuggestStorageLocation(
        [FromQuery] int warehouseId,
        [FromQuery] string? preferredSize = null)
    {
        // Определяем приоритет размеров (от меньшего к большему)
        var sizePriority = new[] { "small", "medium", "large", "extra_large" };
        
        var query = _context.StorageLocations
            .Include(s => s.Warehouse)
            .Where(s => s.WarehouseId == warehouseId && !s.IsOccupied && s.Status == "active");
        
        StorageLocation? bestLocation = null;
        
        // Если указан предпочтительный размер, ищем начиная с него
        if (!string.IsNullOrEmpty(preferredSize))
        {
            var startIndex = Array.IndexOf(sizePriority, preferredSize);
            if (startIndex < 0) startIndex = 1; // по умолчанию medium
            
            // Ищем от предпочтительного размера к большему
            for (int i = startIndex; i < sizePriority.Length; i++)
            {
                bestLocation = await query
                    .Where(s => s.Size == sizePriority[i])
                    .OrderBy(s => s.DailyRate)
                    .ThenBy(s => s.Section)
                    .ThenBy(s => s.Shelf)
                    .ThenBy(s => s.Cell)
                    .FirstOrDefaultAsync();
                
                if (bestLocation != null) break;
            }
        }
        
        // Если не нашли по размеру, ищем любое свободное по минимальной цене
        if (bestLocation == null)
        {
            bestLocation = await query
                .OrderBy(s => s.DailyRate)
                .ThenBy(s => s.Section)
                .ThenBy(s => s.Shelf)
                .ThenBy(s => s.Cell)
                .FirstOrDefaultAsync();
        }
        
        if (bestLocation == null)
        {
            return NotFound(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Нет доступных мест хранения на выбранном складе"
            });
        }
        
        return Ok(new ApiResponse<StorageLocationDto>
        {
            Success = true,
            Message = "Найдено оптимальное место",
            Data = new StorageLocationDto
            {
                Id = bestLocation.Id,
                Code = bestLocation.Code,
                Name = bestLocation.Name,
                Section = bestLocation.Section,
                Shelf = bestLocation.Shelf,
                Cell = bestLocation.Cell,
                Size = bestLocation.Size,
                IsOccupied = bestLocation.IsOccupied,
                DailyRate = bestLocation.DailyRate,
                Status = bestLocation.Status,
                WarehouseId = bestLocation.WarehouseId,
                WarehouseName = bestLocation.Warehouse!.Name,
                ItemsCount = 0
            }
        });
    }
    
    /// <summary>
    /// Зарезервировать место хранения для вещи (временно пометить как занятое)
    /// </summary>
    [HttpPost("{id}/reserve")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ApiResponse<StorageLocationDto>>> ReserveLocation(int id, [FromBody] ReserveLocationRequest request)
    {
        var location = await _context.StorageLocations
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.Id == id);
        
        if (location == null)
        {
            return NotFound(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Место хранения не найдено"
            });
        }
        
        if (location.IsOccupied)
        {
            return BadRequest(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Место уже занято или зарезервировано"
            });
        }
        
        location.IsOccupied = true;
        location.Status = "reserved";
        location.ReservedUntil = DateTime.UtcNow.AddHours(request.ReserveHours ?? 24);
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<StorageLocationDto>
        {
            Success = true,
            Message = "Место зарезервировано",
            Data = new StorageLocationDto
            {
                Id = location.Id,
                Code = location.Code,
                Name = location.Name,
                Section = location.Section,
                Shelf = location.Shelf,
                Cell = location.Cell,
                Size = location.Size,
                IsOccupied = location.IsOccupied,
                DailyRate = location.DailyRate,
                Status = location.Status,
                WarehouseId = location.WarehouseId,
                WarehouseName = location.Warehouse!.Name,
                ItemsCount = 0
            }
        });
    }
    
    /// <summary>
    /// Снять резерв с места хранения
    /// </summary>
    [HttpPost("{id}/unreserve")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ApiResponse<StorageLocationDto>>> UnreserveLocation(int id)
    {
        var location = await _context.StorageLocations
            .Include(s => s.Warehouse)
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id);
        
        if (location == null)
        {
            return NotFound(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Место хранения не найдено"
            });
        }
        
        // Снимаем резерв только если место не занято вещью
        if (location.Items.Any(i => i.Status == "stored"))
        {
            return BadRequest(new ApiResponse<StorageLocationDto>
            {
                Success = false,
                Message = "Нельзя снять резерв - место занято вещью"
            });
        }
        
        location.IsOccupied = false;
        location.Status = "active";
        location.ReservedUntil = null;
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<StorageLocationDto>
        {
            Success = true,
            Message = "Резерв снят",
            Data = new StorageLocationDto
            {
                Id = location.Id,
                Code = location.Code,
                Name = location.Name,
                Section = location.Section,
                Shelf = location.Shelf,
                Cell = location.Cell,
                Size = location.Size,
                IsOccupied = location.IsOccupied,
                DailyRate = location.DailyRate,
                Status = location.Status,
                WarehouseId = location.WarehouseId,
                WarehouseName = location.Warehouse!.Name,
                ItemsCount = location.Items.Count
            }
        });
    }
}
