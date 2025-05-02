using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Driver
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public string VehicleType { get; set; }
        
        [Required]
        public string LicensePlate { get; set; }
        
        [Required]
        public string Capacity { get; set; }
        
        public double? Rating { get; set; }
        
        public bool IsAvailable { get; set; } = true;

        public bool IsOnline { get; set; } = true;
        
        public double? CurrentLatitude { get; set; }
        
        public double? CurrentLongitude { get; set; }
        
        [Required]
        public string VerificationStatus { get; set; } // "pending", "verified", "rejected"
        
        public string Documents { get; set; } // JSON string containing document URLs
        
        // Flag to indicate if driver supports parcel deliveries (useful for filtering)
        public bool? SupportsParcel { get; set; }
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        public virtual ICollection<Delivery> Deliveries { get; set; }
        
        public virtual ICollection<Review> Reviews { get; set; }
    }
}