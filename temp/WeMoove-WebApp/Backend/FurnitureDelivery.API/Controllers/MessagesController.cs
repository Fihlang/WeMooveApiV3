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
    [Route("api/messages")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebSocketService _webSocketService;
        private readonly INotificationService _notificationService;

        public MessagesController(
            ApplicationDbContext context,
            IWebSocketService webSocketService,
            INotificationService notificationService)
        {
            _context = context;
            _webSocketService = webSocketService;
            _notificationService = notificationService;
        }

        // GET: api/messages/delivery/5
        [HttpGet("delivery/{deliveryId}")]
        public async Task<ActionResult<IEnumerable<MessageDTO>>> GetMessagesForDelivery(int deliveryId)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            // Check if user has access to this delivery
            var delivery = await _context.Deliveries
                .Include(d => d.Driver)
                .FirstOrDefaultAsync(d => d.Id == deliveryId);

            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            // Check if user is either the customer or the driver of this delivery
            bool isCustomer = delivery.CustomerId == userId;
            bool isDriver = delivery.Driver != null && delivery.Driver.UserId == userId;

            if (!isCustomer && !isDriver && userType != "admin")
            {
                return Forbid();
            }

            // Get messages
            var messages = await _context.Messages
                .Where(m => m.DeliveryId == deliveryId)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            // Get user details for senders
            var userIds = messages
                .Where(m => m.SenderType == "customer" || m.SenderType == "driver")
                .Select(m => m.SenderId)
                .Distinct()
                .ToList();

            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .ToListAsync();

            // Map to DTOs
            var messageDtos = messages.Select(m =>
            {
                var sender = users.FirstOrDefault(u => u.Id == m.SenderId);
                
                return new MessageDTO
                {
                    Id = m.Id,
                    DeliveryId = m.DeliveryId,
                    SenderId = m.SenderId,
                    SenderType = m.SenderType,
                    SenderName = m.SenderType == "system" 
                        ? "System" 
                        : sender != null 
                            ? $"{sender.FirstName} {sender.LastName}" 
                            : "Unknown",
                    Content = m.Content,
                    CreatedAt = m.CreatedAt,
                    IsRead = m.IsRead
                };
            }).ToList();

            return Ok(messageDtos);
        }

        // POST: api/messages
        [HttpPost]
        public async Task<ActionResult<MessageDTO>> SendMessage(SendMessageDTO sendMessageDto)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            // Check if delivery exists
            var delivery = await _context.Deliveries
                .Include(d => d.Driver)
                .Include(d => d.Customer)
                .FirstOrDefaultAsync(d => d.Id == sendMessageDto.DeliveryId);

            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            // Check if user is either the customer or the driver of this delivery
            bool isCustomer = delivery.CustomerId == userId;
            bool isDriver = delivery.Driver != null && delivery.Driver.UserId == userId;

            if (!isCustomer && !isDriver && userType != "admin")
            {
                return Forbid();
            }

            // Create message
            var message = new Message
            {
                DeliveryId = sendMessageDto.DeliveryId,
                SenderId = userId,
                SenderType = userType,
                Content = sendMessageDto.Content,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Get sender details
            var sender = await _context.Users.FindAsync(userId);

            // Create DTO
            var messageDto = new MessageDTO
            {
                Id = message.Id,
                DeliveryId = message.DeliveryId,
                SenderId = message.SenderId,
                SenderType = message.SenderType,
                SenderName = $"{sender.FirstName} {sender.LastName}",
                Content = message.Content,
                CreatedAt = message.CreatedAt,
                IsRead = message.IsRead
            };

            // Send notification to the other party
            int recipientId;
            string notificationTitle;
            
            if (isCustomer)
            {
                // Notify driver
                recipientId = delivery.Driver?.UserId ?? 0;
                notificationTitle = $"New message from {sender.FirstName}";
            }
            else
            {
                // Notify customer
                recipientId = delivery.CustomerId;
                notificationTitle = $"New message from {sender.FirstName}";
            }

            if (recipientId > 0)
            {
                await _notificationService.CreateNotification(
                    recipientId,
                    "new_message",
                    notificationTitle,
                    message.Content.Length > 50 
                        ? message.Content.Substring(0, 47) + "..." 
                        : message.Content,
                    "message",
                    message.Id);
            }

            // Send WebSocket update
            await _webSocketService.SendNewMessage(messageDto);

            return Ok(messageDto);
        }

        // PATCH: api/messages/5/read
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            // Get message
            var message = await _context.Messages
                .Include(m => m.Delivery)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (message == null)
            {
                return NotFound(new { message = "Message not found" });
            }

            // Check if user has access to this message
            var delivery = message.Delivery;
            
            bool isCustomer = delivery.CustomerId == userId;
            bool isDriver = delivery.DriverId.HasValue && 
                await _context.Drivers
                    .AnyAsync(d => d.Id == delivery.DriverId.Value && d.UserId == userId);

            if (!isCustomer && !isDriver && userType != "admin")
            {
                return Forbid();
            }

            // Check if message is already read
            if (message.IsRead)
            {
                return Ok(new { message = "Message already marked as read" });
            }

            // Mark as read
            message.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Message marked as read" });
        }

        // PATCH: api/messages/delivery/5/read
        [HttpPatch("delivery/{deliveryId}/read")]
        public async Task<IActionResult> MarkAllAsRead(int deliveryId)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            // Check if user has access to this delivery
            var delivery = await _context.Deliveries
                .Include(d => d.Driver)
                .FirstOrDefaultAsync(d => d.Id == deliveryId);

            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            // Check if user is either the customer or the driver of this delivery
            bool isCustomer = delivery.CustomerId == userId;
            bool isDriver = delivery.Driver != null && delivery.Driver.UserId == userId;

            if (!isCustomer && !isDriver && userType != "admin")
            {
                return Forbid();
            }

            // Mark all unread messages as read
            // Only mark messages that were sent by the other party
            var unreadMessages = await _context.Messages
                .Where(m => m.DeliveryId == deliveryId && 
                           !m.IsRead && 
                           m.SenderId != userId)
                .ToListAsync();

            foreach (var message in unreadMessages)
            {
                message.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "All messages marked as read", count = unreadMessages.Count });
        }
    }
}