using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    /// <summary>
    /// Data Transfer Object for Furniture entities
    /// </summary>
    public class FurnitureDTO
    {
        /// <summary>
        /// Unique identifier for the furniture item
        /// </summary>
        public int Id { get; set; }
        
        /// <summary>
        /// Name of the furniture item
        /// </summary>
        [Required]
        public string Name { get; set; }
        
        /// <summary>
        /// Detailed description of the furniture item
        /// </summary>
        public string Description { get; set; }
        
        /// <summary>
        /// Weight of the furniture item in kilograms
        /// </summary>
        [Required]
        public double Weight { get; set; }
        
        /// <summary>
        /// Dimensions of the furniture item (typically in JSON format)
        /// </summary>
        [Required]
        public string Dimensions { get; set; }
        
        /// <summary>
        /// Category of the furniture item (e.g., Sofa, Bed, Table)
        /// </summary>
        [Required]
        public string Category { get; set; }
        
        /// <summary>
        /// URL to an image of the furniture item
        /// </summary>
        public string ImageUrl { get; set; }
    }
}