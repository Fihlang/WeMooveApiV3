using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.Models
{
    public class Furniture
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        public string Description { get; set; }
        
        [Required]
        public double Weight { get; set; }
        
        [Required]
        public string DimensionsJson { get; set; } // JSON string containing dimensions (height, width, length)
        
        [Required]
        public string Category { get; set; }
        
        public string ImageUrl { get; set; }
        
        // Navigation properties
        public virtual ICollection<DeliveryItem> DeliveryItems { get; set; }
    }
}