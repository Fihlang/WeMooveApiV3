using System.Net.WebSockets;

namespace FurnitureDelivery.API.Services
{
    public interface IWebSocketService
    {
        /// <summary>
        /// Adds a connection to the WebSocket service
        /// </summary>
        /// <param name="connectionId">The connection ID</param>
        /// <param name="webSocket">The WebSocket instance</param>
        void AddConnection(string connectionId, WebSocket webSocket);
        
        /// <summary>
        /// Removes a connection from the WebSocket service
        /// </summary>
        /// <param name="connectionId">The connection ID</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task RemoveConnection(string connectionId);
        
        /// <summary>
        /// Associates a user with a connection
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="connectionId">The connection ID</param>
        void AssociateUserWithConnection(int userId, string connectionId);
        
        /// <summary>
        /// Associates a delivery with a connection
        /// </summary>
        /// <param name="deliveryId">The delivery ID</param>
        /// <param name="connectionId">The connection ID</param>
        void AssociateDeliveryWithConnection(int deliveryId, string connectionId);
        
        /// <summary>
        /// Gets all connections for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>A list of connection IDs</returns>
        List<string> GetConnectionsForUser(int userId);
        
        /// <summary>
        /// Gets all connections for a delivery
        /// </summary>
        /// <param name="deliveryId">The delivery ID</param>
        /// <returns>A list of connection IDs</returns>
        List<string> GetConnectionsForDelivery(int deliveryId);
        
        /// <summary>
        /// Sends a message to a specific user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="message">The message to send</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendToUser(int userId, object message);
        
        /// <summary>
        /// Sends a message to all users tracking a delivery
        /// </summary>
        /// <param name="deliveryId">The delivery ID</param>
        /// <param name="message">The message to send</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendToDelivery(int deliveryId, object message);
        
        /// <summary>
        /// Sends a message to all drivers
        /// </summary>
        /// <param name="message">The message to send</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendToDrivers(object message);
        
        /// <summary>
        /// Sends a message to all users
        /// </summary>
        /// <param name="message">The message to send</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendToAll(object message);
        
        /// <summary>
        /// Sends a message to a specific connection
        /// </summary>
        /// <param name="connectionId">The connection ID</param>
        /// <param name="message">The message to send</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendToConnection(string connectionId, object message);
        
        /// <summary>
        /// Broadcasts a driver location update to all connections tracking the driver's deliveries
        /// </summary>
        /// <param name="driverId">The driver ID</param>
        /// <param name="latitude">The current latitude</param>
        /// <param name="longitude">The current longitude</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task BroadcastLocationUpdate(int driverId, double latitude, double longitude);
    }
}