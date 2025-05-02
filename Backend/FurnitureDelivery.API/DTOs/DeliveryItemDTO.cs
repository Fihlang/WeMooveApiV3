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
        
        [JsonPropertyName("furnitureId")]
        public int FurnitureId { get; set; }
        
        [JsonPropertyName("furniture")]
        public FurnitureDTO? Furniture { get; set; }
        
        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }
        
        [JsonPropertyName("specialHandling")]
        public bool SpecialHandling { get; set; }
    }
}