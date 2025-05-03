using System;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    // Response DTOs
    public class BookingResponseDTO
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int ProfessionalId { get; set; }
        public ProfessionalResponseDTO Professional { get; set; }
        public string BookingType { get; set; }
        public string ServiceTier { get; set; }
        public DateTime ScheduledTime { get; set; }
        public int Duration { get; set; }
        public int AddressId { get; set; }
        public AddressDTO Address { get; set; }
        public decimal TotalCost { get; set; }
        public string ItemsDescription { get; set; }
        public string SpecialInstructions { get; set; }
        public int? NumberOfMovers { get; set; }
        public bool? HasHeavyItems { get; set; }
        public bool? HasStairs { get; set; }
        public int? FloorNumber { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedTime { get; set; }
    }
    
    // Request DTOs
    public class CreateBookingDTO
    {
        [Required]
        public int CustomerId { get; set; }
        
        [Required]
        public int ProfessionalId { get; set; }
        
        [Required]
        public string BookingType { get; set; }
        
        [Required]
        public string ServiceTier { get; set; }
        
        [Required]
        public DateTime ScheduledTime { get; set; }
        
        [Required]
        [Range(1, 8)]
        public int Duration { get; set; }
        
        [Required]
        public int AddressId { get; set; }
        
        [Required]
        [Range(0, 100000)]
        public decimal TotalCost { get; set; }
        
        [Required]
        [StringLength(1000)]
        public string ItemsDescription { get; set; }
        
        [StringLength(1000)]
        public string SpecialInstructions { get; set; }
        
        [Range(1, 10)]
        public int? NumberOfMovers { get; set; }
        
        public bool? HasHeavyItems { get; set; }
        
        public bool? HasStairs { get; set; }
        
        [Range(0, 100)]
        public int? FloorNumber { get; set; }
    }
    
    public class UpdateBookingStatusDTO
    {
        [Required]
        public string Status { get; set; }
    }
}