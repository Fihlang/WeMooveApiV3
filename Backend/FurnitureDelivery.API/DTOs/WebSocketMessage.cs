using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Generic WebSocket message wrapper
    /// </summary>
    public class WebSocketMessage
    {
        /// <summary>
        /// Type of the message (e.g., "delivery_update", "new_delivery", "location_update")
        /// </summary>
        [JsonPropertyName("type")]
        public string Type { get; set; }
        
        /// <summary>
        /// Data payload of the message
        /// </summary>
        [JsonPropertyName("data")]
        public object Data { get; set; }
    }
}