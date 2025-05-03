using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace FurnitureDelivery.API.Services
{
    public interface IWebSocketService
    {
        Task HandleWebSocketConnection(HttpContext context, WebSocket webSocket);
        Task SendBookingUpdateAsync(int bookingId, int professionalId, int customerId, string eventType, object payload);
        Task SendProfessionalUpdateAsync(int professionalId, string eventType, object payload);
        Task SendCustomerUpdateAsync(int customerId, string eventType, object payload);
        Task SendToAllAsync(string eventType, object payload);
        Task RemoveConnection(string connectionId);
    }

    public class WebSocketService : IWebSocketService
    {
        private readonly ILogger<WebSocketService> _logger;
        private readonly ConcurrentDictionary<string, WebSocketConnection> _connections = new ConcurrentDictionary<string, WebSocketConnection>();
        private readonly ConcurrentDictionary<int, HashSet<string>> _userConnections = new ConcurrentDictionary<int, HashSet<string>>();
        private readonly ConcurrentDictionary<int, HashSet<string>> _bookingSubscriptions = new ConcurrentDictionary<int, HashSet<string>>();
        
        public WebSocketService(ILogger<WebSocketService> logger)
        {
            _logger = logger;
        }
        
        public async Task HandleWebSocketConnection(HttpContext context, WebSocket webSocket)
        {
            var connectionId = Guid.NewGuid().ToString();
            var connection = new WebSocketConnection
            {
                WebSocket = webSocket,
                ConnectionId = connectionId,
                UserId = GetUserIdFromContext(context)
            };
            
            _connections.TryAdd(connectionId, connection);
            
            // If authenticated, add to user connections
            if (connection.UserId.HasValue)
            {
                _userConnections.AddOrUpdate(
                    connection.UserId.Value,
                    new HashSet<string> { connectionId },
                    (_, connectionIds) =>
                    {
                        connectionIds.Add(connectionId);
                        return connectionIds;
                    });
            }
            
            _logger.LogInformation($"WebSocket connection established: {connectionId}");
            
            try
            {
                await HandleMessages(connection);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling WebSocket messages for connection {connectionId}");
            }
            finally
            {
                await RemoveConnection(connectionId);
            }
        }
        
        private async Task HandleMessages(WebSocketConnection connection)
        {
            var buffer = new byte[1024 * 4];
            var result = await connection.WebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            
            while (!result.CloseStatus.HasValue)
            {
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var messageJson = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    await ProcessMessage(connection, messageJson);
                }
                
                result = await connection.WebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            }
            
            await connection.WebSocket.CloseAsync(
                result.CloseStatus.Value,
                result.CloseStatusDescription,
                CancellationToken.None);
        }
        
        private async Task ProcessMessage(WebSocketConnection connection, string messageJson)
        {
            try
            {
                var message = JsonSerializer.Deserialize<WebSocketMessage>(messageJson);
                
                if (message == null)
                {
                    return;
                }
                
                switch (message.Type)
                {
                    case "subscribe-booking":
                        if (message.Payload.TryGetProperty("bookingId", out var bookingIdElement) && 
                            bookingIdElement.TryGetInt32(out int bookingId))
                        {
                            SubscribeToBooking(connection.ConnectionId, bookingId);
                            _logger.LogInformation($"Connection {connection.ConnectionId} subscribed to booking {bookingId}");
                        }
                        break;
                        
                    case "unsubscribe-booking":
                        if (message.Payload.TryGetProperty("bookingId", out var unsubBookingIdElement) && 
                            unsubBookingIdElement.TryGetInt32(out int unsubBookingId))
                        {
                            UnsubscribeFromBooking(connection.ConnectionId, unsubBookingId);
                            _logger.LogInformation($"Connection {connection.ConnectionId} unsubscribed from booking {unsubBookingId}");
                        }
                        break;
                        
                    case "heartbeat":
                        // Client is checking if connection is still alive
                        await SendToConnectionAsync(connection.ConnectionId, "heartbeat-ack", new { timestamp = DateTimeOffset.UtcNow });
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing WebSocket message: {messageJson}");
            }
        }
        
        private void SubscribeToBooking(string connectionId, int bookingId)
        {
            _bookingSubscriptions.AddOrUpdate(
                bookingId,
                new HashSet<string> { connectionId },
                (_, connectionIds) =>
                {
                    connectionIds.Add(connectionId);
                    return connectionIds;
                });
        }
        
        private void UnsubscribeFromBooking(string connectionId, int bookingId)
        {
            if (_bookingSubscriptions.TryGetValue(bookingId, out var connections))
            {
                connections.Remove(connectionId);
                
                // If no more connections for this booking, remove the booking
                if (connections.Count == 0)
                {
                    _bookingSubscriptions.TryRemove(bookingId, out _);
                }
            }
        }
        
        public async Task SendBookingUpdateAsync(int bookingId, int professionalId, int customerId, string eventType, object payload)
        {
            // Send to all connections subscribed to this booking
            if (_bookingSubscriptions.TryGetValue(bookingId, out var bookingConnections))
            {
                foreach (var connectionId in bookingConnections)
                {
                    await SendToConnectionAsync(connectionId, eventType, payload);
                }
            }
            
            // Also send to professional and customer if they're not subscribed directly
            await SendProfessionalUpdateAsync(professionalId, eventType, payload);
            await SendCustomerUpdateAsync(customerId, eventType, payload);
        }
        
        public async Task SendProfessionalUpdateAsync(int professionalId, string eventType, object payload)
        {
            if (_userConnections.TryGetValue(professionalId, out var connections))
            {
                foreach (var connectionId in connections)
                {
                    await SendToConnectionAsync(connectionId, eventType, payload);
                }
            }
        }
        
        public async Task SendCustomerUpdateAsync(int customerId, string eventType, object payload)
        {
            if (_userConnections.TryGetValue(customerId, out var connections))
            {
                foreach (var connectionId in connections)
                {
                    await SendToConnectionAsync(connectionId, eventType, payload);
                }
            }
        }
        
        public async Task SendToAllAsync(string eventType, object payload)
        {
            foreach (var connection in _connections)
            {
                await SendToConnectionAsync(connection.Key, eventType, payload);
            }
        }
        
        private async Task SendToConnectionAsync(string connectionId, string eventType, object payload)
        {
            if (!_connections.TryGetValue(connectionId, out var connection) || 
                connection.WebSocket.State != WebSocketState.Open)
            {
                await RemoveConnection(connectionId);
                return;
            }
            
            try
            {
                var message = new WebSocketMessage
                {
                    Type = eventType,
                    Payload = JsonSerializer.SerializeToElement(payload)
                };
                
                var messageJson = JsonSerializer.Serialize(message);
                var messageBytes = Encoding.UTF8.GetBytes(messageJson);
                
                await connection.WebSocket.SendAsync(
                    new ArraySegment<byte>(messageBytes),
                    WebSocketMessageType.Text,
                    endOfMessage: true,
                    cancellationToken: CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending message to connection {connectionId}");
                await RemoveConnection(connectionId);
            }
        }
        
        public async Task RemoveConnection(string connectionId)
        {
            if (_connections.TryRemove(connectionId, out var connection))
            {
                // Remove from user connections
                if (connection.UserId.HasValue)
                {
                    if (_userConnections.TryGetValue(connection.UserId.Value, out var userConnections))
                    {
                        userConnections.Remove(connectionId);
                        
                        if (userConnections.Count == 0)
                        {
                            _userConnections.TryRemove(connection.UserId.Value, out _);
                        }
                    }
                }
                
                // Remove from all booking subscriptions
                foreach (var bookingSubs in _bookingSubscriptions)
                {
                    bookingSubs.Value.Remove(connectionId);
                    
                    if (bookingSubs.Value.Count == 0)
                    {
                        _bookingSubscriptions.TryRemove(bookingSubs.Key, out _);
                    }
                }
                
                if (connection.WebSocket.State == WebSocketState.Open)
                {
                    try
                    {
                        await connection.WebSocket.CloseAsync(
                            WebSocketCloseStatus.NormalClosure,
                            "Connection closed by the server",
                            CancellationToken.None);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error closing WebSocket connection {connectionId}");
                    }
                }
                
                _logger.LogInformation($"WebSocket connection removed: {connectionId}");
            }
        }
        
        private int? GetUserIdFromContext(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated != true)
            {
                return null;
            }
            
            var userIdClaim = context.User.FindFirst("sub") ?? context.User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return null;
            }
            
            return userId;
        }
    }
    
    public class WebSocketConnection
    {
        public WebSocket WebSocket { get; set; } = null!;
        public string ConnectionId { get; set; } = null!;
        public int? UserId { get; set; }
    }
    
    public class WebSocketMessage
    {
        public string Type { get; set; } = null!;
        public JsonElement Payload { get; set; }
    }
}