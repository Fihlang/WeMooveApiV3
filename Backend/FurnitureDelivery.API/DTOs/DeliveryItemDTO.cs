using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Data Transfer Object for Delivery Item entities
    /// </summary>
    public class DeliveryItemDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("deliveryId")]
        public int DeliveryId { get; set; }
        
        [JsonPropertyName("itemType")]
        public string ItemType { get; set; } = "furniture"; // "furniture" or "package"
        
        [JsonPropertyName("furnitureId")]
        public int? FurnitureId { get; set; }
        
        [JsonPropertyName("packageId")]
        public int? PackageId { get; set; }
        
        [JsonPropertyName("furniture")]
        public FurnitureDTO? Furniture { get; set; }
        
        [JsonPropertyName("package")]
        public PackageDTO? Package { get; set; }
        
        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }
        
        [JsonPropertyName("specialHandling")]
        public bool SpecialHandling { get; set; }
    }
}