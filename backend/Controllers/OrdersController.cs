using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для управления заказами
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly NotificationService _notificationService;
    
    public OrdersController(AppDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }
    
    /// <summary>
    /// Получить заказы текущего пользователя (для клиента)
    /// </summary>
    [HttpGet("my")]
    public async Task<ActionResult<PaginatedResponse<OrderDto>>> GetMyOrders(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        
        var query = _context.Orders
            .Include(o => o.Warehouse)
            .Include(o => o.User)
            .Where(o => o.UserId == userId);
        
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(o => o.Status == status);
        }
        
        var totalCount = await query.CountAsync();
        
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                Description = o.Description,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt,
                UserId = o.UserId,
                UserName = o.User!.FullName,
                UserEmail = o.User.Email,
                WarehouseId = o.WarehouseId,
                WarehouseName = o.Warehouse!.Name
            })
            .ToListAsync();
        
        return Ok(new PaginatedResponse<OrderDto>
        {
            Success = true,
            Data = orders,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }
    
    /// <summary>
    /// Получить все заказы (только для админа)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PaginatedResponse<OrderDto>>> GetAllOrders(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] int? warehouseId = null)
    {
        var query = _context.Orders
            .Include(o => o.Warehouse)
            .Include(o => o.User)
            .AsQueryable();
        
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(o => o.Status == status);
        }
        
        if (warehouseId.HasValue)
        {
            query = query.Where(o => o.WarehouseId == warehouseId.Value);
        }
        
        var totalCount = await query.CountAsync();
        
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                Description = o.Description,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt,
                UserId = o.UserId,
                UserName = o.User!.FullName,
                UserEmail = o.User.Email,
                WarehouseId = o.WarehouseId,
                WarehouseName = o.Warehouse!.Name
            })
            .ToListAsync();
        
        return Ok(new PaginatedResponse<OrderDto>
        {
            Success = true,
            Data = orders,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }
    
    /// <summary>
    /// Создать новый заказ (для клиента)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        
        // Валидация
        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new ApiResponse<OrderDto> 
            { 
                Success = false, 
                Message = "Описание заказа обязательно" 
            });
        }
        
        // Проверка склада
        var warehouse = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.Id == request.WarehouseId && w.Status == "active");
        
        if (warehouse == null)
        {
            return BadRequest(new ApiResponse<OrderDto> 
            { 
                Success = false, 
                Message = "Склад не найден или недоступен" 
            });
        }
        
        // Создание заказа
        var order = new Order
        {
            Description = request.Description,
            Status = "pending",
            UserId = userId,
            WarehouseId = request.WarehouseId,
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        
        // Загружаем связанные данные
        await _context.Entry(order).Reference(o => o.User).LoadAsync();
        await _context.Entry(order).Reference(o => o.Warehouse).LoadAsync();
        
        // Записываем в историю
        _context.ActionHistories.Add(new ActionHistory
        {
            ActionType = "order_created",
            Description = $"Создан новый заказ #{order.Id} на склад '{warehouse.Name}'",
            UserId = userId,
            OrderId = order.Id,
            WarehouseId = warehouse.Id
        });
        await _context.SaveChangesAsync();
        
        // Уведомляем админов
        await _notificationService.NotifyAdminsAboutNewOrderAsync(order);
        
        return Ok(new ApiResponse<OrderDto>
        {
            Success = true,
            Message = "Заказ успешно создан",
            Data = new OrderDto
            {
                Id = order.Id,
                Description = order.Description,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                UserId = order.UserId,
                UserName = order.User!.FullName,
                UserEmail = order.User.Email,
                WarehouseId = order.WarehouseId,
                WarehouseName = order.Warehouse!.Name
            }
        });
    }
    
    /// <summary>
    /// Обновить статус заказа (только для админа)
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateOrderStatus(
        int id, 
        [FromBody] UpdateOrderStatusRequest request)
    {
        var adminId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        
        // Валидация статуса
        var allowedStatuses = new[] { "approved", "rejected", "pending" };
        if (!allowedStatuses.Contains(request.Status))
        {
            return BadRequest(new ApiResponse<OrderDto> 
            { 
                Success = false, 
                Message = "Недопустимый статус" 
            });
        }
        
        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Warehouse)
            .FirstOrDefaultAsync(o => o.Id == id);
        
        if (order == null)
        {
            return NotFound(new ApiResponse<OrderDto> 
            { 
                Success = false, 
                Message = "Заказ не найден" 
            });
        }
        
        var oldStatus = order.Status;
        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;
        
        // Записываем в историю
        var actionType = request.Status == "approved" ? "order_approved" : "order_rejected";
        var statusText = request.Status == "approved" ? "одобрен" : "отклонён";
        
        _context.ActionHistories.Add(new ActionHistory
        {
            ActionType = actionType,
            Description = $"Заказ #{order.Id} был {statusText} администратором",
            UserId = adminId,
            OrderId = order.Id,
            WarehouseId = order.WarehouseId
        });
        
        await _context.SaveChangesAsync();
        
        // Уведомляем клиента
        await _notificationService.NotifyClientAboutOrderStatusAsync(order, oldStatus);
        
        return Ok(new ApiResponse<OrderDto>
        {
            Success = true,
            Message = $"Статус заказа изменён на '{statusText}'",
            Data = new OrderDto
            {
                Id = order.Id,
                Description = order.Description,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                UserId = order.UserId,
                UserName = order.User!.FullName,
                UserEmail = order.User.Email,
                WarehouseId = order.WarehouseId,
                WarehouseName = order.Warehouse!.Name
            }
        });
    }
    
    /// <summary>
    /// Получить заказ по ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetOrder(int id)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Warehouse)
            .FirstOrDefaultAsync(o => o.Id == id);
        
        if (order == null)
        {
            return NotFound(new ApiResponse<OrderDto> 
            { 
                Success = false, 
                Message = "Заказ не найден" 
            });
        }
        
        // Проверяем права доступа
        if (role != "Admin" && order.UserId != userId)
        {
            return Forbid();
        }
        
        return Ok(new ApiResponse<OrderDto>
        {
            Success = true,
            Data = new OrderDto
            {
                Id = order.Id,
                Description = order.Description,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                UserId = order.UserId,
                UserName = order.User!.FullName,
                UserEmail = order.User.Email,
                WarehouseId = order.WarehouseId,
                WarehouseName = order.Warehouse!.Name
            }
        });
    }
}
