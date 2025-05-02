using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Data Transfer Object for Delivery entities
    /// </summary>
    public class DeliveryDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }
        
        [JsonPropertyName("customerId")]
        public int CustomerId { get; set; }
        
        [JsonPropertyName("customer")]
        public UserDTO? Customer { get; set; }
        
        [JsonPropertyName("driverId")]
        public int? DriverId { get; set; }
        
        [JsonPropertyName("driver")]
        public DriverDTO? Driver { get; set; }
        
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";
        
        [JsonPropertyName("scheduledDate")]
        public DateTime ScheduledDate { get; set; }
        
        [JsonPropertyName("pickupAddress")]
        public string PickupAddress { get; set; } = "";
        
        [JsonPropertyName("destinationAddress")]
        public string DestinationAddress { get; set; } = "";
        
        [JsonPropertyName("totalPrice")]
        public decimal TotalPrice { get; set; }
        
        [JsonPropertyName("payment")]
        public PaymentDTO? Payment { get; set; }
        
        [JsonPropertyName("distance")]
        public double? Distance { get; set; }
        
        [JsonPropertyName("trackingNumber")]
        public string? TrackingNumber { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
        
        [JsonPropertyName("estimatedTime")]
        public double? EstimatedTime { get; set; }
        
        [JsonPropertyName("deliveryType")]
        public string DeliveryType { get; set; } = "furniture"; // "furniture" or "parcel"
        
        [JsonPropertyName("requiredVehicleType")]
        public string RequiredVehicleType { get; set; } = "truck"; // "truck" or "motorbike"
        
        [JsonPropertyName("items")]
        public List<DeliveryItemDTO>? Items { get; set; }
    }
}