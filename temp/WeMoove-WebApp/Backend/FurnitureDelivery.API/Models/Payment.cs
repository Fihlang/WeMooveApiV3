using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        
        [Required]
        public string Status { get; set; } // "pending", "processing", "completed", "failed", "refunded"
        
        [Required]
        public string PaymentMethod { get; set; } // "credit_card", "debit_card", "paypal", "bank_transfer", etc.
        
        public string TransactionId { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        public DateTime? CompletedAt { get; set; }

         
        public DateTime? PaidAt { get; set; }
        
        // Navigation properties
        [ForeignKey("DeliveryId")]
        public virtual Delivery Delivery { get; set; }
    }
}