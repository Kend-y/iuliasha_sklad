using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Services;

/// <summary>
/// Сервис для работы с уведомлениями
/// </summary>
public class NotificationService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    
    public NotificationService(AppDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }
    
    /// <summary>
    /// Создает уведомление о новом заказе для всех администраторов
    /// </summary>
    public async Task NotifyAdminsAboutNewOrderAsync(Order order)
    {
        var admins = await _context.Users
            .Where(u => u.Role == "Admin" && u.IsActive)
            .ToListAsync();
        
        foreach (var admin in admins)
        {
            var notification = new Notification
            {
                Title = "Новый заказ",
                Message = $"Клиент создал новый заказ на склад '{order.Warehouse?.Name}'",
                Type = "new_order",
                UserId = admin.Id,
                OrderId = order.Id,
                WarehouseId = order.WarehouseId
            };
            
            _context.Notifications.Add(notification);
        }
        
        await _context.SaveChangesAsync();
        
        // Отправка real-time уведомления через SignalR
        var notificationDto = new NotificationDto
        {
            Title = "Новый заказ",
            Message = $"Клиент создал новый заказ на склад '{order.Warehouse?.Name}'",
            Type = "new_order",
            OrderId = order.Id,
            WarehouseId = order.WarehouseId,
            CreatedAt = DateTime.UtcNow
        };
        
        await _hubContext.Clients.Group("admins").SendAsync("ReceiveNotification", notificationDto);
    }
    
    /// <summary>
    /// Создает уведомление об изменении статуса заказа для клиента
    /// </summary>
    public async Task NotifyClientAboutOrderStatusAsync(Order order, string oldStatus)
    {
        var statusText = order.Status switch
        {
            "approved" => "одобрен",
            "rejected" => "отклонён",
            _ => order.Status
        };
        
        var notification = new Notification
        {
            Title = "Статус заказа изменён",
            Message = $"Ваш заказ #{order.Id} был {statusText}",
            Type = "order_status_changed",
            UserId = order.UserId,
            OrderId = order.Id,
            WarehouseId = order.WarehouseId
        };
        
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        
        // Отправка real-time уведомления через SignalR
        var notificationDto = new NotificationDto
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type,
            OrderId = order.Id,
            WarehouseId = order.WarehouseId,
            CreatedAt = notification.CreatedAt
        };
        
        await _hubContext.Clients.User(order.UserId.ToString()).SendAsync("ReceiveNotification", notificationDto);
        await _hubContext.Clients.User(order.UserId.ToString()).SendAsync("OrderStatusChanged", new { 
            orderId = order.Id, 
            newStatus = order.Status 
        });
    }
    
    /// <summary>
    /// Получает уведомления пользователя
    /// </summary>
    public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 20)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                OrderId = n.OrderId,
                WarehouseId = n.WarehouseId
            })
            .ToListAsync();
    }
    
    /// <summary>
    /// Отмечает уведомление как прочитанное
    /// </summary>
    public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        
        if (notification == null) return false;
        
        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return true;
    }
    
    /// <summary>
    /// Отмечает все уведомления пользователя как прочитанные
    /// </summary>
    public async Task MarkAllAsReadAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();
        
        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }
        
        await _context.SaveChangesAsync();
    }
    
    /// <summary>
    /// Получает количество непрочитанных уведомлений
    /// </summary>
    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }
}
