using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public string Type { get; set; } // "delivery_created", "delivery_assigned", "driver_assigned", "delivery_status_updated", "new_message", "new_review", etc.
        
        [Required]
        public string Title { get; set; }
        
        [Required]
        public string Message { get; set; }
        
        public bool IsRead { get; set; }
        
        public string RelatedEntityType { get; set; } // "delivery", "message", "review", etc.
        
        public int? RelatedEntityId { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}