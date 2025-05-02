using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    // Register Request DTO
    public class RegisterRequestDTO
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
    
    // Register Driver Request DTO
    public class RegisterDriverRequestDTO : RegisterRequestDTO
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

        [Required]
        [JsonPropertyName("documents")]
        public string Documents { get; set; } = "";

        
    }
    
    // Login Request DTO
    public class LoginRequestDTO
    {
        [Required]
        [EmailAddress]
        [JsonPropertyName("email")]
        public string Email { get; set; } = "";
        
        [Required]
        [JsonPropertyName("password")]
        public string Password { get; set; } = "";
    }
    
    // Auth Response DTO
    public class AuthResponseDTO
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

        public static implicit operator AuthResponseDTO(DriverDTO v)
        {
            throw new NotImplementedException();
        }
    }
    
    // Password Reset Request DTO
    public class PasswordResetRequestDTO
    {
        [Required]
        [EmailAddress]
        [JsonPropertyName("email")]
        public string Email { get; set; } = "";
    }
    
    // Password Reset Confirm DTO
    public class PasswordResetConfirmDTO
    {
        [Required]
        [EmailAddress]
        [JsonPropertyName("email")]
        public string Email { get; set; } = "";
        
        [Required]
        [JsonPropertyName("resetToken")]
        public string ResetToken { get; set; } = "";
        
        [Required]
        [MinLength(6)]
        [JsonPropertyName("newPassword")]
        public string NewPassword { get; set; } = "";
        
        [Required]
        [Compare("NewPassword")]
        [JsonPropertyName("confirmPassword")]
        public string ConfirmPassword { get; set; } = "";
    }
    
    // Change Password DTO
    public class ChangePasswordDTO
    {
        [Required]
        [JsonPropertyName("currentPassword")]
        public string CurrentPassword { get; set; } = "";
        
        [Required]
        [MinLength(6)]
        [JsonPropertyName("newPassword")]
        public string NewPassword { get; set; } = "";
        
        [Required]
        [Compare("NewPassword")]
        [JsonPropertyName("confirmPassword")]
        public string ConfirmPassword { get; set; } = "";
    }
    
    // Update Profile DTO
    public class UpdateProfileDTO
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