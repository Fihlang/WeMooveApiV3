using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Package
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [StringLength(500)]
        public string Description { get; set; }
        
        [Required]
        public double Weight { get; set; }
        
        [Required]
        public string DimensionsJson { get; set; } // JSON string containing dimensions (height, width, length)
        
        public bool FragileItem { get; set; } = false;
        
        [StringLength(100)]
        public string PackageType { get; set; } // e.g., "box", "envelope", "tube"
        
        // Navigation properties
        [ForeignKey("DeliveryId")]
        public virtual Delivery Delivery { get; set; }
    }
}