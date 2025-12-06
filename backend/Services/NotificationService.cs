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
    
    /// <summary>
    /// Уведомляет сотрудников о новой вещи на приём
    /// </summary>
    public async Task NotifyAboutNewItemAsync(Item item)
    {
        var employees = await _context.Users
            .Where(u => (u.Role == "Admin" || u.Role == "Employee") && u.IsActive)
            .ToListAsync();
        
        foreach (var employee in employees)
        {
            var notification = new Notification
            {
                Title = "Новая заявка на хранение",
                Message = $"Клиент {item.Owner?.FullName} подал заявку на хранение: {item.Name}",
                Type = "new_item",
                UserId = employee.Id,
                WarehouseId = item.WarehouseId
            };
            
            _context.Notifications.Add(notification);
        }
        
        await _context.SaveChangesAsync();
        
        var notificationDto = new NotificationDto
        {
            Title = "Новая заявка на хранение",
            Message = $"Клиент {item.Owner?.FullName} подал заявку на хранение: {item.Name}",
            Type = "new_item",
            WarehouseId = item.WarehouseId,
            CreatedAt = DateTime.UtcNow
        };
        
        await _hubContext.Clients.Groups("admins", "employees").SendAsync("ReceiveNotification", notificationDto);
    }
    
    /// <summary>
    /// Уведомляет владельца об изменении статуса вещи
    /// </summary>
    public async Task NotifyOwnerAboutItemStatusAsync(Item item, string oldStatus)
    {
        var statusText = item.Status switch
        {
            "stored" => "принята на хранение",
            "pending_release" => "ожидает выдачи",
            "released" => "выдана",
            "disposed" => "утилизирована",
            _ => item.Status
        };
        
        var notification = new Notification
        {
            Title = "Статус вещи изменён",
            Message = $"Ваша вещь \"{item.Name}\" {statusText}",
            Type = "item_status_changed",
            UserId = item.OwnerId,
            WarehouseId = item.WarehouseId
        };
        
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        
        var notificationDto = new NotificationDto
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type,
            WarehouseId = item.WarehouseId,
            CreatedAt = notification.CreatedAt
        };
        
        await _hubContext.Clients.User(item.OwnerId.ToString()).SendAsync("ReceiveNotification", notificationDto);
        await _hubContext.Clients.User(item.OwnerId.ToString()).SendAsync("ItemStatusChanged", new { 
            itemId = item.Id, 
            newStatus = item.Status 
        });
    }
    
    /// <summary>
    /// Уведомляет сотрудников о запросе на выдачу
    /// </summary>
    public async Task NotifyAboutReleaseRequestAsync(Item item)
    {
        var employees = await _context.Users
            .Where(u => (u.Role == "Admin" || u.Role == "Employee") && u.IsActive)
            .ToListAsync();
        
        foreach (var employee in employees)
        {
            var notification = new Notification
            {
                Title = "Запрос на выдачу",
                Message = $"Клиент {item.Owner?.FullName} запросил выдачу вещи: {item.Name}",
                Type = "release_request",
                UserId = employee.Id,
                WarehouseId = item.WarehouseId
            };
            
            _context.Notifications.Add(notification);
        }
        
        await _context.SaveChangesAsync();
        
        var notificationDto = new NotificationDto
        {
            Title = "Запрос на выдачу",
            Message = $"Клиент {item.Owner?.FullName} запросил выдачу вещи: {item.Name}",
            Type = "release_request",
            WarehouseId = item.WarehouseId,
            CreatedAt = DateTime.UtcNow
        };
        
        await _hubContext.Clients.Groups("admins", "employees").SendAsync("ReceiveNotification", notificationDto);
    }
}
