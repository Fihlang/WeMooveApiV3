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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}