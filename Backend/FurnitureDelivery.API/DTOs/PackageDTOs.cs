using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    public class PackageDTO
    {
        public int Id { get; set; }
        
        public int DeliveryId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [StringLength(500)]
        public string Description { get; set; }
        
        [Required]
        [Range(0.01, 1000)]
        public double Weight { get; set; }
        
        [Required]
        public string Dimensions { get; set; } // JSON string containing dimensions
        
        public bool FragileItem { get; set; }
        
        [StringLength(100)]
        public string PackageType { get; set; } // e.g., "box", "envelope", "tube"
    }
    
    public class CreatePackageDTO
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [StringLength(500)]
        public string Description { get; set; }
        
        [Required]
        [Range(0.01, 1000)]
        public double Weight { get; set; }
        
        [Required]
        public string Dimensions { get; set; } // JSON string containing dimensions
        
        public bool FragileItem { get; set; } = false;
        
        [StringLength(100)]
        public string PackageType { get; set; } = "box"; // Default to box
    }
}