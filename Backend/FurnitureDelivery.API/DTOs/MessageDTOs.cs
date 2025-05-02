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
         
        /// <summary>
        /// Type of sender (e.g., "customer", "driver", "system")
        /// </summary>
        [JsonPropertyName("senderType")]
        public string SenderType { get; set; }
    }
    
    /// <summary>
    /// DTO for message data
    /// </summary>
    public class MessageDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [JsonPropertyName("senderId")]
        public int SenderId { get; set; }

        [JsonPropertyName("senderType")]
        public string? SenderType { get; set; }

        [JsonPropertyName("senderName")]
        public string? SenderName { get; set; }
        
        [JsonPropertyName("recipientId")]
        public int RecipientId { get; set; }
        
        [JsonPropertyName("content")]
        public string Content { get; set; } = "";
        
        [JsonPropertyName("isRead")]
        public bool IsRead { get; set; }
    }
}