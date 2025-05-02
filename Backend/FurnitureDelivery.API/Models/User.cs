using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        public string PasswordHash { get; set; }

         [Required]
        public string PasswordSalt { get; set; }

        [Required]
        public string Salt { get; set; }
        
        [Required]
        public string FirstName { get; set; }
        
        [Required]
        public string LastName { get; set; }
        
        [Required]
        public string PhoneNumber { get; set; }
        
        public string Address { get; set; }
        
        public string AvatarUrl { get; set; }
        
        public bool IsVerified { get; set; }
        
        [Required]
        public string UserType { get; set; } // "customer", "driver", "admin"
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<Delivery> CustomerDeliveries { get; set; }
        public virtual Driver Driver { get; set; }
        public virtual ICollection<Review> CustomerReviews { get; set; }
        public virtual ICollection<Notification> Notifications { get; set; }
    }
}