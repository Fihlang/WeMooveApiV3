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
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly IUserService _userService;
        private readonly IWebSocketService _webSocketService;
        
        public NotificationsController(
            INotificationService notificationService,
            IUserService userService,
            IWebSocketService webSocketService)
        {
            _notificationService = notificationService;
            _userService = userService;
            _webSocketService = webSocketService;
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<NotificationResponseDTO>> GetNotification(int id)
        {
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            var notification = await _notificationService.GetNotificationByIdAsync(id);
            
            if (notification == null)
            {
                return NotFound();
            }
            
            // Only the user who owns the notification or an admin can view it
            if (notification.UserId != currentUser.Id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }
            
            return Ok(notification);
        }
        
        [HttpGet("user")]
        public async Task<ActionResult<IEnumerable<NotificationResponseDTO>>> GetUserNotifications(
            [FromQuery] bool? unreadOnly = false)
        {
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            
            if (unreadOnly == true)
            {
                var unreadNotifications = await _notificationService.GetUnreadNotificationsByUserIdAsync(currentUser.Id);
                return Ok(unreadNotifications);
            }
            else
            {
                var allNotifications = await _notificationService.GetNotificationsByUserIdAsync(currentUser.Id);
                return Ok(allNotifications);
            }
        }
        
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<NotificationResponseDTO>> CreateNotification([FromBody] CreateNotificationDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            try
            {
                var notification = await _notificationService.CreateNotificationAsync(model);
                
                // Send real-time update via WebSocket
                await _webSocketService.SendCustomerUpdateAsync(
                    notification.UserId, 
                    "notification_received", 
                    notification
                );
                
                return CreatedAtAction(nameof(GetNotification), new { id = notification.Id }, notification);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [HttpPut("{id}/read")]
        public async Task<ActionResult<NotificationResponseDTO>> MarkNotificationAsRead(int id)
        {
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            var notification = await _notificationService.GetNotificationByIdAsync(id);
            
            if (notification == null)
            {
                return NotFound();
            }
            
            // Only the user who owns the notification or an admin can mark it as read
            if (notification.UserId != currentUser.Id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }
            
            try
            {
                var updatedNotification = await _notificationService.MarkNotificationAsReadAsync(id);
                return Ok(updatedNotification);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [HttpPut("mark-all-read")]
        public async Task<ActionResult> MarkAllNotificationsAsRead()
        {
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            
            try
            {
                await _notificationService.MarkAllNotificationsAsReadAsync(currentUser.Id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteNotification(int id)
        {
            var notification = await _notificationService.GetNotificationByIdAsync(id);
            
            if (notification == null)
            {
                return NotFound();
            }
            
            try
            {
                await _notificationService.DeleteNotificationAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}