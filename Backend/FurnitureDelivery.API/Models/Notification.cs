using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    /// <summary>
    /// Represents a notification for a user
    /// </summary>
    public class Notification
    {
        /// <summary>
        /// Unique identifier for the notification
        /// </summary>
        [Key]
        public int Id { get; set; }
        
        /// <summary>
        /// ID of the user this notification is for
        /// </summary>
        public int UserId { get; set; }
        
        /// <summary>
        /// Navigation property for the user
        /// </summary>
        [ForeignKey("UserId")]
        public User User { get; set; }
        
        /// <summary>
        /// Type of notification (e.g., "message", "delivery_status", etc.)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Type { get; set; }
        
        /// <summary>
        /// Title of the notification
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Title { get; set; }
        
        /// <summary>
        /// Content of the notification
        /// </summary>
        [Required]
        [StringLength(500)]
        public string Message { get; set; }
        
        /// <summary>
        /// Whether the notification has been read
        /// </summary>
        public bool IsRead { get; set; }
        
        /// <summary>
        /// Time when the notification was created
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// Type of the related entity (e.g., "delivery", "message")
        /// </summary>
        [StringLength(50)]
        public string RelatedEntityType { get; set; }
        
        /// <summary>
        /// ID of the related entity
        /// </summary>
        public int? RelatedEntityId { get; set; }
    }
}