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
    [Route("api/bookings")]
    [Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly IProfessionalService _professionalService;
        private readonly IUserService _userService;
        private readonly INotificationService _notificationService;
        private readonly IWebSocketService _webSocketService;
        
        public BookingsController(
            IBookingService bookingService,
            IProfessionalService professionalService,
            IUserService userService,
            INotificationService notificationService,
            IWebSocketService webSocketService)
        {
            _bookingService = bookingService;
            _professionalService = professionalService;
            _userService = userService;
            _notificationService = notificationService;
            _webSocketService = webSocketService;
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<BookingResponseDTO>> GetBooking(int id)
        {
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            var booking = await _bookingService.GetBookingByIdAsync(id);
            
            if (booking == null)
            {
                return NotFound();
            }
            
            // Verify permission - only customer, professional, or admin can view booking
            if (!User.IsInRole("Admin") && booking.CustomerId != currentUser.Id && 
                !await _professionalService.IsProfessionalUserAsync(currentUser.Id, booking.ProfessionalId))
            {
                return Forbid();
            }
            
            return Ok(booking);
        }
        
        [HttpPost]
        public async Task<ActionResult<BookingResponseDTO>> CreateBooking([FromBody] CreateBookingDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            
            // Verify the customer is the current user or admin
            if (!User.IsInRole("Admin") && model.CustomerId != currentUser.Id)
            {
                return Forbid();
            }
            
            try
            {
                var booking = await _bookingService.CreateBookingAsync(model);
                
                // Send notification to professional
                await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                {
                    UserId = booking.Professional.UserId,
                    Title = "New Booking Request",
                    Message = $"You have a new booking request for {booking.BookingType} service on {booking.ScheduledTime.ToString("MMM dd, yyyy")} at {booking.ScheduledTime.ToString("h:mm tt")}",
                    Type = "booking_request",
                    ReferenceId = booking.Id
                });
                
                // Send real-time update via WebSocket
                await _webSocketService.SendBookingUpdateAsync(booking.Id, booking.ProfessionalId, booking.CustomerId, "booking_created", booking);
                
                return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [HttpPut("{id}/status")]
        public async Task<ActionResult<BookingResponseDTO>> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            var booking = await _bookingService.GetBookingByIdAsync(id);
            
            if (booking == null)
            {
                return NotFound();
            }
            
            // Verify permission based on status change
            bool hasPermission = false;
            
            // Admin can always update
            if (User.IsInRole("Admin"))
            {
                hasPermission = true;
            }
            // Customer can cancel their own booking
            else if (model.Status == "cancelled" && booking.CustomerId == currentUser.Id)
            {
                hasPermission = true;
            }
            // Professional can update to confirmed, in_progress, completed
            else if ((model.Status == "confirmed" || model.Status == "in_progress" || model.Status == "completed") && 
                    await _professionalService.IsProfessionalUserAsync(currentUser.Id, booking.ProfessionalId))
            {
                hasPermission = true;
            }
            
            if (!hasPermission)
            {
                return Forbid();
            }
            
            try
            {
                var updatedBooking = await _bookingService.UpdateBookingStatusAsync(id, model.Status);
                
                // Create notification based on status change
                string title = "";
                string message = "";
                int recipientId;
                
                switch (model.Status)
                {
                    case "confirmed":
                        title = "Booking Confirmed";
                        message = $"Your booking for {updatedBooking.BookingType} service on {updatedBooking.ScheduledTime.ToString("MMM dd, yyyy")} has been confirmed.";
                        recipientId = updatedBooking.CustomerId;
                        break;
                    case "in_progress":
                        title = "Service Started";
                        message = $"Your {updatedBooking.BookingType} service has started.";
                        recipientId = updatedBooking.CustomerId;
                        break;
                    case "completed":
                        title = "Service Completed";
                        message = $"Your {updatedBooking.BookingType} service has been completed. Please leave a review!";
                        recipientId = updatedBooking.CustomerId;
                        break;
                    case "cancelled":
                        title = "Booking Cancelled";
                        message = $"A booking for {updatedBooking.BookingType} service on {updatedBooking.ScheduledTime.ToString("MMM dd, yyyy")} has been cancelled.";
                        // If customer cancels, notify professional; if professional cancels, notify customer
                        recipientId = booking.CustomerId == currentUser.Id ? updatedBooking.Professional.UserId : updatedBooking.CustomerId;
                        break;
                    default:
                        title = "Booking Update";
                        message = $"Your booking status has been updated to {model.Status}.";
                        recipientId = updatedBooking.CustomerId;
                        break;
                }
                
                await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                {
                    UserId = recipientId,
                    Title = title,
                    Message = message,
                    Type = "booking_status",
                    ReferenceId = updatedBooking.Id
                });
                
                // Send real-time update via WebSocket
                await _webSocketService.SendBookingUpdateAsync(
                    updatedBooking.Id, 
                    updatedBooking.ProfessionalId, 
                    updatedBooking.CustomerId, 
                    "booking_status_updated", 
                    new 
                    { 
                        bookingId = updatedBooking.Id, 
                        status = updatedBooking.Status,
                        completedTime = updatedBooking.CompletedTime
                    }
                );
                
                return Ok(updatedBooking);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}