import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Define WebSocket connection types
interface WebSocketConnection extends WebSocket {
  userId?: number;
  isDriver?: boolean;
  driverId?: number;
  vehicleType?: string;
  subscribedDeliveries: Set<number>;
}

// WebSocket message types
type WebSocketMessage = {
  type: string;
  payload: any;
};

// WebSocket service class
class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocketConnection>;

  constructor(server: Server) {
    const wsPath = process.env.WS_PATH || '/ws';
    this.wss = new WebSocketServer({ server, path: wsPath });
    this.clients = new Set();
    this.initialize();
    console.log(`WebSocket server initialized with path: ${wsPath}`);
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocketConnection) => {
      console.log('New WebSocket connection established');
      
      // Initialize client properties
      ws.subscribedDeliveries = new Set();
      this.clients.add(ws);
      
      // Handle authentication message
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message) as WebSocketMessage;
          
          if (data.type === 'auth') {
            // Authenticate the user
            this.handleAuthentication(ws, data.payload);
          } else if (data.type === 'subscribe_delivery') {
            // Subscribe to a delivery
            if (data.payload && data.payload.deliveryId) {
              this.subscribeToDelivery(ws, data.payload.deliveryId);
            }
          } else if (data.type === 'unsubscribe_delivery') {
            // Unsubscribe from a delivery
            if (data.payload && data.payload.deliveryId) {
              this.unsubscribeFromDelivery(ws, data.payload.deliveryId);
            }
          } else if (data.type === 'driver_location_update') {
            // Update driver location and broadcast to relevant clients
            if (ws.driverId && data.payload) {
              this.broadcastDriverLocation(ws.driverId, data.payload);
            }
          } else if (data.type === 'ping') {
            // Respond to ping with pong
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('WebSocket connection closed');
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        payload: {
          message: 'Connected to furniture delivery service WebSocket server',
          timestamp: new Date().toISOString()
        }
      }));
    });
    
    console.log('WebSocket server initialized');
  }

  // Handle authentication message
  private handleAuthentication(ws: WebSocketConnection, payload: any) {
    if (payload.userId) {
      ws.userId = payload.userId;
      
      // If it's a driver, store additional information
      if (payload.isDriver) {
        ws.isDriver = true;
        ws.driverId = payload.driverId;
        ws.vehicleType = payload.vehicleType;
        
        console.log(`Driver ${ws.driverId} (Vehicle: ${ws.vehicleType}) authenticated via WebSocket`);
      } else {
        console.log(`User ${ws.userId} authenticated via WebSocket`);
      }
      
      // Confirm authentication
      ws.send(JSON.stringify({
        type: 'auth_success',
        payload: {
          userId: ws.userId,
          isDriver: ws.isDriver,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  // Subscribe to delivery updates
  private subscribeToDelivery(ws: WebSocketConnection, deliveryId: number) {
    ws.subscribedDeliveries.add(deliveryId);
    console.log(`Client subscribed to delivery ${deliveryId}`);
    
    // Confirm subscription
    ws.send(JSON.stringify({
      type: 'subscription_success',
      payload: {
        deliveryId,
        timestamp: new Date().toISOString()
      }
    }));
  }

  // Unsubscribe from delivery updates
  private unsubscribeFromDelivery(ws: WebSocketConnection, deliveryId: number) {
    ws.subscribedDeliveries.delete(deliveryId);
    console.log(`Client unsubscribed from delivery ${deliveryId}`);
  }

  // Broadcast a message to all clients subscribed to a delivery
  public broadcastToDelivery(deliveryId: number, message: WebSocketMessage) {
    this.clients.forEach(client => {
      if (client.subscribedDeliveries.has(deliveryId) && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Broadcast a message to a specific user
  public broadcastToUser(userId: number, message: WebSocketMessage) {
    this.clients.forEach(client => {
      if (client.userId === userId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Broadcast a message to all drivers
  public broadcastToDrivers(message: WebSocketMessage) {
    this.clients.forEach(client => {
      if (client.isDriver && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Broadcast a message to drivers of a specific vehicle type
  public broadcastToDriversByVehicleType(vehicleType: string, message: WebSocketMessage) {
    this.clients.forEach(client => {
      if (client.isDriver && client.vehicleType === vehicleType && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Broadcast driver location update to all clients tracking that delivery
  private broadcastDriverLocation(driverId: number, locationData: any) {
    const message: WebSocketMessage = {
      type: 'driver_location_update',
      payload: {
        driverId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        heading: locationData.heading,
        speed: locationData.speed,
        timestamp: new Date().toISOString()
      }
    };
    
    // Find all deliveries this driver is assigned to
    const activeDeliveries = new Set<number>();
    
    this.clients.forEach(client => {
      if (client.driverId === driverId) {
        client.subscribedDeliveries.forEach(deliveryId => {
          activeDeliveries.add(deliveryId);
        });
      }
    });
    
    // Broadcast to all clients subscribed to those deliveries
    activeDeliveries.forEach(deliveryId => {
      this.broadcastToDelivery(deliveryId, message);
    });
  }
}

// Create and export the WebSocket service
export function createWebSocketService(server: Server): WebSocketService {
  return new WebSocketService(server);
}