using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Delivery
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        public int? DriverId { get; set; }
        
        [Required]
        public string Status { get; set; } // "pending", "accepted", "picked_up", "in_transit", "delivered", "completed", "cancelled"
        
        [Required]
        public string PickupAddress { get; set; }
        
        [Required]
        public double PickupLatitude { get; set; }
        
        [Required]
        public double PickupLongitude { get; set; }
        
        [Required]
        public string DestinationAddress { get; set; }
        
        [Required]
        public double DestinationLatitude { get; set; }
        
        [Required]
        public double DestinationLongitude { get; set; }
        
        [Required]
        public DateTime ScheduledDate { get; set; }
        
        public DateTime? CompletedDate { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }
        
        public double? Distance { get; set; }

         [StringLength(50)]
        public string TrackingNumber { get; set; }
        
        [StringLength(500)]
        public string Notes { get; set; }

        public string EstimatedTime { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        [Required]
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; }
        
        [ForeignKey("DriverId")]
        public virtual Driver Driver { get; set; }
        
        public virtual ICollection<DeliveryItem> Items { get; set; }
        
        public virtual Payment Payment { get; set; }
        
        public virtual ICollection<Message> Messages { get; set; }
        
        public virtual ICollection<Review> Reviews { get; set; }
    }
}