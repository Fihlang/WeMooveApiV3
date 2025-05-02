using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Review
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        [Required]
        public int DriverId { get; set; }
        
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        
        public string Comment { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        [ForeignKey("DeliveryId")]
        public virtual Delivery Delivery { get; set; }
        
        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; }
        
        [ForeignKey("DriverId")]
        public virtual Driver Driver { get; set; }
    }
}