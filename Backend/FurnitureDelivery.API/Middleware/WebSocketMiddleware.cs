using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Net.WebSockets;
using System.Threading.Tasks;
using FurnitureDelivery.API.Services;

namespace FurnitureDelivery.API.Middleware
{
    public class WebSocketMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<WebSocketMiddleware> _logger;
        private readonly IWebSocketService _webSocketService;
        
        public WebSocketMiddleware(
            RequestDelegate next, 
            ILogger<WebSocketMiddleware> logger,
            IWebSocketService webSocketService)
        {
            _next = next;
            _logger = logger;
            _webSocketService = webSocketService;
        }
        
        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Path == "/ws")
            {
                if (context.WebSockets.IsWebSocketRequest)
                {
                    try
                    {
                        _logger.LogInformation("WebSocket connection request received");
                        WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                        await _webSocketService.HandleWebSocketConnection(context, webSocket);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error handling WebSocket connection");
                    }
                }
                else
                {
                    context.Response.StatusCode = 400;
                }
            }
            else
            {
                await _next(context);
            }
        }
    }
}