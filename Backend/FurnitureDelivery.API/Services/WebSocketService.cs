using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;

namespace FurnitureDelivery.API.Services
{
    public class WebSocketService : IWebSocketService
    {
        private readonly ConcurrentDictionary<string, WebSocket> _connections;
        private readonly ConcurrentDictionary<int, HashSet<string>> _userConnections;
        private readonly ConcurrentDictionary<int, HashSet<string>> _deliveryConnections;
        private readonly ConcurrentDictionary<string, int> _connectionToUser;
        private readonly ILogger<WebSocketService> _logger;
        private readonly ApplicationDbContext _dbContext;

        public WebSocketService(ILogger<WebSocketService> logger, ApplicationDbContext dbContext)
        {
            _connections = new ConcurrentDictionary<string, WebSocket>();
            _userConnections = new ConcurrentDictionary<int, HashSet<string>>();
            _deliveryConnections = new ConcurrentDictionary<int, HashSet<string>>();
            _connectionToUser = new ConcurrentDictionary<string, int>();
            _logger = logger;
            _dbContext = dbContext;
        }

        public void AddConnection(string connectionId, WebSocket webSocket)
        {
            _connections.TryAdd(connectionId, webSocket);
            _logger.LogInformation($"WebSocket connection added: {connectionId}");
        }

        public async Task RemoveConnection(string connectionId)
        {
            if (_connections.TryRemove(connectionId, out _))
            {
                _logger.LogInformation($"WebSocket connection removed: {connectionId}");
                
                // Remove user association
                if (_connectionToUser.TryRemove(connectionId, out var userId))
                {
                    if (_userConnections.TryGetValue(userId, out var userConnections))
                    {
                        userConnections.Remove(connectionId);
                        if (userConnections.Count == 0)
                        {
                            _userConnections.TryRemove(userId, out _);
                        }
                    }
                }
                
                // Remove from all delivery associations
                foreach (var delivery in _deliveryConnections)
                {
                    delivery.Value.Remove(connectionId);
                    if (delivery.Value.Count == 0)
                    {
                        _deliveryConnections.TryRemove(delivery.Key, out _);
                    }
                }
            }
        }

        public void AssociateUserWithConnection(int userId, string connectionId)
        {
            _connectionToUser.TryAdd(connectionId, userId);
            
            _userConnections.AddOrUpdate(
                userId,
                new HashSet<string> { connectionId },
                (_, connections) =>
                {
                    connections.Add(connectionId);
                    return connections;
                });
            
            _logger.LogInformation($"User {userId} associated with connection {connectionId}");
        }

        public void AssociateDeliveryWithConnection(int deliveryId, string connectionId)
        {
            _deliveryConnections.AddOrUpdate(
                deliveryId,
                new HashSet<string> { connectionId },
                (_, connections) =>
                {
                    connections.Add(connectionId);
                    return connections;
                });
            
            _logger.LogInformation($"Delivery {deliveryId} associated with connection {connectionId}");
        }

        public List<string> GetConnectionsForUser(int userId)
        {
            if (_userConnections.TryGetValue(userId, out var connections))
            {
                return connections.ToList();
            }
            
            return new List<string>();
        }

        public List<string> GetConnectionsForDelivery(int deliveryId)
        {
            if (_deliveryConnections.TryGetValue(deliveryId, out var connections))
            {
                return connections.ToList();
            }
            
            return new List<string>();
        }

        public async Task SendToUser(int userId, object message)
        {
            var connections = GetConnectionsForUser(userId);
            foreach (var connectionId in connections)
            {
                await SendToConnection(connectionId, message);
            }
        }

        public async Task SendToDelivery(int deliveryId, object message)
        {
            var connections = GetConnectionsForDelivery(deliveryId);
            foreach (var connectionId in connections)
            {
                await SendToConnection(connectionId, message);
            }
        }

        public async Task SendToDrivers(object message)
        {
            // Get all driver user IDs
            var driverUserIds = _dbContext.Drivers
                .Select(d => d.UserId)
                .ToList();
            
            foreach (var userId in driverUserIds)
            {
                await SendToUser(userId, message);
            }
        }

        public async Task SendToAll(object message)
        {
            var wsMessage = new WebSocketMessage
            {
                Type = "broadcast",
                Data = message
            };
            
            var messageBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(wsMessage));
            var sendBuffer = new ArraySegment<byte>(messageBytes);
            
            var connectionsCopy = _connections.ToArray();
            foreach (var connection in connectionsCopy)
            {
                try
                {
                    if (connection.Value.State == WebSocketState.Open)
                    {
                        await connection.Value.SendAsync(
                            sendBuffer,
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending message to connection {connection.Key}");
                    await RemoveConnection(connection.Key);
                }
            }
        }

        public async Task SendToConnection(string connectionId, object message)
        {
            if (_connections.TryGetValue(connectionId, out var webSocket))
            {
                try
                {
                    if (webSocket.State == WebSocketState.Open)
                    {
                        var wsMessage = new WebSocketMessage
                        {
                            Type = message.GetType().Name.ToLower(),
                            Data = message
                        };
                        
                        var messageBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(wsMessage));
                        var sendBuffer = new ArraySegment<byte>(messageBytes);
                        
                        await webSocket.SendAsync(
                            sendBuffer,
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None);
                    }
                    else
                    {
                        _logger.LogWarning($"WebSocket connection {connectionId} is not open");
                        await RemoveConnection(connectionId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending message to connection {connectionId}");
                    await RemoveConnection(connectionId);
                }
            }
        }
        
        public async Task BroadcastLocationUpdate(int driverId, double latitude, double longitude)
        {
            try
            {
                // Find the driver
                var driver = await _dbContext.Drivers.FindAsync(driverId);
                if (driver == null)
                {
                    _logger.LogWarning($"BroadcastLocationUpdate: Driver with ID {driverId} not found");
                    return;
                }
                
                // Update the driver's location in the database
                driver.CurrentLatitude = latitude;
                driver.CurrentLongitude = longitude;
                await _dbContext.SaveChangesAsync();
                
                // Get all active deliveries for this driver
                var activeDeliveries = await _dbContext.Deliveries
                    .Where(d => d.DriverId == driverId && 
                               (d.Status == "assigned" || d.Status == "picked_up" || d.Status == "in_transit"))
                    .ToListAsync();
                
                // Create location update DTO
                var locationUpdate = new LocationUpdateDTO
                {
                    DriverId = driverId,
                    Latitude = latitude,
                    Longitude = longitude,
                    UpdatedAt = DateTime.UtcNow
                };
                
                // Send location update to all users tracking any of the active deliveries
                foreach (var delivery in activeDeliveries)
                {
                    locationUpdate.DeliveryId = delivery.Id;
                    await SendToDelivery(delivery.Id, locationUpdate);
                    
                    // Also send to the customer directly
                    await SendToUser(delivery.CustomerId, locationUpdate);
                }
                
                _logger.LogInformation($"Location update broadcast for driver {driverId} to {activeDeliveries.Count} deliveries");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error broadcasting location update for driver {driverId}");
            }
        }
        
        public async Task SendNewMessage(MessageDTO message)
        {
            try
            {
                // Send the message to the recipient
                await SendToUser(message.RecipientId, message);
                
                // Get delivery details
                var delivery = await _dbContext.Deliveries
                    .Include(d => d.Customer)
                    .Include(d => d.Driver)
                    .ThenInclude(dr => dr.User)
                    .FirstOrDefaultAsync(d => d.Id == message.DeliveryId);
                    
                if (delivery == null)
                {
                    _logger.LogWarning($"SendNewMessage: Delivery with ID {message.DeliveryId} not found");
                    return;
                }
                
                // Broadcast to all connections tracking this delivery
                await SendToDelivery(message.DeliveryId, message);
                
                // Create a notification for the recipient
                var sender = await _dbContext.Users.FindAsync(message.SenderId);
                if (sender != null)
                {
                    var notification = new Models.Notification
                    {
                        UserId = message.RecipientId,
                        Type = "message",
                        Title = "New Message",
                        Message = $"New message from {sender.FirstName} {sender.LastName}",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                        RelatedEntityType = "delivery",
                        RelatedEntityId = message.DeliveryId
                    };
                    
                    _dbContext.Notifications.Add(notification);
                    await _dbContext.SaveChangesAsync();
                    
                    // Convert to DTO for websocket
                    var notificationDto = new NotificationDTO
                    {
                        Id = notification.Id,
                        UserId = notification.UserId,
                        Type = notification.Type,
                        Title = notification.Title,
                        Message = notification.Message,
                        IsRead = notification.IsRead,
                        CreatedAt = notification.CreatedAt,
                        RelatedEntityType = notification.RelatedEntityType,
                        RelatedEntityId = notification.RelatedEntityId
                    };
                    
                    // Send notification through WebSocket
                    await SendToUser(message.RecipientId, notificationDto);
                }
                
                _logger.LogInformation($"Message sent from user {message.SenderId} to user {message.RecipientId} for delivery {message.DeliveryId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending message from user {message.SenderId} to user {message.RecipientId}");
            }
        }
        
        public async Task<int> NotifyNewMessage(int messageId)
        {
            try
            {
                var message = await _dbContext.Messages
                    .Include(m => m.Sender)
                    .Include(m => m.Recipient)
                    .Include(m => m.Delivery)
                    .FirstOrDefaultAsync(m => m.Id == messageId);

                if (message == null)
                {
                    throw new KeyNotFoundException($"Message with ID {messageId} not found");
                }

                // Create a notification for the recipient
                var notification = new Models.Notification
                {
                    UserId = message.RecipientId,
                    Type = "message",
                    Title = "New Message",
                    Message = $"New message from {message.Sender.FirstName} {message.Sender.LastName}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "message",
                    RelatedEntityId = message.Id
                };

                _dbContext.Notifications.Add(notification);
                await _dbContext.SaveChangesAsync();

                // Create MessageDTO from message entity
                var messageDto = new MessageDTO
                {
                    Id = message.Id,
                    DeliveryId = message.DeliveryId,
                    SenderId = message.SenderId,
                    SenderType = message.SenderType,
                    SenderName = $"{message.Sender.FirstName} {message.Sender.LastName}",
                    RecipientId = message.RecipientId,
                    RecipientName = $"{message.Recipient.FirstName} {message.Recipient.LastName}",
                    Content = message.Content,
                    IsRead = message.IsRead,
                    CreatedAt = message.CreatedAt
                };

                // Send message to the recipient via WebSocket
                await SendToUser(message.RecipientId, messageDto);

                // Also send to all connections tracking this delivery
                await SendToDelivery(message.DeliveryId, messageDto);

                // Create notification DTO for WebSocket
                var notificationDto = new NotificationDTO
                {
                    Id = notification.Id,
                    UserId = notification.UserId,
                    Type = notification.Type,
                    Title = notification.Title,
                    Message = notification.Message,
                    IsRead = notification.IsRead,
                    CreatedAt = notification.CreatedAt,
                    RelatedEntityType = notification.RelatedEntityType,
                    RelatedEntityId = notification.RelatedEntityId.Value
                };

                // Send notification through WebSocket
                await SendToUser(message.RecipientId, notificationDto);

                _logger.LogInformation($"Notification created for message {messageId} sent to user {message.RecipientId}");
                
                return notification.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating notification for message {messageId}");
                throw;
            }
        }
        
        public async Task BroadcastToDrivers(WebSocketMessage message)
        {
            try
            {
                // Get all drivers
                var drivers = await _dbContext.Drivers
                    .Include(d => d.User)
                    .Where(d => d.IsOnline)
                    .ToListAsync();
                
                foreach (var driver in drivers)
                {
                    if (driver.User != null)
                    {
                        await SendToUser(driver.User.Id, message);
                    }
                }
                
                _logger.LogInformation($"Message broadcast to {drivers.Count} drivers, type: {message.Type}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error broadcasting message to drivers, type: {message.Type}");
            }
        }
        
        public async Task BroadcastDeliveryStatusUpdate(int deliveryId, string status)
        {
            try
            {
                var delivery = await _dbContext.Deliveries
                    .Include(d => d.Customer)
                    .Include(d => d.Driver)
                        .ThenInclude(dr => dr != null ? dr.User : null)
                    .FirstOrDefaultAsync(d => d.Id == deliveryId);
                
                if (delivery == null)
                {
                    _logger.LogWarning($"BroadcastDeliveryStatusUpdate: Delivery with ID {deliveryId} not found");
                    return;
                }
                
                // Create status update message
                var statusUpdate = new DeliveryStatusUpdateDTO
                {
                    DeliveryId = deliveryId,
                    Status = status,
                    UpdatedAt = DateTime.UtcNow,
                    StatusDisplay = GetStatusDisplayName(status)
                };
                
                // Send to connections tracking this delivery
                await SendToDelivery(deliveryId, statusUpdate);
                
                // Send to customer
                await SendToUser(delivery.CustomerId, statusUpdate);
                
                // Send to driver if assigned
                if (delivery.DriverId.HasValue && delivery.Driver?.User != null)
                {
                    await SendToUser(delivery.Driver.User.Id, statusUpdate);
                }
                
                // Create notifications
                var title = "Delivery Status Update";
                var message = $"Your delivery #{deliveryId} is now {GetStatusDisplayName(status)}";
                
                // Notify customer
                var customerNotification = new Models.Notification
                {
                    UserId = delivery.CustomerId,
                    Type = "delivery_status",
                    Title = title,
                    Message = message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "delivery",
                    RelatedEntityId = deliveryId
                };
                
                _dbContext.Notifications.Add(customerNotification);
                
                // Notify driver if assigned
                if (delivery.DriverId.HasValue && delivery.Driver?.User != null)
                {
                    var driverNotification = new Models.Notification
                    {
                        UserId = delivery.Driver.User.Id,
                        Type = "delivery_status",
                        Title = title,
                        Message = message,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                        RelatedEntityType = "delivery",
                        RelatedEntityId = deliveryId
                    };
                    
                    _dbContext.Notifications.Add(driverNotification);
                }
                
                await _dbContext.SaveChangesAsync();
                
                _logger.LogInformation($"Delivery status update for delivery {deliveryId} broadcast: {status}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error broadcasting delivery status update for delivery {deliveryId}");
            }
        }
        
        private string GetStatusDisplayName(string status)
        {
            return status switch
            {
                "pending" => "Pending",
                "accepted" => "Accepted",
                "assigned" => "Assigned to Driver",
                "picked_up" => "Picked Up",
                "in_transit" => "In Transit",
                "delivered" => "Delivered",
                "completed" => "Completed",
                "cancelled" => "Cancelled",
                _ => status
            };
        }
    }
}