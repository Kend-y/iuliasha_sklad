using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для управления складами
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public WarehousesController(AppDbContext context)
    {
        _context = context;
    }
    
    /// <summary>
    /// Получить все активные склады (для всех авторизованных пользователей)
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<WarehouseDto>>>> GetWarehouses([FromQuery] bool includeInactive = false)
    {
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        var query = _context.Warehouses.AsQueryable();
        
        // Клиенты видят только активные склады
        if (role != "Admin" || !includeInactive)
        {
            query = query.Where(w => w.Status == "active");
        }
        
        var warehouses = await query
            .Select(w => new WarehouseDto
            {
                Id = w.Id,
                Name = w.Name,
                Address = w.Address,
                Description = w.Description,
                Status = w.Status,
                CreatedAt = w.CreatedAt,
                OrdersCount = w.Orders.Count
            })
            .ToListAsync();
        
        return Ok(new ApiResponse<List<WarehouseDto>>
        {
            Success = true,
            Data = warehouses
        });
    }
    
    /// <summary>
    /// Получить склад по ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<WarehouseDto>>> GetWarehouse(int id)
    {
        var warehouse = await _context.Warehouses
            .Include(w => w.Orders)
            .FirstOrDefaultAsync(w => w.Id == id);
        
        if (warehouse == null)
        {
            return NotFound(new ApiResponse<WarehouseDto> 
            { 
                Success = false, 
                Message = "Склад не найден" 
            });
        }
        
        return Ok(new ApiResponse<WarehouseDto>
        {
            Success = true,
            Data = new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Description = warehouse.Description,
                Status = warehouse.Status,
                CreatedAt = warehouse.CreatedAt,
                OrdersCount = warehouse.Orders.Count
            }
        });
    }
    
    /// <summary>
    /// Создать новый склад (только для админа)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<WarehouseDto>>> CreateWarehouse([FromBody] CreateWarehouseRequest request)
    {
        var adminId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        
        // Валидация
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new ApiResponse<WarehouseDto> 
            { 
                Success = false, 
                Message = "Название склада обязательно" 
            });
        }
        
        // Проверка уникальности названия
        var exists = await _context.Warehouses
            .AnyAsync(w => w.Name.ToLower() == request.Name.ToLower());
        
        if (exists)
        {
            return BadRequest(new ApiResponse<WarehouseDto> 
            { 
                Success = false, 
                Message = "Склад с таким названием уже существует" 
            });
        }
        
        var warehouse = new Warehouse
        {
            Name = request.Name,
            Address = request.Address ?? string.Empty,
            Description = request.Description ?? string.Empty,
            Status = "active",
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();
        
        // Записываем в историю ПОСЛЕ сохранения склада (чтобы получить Id)
        _context.ActionHistories.Add(new ActionHistory
        {
            ActionType = "warehouse_created",
            Description = $"Создан новый склад '{warehouse.Name}'",
            UserId = adminId,
            WarehouseId = warehouse.Id
        });
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<WarehouseDto>
        {
            Success = true,
            Message = "Склад успешно создан",
            Data = new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Description = warehouse.Description,
                Status = warehouse.Status,
                CreatedAt = warehouse.CreatedAt,
                OrdersCount = 0
            }
        });
    }
    
    /// <summary>
    /// Обновить склад (только для админа)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<WarehouseDto>>> UpdateWarehouse(
        int id, 
        [FromBody] UpdateWarehouseRequest request)
    {
        var adminId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        
        var warehouse = await _context.Warehouses
            .Include(w => w.Orders)
            .FirstOrDefaultAsync(w => w.Id == id);
        
        if (warehouse == null)
        {
            return NotFound(new ApiResponse<WarehouseDto> 
            { 
                Success = false, 
                Message = "Склад не найден" 
            });
        }
        
        // Обновляем поля
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            warehouse.Name = request.Name;
        }
        
        if (request.Address != null)
        {
            warehouse.Address = request.Address;
        }
        
        if (request.Description != null)
        {
            warehouse.Description = request.Description;
        }
        
        // Обработка статуса
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var allowedStatuses = new[] { "active", "suspended" };
            if (!allowedStatuses.Contains(request.Status))
            {
                return BadRequest(new ApiResponse<WarehouseDto> 
                { 
                    Success = false, 
                    Message = "Недопустимый статус" 
                });
            }
            
            var oldStatus = warehouse.Status;
            warehouse.Status = request.Status;
            
            if (oldStatus != request.Status)
            {
                var actionType = request.Status == "suspended" ? "warehouse_suspended" : "warehouse_activated";
                var statusText = request.Status == "suspended" ? "приостановлен" : "активирован";
                
                _context.ActionHistories.Add(new ActionHistory
                {
                    ActionType = actionType,
                    Description = $"Склад '{warehouse.Name}' был {statusText}",
                    UserId = adminId,
                    WarehouseId = warehouse.Id
                });
            }
        }
        
        warehouse.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<WarehouseDto>
        {
            Success = true,
            Message = "Склад успешно обновлён",
            Data = new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Description = warehouse.Description,
                Status = warehouse.Status,
                CreatedAt = warehouse.CreatedAt,
                OrdersCount = warehouse.Orders.Count
            }
        });
    }
    
    /// <summary>
    /// Удалить склад (только для админа)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteWarehouse(int id)
    {
        var adminId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        
        var warehouse = await _context.Warehouses
            .Include(w => w.Orders)
            .FirstOrDefaultAsync(w => w.Id == id);
        
        if (warehouse == null)
        {
            return NotFound(new ApiResponse<object> 
            { 
                Success = false, 
                Message = "Склад не найден" 
            });
        }
        
        // Проверяем наличие активных заказов
        var pendingOrders = warehouse.Orders.Count(o => o.Status == "pending");
        if (pendingOrders > 0)
        {
            return BadRequest(new ApiResponse<object> 
            { 
                Success = false, 
                Message = $"Невозможно удалить склад с {pendingOrders} активными заказами" 
            });
        }
        
        // Мягкое удаление - меняем статус
        warehouse.Status = "deleted";
        warehouse.UpdatedAt = DateTime.UtcNow;
        
        _context.ActionHistories.Add(new ActionHistory
        {
            ActionType = "warehouse_deleted",
            Description = $"Склад '{warehouse.Name}' был удалён",
            UserId = adminId,
            WarehouseId = warehouse.Id
        });
        
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Склад успешно удалён"
        });
    }
}
