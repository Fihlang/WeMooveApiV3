using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    // WebSocket Message container
    public class WebSocketMessage
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "";
        
        [JsonPropertyName("data")]
        public object Data { get; set; } = null!;
    }
    
    // Notification DTO
    public class NotificationDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        [JsonPropertyName("userId")]
        public int UserId { get; set; }
        
        [JsonPropertyName("type")]
        public string Type { get; set; } = "";
        
        [JsonPropertyName("title")]
        public string Title { get; set; } = "";
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";
        
        [JsonPropertyName("isRead")]
        public bool IsRead { get; set; }
        
        [JsonPropertyName("relatedEntityType")]
        public string? RelatedEntityType { get; set; }
        
        [JsonPropertyName("relatedEntityId")]
        public int? RelatedEntityId { get; set; }
    }
    
    // Status Update DTO
    public class StatusUpdateDTO
    {
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";
        
        [JsonPropertyName("previousStatus")]
        public string? PreviousStatus { get; set; }
        
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }
    
    // Message DTO
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
    
    // Location Update DTO
    public class LocationUpdateDTO
    {
        [JsonPropertyName("driverId")]
        public int DriverId { get; set; }
        
        [JsonPropertyName("deliveryId")]
        public int? DeliveryId { get; set; }
        
        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }
        
        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }
        
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }
        
        [JsonPropertyName("heading")]
        public double? Heading { get; set; }
        
        [JsonPropertyName("speed")]
        public double? Speed { get; set; }
        
        [JsonPropertyName("estimatedArrival")]
        public DateTime? EstimatedArrival { get; set; }
    }
    
    // Driver Availability Update DTO
    public class DriverAvailabilityDTO
    {
        [JsonPropertyName("driverId")]
        public int DriverId { get; set; }
        
        [JsonPropertyName("userId")]
        public int UserId { get; set; }
        
        [JsonPropertyName("isAvailable")]
        public bool IsAvailable { get; set; }
        
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }
    
    // Delivery Assignment DTO
    public class DeliveryAssignmentDTO
    {
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [JsonPropertyName("driverId")]
        public int DriverId { get; set; }
        
        [JsonPropertyName("assignedAt")]
        public DateTime AssignedAt { get; set; }
        
        [JsonPropertyName("estimatedPickupTime")]
        public DateTime? EstimatedPickupTime { get; set; }
        
        [JsonPropertyName("estimatedDeliveryTime")]
        public DateTime? EstimatedDeliveryTime { get; set; }
    }
    
    // Delivery Request DTO
    public class DeliveryRequestDTO
    {
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [JsonPropertyName("customerId")]
        public int CustomerId { get; set; }
        
        [JsonPropertyName("pickupAddress")]
        public string PickupAddress { get; set; } = "";
        
        [JsonPropertyName("destinationAddress")]
        public string DestinationAddress { get; set; } = "";
        
        [JsonPropertyName("scheduledDate")]
        public DateTime ScheduledDate { get; set; }
        
        [JsonPropertyName("totalPrice")]
        public decimal TotalPrice { get; set; }
        
        [JsonPropertyName("itemCount")]
        public int ItemCount { get; set; }
        
        [JsonPropertyName("specialHandling")]
        public bool SpecialHandling { get; set; }
        
        [JsonPropertyName("distance")]
        public double? Distance { get; set; }
        
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
    
    // Error DTO
    public class ErrorDTO
    {
        [JsonPropertyName("errorCode")]
        public string ErrorCode { get; set; } = "";
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";
        
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}