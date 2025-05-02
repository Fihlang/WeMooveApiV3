using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// DTO for delivery status updates
    /// </summary>
    public class DeliveryStatusUpdateDTO
    {
        /// <summary>
        /// ID of the delivery
        /// </summary>
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        /// <summary>
        /// New status of the delivery
        /// </summary>
        [JsonPropertyName("status")]
        public string Status { get; set; }
        
        /// <summary>
        /// Timestamp of the update
        /// </summary>
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }

}