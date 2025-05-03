using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    // Response DTOs
    public class ProfessionalResponseDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserDTO User { get; set; }
        public string Skills { get; set; }
        public int Experience { get; set; }
        public decimal HourlyRate { get; set; }
        public string Bio { get; set; }
        public string ProfileImageUrl { get; set; }
        public bool LicensedAndInsured { get; set; }
        public string ServiceArea { get; set; }
        public bool BackgroundChecked { get; set; }
        public decimal Rating { get; set; }
        public int TotalReviews { get; set; }
        public int TotalJobs { get; set; }
        public DateTime CreatedAt { get; set; }
        public string AvailabilityStartTime { get; set; }
        public string AvailabilityEndTime { get; set; }
        public List<string> WorkDays { get; set; }
    }
    
    public class ProfessionalRatingDTO
    {
        public int ProfessionalId { get; set; }
        public decimal AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }
    
    public class AvailabilityTimeSlotDTO
    {
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public bool Available { get; set; }
    }
    
    public class AvailabilityDayDTO
    {
        public string Date { get; set; }
        public string DayName { get; set; }
        public List<AvailabilityTimeSlotDTO> Slots { get; set; }
    }
    
    public class AvailabilityResponseDTO
    {
        public int ProfessionalId { get; set; }
        public List<AvailabilityDayDTO> Days { get; set; }
    }
    
    // Request DTOs
    public class CreateProfessionalDTO
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public string Skills { get; set; }
        
        [Required]
        [Range(0, 50)]
        public int Experience { get; set; }
        
        [Required]
        [Range(0, 10000)]
        public decimal HourlyRate { get; set; }
        
        [Required]
        [StringLength(1000)]
        public string Bio { get; set; }
        
        public string ProfileImageUrl { get; set; }
        
        [Required]
        public bool LicensedAndInsured { get; set; }
        
        [Required]
        public string ServiceArea { get; set; }
        
        public bool BackgroundChecked { get; set; } = false;
        
        public string AvailabilityStartTime { get; set; }
        
        public string AvailabilityEndTime { get; set; }
        
        public List<string> WorkDays { get; set; }
    }
    
    public class UpdateProfessionalDTO
    {
        public string Skills { get; set; }
        
        [Range(0, 50)]
        public int? Experience { get; set; }
        
        [Range(0, 10000)]
        public decimal? HourlyRate { get; set; }
        
        [StringLength(1000)]
        public string Bio { get; set; }
        
        public string ProfileImageUrl { get; set; }
        
        public bool? LicensedAndInsured { get; set; }
        
        public string ServiceArea { get; set; }
        
        public bool? BackgroundChecked { get; set; }
    }
    
    public class UpdateAvailabilityDTO
    {
        public string AvailabilityStartTime { get; set; }
        
        public string AvailabilityEndTime { get; set; }
        
        public List<string> WorkDays { get; set; }
    }
}