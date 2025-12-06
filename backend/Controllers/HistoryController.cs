using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для истории действий (только для админа)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class HistoryController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public HistoryController(AppDbContext context)
    {
        _context = context;
    }
    
    /// <summary>
    /// Получить историю действий
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<ActionHistoryDto>>> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? actionType = null,
        [FromQuery] int? userId = null)
    {
        var query = _context.ActionHistories
            .Include(h => h.User)
            .AsQueryable();
        
        if (!string.IsNullOrEmpty(actionType))
        {
            query = query.Where(h => h.ActionType == actionType);
        }
        
        if (userId.HasValue)
        {
            query = query.Where(h => h.UserId == userId.Value);
        }
        
        var totalCount = await query.CountAsync();
        
        var history = await query
            .OrderByDescending(h => h.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new ActionHistoryDto
            {
                Id = h.Id,
                ActionType = h.ActionType,
                Description = h.Description,
                CreatedAt = h.CreatedAt,
                UserName = h.User != null ? h.User.FullName : null,
                UserEmail = h.User != null ? h.User.Email : null,
                OrderId = h.OrderId,
                WarehouseId = h.WarehouseId
            })
            .ToListAsync();
        
        return Ok(new PaginatedResponse<ActionHistoryDto>
        {
            Success = true,
            Data = history,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }
    
    /// <summary>
    /// Получить статистику по действиям
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<object>>> GetStats()
    {
        var stats = await _context.ActionHistories
            .GroupBy(h => h.ActionType)
            .Select(g => new { ActionType = g.Key, Count = g.Count() })
            .ToListAsync();
        
        var totalOrders = await _context.Orders.CountAsync();
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == "pending");
        var approvedOrders = await _context.Orders.CountAsync(o => o.Status == "approved");
        var rejectedOrders = await _context.Orders.CountAsync(o => o.Status == "rejected");
        
        var totalWarehouses = await _context.Warehouses.CountAsync(w => w.Status != "deleted");
        var activeWarehouses = await _context.Warehouses.CountAsync(w => w.Status == "active");
        
        var totalClients = await _context.Users.CountAsync(u => u.Role == "Client");
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = new
            {
                ActionStats = stats,
                Orders = new
                {
                    Total = totalOrders,
                    Pending = pendingOrders,
                    Approved = approvedOrders,
                    Rejected = rejectedOrders
                },
                Warehouses = new
                {
                    Total = totalWarehouses,
                    Active = activeWarehouses
                },
                Clients = totalClients
            }
        });
    }
}
