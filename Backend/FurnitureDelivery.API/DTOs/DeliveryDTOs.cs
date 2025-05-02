using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    // Update Delivery Status Request DTO
    public class UpdateDeliveryStatusRequest
    {
        [Required]
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }
    // Create Delivery Request DTO
    public class CreateDeliveryRequestDTO
    {
        [Required]
        [JsonPropertyName("pickupAddress")]
        public string PickupAddress { get; set; } = "";
        
        [Required]
        [JsonPropertyName("destinationAddress")]
        public string DestinationAddress { get; set; } = "";
        
        [Required]
        [JsonPropertyName("scheduledDate")]
        public DateTime ScheduledDate { get; set; }
        
        [JsonPropertyName("specialInstructions")]
        public string? SpecialInstructions { get; set; }
        
        [JsonPropertyName("items")]
        public List<CreateDeliveryItemDTO> Items { get; set; } = new List<CreateDeliveryItemDTO>();
    }
    
    // Create Delivery Item DTO
    public class CreateDeliveryItemDTO
    {
        [Required]
        [JsonPropertyName("furnitureId")]
        public int FurnitureId { get; set; }
        
        [Required]
        [Range(1, 100)]
        [JsonPropertyName("quantity")]
        public int Quantity { get; set; } = 1;
        
        [JsonPropertyName("specialHandling")]
        public bool SpecialHandling { get; set; }
    }
    
    // Delivery Response DTO
    public class DeliveryResponseDTO
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
        
        [JsonPropertyName("customerName")]
        public string? CustomerName { get; set; }
        
        [JsonPropertyName("customerPhone")]
        public string? CustomerPhone { get; set; }
        
        [JsonPropertyName("driverId")]
        public int? DriverId { get; set; }
        
        [JsonPropertyName("driver")]
        public DriverDTO? Driver { get; set; }
        
        [JsonPropertyName("driverName")]
        public string? DriverName { get; set; }
        
        [JsonPropertyName("driverPhone")]
        public string? DriverPhone { get; set; }
        
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
        
        [JsonPropertyName("paymentStatus")]
        public string? PaymentStatus { get; set; }
        
        [JsonPropertyName("specialInstructions")]
        public string? SpecialInstructions { get; set; }
        
        [JsonPropertyName("distance")]
        public double? Distance { get; set; }
        
        [JsonPropertyName("estimatedDuration")]
        public double? EstimatedDuration { get; set; }
        
        [JsonPropertyName("actualDuration")]
        public double? ActualDuration { get; set; }
        
        [JsonPropertyName("trackingNumber")]
        public string? TrackingNumber { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
        
        [JsonPropertyName("estimatedTime")]
        public double? EstimatedTime { get; set; }
        
        [JsonPropertyName("items")]
        public List<DeliveryItemResponseDTO>? Items { get; set; }
        
        [JsonPropertyName("events")]
        public List<DeliveryEventDTO>? Events { get; set; }
    }
    
    // Delivery Item Response DTO
    public class DeliveryItemResponseDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [JsonPropertyName("furnitureId")]
        public int FurnitureId { get; set; }
        
        [JsonPropertyName("furniture")]
        public FurnitureDTO? Furniture { get; set; }
        
        [JsonPropertyName("furnitureName")]
        public string? FurnitureName { get; set; }
        
        [JsonPropertyName("furnitureCategory")]
        public string? FurnitureCategory { get; set; }
        
        [JsonPropertyName("furnitureImageUrl")]
        public string? FurnitureImageUrl { get; set; }
        
        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }
        
        [JsonPropertyName("specialHandling")]
        public bool SpecialHandling { get; set; }
        
        [JsonPropertyName("price")]
        public decimal? Price { get; set; }
    }
    
    // Delivery Event DTO
    public class DeliveryEventDTO
    {
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }
        
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";
        
        [JsonPropertyName("description")]
        public string Description { get; set; } = "";
        
        [JsonPropertyName("agentId")]
        public int? AgentId { get; set; }
        
        [JsonPropertyName("agentName")]
        public string? AgentName { get; set; }
        
        [JsonPropertyName("location")]
        public LocationDTO? Location { get; set; }
    }
    
    // Location DTO
    public class LocationDTO
    {
        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }
        
        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }
        
        [JsonPropertyName("address")]
        public string? Address { get; set; }
    }
    
    // Assign Driver DTO
    public class AssignDriverDTO
    {
        [Required]
        [JsonPropertyName("driverId")]
        public int DriverId { get; set; }
    }
    
    // Update Delivery Status DTO
    public class UpdateDeliveryStatusDTO
    {
        [Required]
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";
        
        [JsonPropertyName("location")]
        public LocationDTO? Location { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }
    
    // Create Review DTO
    public class CreateReviewDTO
    {
        [Required]
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [Required]
        [Range(1, 5)]
        [JsonPropertyName("rating")]
        public int Rating { get; set; }
        
        [JsonPropertyName("comment")]
        public string? Comment { get; set; }
    }
    
    // Review Response DTO
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
        
        [JsonPropertyName("customerName")]
        public string? CustomerName { get; set; }
        
        [JsonPropertyName("driverId")]
        public int DriverId { get; set; }
        
        [JsonPropertyName("driverName")]
        public string? DriverName { get; set; }
        
        [JsonPropertyName("rating")]
        public int Rating { get; set; }
        
        [JsonPropertyName("comment")]
        public string? Comment { get; set; }
    }
    
    // Create Message DTO
    public class CreateMessageDTO
    {
        [Required]
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [Required]
        [JsonPropertyName("recipientId")]
        public int RecipientId { get; set; }
        
        [Required]
        [JsonPropertyName("content")]
        public string Content { get; set; } = "";
    }
}