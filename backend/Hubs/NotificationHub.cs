using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Backend.Hubs;

/// <summary>
/// SignalR Hub для real-time уведомлений
/// </summary>
public class NotificationHub : Hub
{
    /// <summary>
    /// Вызывается при подключении клиента
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Добавляем пользователя в его персональную группу
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            
            // Если админ, добавляем в группу админов
            if (role == "Admin")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
            }
        }
        
        await base.OnConnectedAsync();
    }
    
    /// <summary>
    /// Вызывается при отключении клиента
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            
            if (role == "Admin")
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "admins");
            }
        }
        
        await base.OnDisconnectedAsync(exception);
    }
    
    /// <summary>
    /// Присоединяет клиента к группе склада для получения уведомлений
    /// </summary>
    public async Task JoinWarehouseGroup(int warehouseId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"warehouse_{warehouseId}");
    }
    
    /// <summary>
    /// Отсоединяет клиента от группы склада
    /// </summary>
    public async Task LeaveWarehouseGroup(int warehouseId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"warehouse_{warehouseId}");
    }
}
