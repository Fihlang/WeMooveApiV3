import type { Express } from "express";
import { createServer, type Server } from "http";
import { furnitureStorage } from "./furniture-storage";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { 
  insertUserSchema, 
  insertDriverSchema,
  insertFurnitureSchema,
  insertDeliverySchema,
  insertDeliveryItemSchema,
  insertReviewSchema,
  insertPaymentSchema,
  insertMessageSchema,
  insertNotificationSchema
} from "../shared/db-schema";

export async function registerFurnitureRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await furnitureStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving user" });
    }
  });

  app.post("/api/users/register", async (req, res) => {
    try {
      const validatedUser = insertUserSchema.parse(req.body);
      // Check if email already exists
      const existingUser = await furnitureStorage.getUserByEmail(validatedUser.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const user = await furnitureStorage.createUser(validatedUser);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/users/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await furnitureStorage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // In a real app, we would use proper authentication with JWT tokens
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Error logging in" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      const updatedUser = await furnitureStorage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Driver routes
  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const driver = await furnitureStorage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving driver" });
    }
  });

  app.get("/api/drivers/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const driver = await furnitureStorage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving driver" });
    }
  });

  app.get("/api/drivers/nearby", async (req, res) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = parseFloat(req.query.radius as string) || 10; // Default 10km radius
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Valid latitude and longitude are required" });
      }
      
      const drivers = await furnitureStorage.getDriversNearby(latitude, longitude, radius);
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ message: "Error finding nearby drivers" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const validatedDriver = insertDriverSchema.parse(req.body);
      const driver = await furnitureStorage.createDriver(validatedDriver);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid driver data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating driver" });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const driverData = req.body;
      const updatedDriver = await furnitureStorage.updateDriver(id, driverData);
      res.json(updatedDriver);
    } catch (error) {
      res.status(500).json({ message: "Error updating driver" });
    }
  });

  app.put("/api/drivers/:id/location", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { latitude, longitude } = req.body;
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Valid latitude and longitude are required" });
      }
      
      const updatedDriver = await furnitureStorage.updateDriverLocation(id, latitude, longitude);
      res.json(updatedDriver);
    } catch (error) {
      res.status(500).json({ message: "Error updating driver location" });
    }
  });

  // Furniture routes
  app.get("/api/furniture", async (req, res) => {
    try {
      const category = req.query.category as string;
      const furniture = category ? 
        await furnitureStorage.getFurnitureByCategory(category) :
        await furnitureStorage.getAllFurniture();
      res.json(furniture);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving furniture" });
    }
  });

  app.get("/api/furniture/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const furniture = await furnitureStorage.getFurniture(id);
      if (!furniture) {
        return res.status(404).json({ message: "Furniture not found" });
      }
      res.json(furniture);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving furniture" });
    }
  });

  app.post("/api/furniture", async (req, res) => {
    try {
      const validatedFurniture = insertFurnitureSchema.parse(req.body);
      const furniture = await furnitureStorage.createFurniture(validatedFurniture);
      res.status(201).json(furniture);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid furniture data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating furniture" });
    }
  });

  // Delivery routes
  app.get("/api/deliveries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const detailed = req.query.detailed === "true";
      
      const delivery = detailed ? 
        await furnitureStorage.getDeliveryWithItems(id) :
        await furnitureStorage.getDelivery(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving delivery" });
    }
  });

  app.get("/api/customers/:customerId/deliveries", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const deliveries = await furnitureStorage.getDeliveriesByCustomerId(customerId);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving customer deliveries" });
    }
  });

  app.get("/api/drivers/:driverId/deliveries", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const activeOnly = req.query.active === "true";
      
      const deliveries = activeOnly ? 
        await furnitureStorage.getActiveDeliveriesByDriverId(driverId) :
        await furnitureStorage.getDeliveriesByDriverId(driverId);
      
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving driver deliveries" });
    }
  });

  app.post("/api/deliveries", async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await furnitureStorage.createDelivery(deliveryData);
      
      // If there are furniture items included, add them to the delivery
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          const deliveryItem = {
            deliveryId: delivery.id,
            furnitureId: item.furnitureId,
            quantity: item.quantity || 1,
            specialHandling: item.specialHandling || false
          };
          await furnitureStorage.createDeliveryItem(deliveryItem);
        }
      }
      
      // Return the delivery with items
      const deliveryWithItems = await furnitureStorage.getDeliveryWithItems(delivery.id);
      res.status(201).json(deliveryWithItems);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid delivery data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating delivery" });
    }
  });

  app.put("/api/deliveries/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedDelivery = await furnitureStorage.updateDeliveryStatus(id, status);
      res.json(updatedDelivery);
    } catch (error) {
      res.status(500).json({ message: "Error updating delivery status" });
    }
  });

  app.put("/api/deliveries/:id/assign", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { driverId } = req.body;
      
      if (!driverId) {
        return res.status(400).json({ message: "Driver ID is required" });
      }
      
      const updatedDelivery = await furnitureStorage.assignDriverToDelivery(id, driverId);
      res.json(updatedDelivery);
    } catch (error) {
      res.status(500).json({ message: "Error assigning driver to delivery" });
    }
  });

  // Delivery Items routes
  app.post("/api/delivery-items", async (req, res) => {
    try {
      const validatedItem = insertDeliveryItemSchema.parse(req.body);
      const item = await furnitureStorage.createDeliveryItem(validatedItem);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid delivery item data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating delivery item" });
    }
  });

  app.get("/api/deliveries/:deliveryId/items", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.deliveryId);
      const items = await furnitureStorage.getDeliveryItemsByDeliveryId(deliveryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving delivery items" });
    }
  });

  // Review routes
  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedReview = insertReviewSchema.parse(req.body);
      const review = await furnitureStorage.createReview(validatedReview);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating review" });
    }
  });

  app.get("/api/drivers/:driverId/reviews", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const reviews = await furnitureStorage.getReviewsByDriverId(driverId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving driver reviews" });
    }
  });

  app.get("/api/customers/:customerId/reviews", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const reviews = await furnitureStorage.getReviewsByCustomerId(customerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving customer reviews" });
    }
  });

  app.get("/api/drivers/:driverId/rating", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const rating = await furnitureStorage.getAverageDriverRating(driverId);
      res.json({ rating });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving driver rating" });
    }
  });

  // Payment routes
  app.post("/api/payments", async (req, res) => {
    try {
      const validatedPayment = insertPaymentSchema.parse(req.body);
      const payment = await furnitureStorage.createPayment(validatedPayment);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating payment" });
    }
  });

  app.get("/api/deliveries/:deliveryId/payment", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.deliveryId);
      const payment = await furnitureStorage.getPaymentByDeliveryId(deliveryId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving payment" });
    }
  });

  app.put("/api/payments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedPayment = await furnitureStorage.updatePaymentStatus(id, status);
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ message: "Error updating payment status" });
    }
  });

  // Message routes
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedMessage = insertMessageSchema.parse(req.body);
      const message = await furnitureStorage.createMessage(validatedMessage);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating message" });
    }
  });

  app.get("/api/deliveries/:deliveryId/messages", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.deliveryId);
      const messages = await furnitureStorage.getMessagesByDeliveryId(deliveryId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving messages" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedMessage = await furnitureStorage.markMessageAsRead(id);
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: "Error marking message as read" });
    }
  });

  // Notification routes
  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedNotification = insertNotificationSchema.parse(req.body);
      const notification = await furnitureStorage.createNotification(validatedNotification);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating notification" });
    }
  });

  app.get("/api/users/:userId/notifications", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const unreadOnly = req.query.unread === "true";
      
      const notifications = unreadOnly ?
        await furnitureStorage.getUnreadNotificationsByUserId(userId) :
        await furnitureStorage.getNotificationsByUserId(userId);
      
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedNotification = await furnitureStorage.markNotificationAsRead(id);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'driver_location_update':
            // Broadcast driver location update to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'driver_location_update',
                  driverId: data.driverId,
                  latitude: data.latitude,
                  longitude: data.longitude
                }));
              }
            });
            break;
            
          case 'delivery_status_update':
            // Broadcast delivery status update to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'delivery_status_update',
                  deliveryId: data.deliveryId,
                  status: data.status
                }));
              }
            });
            break;
            
          case 'new_message':
            // Broadcast new message to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'new_message',
                  message: data.message
                }));
              }
            });
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connection_established', message: 'Connected to Furniture Delivery WebSocket server' }));
  });
  
  return httpServer;
}