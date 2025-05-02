using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    /// <summary>
    /// Represents a message between users in the system
    /// </summary>
    public class Message
    {
        /// <summary>
        /// Unique identifier for the message
        /// </summary>
        [Key]
        public int Id { get; set; }
        
        /// <summary>
        /// ID of the delivery this message is related to
        /// </summary>
        public int DeliveryId { get; set; }
        
        /// <summary>
        /// Navigation property for the related delivery
        /// </summary>
        [ForeignKey("DeliveryId")]
        public Delivery Delivery { get; set; }
        
        /// <summary>
        /// ID of the user who sent the message
        /// </summary>
        public int SenderId { get; set; }

                /// Type of sender (e.g., "customer", "driver", "system")
        /// </summary>
        [Required]
        [StringLength(20)]
        public string SenderType { get; set; }
        
        /// <summary>
        
        /// <summary>
        /// Navigation property for the sender
        /// </summary>
        [ForeignKey("SenderId")]
        public User Sender { get; set; }
        
        /// <summary>
        /// ID of the user who receives the message
        /// </summary>
        public int RecipientId { get; set; }
        
        /// <summary>
        /// Navigation property for the recipient
        /// </summary>
        [ForeignKey("RecipientId")]
        public User Recipient { get; set; }
        
        /// <summary>
        /// Content of the message
        /// </summary>
        [Required]
        [StringLength(1000)]
        public string Content { get; set; }
        
        /// <summary>
        /// Indicates if the message has been read
        /// </summary>
        public bool IsRead { get; set; }
        
        /// <summary>
        /// Time when the message was created
        /// </summary>
        public DateTime CreatedAt { get; set; }
    }
}