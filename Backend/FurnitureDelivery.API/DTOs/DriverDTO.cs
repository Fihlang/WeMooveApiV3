using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Data Transfer Object for Driver entities with associated User information
    /// </summary>
    public class DriverDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("userId")]
        public int UserId { get; set; }
        
        [JsonPropertyName("vehicleType")]
        public string VehicleType { get; set; } = "";
        
        [JsonPropertyName("licensePlate")]
        public string LicensePlate { get; set; } = "";
        
        [JsonPropertyName("capacity")]
        public string Capacity { get; set; } = "";
        
        [JsonPropertyName("rating")]
        public double? Rating { get; set; }
        
        [JsonPropertyName("isAvailable")]
        public bool IsAvailable { get; set; }
        
        [JsonPropertyName("currentLatitude")]
        public double? CurrentLatitude { get; set; }
        
        [JsonPropertyName("currentLongitude")]
        public double? CurrentLongitude { get; set; }
        
        [JsonPropertyName("verificationStatus")]
        public string VerificationStatus { get; set; } = "";
        
        [JsonPropertyName("documents")]
        public string? Documents { get; set; }
        
        [JsonPropertyName("supportsParcel")]
        public bool? SupportsParcel { get; set; }
        
        [JsonPropertyName("user")]
        public UserDTO? User { get; set; }
    }
}