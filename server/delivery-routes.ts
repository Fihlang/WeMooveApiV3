import { Express, Request, Response } from 'express';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { deliveryStorage } from './delivery-storage';
import { createWebSocketService } from './websocket';
import {
  insertUserSchema,
  insertDriverSchema,
  insertCustomerSchema,
  insertAddressSchema,
  insertDeliverySchema,
  insertPackageSchema,
  insertPaymentSchema,
  insertReviewSchema,
  insertMessageSchema,
  insertNotificationSchema,
  insertFurnitureSchema,
  insertDeliveryItemSchema
} from '../shared/db-schema';
import bcrypt from 'bcrypt';
import argon2 from 'argon2';

// Helper function to validate request body
function validateRequest(req: Request, schema: any) {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return { valid: false, errors: result.error.errors };
  }
  return { valid: true, data: result.data };
}

export async function registerDeliveryRoutes(app: Express): Promise<Server> {
  const httpServer = new Server(app);
  
  // Initialize WebSocket service
  const wsService = createWebSocketService(httpServer);

  // Auth Routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      // Validate user data
      const validation = validateRequest(req, insertUserSchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Check if email already exists
      const existingUser = await deliveryStorage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      
      // Create user
      const user = await deliveryStorage.createUser(validation.data);
      
      // If user is a customer, create customer record
      if (user.role === 'customer') {
        await deliveryStorage.createCustomer({ userId: user.id });
      }
      
      // Return user without password
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await deliveryStorage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Return user without password
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Failed to log in' });
    }
  });

  // Driver Routes
  app.post('/api/drivers', async (req: Request, res: Response) => {
    try {
      // Validate driver data
      const validation = validateRequest(req, insertDriverSchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Create driver
      const driver = await deliveryStorage.createDriver(validation.data);
      res.status(201).json(driver);
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ error: 'Failed to create driver' });
    }
  });

  app.get('/api/drivers/:id', async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await deliveryStorage.getDriver(driverId);
      
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      
      res.json(driver);
    } catch (error) {
      console.error('Error fetching driver:', error);
      res.status(500).json({ error: 'Failed to fetch driver' });
    }
  });

  app.put('/api/drivers/:id', async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await deliveryStorage.updateDriver(driverId, req.body);
      res.json(driver);
    } catch (error) {
      console.error('Error updating driver:', error);
      res.status(500).json({ error: 'Failed to update driver' });
    }
  });

  app.put('/api/drivers/:id/location', async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      const { latitude, longitude } = req.body;
      
      const driver = await deliveryStorage.updateDriverLocation(driverId, latitude, longitude);
      res.json(driver);
    } catch (error) {
      console.error('Error updating driver location:', error);
      res.status(500).json({ error: 'Failed to update driver location' });
    }
  });

  app.get('/api/drivers/nearby', async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius = 10 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }
      
      const drivers = await deliveryStorage.getDriversNearby(
        parseFloat(latitude as string), 
        parseFloat(longitude as string), 
        parseFloat(radius as string)
      );
      
      res.json(drivers);
    } catch (error) {
      console.error('Error fetching nearby drivers:', error);
      res.status(500).json({ error: 'Failed to fetch nearby drivers' });
    }
  });

  // Address Routes
  app.post('/api/addresses', async (req: Request, res: Response) => {
    try {
      // Validate address data
      const validation = validateRequest(req, insertAddressSchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Create address
      const address = await deliveryStorage.createAddress(validation.data);
      res.status(201).json(address);
    } catch (error) {
      console.error('Error creating address:', error);
      res.status(500).json({ error: 'Failed to create address' });
    }
  });

  app.get('/api/users/:userId/addresses', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const addresses = await deliveryStorage.getAddressesByUserId(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).json({ error: 'Failed to fetch addresses' });
    }
  });

  // Delivery Routes
  app.post('/api/deliveries', async (req: Request, res: Response) => {
    try {
      // Validate delivery data
      const validation = validateRequest(req, insertDeliverySchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Create delivery
      const delivery = await deliveryStorage.createDelivery(validation.data);
      
      // If there are packages, add them
      if (req.body.packages && Array.isArray(req.body.packages)) {
        for (const packageData of req.body.packages) {
          await deliveryStorage.createPackage({
            ...packageData,
            deliveryId: delivery.id
          });
        }
      }
      
      // Create initial payment record if price is specified
      if (delivery.price) {
        await deliveryStorage.createPayment({
          deliveryId: delivery.id,
          amount: delivery.price,
          status: 'pending',
          method: req.body.paymentMethod || 'cash'
        });
      }
      
      // Notify nearby drivers of the new delivery
      wsService.broadcastToDriversByVehicleType(delivery.requiredVehicleType, {
        type: 'new_delivery',
        payload: delivery
      });
      
      res.status(201).json(delivery);
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ error: 'Failed to create delivery' });
    }
  });

  app.get('/api/deliveries/:id', async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const delivery = await deliveryStorage.getDeliveryWithItems(deliveryId);
      
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
      
      res.json(delivery);
    } catch (error) {
      console.error('Error fetching delivery:', error);
      res.status(500).json({ error: 'Failed to fetch delivery' });
    }
  });

  app.put('/api/deliveries/:id/status', async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      const delivery = await deliveryStorage.updateDeliveryStatus(deliveryId, status);
      
      // Notify all clients subscribed to this delivery about the status change
      wsService.broadcastToDelivery(deliveryId, {
        type: 'delivery_status_updated',
        payload: {
          deliveryId,
          status,
          timestamp: new Date().toISOString()
        }
      });
      
      // Create a notification for the customer
      const deliveryWithDetails = await deliveryStorage.getDeliveryWithItems(deliveryId);
      if (deliveryWithDetails) {
        const statusMessage = getStatusMessage(status);
        
        await deliveryStorage.createNotification({
          userId: deliveryWithDetails.customer.id,
          title: 'Delivery Status Update',
          message: statusMessage,
          type: 'delivery_update',
          referenceId: deliveryId
        });
      }
      
      res.json(delivery);
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ error: 'Failed to update delivery status' });
    }
  });

  app.put('/api/deliveries/:id/assign', async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const { driverId } = req.body;
      
      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }
      
      const delivery = await deliveryStorage.assignDriverToDelivery(deliveryId, driverId);
      
      // Notify all clients subscribed to this delivery about the driver assignment
      const driver = await deliveryStorage.getDriver(driverId);
      if (driver) {
        wsService.broadcastToDelivery(deliveryId, {
          type: 'driver_assigned',
          payload: {
            deliveryId,
            driverId,
            driverName: driver.user?.firstName + ' ' + driver.user?.lastName,
            timestamp: new Date().toISOString()
          }
        });
        
        // Create a notification for the customer
        const deliveryWithDetails = await deliveryStorage.getDeliveryWithItems(deliveryId);
        if (deliveryWithDetails) {
          await deliveryStorage.createNotification({
            userId: deliveryWithDetails.customer.id,
            title: 'Driver Assigned',
            message: `${driver.user?.firstName} ${driver.user?.lastName} has been assigned to your delivery.`,
            type: 'delivery_update',
            referenceId: deliveryId
          });
        }
      }
      
      res.json(delivery);
    } catch (error) {
      console.error('Error assigning driver to delivery:', error);
      res.status(500).json({ error: 'Failed to assign driver to delivery' });
    }
  });

  app.get('/api/customers/:customerId/deliveries', async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const deliveries = await deliveryStorage.getDeliveriesByCustomerId(customerId);
      res.json(deliveries);
    } catch (error) {
      console.error('Error fetching customer deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch customer deliveries' });
    }
  });

  app.get('/api/drivers/:driverId/deliveries', async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const active = req.query.active === 'true';
      
      const deliveries = active
        ? await deliveryStorage.getActiveDeliveriesByDriverId(driverId)
        : await deliveryStorage.getDeliveriesByDriverId(driverId);
      
      res.json(deliveries);
    } catch (error) {
      console.error('Error fetching driver deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch driver deliveries' });
    }
  });

  // Payment Routes
  app.post('/api/payments', async (req: Request, res: Response) => {
    try {
      // Validate payment data
      const validation = validateRequest(req, insertPaymentSchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Create payment
      const payment = await deliveryStorage.createPayment(validation.data);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  app.get('/api/deliveries/:deliveryId/payment', async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.deliveryId);
      const payment = await deliveryStorage.getPaymentByDeliveryId(deliveryId);
      
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      res.json(payment);
    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({ error: 'Failed to fetch payment' });
    }
  });

  app.put('/api/payments/:id/status', async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      const payment = await deliveryStorage.updatePaymentStatus(paymentId, status);
      
      // Notify relevant parties about the payment status update
      const deliveryWithDetails = await deliveryStorage.getDeliveryWithItems(payment.deliveryId);
      if (deliveryWithDetails) {
        // Notify the customer
        await deliveryStorage.createNotification({
          userId: deliveryWithDetails.customer.id,
          title: 'Payment Update',
          message: `Your payment for delivery #${payment.deliveryId} is now ${status}.`,
          type: 'payment_update',
          referenceId: payment.deliveryId
        });
        
        // If payment is successful, notify the driver
        if (status === 'paid' && deliveryWithDetails.driver) {
          await deliveryStorage.createNotification({
            userId: deliveryWithDetails.driver.user.id,
            title: 'Payment Received',
            message: `Payment for delivery #${payment.deliveryId} has been received.`,
            type: 'payment_update',
            referenceId: payment.deliveryId
          });
        }
      }
      
      res.json(payment);
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  });

  // Review Routes
  app.post('/api/reviews', async (req: Request, res: Response) => {
    try {
      // Validate review data
      const validation = validateRequest(req, insertReviewSchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Create review
      const review = await deliveryStorage.createReview(validation.data);
      
      // Notify the reviewee about the new review
      await deliveryStorage.createNotification({
        userId: review.revieweeId,
        title: 'New Review',
        message: `You've received a ${review.rating}-star review for delivery #${review.deliveryId}.`,
        type: 'review',
        referenceId: review.deliveryId
      });
      
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  });

  app.get('/api/drivers/:driverId/reviews', async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const reviews = await deliveryStorage.getReviewsByDriverId(driverId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching driver reviews:', error);
      res.status(500).json({ error: 'Failed to fetch driver reviews' });
    }
  });

  app.get('/api/drivers/:driverId/rating', async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const rating = await deliveryStorage.getAverageDriverRating(driverId);
      
      const driver = await deliveryStorage.getDriver(driverId);
      res.json({
        rating,
        count: driver?.ratingCount || 0
      });
    } catch (error) {
      console.error('Error fetching driver rating:', error);
      res.status(500).json({ error: 'Failed to fetch driver rating' });
    }
  });

  // Message Routes
  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      // Validate message data
      const validation = validateRequest(req, insertMessageSchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Create message
      const message = await deliveryStorage.createMessage(validation.data);
      
      // Broadcast the message to all clients subscribed to this delivery
      wsService.broadcastToDelivery(message.deliveryId, {
        type: 'new_message',
        payload: message
      });
      
      // Create a notification for the recipient
      await deliveryStorage.createNotification({
        userId: message.receiverId,
        title: 'New Message',
        message: 'You have a new message regarding your delivery.',
        type: 'message',
        referenceId: message.deliveryId
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  app.get('/api/deliveries/:deliveryId/messages', async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.deliveryId);
      const messages = await deliveryStorage.getMessagesByDeliveryId(deliveryId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.put('/api/messages/:id/read', async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await deliveryStorage.markMessageAsRead(messageId);
      res.json(message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  // Notification Routes
  app.get('/api/users/:userId/notifications', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const unreadOnly = req.query.unread === 'true';
      
      const notifications = unreadOnly
        ? await deliveryStorage.getUnreadNotificationsByUserId(userId)
        : await deliveryStorage.getNotificationsByUserId(userId);
      
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.put('/api/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await deliveryStorage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Furniture Routes (for compatibility with existing code)
  app.get('/api/furniture', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      
      const furniture = category
        ? await deliveryStorage.getFurnitureByCategory(category)
        : await deliveryStorage.getAllFurniture();
      
      res.json(furniture);
    } catch (error) {
      console.error('Error fetching furniture:', error);
      res.status(500).json({ error: 'Failed to fetch furniture' });
    }
  });

  app.get('/api/furniture/:id', async (req: Request, res: Response) => {
    try {
      const furnitureId = parseInt(req.params.id);
      const furniture = await deliveryStorage.getFurniture(furnitureId);
      
      if (!furniture) {
        return res.status(404).json({ error: 'Furniture not found' });
      }
      
      res.json(furniture);
    } catch (error) {
      console.error('Error fetching furniture:', error);
      res.status(500).json({ error: 'Failed to fetch furniture' });
    }
  });

  app.post('/api/furniture', async (req: Request, res: Response) => {
    try {
      // Validate furniture data
      const validation = validateRequest(req, insertFurnitureSchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Create furniture
      const furniture = await deliveryStorage.createFurniture(validation.data);
      res.status(201).json(furniture);
    } catch (error) {
      console.error('Error creating furniture:', error);
      res.status(500).json({ error: 'Failed to create furniture' });
    }
  });

  return httpServer;
}

// Helper function to get status messages
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Your delivery request is pending.';
    case 'accepted':
      return 'A driver has accepted your delivery request.';
    case 'driver_en_route_to_pickup':
      return 'Your driver is on the way to the pickup location.';
    case 'at_pickup':
      return 'Your driver has arrived at the pickup location.';
    case 'loading':
      return 'Your items are being loaded.';
    case 'in_transit':
      return 'Your delivery is in transit.';
    case 'arriving':
      return 'Your driver is approaching the drop-off location.';
    case 'at_dropoff':
      return 'Your driver has arrived at the drop-off location.';
    case 'unloading':
      return 'Your items are being unloaded.';
    case 'completed':
      return 'Your delivery has been completed. Thank you for using our service!';
    case 'cancelled':
      return 'Your delivery has been cancelled.';
    default:
      return `Your delivery status has been updated to ${status}.`;
  }
}