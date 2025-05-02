using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDTO>>> GetNotifications([FromQuery] bool? unreadOnly = null)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Build query
            var query = _context.Notifications
                .Where(n => n.UserId == userId);

            // Filter by read status if requested
            if (unreadOnly.HasValue && unreadOnly.Value)
            {
                query = query.Where(n => !n.IsRead);
            }

            // Execute query
            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            // Map to DTOs
            var notificationDtos = notifications.Select(n => new NotificationDTO
            {
                Id = n.Id,
                UserId = n.UserId,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                RelatedEntityType = n.RelatedEntityType,
                RelatedEntityId = n.RelatedEntityId,
                CreatedAt = n.CreatedAt
            }).ToList();

            return Ok(notificationDtos);
        }

        // PATCH: api/notifications/5/read
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Get notification
            var notification = await _context.Notifications.FindAsync(id);

            if (notification == null)
            {
                return NotFound(new { message = "Notification not found" });
            }

            // Check if notification belongs to user
            if (notification.UserId != userId)
            {
                return Forbid();
            }

            // Check if already read
            if (notification.IsRead)
            {
                return Ok(new { message = "Notification already marked as read" });
            }

            // Mark as read
            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification marked as read" });
        }

        // PATCH: api/notifications/read-all
        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Get all unread notifications
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            // Mark all as read
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "All notifications marked as read", count = unreadNotifications.Count });
        }

        // DELETE: api/notifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Get notification
            var notification = await _context.Notifications.FindAsync(id);

            if (notification == null)
            {
                return NotFound(new { message = "Notification not found" });
            }

            // Check if notification belongs to user
            if (notification.UserId != userId)
            {
                return Forbid();
            }

            // Delete notification
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification deleted" });
        }
    }
}