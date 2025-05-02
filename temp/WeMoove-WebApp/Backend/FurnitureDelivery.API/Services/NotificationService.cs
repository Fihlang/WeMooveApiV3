using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FurnitureDelivery.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IWebSocketService _webSocketService;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            ApplicationDbContext dbContext,
            IWebSocketService webSocketService,
            ILogger<NotificationService> logger)
        {
            _dbContext = dbContext;
            _webSocketService = webSocketService;
            _logger = logger;
        }

        public async Task<Notification> CreateNotification(
            int userId, 
            string type, 
            string title, 
            string message, 
            string? relatedEntityType = null, 
            int? relatedEntityId = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                RelatedEntityType = relatedEntityType,
                RelatedEntityId = relatedEntityId
            };

            await _dbContext.Notifications.AddAsync(notification);
            await _dbContext.SaveChangesAsync();

            // Send real-time notification via WebSocket
            try
            {
                var notificationDto = new NotificationDTO
                {
                    Id = notification.Id,
                    CreatedAt = notification.CreatedAt,
                    UserId = notification.UserId,
                    Type = notification.Type,
                    Title = notification.Title,
                    Message = notification.Message,
                    IsRead = notification.IsRead,
                    RelatedEntityType = notification.RelatedEntityType,
                    RelatedEntityId = notification.RelatedEntityId
                };

                await _webSocketService.SendToUser(userId, notificationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send notification via WebSocket");
            }

            return notification;
        }

        public async Task<List<Notification>> GetNotificationsByUserId(int userId)
        {
            return await _dbContext.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Notification>> GetUnreadNotificationsByUserId(int userId)
        {
            return await _dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task<Notification> MarkNotificationAsRead(int notificationId)
        {
            var notification = await _dbContext.Notifications.FindAsync(notificationId);
            if (notification == null)
            {
                throw new KeyNotFoundException($"Notification with ID {notificationId} not found");
            }

            notification.IsRead = true;
            await _dbContext.SaveChangesAsync();
            return notification;
        }

        public async Task<int> MarkAllNotificationsAsRead(int userId)
        {
            var unreadNotifications = await _dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _dbContext.SaveChangesAsync();
            return unreadNotifications.Count;
        }

        public async Task<int> NotifyDeliveryStatusChange(int deliveryId, string status)
        {
            var delivery = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Driver)
                .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == deliveryId);

            if (delivery == null)
            {
                throw new KeyNotFoundException($"Delivery with ID {deliveryId} not found");
            }

            // Generate appropriate title and message based on the status
            string title = $"Delivery Status Update";
            string message = $"Your delivery #{deliveryId} status has been updated to: {status}";
            
            // Get timestamp for the update
            var timestamp = DateTime.UtcNow;

            // Send notification to customer
            await CreateNotification(
                delivery.CustomerId,
                "delivery_status",
                title,
                message,
                "Delivery",
                deliveryId);

            // Send notification to driver if assigned
            if (delivery.DriverId.HasValue)
            {
                string driverTitle = "Delivery Status Update";
                string driverMessage = $"Delivery #{deliveryId} status has been updated to: {status}";
                
                await CreateNotification(
                    delivery.Driver!.UserId,
                    "delivery_status",
                    driverTitle,
                    driverMessage,
                    "Delivery",
                    deliveryId);
            }

            // Send status update via WebSocket
            try
            {
                var statusUpdate = new StatusUpdateDTO
                {
                    DeliveryId = deliveryId,
                    Status = status,
                    PreviousStatus = delivery.Status,
                    UpdatedAt = timestamp
                };

                // Update delivery status in database
                delivery.Status = status;
                delivery.UpdatedAt = timestamp;
                await _dbContext.SaveChangesAsync();

                // Send to all users tracking this delivery
                await _webSocketService.SendToDelivery(deliveryId, statusUpdate);

                return delivery.DriverId.HasValue ? 2 : 1; // Return the number of notifications sent
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send delivery status update via WebSocket");
                throw;
            }
        }

        public async Task<int> NotifyNewMessage(int messageId)
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

            // Create notification for the recipient
            string title = $"New Message";
            string senderName = $"{message.Sender.FirstName} {message.Sender.LastName}";
            string notificationMessage = $"You have a new message from {senderName} regarding delivery #{message.DeliveryId}";

            await CreateNotification(
                message.RecipientId,
                "new_message",
                title,
                notificationMessage,
                "Message",
                messageId);

            // Send message update via WebSocket
            try
            {
                var messageDto = new MessageDTO
                {
                    Id = message.Id,
                    CreatedAt = message.CreatedAt,
                    DeliveryId = message.DeliveryId,
                    SenderId = message.SenderId,
                    RecipientId = message.RecipientId,
                    Content = message.Content,
                    IsRead = message.IsRead
                };

                // Send to the recipient
                await _webSocketService.SendToUser(message.RecipientId, messageDto);

                return 1; // Return the number of notifications sent
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send new message notification via WebSocket");
                throw;
            }
        }
    }
}