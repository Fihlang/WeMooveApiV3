using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Data Transfer Object for User entities
    /// </summary>
    public class UserDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("email")]
        public string Email { get; set; } = "";
        
        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = "";
        
        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = "";
        
        [JsonPropertyName("phoneNumber")]
        public string PhoneNumber { get; set; } = "";
        
        [JsonPropertyName("address")]
        public string? Address { get; set; }
        
        [JsonPropertyName("avatarUrl")]
        public string? AvatarUrl { get; set; }
        
        [JsonPropertyName("userType")]
        public string UserType { get; set; } = "";
        
        [JsonPropertyName("isVerified")]
        public bool IsVerified { get; set; }
        
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

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
        
        [JsonPropertyName("user")]
        public UserDTO? User { get; set; }
    }

    /// <summary>
    /// Request to register a new user
    /// </summary>
    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        [JsonPropertyName("email")]
        public string Email { get; set; } = "";
        
        [Required]
        [MinLength(6)]
        [JsonPropertyName("password")]
        public string Password { get; set; } = "";
        
        [Required]
        [Compare("Password")]
        [JsonPropertyName("confirmPassword")]
        public string ConfirmPassword { get; set; } = "";
        
        [Required]
        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = "";
        
        [Required]
        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = "";
        
        [Required]
        [Phone]
        [JsonPropertyName("phoneNumber")]
        public string PhoneNumber { get; set; } = "";
        
        [JsonPropertyName("address")]
        public string? Address { get; set; }
        
        [JsonPropertyName("avatarUrl")]
        public string? AvatarUrl { get; set; }
        
        [Required]
        [JsonPropertyName("userType")]
        public string UserType { get; set; } = "Customer"; // Customer or Driver
    }

    /// <summary>
    /// Request to register a new driver, extending the user registration request
    /// </summary>
    public class RegisterDriverRequest : RegisterRequest
    {
        [Required]
        [JsonPropertyName("vehicleType")]
        public string VehicleType { get; set; } = "";
        
        [Required]
        [JsonPropertyName("licensePlate")]
        public string LicensePlate { get; set; } = "";
        
        [Required]
        [JsonPropertyName("capacity")]
        public string Capacity { get; set; } = "";
    }

    /// <summary>
    /// Response for authentication operations
    /// </summary>
    public class AuthResponse
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("email")]
        public string Email { get; set; } = "";
        
        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = "";
        
        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = "";
        
        [JsonPropertyName("phoneNumber")]
        public string PhoneNumber { get; set; } = "";
        
        [JsonPropertyName("address")]
        public string? Address { get; set; }
        
        [JsonPropertyName("avatarUrl")]
        public string? AvatarUrl { get; set; }
        
        [JsonPropertyName("userType")]
        public string UserType { get; set; } = "";
        
        [JsonPropertyName("isVerified")]
        public bool IsVerified { get; set; }
        
        [JsonPropertyName("token")]
        public string Token { get; set; } = "";
        
        [JsonPropertyName("driverId")]
        public int? DriverId { get; set; }
        
        [JsonPropertyName("expiresAt")]
        public DateTime ExpiresAt { get; set; }
    }

    /// <summary>
    /// Request to validate an authentication token
    /// </summary>
    public class ValidateTokenRequest
    {
        [Required]
        [JsonPropertyName("token")]
        public string Token { get; set; } = "";
    }

    /// <summary>
    /// Request to update a user's profile information
    /// </summary>
    public class UpdateProfileRequest
    {
        [JsonPropertyName("firstName")]
        public string? FirstName { get; set; }
        
        [JsonPropertyName("lastName")]
        public string? LastName { get; set; }
        
        [Phone]
        [JsonPropertyName("phoneNumber")]
        public string? PhoneNumber { get; set; }
        
        [JsonPropertyName("address")]
        public string? Address { get; set; }
        
        [JsonPropertyName("avatarUrl")]
        public string? AvatarUrl { get; set; }
    }
}