using FurnitureDelivery.API.Models;

namespace FurnitureDelivery.API.Services
{
    public interface INotificationService
    {
        /// <summary>
        /// Creates a notification for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="type">The notification type (info, success, warning, error)</param>
        /// <param name="title">The notification title</param>
        /// <param name="message">The notification message</param>
        /// <param name="relatedEntityType">The related entity type (optional)</param>
        /// <param name="relatedEntityId">The related entity ID (optional)</param>
        /// <returns>The created notification</returns>
        Task<Notification> CreateNotification(
            int userId, 
            string type, 
            string title, 
            string message, 
            string? relatedEntityType = null, 
            int? relatedEntityId = null);
        
        /// <summary>
        /// Gets all notifications for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>A list of notifications</returns>
        Task<List<Notification>> GetNotificationsByUserId(int userId);
        
        /// <summary>
        /// Gets all unread notifications for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>A list of unread notifications</returns>
        Task<List<Notification>> GetUnreadNotificationsByUserId(int userId);
        
        /// <summary>
        /// Marks a notification as read
        /// </summary>
        /// <param name="notificationId">The notification ID</param>
        /// <returns>The updated notification</returns>
        Task<Notification> MarkNotificationAsRead(int notificationId);
        
        /// <summary>
        /// Marks all notifications for a user as read
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>The number of notifications marked as read</returns>
        Task<int> MarkAllNotificationsAsRead(int userId);
        
        /// <summary>
        /// Sends notification to all relevant users about a delivery status change
        /// </summary>
        /// <param name="deliveryId">The delivery ID</param>
        /// <param name="status">The new status</param>
        /// <returns>The number of notifications sent</returns>
        Task<int> NotifyDeliveryStatusChange(int deliveryId, string status);
        
        /// <summary>
        /// Sends notification to all relevant users about a new message
        /// </summary>
        /// <param name="messageId">The message ID</param>
        /// <returns>The number of notifications sent</returns>
        Task<int> NotifyNewMessage(int messageId);
    }
}