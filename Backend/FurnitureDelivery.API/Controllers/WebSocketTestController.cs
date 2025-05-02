using System;
using System.Threading.Tasks;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FurnitureDelivery.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebSocketTestController : ControllerBase
    {
        private readonly IWebSocketService _webSocketService;
        private readonly ILogger<WebSocketTestController> _logger;
        
        public WebSocketTestController(
            IWebSocketService webSocketService,
            ILogger<WebSocketTestController> logger)
        {
            _webSocketService = webSocketService;
            _logger = logger;
        }
        
        /// <summary>
        /// Test endpoint to broadcast a message to all drivers
        /// </summary>
        [HttpPost("broadcast-to-drivers")]
        public async Task<IActionResult> BroadcastToDrivers([FromBody] object data)
        {
            try
            {
                var message = new WebSocketMessage
                {
                    Type = "test_broadcast",
                    Data = data
                };
                
                await _webSocketService.BroadcastToDrivers(message);
                
                return Ok(new { success = true, message = "Message broadcast to all drivers" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting message to drivers");
                return StatusCode(500, new { error = "Failed to broadcast message" });
            }
        }
        
        /// <summary>
        /// Test endpoint to broadcast a delivery status update
        /// </summary>
        [HttpPost("delivery-status-update/{id}")]
        public async Task<IActionResult> BroadcastDeliveryStatusUpdate(int id, [FromBody] DeliveryStatusUpdateRequest request)
        {
            try
            {
                await _webSocketService.BroadcastDeliveryStatusUpdate(id, request.Status);
                
                return Ok(new { 
                    success = true, 
                    message = $"Delivery status update broadcast for delivery {id}: {request.Status}" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error broadcasting delivery status update for delivery {id}");
                return StatusCode(500, new { error = "Failed to broadcast status update" });
            }
        }
    }
    
    public class DeliveryStatusUpdateRequest
    {
        public string Status { get; set; }
    }
}