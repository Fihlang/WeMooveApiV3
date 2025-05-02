using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// DTO for sending a new message
    /// </summary>
    public class SendMessageDTO
    {
        /// <summary>
        /// ID of the delivery associated with this message
        /// </summary>
        [Required]
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        /// <summary>
        /// ID of the recipient user
        /// </summary>
        [Required]
        [JsonPropertyName("recipientId")]
        public int RecipientId { get; set; }
        
        /// <summary>
        /// Content of the message
        /// </summary>
        [Required]
        [StringLength(1000)]
        [JsonPropertyName("content")]
        public string Content { get; set; } = "";
    }
    
    /// <summary>
    /// DTO for message data
    /// </summary>
    public class MessageDTO
    {
        /// <summary>
        /// Unique identifier for the message
        /// </summary>
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        /// <summary>
        /// ID of the delivery this message is related to
        /// </summary>
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        /// <summary>
        /// ID of the user who sent the message
        /// </summary>
        [JsonPropertyName("senderId")]
        public int SenderId { get; set; }
        
        /// <summary>
        /// Type of sender (e.g., "customer", "driver", "system")
        /// </summary>
        [JsonPropertyName("senderType")]
        public string SenderType { get; set; }
        
        /// <summary>
        /// Name of the sender
        /// </summary>
        [JsonPropertyName("senderName")]
        public string SenderName { get; set; }
        
        /// <summary>
        /// ID of the user who receives the message
        /// </summary>
        [JsonPropertyName("recipientId")]
        public int RecipientId { get; set; }
        
        /// <summary>
        /// Name of the recipient
        /// </summary>
        [JsonPropertyName("recipientName")]
        public string RecipientName { get; set; }
        
        /// <summary>
        /// Content of the message
        /// </summary>
        [JsonPropertyName("content")]
        public string Content { get; set; }
        
        /// <summary>
        /// Indicates if the message has been read
        /// </summary>
        [JsonPropertyName("isRead")]
        public bool IsRead { get; set; }
        
        /// <summary>
        /// Time when the message was created
        /// </summary>
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
    
    /// <summary>
    /// DTO for notification data
    /// </summary>
    public class NotificationDTO
    {
        /// <summary>
        /// Unique identifier for the notification
        /// </summary>
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        /// <summary>
        /// ID of the user this notification is for
        /// </summary>
        [JsonPropertyName("userId")]
        public int UserId { get; set; }
        
        /// <summary>
        /// Type of notification (e.g., "message", "delivery_status", etc.)
        /// </summary>
        [JsonPropertyName("type")]
        public string Type { get; set; }
        
        /// <summary>
        /// Title of the notification
        /// </summary>
        [JsonPropertyName("title")]
        public string Title { get; set; }
        
        /// <summary>
        /// Content of the notification
        /// </summary>
        [JsonPropertyName("message")]
        public string Message { get; set; }
        
        /// <summary>
        /// Whether the notification has been read
        /// </summary>
        [JsonPropertyName("isRead")]
        public bool IsRead { get; set; }
        
        /// <summary>
        /// Time when the notification was created
        /// </summary>
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// Type of the related entity (e.g., "delivery", "message")
        /// </summary>
        [JsonPropertyName("relatedEntityType")]
        public string RelatedEntityType { get; set; }
        
        /// <summary>
        /// ID of the related entity
        /// </summary>
        [JsonPropertyName("relatedEntityId")]
        public int RelatedEntityId { get; set; }
    }
    
    /// <summary>
    /// DTO for location updates
    /// </summary>
    public class LocationUpdateDTO
    {
        /// <summary>
        /// ID of the driver
        /// </summary>
        [JsonPropertyName("driverId")]
        public int DriverId { get; set; }
        
        /// <summary>
        /// ID of the delivery
        /// </summary>
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        /// <summary>
        /// Current latitude
        /// </summary>
        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }
        
        /// <summary>
        /// Current longitude
        /// </summary>
        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }
        
        /// <summary>
        /// Timestamp of the update
        /// </summary>
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }
}