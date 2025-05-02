using FurnitureDelivery.API.Models;
using Microsoft.EntityFrameworkCore;
using System;

namespace FurnitureDelivery.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Furniture> Furniture { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<DeliveryItem> DeliveryItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships and constraints
            
            // User entity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
            
            // Driver entity
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.User)
                .WithOne(u => u.Driver)
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<Driver>()
                .HasIndex(d => d.LicensePlate)
                .IsUnique();
            
            // Delivery entity
            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Customer)
                .WithMany(u => u.CustomerDeliveries)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Driver)
                .WithMany(d => d.Deliveries)
                .HasForeignKey(d => d.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // DeliveryItem entity
            modelBuilder.Entity<DeliveryItem>()
                .HasOne(di => di.Delivery)
                .WithMany(d => d.Items)
                .HasForeignKey(di => di.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<DeliveryItem>()
                .HasOne(di => di.Furniture)
                .WithMany(f => f.DeliveryItems)
                .HasForeignKey(di => di.FurnitureId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Payment entity
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Delivery)
                .WithOne(d => d.Payment)
                .HasForeignKey<Payment>(p => p.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Message entity
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Delivery)
                .WithMany(d => d.Messages)
                .HasForeignKey(m => m.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Review entity
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Delivery)
                .WithMany(d => d.Reviews)
                .HasForeignKey(r => r.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Customer)
                .WithMany(u => u.CustomerReviews)
                .HasForeignKey(r => r.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Driver)
                .WithMany(d => d.Reviews)
                .HasForeignKey(r => r.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Notification entity
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Email = "admin@furnituredelivery.com",
                    PasswordHash = "hash_placeholder", // In real app, use a proper password hashing method
                    Salt = "salt_placeholder",
                    FirstName = "Admin",
                    LastName = "User",
                    PhoneNumber = "1234567890",
                    Address = "Admin Office, 123 Main St",
                    IsVerified = true,
                    UserType = "admin",
                    CreatedAt = DateTime.UtcNow
                }
            );

            // Seed furniture categories
            modelBuilder.Entity<Furniture>().HasData(
                new Furniture
                {
                    Id = 1,
                    Name = "L-Shaped Sofa",
                    Description = "Large comfortable L-shaped sofa for living room",
                    Weight = 85.5,
                    DimensionsJson = "{\"length\": 220, \"width\": 160, \"height\": 85}",
                    Category = "sofas",
                    ImageUrl = "/images/furniture/l-shaped-sofa.jpg"
                },
                new Furniture
                {
                    Id = 2,
                    Name = "King Size Bed",
                    Description = "Luxury king size bed with wooden frame",
                    Weight = 75.0,
                    DimensionsJson = "{\"length\": 200, \"width\": 180, \"height\": 120}",
                    Category = "beds",
                    ImageUrl = "/images/furniture/king-bed.jpg"
                },
                new Furniture
                {
                    Id = 3,
                    Name = "Dining Table Set",
                    Description = "Six-seat dining table with chairs",
                    Weight = 60.0,
                    DimensionsJson = "{\"length\": 180, \"width\": 90, \"height\": 75}",
                    Category = "tables",
                    ImageUrl = "/images/furniture/dining-table.jpg"
                },
                new Furniture
                {
                    Id = 4,
                    Name = "Wardrobe",
                    Description = "Large three-door wardrobe with mirror",
                    Weight = 120.0,
                    DimensionsJson = "{\"length\": 150, \"width\": 60, \"height\": 210}",
                    Category = "storage",
                    ImageUrl = "/images/furniture/wardrobe.jpg"
                },
                new Furniture
                {
                    Id = 5,
                    Name = "Office Desk",
                    Description = "Professional office desk with drawers",
                    Weight = 45.0,
                    DimensionsJson = "{\"length\": 140, \"width\": 70, \"height\": 75}",
                    Category = "office",
                    ImageUrl = "/images/furniture/office-desk.jpg"
                }
            );
        }
    }
}