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
    }
}