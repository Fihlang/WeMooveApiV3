using System;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// DTO for delivery status updates sent via WebSocket
    /// </summary>
    public class DeliveryStatusUpdateDTO
    {
        /// <summary>
        /// The delivery ID
        /// </summary>
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        /// <summary>
        /// The new status of the delivery
        /// </summary>
        [JsonPropertyName("status")]
        public string Status { get; set; }
        
        /// <summary>
        /// The timestamp of the update
        /// </summary>
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }
        
        /// <summary>
        /// A user-friendly display name for the status
        /// </summary>
        [JsonPropertyName("statusDisplay")]
        public string StatusDisplay { get; set; }
    }
}