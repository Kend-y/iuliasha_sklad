using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для управления уведомлениями
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly NotificationService _notificationService;
    
    public NotificationsController(AppDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }
    
    /// <summary>
    /// Получить уведомления текущего пользователя
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<NotificationDto>>> GetNotifications(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        
        var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
        var totalCount = await _context.Notifications.CountAsync(n => n.UserId == userId);
        
        return Ok(new PaginatedResponse<NotificationDto>
        {
            Success = true,
            Data = notifications,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }
    
    /// <summary>
    /// Получить количество непрочитанных уведомлений
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        var count = await _notificationService.GetUnreadCountAsync(userId);
        
        return Ok(new ApiResponse<int>
        {
            Success = true,
            Data = count
        });
    }
    
    /// <summary>
    /// Отметить уведомление как прочитанное
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int id)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        var result = await _notificationService.MarkAsReadAsync(id, userId);
        
        if (!result)
        {
            return NotFound(new ApiResponse<object> 
            { 
                Success = false, 
                Message = "Уведомление не найдено" 
            });
        }
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Уведомление отмечено как прочитанное"
        });
    }
    
    /// <summary>
    /// Отметить все уведомления как прочитанные
    /// </summary>
    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead()
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        await _notificationService.MarkAllAsReadAsync(userId);
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Все уведомления отмечены как прочитанные"
        });
    }
}
