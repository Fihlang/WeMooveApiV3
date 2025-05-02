using System;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Data Transfer Object for Payment entities
    /// </summary>
    public class PaymentDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [JsonPropertyName("method")]
        public string Method { get; set; } = "";
        
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";
        
        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }
        
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        [JsonPropertyName("paidAt")]
        public DateTime? PaidAt { get; set; }
    }
}