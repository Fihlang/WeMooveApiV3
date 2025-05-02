using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Request DTO for getting drivers nearby a location
    /// </summary>
    public class DriverNearbyRequest
    {
        /// <summary>
        /// Latitude of the search location
        /// </summary>
        [Required]
        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }
        
        /// <summary>
        /// Longitude of the search location
        /// </summary>
        [Required]
        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }
        
        /// <summary>
        /// Search radius in kilometers
        /// </summary>
        [Required]
        [Range(0.1, 50.0)]
        [JsonPropertyName("radius")]
        public double Radius { get; set; } = 5.0;
        
        /// <summary>
        /// Optional vehicle type filter (e.g., "truck", "motorbike")
        /// </summary>
        [JsonPropertyName("vehicleType")]
        public string? VehicleType { get; set; }
        
        /// <summary>
        /// Whether to only include available drivers
        /// </summary>
        [JsonPropertyName("onlyAvailable")]
        public bool OnlyAvailable { get; set; } = true;
    }
    
    /// <summary>
    /// Request DTO for updating a driver's location
    /// </summary>
    public class UpdateDriverLocationRequest
    {
        /// <summary>
        /// Driver ID
        /// </summary>
        [Required]
        [JsonPropertyName("driverId")]
        public int DriverId { get; set; }
        
        /// <summary>
        /// Current latitude
        /// </summary>
        [Required]
        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }
        
        /// <summary>
        /// Current longitude
        /// </summary>
        [Required]
        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }
        
        /// <summary>
        /// Heading direction in degrees (0-360)
        /// </summary>
        [JsonPropertyName("heading")]
        public double? Heading { get; set; }
        
        /// <summary>
        /// Current speed in km/h
        /// </summary>
        [JsonPropertyName("speed")]
        public double? Speed { get; set; }
        
        /// <summary>
        /// Accuracy of the location data in meters
        /// </summary>
        [JsonPropertyName("accuracy")]
        public double? Accuracy { get; set; }
    }
}