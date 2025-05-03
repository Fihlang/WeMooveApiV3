using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FurnitureDelivery.API.Models;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly IBookingService _bookingService;
        private readonly IUserService _userService;
        private readonly IProfessionalService _professionalService;
        private readonly INotificationService _notificationService;
        private readonly IWebSocketService _webSocketService;
        
        public ReviewsController(
            IReviewService reviewService,
            IBookingService bookingService,
            IUserService userService,
            IProfessionalService professionalService,
            INotificationService notificationService,
            IWebSocketService webSocketService)
        {
            _reviewService = reviewService;
            _bookingService = bookingService;
            _userService = userService;
            _professionalService = professionalService;
            _notificationService = notificationService;
            _webSocketService = webSocketService;
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<ReviewResponseDTO>> GetReview(int id)
        {
            var review = await _reviewService.GetReviewByIdAsync(id);
            
            if (review == null)
            {
                return NotFound();
            }
            
            return Ok(review);
        }
        
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ReviewResponseDTO>> CreateReview([FromBody] CreateReviewDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            var booking = await _bookingService.GetBookingByIdAsync(model.BookingId);
            
            // Verify permission - only customer who made the booking can review
            if (booking == null)
            {
                return NotFound("Booking not found");
            }
            
            if (booking.CustomerId != currentUser.Id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }
            
            // Verify booking is completed
            if (booking.Status != "completed")
            {
                return BadRequest("Only completed bookings can be reviewed");
            }
            
            // Check if review already exists for this booking
            var existingReview = await _reviewService.GetReviewByBookingIdAsync(model.BookingId);
            if (existingReview != null)
            {
                return BadRequest("A review already exists for this booking");
            }
            
            try
            {
                // Set the proper customer ID from the booking
                model.CustomerId = booking.CustomerId;
                
                var review = await _reviewService.CreateReviewAsync(model);
                
                // Update professional rating
                await _professionalService.RecalculateProfessionalRatingAsync(model.ProfessionalId);
                
                // Send notification to professional
                await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                {
                    UserId = booking.Professional.UserId,
                    Title = "New Review Received",
                    Message = $"You've received a {model.Rating}-star review for your recent {booking.BookingType} service.",
                    Type = "review",
                    ReferenceId = review.Id
                });
                
                // Send real-time update via WebSocket
                await _webSocketService.SendProfessionalUpdateAsync(
                    model.ProfessionalId,
                    "review_added", 
                    new 
                    { 
                        professionalId = model.ProfessionalId,
                        reviewId = review.Id,
                        rating = model.Rating,
                        serviceType = model.ServiceType
                    }
                );
                
                return CreatedAtAction(nameof(GetReview), new { id = review.Id }, review);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<ReviewResponseDTO>> UpdateReview(int id, [FromBody] UpdateReviewDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var review = await _reviewService.GetReviewByIdAsync(id);
            
            if (review == null)
            {
                return NotFound();
            }
            
            // Only admin can update reviews
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }
            
            try
            {
                var updatedReview = await _reviewService.UpdateReviewAsync(id, model);
                
                // Update professional rating
                await _professionalService.RecalculateProfessionalRatingAsync(updatedReview.ProfessionalId);
                
                return Ok(updatedReview);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReview(int id)
        {
            var review = await _reviewService.GetReviewByIdAsync(id);
            
            if (review == null)
            {
                return NotFound();
            }
            
            // Only admin can delete reviews
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }
            
            var professionalId = review.ProfessionalId;
            
            try
            {
                await _reviewService.DeleteReviewAsync(id);
                
                // Update professional rating
                await _professionalService.RecalculateProfessionalRatingAsync(professionalId);
                
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}