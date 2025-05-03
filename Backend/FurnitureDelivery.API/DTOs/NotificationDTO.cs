using System;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    // Response DTOs
    public class NotificationResponseDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public int? ReferenceId { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    // Request DTOs
    public class CreateNotificationDTO
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Title { get; set; }
        
        [Required]
        [StringLength(500)]
        public string Message { get; set; }
        
        [Required]
        public string Type { get; set; }
        
        public int? ReferenceId { get; set; }
    }
    
    public class UpdateNotificationReadStatusDTO
    {
        [Required]
        public bool IsRead { get; set; }
    }
}