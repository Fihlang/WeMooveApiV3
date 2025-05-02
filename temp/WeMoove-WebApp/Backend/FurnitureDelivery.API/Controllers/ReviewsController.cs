using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using FurnitureDelivery.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Controllers
{
    [Route("api/reviews")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public ReviewsController(
            ApplicationDbContext context,
            INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/reviews/driver/5
        [HttpGet("driver/{driverId}")]
        public async Task<ActionResult<IEnumerable<CreateReviewDTO>>> GetDriverReviews(int driverId)
        {
            // Check if driver exists
            bool driverExists = await _context.Drivers.AnyAsync(d => d.Id == driverId);
            if (!driverExists)
            {
                return NotFound(new { message = "Driver not found" });
            }

            // Get reviews
            var reviews = await _context.Reviews
                .Include(r => r.Customer)
                .Include(r => r.Driver)
                    .ThenInclude(d => d.User)
                .Where(r => r.DriverId == driverId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            // Map to DTOs
            var CreateReviewDTOs = reviews.Select(r => new ReviewResponseDTO
            {
                Id = r.Id,
                DeliveryId = r.DeliveryId,
                CustomerId = r.CustomerId,
                CustomerName = $"{r.Customer.FirstName} {r.Customer.LastName}",
                DriverId = r.DriverId,
                DriverName = $"{r.Driver.User.FirstName} {r.Driver.User.LastName}",
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).ToList();

            return Ok(CreateReviewDTOs);
        }

        // POST: api/reviews
        [HttpPost]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<CreateReviewDTO>> CreateReview(ReviewResponseDTO createCreateReviewDTO)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Check if delivery exists and is completed
            var delivery = await _context.Deliveries
                .FirstOrDefaultAsync(d => d.Id == createCreateReviewDTO.DeliveryId);

            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            // Check if user is the customer of this delivery
            if (delivery.CustomerId != userId)
            {
                return Forbid();
            }

            // Check if delivery is completed
            if (delivery.Status != "completed")
            {
                return BadRequest(new { message = "Cannot review a delivery that is not completed" });
            }

            // Check if driver is assigned to this delivery
            if (delivery.DriverId != createCreateReviewDTO.DriverId)
            {
                return BadRequest(new { message = "Driver is not assigned to this delivery" });
            }

            // Check if review already exists
            bool reviewExists = await _context.Reviews
                .AnyAsync(r => r.DeliveryId == createCreateReviewDTO.DeliveryId && 
                              r.CustomerId == userId && 
                              r.DriverId == createCreateReviewDTO.DriverId);

            if (reviewExists)
            {
                return BadRequest(new { message = "Review already exists for this delivery" });
            }

            // Get customer details
            var customer = await _context.Users.FindAsync(userId);

            // Create review
            var review = new Review
            {
                DeliveryId = createCreateReviewDTO.DeliveryId,
                CustomerId = userId,
                DriverId = createCreateReviewDTO.DriverId,
                Rating = createCreateReviewDTO.Rating,
                Comment = createCreateReviewDTO.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // Update driver rating
            await UpdateDriverRating(createCreateReviewDTO.DriverId);

            // Get driver details
            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == createCreateReviewDTO.DriverId);

            // Create notification for driver
            await _notificationService.CreateNotification(
                driver.UserId,
                "new_review",
                "New Review Received",
                $"{customer.FirstName} {customer.LastName} gave you a {createCreateReviewDTO.Rating}-star review.",
                "review",
                review.Id);

            // Return the created review
            var CreateReviewDTO = new ReviewResponseDTO
            {
                Id = review.Id,
                DeliveryId = review.DeliveryId,
                CustomerId = review.CustomerId,
                CustomerName = $"{customer.FirstName} {customer.LastName}",
                DriverId = review.DriverId,
                DriverName = $"{driver.User.FirstName} {driver.User.LastName}",
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };

            return CreatedAtAction(nameof(GetDriverReviews), new { driverId = review.DriverId }, CreateReviewDTO);
        }

        // Private helper methods
        private async Task UpdateDriverRating(int driverId)
        {
            // Calculate average rating
            var reviews = await _context.Reviews
                .Where(r => r.DriverId == driverId)
                .ToListAsync();

            if (reviews.Count == 0)
            {
                return;
            }

            double averageRating = reviews.Average(r => r.Rating);

            // Update driver rating
            var driver = await _context.Drivers.FindAsync(driverId);
            if (driver != null)
            {
                driver.Rating = averageRating;
                await _context.SaveChangesAsync();
            }
        }
    }
}