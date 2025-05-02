using System;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Response DTO for review data including customer and driver information
    /// </summary>
    public class ReviewResponseDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [JsonPropertyName("customerId")]
        public int CustomerId { get; set; }
        
        [JsonPropertyName("customer")]
        public UserDTO Customer { get; set; }
        
        [JsonPropertyName("driverId")]
        public int DriverId { get; set; }
        
        [JsonPropertyName("driver")]
        public DriverDTO Driver { get; set; }
        
        [JsonPropertyName("rating")]
        public int Rating { get; set; }
        
        [JsonPropertyName("comment")]
        public string Comment { get; set; }
    }
}