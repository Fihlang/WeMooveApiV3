using System;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    // Response DTOs
    public class ReviewResponseDTO
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public CustomerDTO Customer { get; set; }
        public int ProfessionalId { get; set; }
        public int BookingId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public string ServiceType { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    // Request DTOs
    public class CreateReviewDTO
    {
        [Required]
        public int ProfessionalId { get; set; }
        
        [Required]
        public int BookingId { get; set; }
        
        public int CustomerId { get; set; } // This will be overridden from the booking
        
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        
        [Required]
        [StringLength(1000)]
        public string Comment { get; set; }
        
        [Required]
        public string ServiceType { get; set; }
    }
    
    public class UpdateReviewDTO
    {
        [Range(1, 5)]
        public int? Rating { get; set; }
        
        [StringLength(1000)]
        public string Comment { get; set; }
    }
}