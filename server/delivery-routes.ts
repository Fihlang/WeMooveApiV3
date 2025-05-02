import { Express, Request, Response } from 'express';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { deliveryStorage } from './delivery-storage';
import { createWebSocketService } from './websocket';
import { db } from './db';
import { eq, and, or, gt, isNull } from 'drizzle-orm';
import * as schema from '../shared/db-schema';
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

// Initialize WebSocket service
let wsService: any;
import argon2 from 'argon2';
import { 
  sendWelcomeEmail,
  sendDeliveryConfirmationEmail,
  sendDriverAssignedEmail,
  sendDeliveryStatusEmail,
  sendDeliveryCompleteEmail,
  EmailTemplate
} from './services/email.service';

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
  wsService = createWebSocketService(httpServer);

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
      
      // Send welcome email asynchronously (don't wait for it to complete)
      try {
        // Create a dashboard URL based on the user's role
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
        const dashboardUrl = `${baseUrl}/${user.role === 'customer' ? 'customer' : 'driver'}/dashboard`;
        
        sendWelcomeEmail(
          user.email,
          user.firstName,
          user.lastName,
          dashboardUrl
        ).catch(emailError => {
          // Just log email errors, don't fail the registration
          console.error('Error sending welcome email:', emailError);
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }
      
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

  // Enhanced endpoint for driver location updates with more tracking data
  app.put('/api/drivers/:id/location', async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      const { latitude, longitude, heading, speed, accuracy, altitude, timestamp } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }
      
      // Update driver location in database
      const driver = await deliveryStorage.updateDriverLocation(
        driverId, 
        parseFloat(latitude), 
        parseFloat(longitude),
        heading ? parseFloat(heading) : undefined,
        speed ? parseFloat(speed) : undefined,
        accuracy ? parseFloat(accuracy) : undefined,
        altitude ? parseFloat(altitude) : undefined
      );
      
      // If the driver has an active delivery, calculate ETA and broadcast location update
      const activeDeliveries = await deliveryStorage.getActiveDeliveriesByDriverId(driverId);
      if (activeDeliveries.length > 0) {
        const currentDelivery = activeDeliveries[0];
        
        // Calculate ETA and remaining distance
        let estimatedArrivalTime = null;
        let distanceRemaining = null;
        let etaMinutes = null;
        let nextWaypoint = null;
        
        const deliveryWithDetails = await deliveryStorage.getDeliveryWithItems(currentDelivery.id);
        if (deliveryWithDetails) {
          // Determine which address we're heading to based on delivery status
          const destination = ['pending', 'accepted', 'driver_en_route_to_pickup', 'at_pickup', 'loading'].includes(currentDelivery.status)
            ? deliveryWithDetails.pickupAddress 
            : deliveryWithDetails.dropoffAddress;
            
          if (destination && destination.latitude && destination.longitude) {
            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = (parseFloat(destination.latitude) - parseFloat(latitude)) * Math.PI / 180;
            const dLon = (parseFloat(destination.longitude) - parseFloat(longitude)) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(parseFloat(latitude) * Math.PI / 180) * Math.cos(parseFloat(destination.latitude) * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distanceRemaining = R * c; // Distance in km
            
            // Calculate ETA based on current speed or average speed by vehicle type
            if (speed && parseFloat(speed) > 0) {
              // Convert km/h to minutes
              etaMinutes = Math.round((distanceRemaining / parseFloat(speed)) * 60);
              
              // Ensure minimum ETA of 1 minute if very close
              if (etaMinutes < 1) etaMinutes = 1;
              
              // Calculate actual arrival time
              estimatedArrivalTime = new Date(Date.now() + etaMinutes * 60 * 1000);
              
              // Update the delivery with the estimated arrival time
              await db.update(schema.deliveries)
                .set({ 
                  estimatedDeliveryTime: estimatedArrivalTime,
                  updatedAt: new Date()
                })
                .where(eq(schema.deliveries.id, currentDelivery.id));
            } else {
              // Use average speed based on vehicle type
              const avgSpeed = driver.vehicleType === 'motorbike' ? 30 : 25; // km/h
              etaMinutes = Math.round((distanceRemaining / avgSpeed) * 60);
              
              // Ensure minimum ETA of 1 minute if very close
              if (etaMinutes < 1) etaMinutes = 1;
              
              estimatedArrivalTime = new Date(Date.now() + etaMinutes * 60 * 1000);
            }
            
            // Create next waypoint data
            nextWaypoint = {
              latitude: parseFloat(destination.latitude),
              longitude: parseFloat(destination.longitude),
              address: `${destination.addressLine1}, ${destination.city}`,
              type: ['pending', 'accepted', 'driver_en_route_to_pickup', 'at_pickup', 'loading'].includes(currentDelivery.status) 
                ? 'pickup' 
                : 'dropoff'
            };
          }
        }
        
        // Broadcast the location update to all clients subscribed to this delivery
        wsService.broadcastToDelivery(currentDelivery.id, {
          type: 'driver_location_updated',
          payload: {
            deliveryId: currentDelivery.id,
            driverId,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            heading: heading ? parseFloat(heading) : null,
            speed: speed ? parseFloat(speed) : null,
            accuracy: accuracy ? parseFloat(accuracy) : null,
            altitude: altitude ? parseFloat(altitude) : null,
            estimatedArrivalTime: estimatedArrivalTime ? estimatedArrivalTime.toISOString() : null,
            etaMinutes,
            distanceRemaining,
            distanceText: distanceRemaining ? `${distanceRemaining.toFixed(1)} km` : null,
            etaText: etaMinutes ? `${etaMinutes} min` : null,
            nextWaypoint,
            timestamp: timestamp || new Date().toISOString()
          }
        });
      }
      
      res.json({
        ...driver,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        heading: heading ? parseFloat(heading) : null,
        speed: speed ? parseFloat(speed) : null,
        accuracy: accuracy ? parseFloat(accuracy) : null
      });
    } catch (error) {
      console.error('Error updating driver location:', error);
      res.status(500).json({ error: 'Failed to update driver location' });
    }
  });
  
  // New endpoint for getting driver's current location and ETA for a specific delivery
  app.get('/api/deliveries/:id/tracking', async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.id);
      
      // Get delivery with driver details
      const delivery = await deliveryStorage.getDeliveryWithItems(deliveryId);
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
      
      if (!delivery.driverId) {
        return res.status(200).json({ 
          deliveryId,
          status: delivery.status,
          driverAssigned: false,
          message: 'No driver assigned to this delivery yet'
        });
      }
      
      // Get driver with location data
      const driver = await deliveryStorage.getDriver(delivery.driverId);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      
      // If we don't have location data yet
      if (!driver.latitude || !driver.longitude) {
        return res.status(200).json({
          deliveryId,
          driverId: driver.id,
          driverName: driver.user?.firstName + ' ' + driver.user?.lastName,
          vehicleInfo: {
            type: driver.vehicleType,
            make: driver.vehicleMake,
            model: driver.vehicleModel,
            color: driver.vehicleColor,
            licensePlate: driver.licensePlate
          },
          trackingAvailable: false,
          driverAssigned: true,
          status: delivery.status,
          message: 'Driver assigned but location tracking not yet available'
        });
      }
      
      // Determine which address we're heading to based on delivery status
      const isGoingToPickup = ['pending', 'accepted', 'driver_en_route_to_pickup', 'at_pickup', 'loading'].includes(delivery.status);
      const targetAddress = isGoingToPickup ? delivery.pickupAddress : delivery.dropoffAddress;
      
      let eta = null;
      let distanceRemaining = null;
      let nextWaypoint = null;
      
      if (targetAddress && targetAddress.latitude && targetAddress.longitude) {
        // Calculate distance in kilometers using Haversine formula
        const R = 6371; // Earth's radius in kilometers
        const dLat = (parseFloat(targetAddress.latitude) - parseFloat(driver.latitude)) * Math.PI / 180;
        const dLng = (parseFloat(targetAddress.longitude) - parseFloat(driver.longitude)) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(parseFloat(driver.latitude) * Math.PI / 180) * Math.cos(parseFloat(targetAddress.latitude) * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        distanceRemaining = R * c;
        
        // Estimate ETA based on distance and current speed
        // If speed is available and > 0, use it for ETA calculation
        if (driver.speed && parseFloat(driver.speed) > 0) {
          // Convert speed from km/h to km/min and calculate ETA in minutes
          eta = Math.round(distanceRemaining / (parseFloat(driver.speed) / 60));
          
          // If ETA is less than 1 minute, set it to 1
          if (eta < 1) eta = 1;
        } else {
          // No speed data, use average speed based on vehicle type
          const avgSpeed = driver.vehicleType === 'motorbike' ? 30 : 25; // km/h
          eta = Math.round(distanceRemaining / (avgSpeed / 60));
        }
        
        nextWaypoint = {
          latitude: parseFloat(targetAddress.latitude),
          longitude: parseFloat(targetAddress.longitude),
          address: `${targetAddress.addressLine1}, ${targetAddress.city}`,
          type: isGoingToPickup ? 'pickup' : 'dropoff'
        };
      }
      
      // Get origin and destination for the map
      const origin = {
        latitude: parseFloat(driver.latitude),
        longitude: parseFloat(driver.longitude),
        address: 'Current driver location'
      };
      
      // Define appropriate status messages based on delivery status
      let statusMessage = '';
      let statusPhase = '';
      
      switch(delivery.status) {
        case 'pending':
          statusMessage = 'Your delivery is being prepared';
          statusPhase = 'preparation';
          break;
        case 'accepted':
          statusMessage = 'Driver has accepted your delivery';
          statusPhase = 'accepted';
          break;
        case 'driver_en_route_to_pickup':
          statusMessage = 'Driver is on the way to pickup your items';
          statusPhase = 'to_pickup';
          break;
        case 'at_pickup':
          statusMessage = 'Driver has arrived at the pickup location';
          statusPhase = 'at_pickup';
          break;
        case 'loading':
          statusMessage = 'Your items are being loaded';
          statusPhase = 'loading';
          break;
        case 'in_transit':
          statusMessage = 'Your items are on the way to the destination';
          statusPhase = 'in_transit';
          break;
        case 'arriving':
          statusMessage = 'Driver is arriving at your location soon';
          statusPhase = 'arriving';
          break;
        case 'at_dropoff':
          statusMessage = 'Driver has arrived at the destination';
          statusPhase = 'at_dropoff';
          break;
        case 'unloading':
          statusMessage = 'Your items are being unloaded';
          statusPhase = 'unloading';
          break;
        case 'completed':
          statusMessage = 'Your delivery has been completed';
          statusPhase = 'completed';
          break;
        case 'cancelled':
          statusMessage = 'This delivery has been cancelled';
          statusPhase = 'cancelled';
          break;
        default:
          statusMessage = `Status: ${delivery.status}`;
          statusPhase = 'unknown';
      }
      
      // Return comprehensive tracking data
      res.json({
        deliveryId,
        status: delivery.status,
        statusMessage,
        statusPhase,
        driverAssigned: true,
        trackingAvailable: true,
        driver: {
          id: driver.id,
          name: driver.user?.firstName + ' ' + driver.user?.lastName,
          phone: driver.user?.phone,
          rating: driver.rating || 0,
          ratingCount: driver.ratingCount || 0,
          photo: driver.user?.photoUrl,
          vehicle: {
            type: driver.vehicleType,
            make: driver.vehicleMake,
            model: driver.vehicleModel,
            color: driver.vehicleColor,
            licensePlate: driver.licensePlate,
            year: driver.vehicleYear
          }
        },
        tracking: {
          currentLocation: {
            latitude: parseFloat(driver.latitude),
            longitude: parseFloat(driver.longitude),
            heading: driver.heading ? parseFloat(driver.heading) : null,
            speed: driver.speed ? parseFloat(driver.speed) : null,
            accuracy: driver.locationAccuracy ? parseFloat(driver.locationAccuracy) : null,
            lastUpdated: driver.locationUpdatedAt
          },
          destination: nextWaypoint,
          origin,
          eta,
          etaText: eta ? `${eta} minutes` : 'Calculating...',
          distanceRemaining,
          distanceText: distanceRemaining ? `${distanceRemaining.toFixed(1)} km` : 'Calculating...',
          estimatedArrivalTime: delivery.estimatedDeliveryTime
        },
        delivery: {
          scheduledPickupTime: delivery.scheduledPickupTime,
          estimatedDeliveryTime: delivery.estimatedDeliveryTime,
          price: delivery.price,
          currency: 'ZAR',
          requiredVehicleType: delivery.requiredVehicleType,
          specialInstructions: delivery.specialInstructions
        }
      });
    } catch (error) {
      console.error('Error getting driver location:', error);
      res.status(500).json({ error: 'Failed to get driver location' });
    }
  });
  
  app.put('/api/drivers/:id/status', async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      const { isOnline, isAvailable } = req.body;
      
      if (isOnline === undefined || isAvailable === undefined) {
        return res.status(400).json({ error: 'isOnline and isAvailable status are required' });
      }
      
      const driver = await deliveryStorage.updateDriverStatus(driverId, isOnline, isAvailable);
      res.json(driver);
    } catch (error) {
      console.error('Error updating driver status:', error);
      res.status(500).json({ error: 'Failed to update driver status' });
    }
  });

  app.get('/api/drivers/nearby', async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius = 10, vehicleType, onlineOnly = 'true' } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }
      
      const requiresOnline = onlineOnly === 'true';
      
      const drivers = await deliveryStorage.getDriversNearby(
        parseFloat(latitude as string), 
        parseFloat(longitude as string), 
        parseFloat(radius as string),
        vehicleType as string | undefined,
        requiresOnline
      );
      
      res.json(drivers);
    } catch (error) {
      console.error('Error fetching nearby drivers:', error);
      res.status(500).json({ error: 'Failed to fetch nearby drivers' });
    }
  });
  
  app.get('/api/drivers/available-for-delivery', async (req: Request, res: Response) => {
    try {
      const { 
        pickupLatitude, 
        pickupLongitude, 
        vehicleType, 
        isSmallParcel = 'false' 
      } = req.query;
      
      if (!pickupLatitude || !pickupLongitude || !vehicleType) {
        return res.status(400).json({ 
          error: 'Pickup coordinates and vehicle type are required'
        });
      }
      
      const drivers = await deliveryStorage.getAvailableDriversForDelivery(
        parseFloat(pickupLatitude as string),
        parseFloat(pickupLongitude as string),
        vehicleType as string,
        isSmallParcel === 'true'
      );
      
      res.json(drivers);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      res.status(500).json({ error: 'Failed to fetch available drivers' });
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
  // Generic delivery creation endpoint
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
      
      // Send delivery confirmation email asynchronously
      try {
        await sendDeliveryConfirmationEmailWithDetails(delivery.id);
      } catch (emailError) {
        console.error('Error sending delivery confirmation email:', emailError);
      }
      
      res.status(201).json(delivery);
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ error: 'Failed to create delivery' });
    }
  });
  
  // Specialized endpoint for furniture deliveries
  app.post('/api/deliveries/furniture', async (req: Request, res: Response) => {
    try {
      // Validate basic delivery data
      const validation = validateRequest(req, insertDeliverySchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Ensure the vehicle type is appropriate for furniture
      if (validation.data.requiredVehicleType !== 'truck' && validation.data.requiredVehicleType !== 'van') {
        return res.status(400).json({ 
          error: 'Furniture deliveries require a truck or van vehicle type' 
        });
      }
      
      // Check if furniture items are provided
      if (!req.body.furnitureItems || !Array.isArray(req.body.furnitureItems) || req.body.furnitureItems.length === 0) {
        return res.status(400).json({ 
          error: 'Furniture deliveries require at least one furniture item' 
        });
      }
      
      // Create the delivery
      const delivery = await deliveryStorage.createDelivery(validation.data);
      
      // Add furniture items as packages
      for (const item of req.body.furnitureItems) {
        await deliveryStorage.createPackage({
          deliveryId: delivery.id,
          packageType: 'furniture',
          name: item.name || 'Furniture item',
          description: item.description || '',
          weight: item.weight,
          length: item.length,
          width: item.width,
          height: item.height,
          isFragile: item.isFragile || false,
          requiresSpecialHandling: item.requiresAssembly || false,
          photoUrl: item.photoUrl
        });
      }
      
      // Create initial payment record
      await deliveryStorage.createPayment({
        deliveryId: delivery.id,
        amount: delivery.price,
        status: 'pending',
        method: req.body.paymentMethod || 'cash'
      });
      
      // Find suitable drivers specifically for furniture delivery
      if (req.body.findDriver === true && 
          req.body.pickupCoordinates && 
          req.body.pickupCoordinates.latitude && 
          req.body.pickupCoordinates.longitude) {
        
        // Get the most appropriate drivers for this furniture delivery
        const suitableDrivers = await deliveryStorage.getAvailableDriversForDelivery(
          parseFloat(req.body.pickupCoordinates.latitude),
          parseFloat(req.body.pickupCoordinates.longitude),
          validation.data.requiredVehicleType,
          false // Not a small parcel
        );
        
        // Notify these drivers via WebSocket
        for (const driver of suitableDrivers) {
          wsService.broadcastToUser(driver.userId, {
            type: 'furniture_delivery_request',
            payload: {
              deliveryId: delivery.id,
              pickupLocation: {
                latitude: req.body.pickupCoordinates.latitude,
                longitude: req.body.pickupCoordinates.longitude,
                address: await deliveryStorage.getAddress(delivery.pickupAddressId)
              },
              dropoffLocation: {
                address: await deliveryStorage.getAddress(delivery.dropoffAddressId)
              },
              itemCount: req.body.furnitureItems.length,
              price: delivery.price,
              scheduledPickupTime: delivery.scheduledPickupTime
            }
          });
        }
        
        // Send back the suitable driver count
        delivery.suitableDriverCount = suitableDrivers.length;
      }
      
      // Send delivery confirmation email
      try {
        await sendDeliveryConfirmationEmailWithDetails(delivery.id);
      } catch (emailError) {
        console.error('Error sending furniture delivery confirmation email:', emailError);
      }
      
      res.status(201).json(delivery);
    } catch (error) {
      console.error('Error creating furniture delivery:', error);
      res.status(500).json({ error: 'Failed to create furniture delivery' });
    }
  });
  
  // Specialized endpoint for small parcel deliveries (motorbike deliveries)
  app.post('/api/deliveries/parcel', async (req: Request, res: Response) => {
    try {
      // Validate basic delivery data
      const validation = validateRequest(req, insertDeliverySchema);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Ensure the vehicle type is appropriate for small parcels
      if (validation.data.requiredVehicleType !== 'motorbike') {
        return res.status(400).json({ 
          error: 'Small parcel deliveries require a motorbike vehicle type' 
        });
      }
      
      // Check if parcel details are provided
      if (!req.body.parcel) {
        return res.status(400).json({ 
          error: 'Parcel deliveries require parcel details' 
        });
      }
      
      // Create the delivery
      const delivery = await deliveryStorage.createDelivery(validation.data);
      
      // Add parcel as a package
      await deliveryStorage.createPackage({
        deliveryId: delivery.id,
        packageType: req.body.parcel.type || 'parcel',
        name: req.body.parcel.name || 'Small parcel',
        description: req.body.parcel.description || '',
        weight: req.body.parcel.weight,
        length: req.body.parcel.length,
        width: req.body.parcel.width,
        height: req.body.parcel.height,
        isFragile: req.body.parcel.isFragile || false,
        requiresSpecialHandling: req.body.parcel.requiresSpecialHandling || false,
        photoUrl: req.body.parcel.photoUrl
      });
      
      // Create initial payment record
      await deliveryStorage.createPayment({
        deliveryId: delivery.id,
        amount: delivery.price,
        status: 'pending',
        method: req.body.paymentMethod || 'cash'
      });
      
      // Find suitable motorbike drivers for quick delivery
      if (req.body.findDriver === true && 
          req.body.pickupCoordinates && 
          req.body.pickupCoordinates.latitude && 
          req.body.pickupCoordinates.longitude) {
        
        // Get the closest motorbike drivers
        const suitableDrivers = await deliveryStorage.getAvailableDriversForDelivery(
          parseFloat(req.body.pickupCoordinates.latitude),
          parseFloat(req.body.pickupCoordinates.longitude),
          'motorbike',
          true // Is a small parcel
        );
        
        // Notify these drivers via WebSocket - use a higher priority for parcels (quick delivery)
        for (const driver of suitableDrivers) {
          wsService.broadcastToUser(driver.userId, {
            type: 'parcel_delivery_request',
            priority: 'high',
            payload: {
              deliveryId: delivery.id,
              pickupLocation: {
                latitude: req.body.pickupCoordinates.latitude,
                longitude: req.body.pickupCoordinates.longitude,
                address: await deliveryStorage.getAddress(delivery.pickupAddressId)
              },
              dropoffLocation: {
                address: await deliveryStorage.getAddress(delivery.dropoffAddressId)
              },
              parcelDetails: {
                type: req.body.parcel.type || 'parcel',
                name: req.body.parcel.name || 'Small parcel',
                weight: req.body.parcel.weight
              },
              price: delivery.price,
              scheduledPickupTime: delivery.scheduledPickupTime
            }
          });
        }
        
        // Send back the suitable driver count
        delivery.suitableDriverCount = suitableDrivers.length;
      }
      
      // Send delivery confirmation email
      try {
        await sendDeliveryConfirmationEmailWithDetails(delivery.id);
      } catch (emailError) {
        console.error('Error sending parcel delivery confirmation email:', emailError);
      }
      
      res.status(201).json(delivery);
    } catch (error) {
      console.error('Error creating parcel delivery:', error);
      res.status(500).json({ error: 'Failed to create parcel delivery' });
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

  // Enhanced endpoint for delivery status updates with automated transitions and additional actions
  app.put('/api/deliveries/:id/status', async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const { 
        status, 
        latitude, 
        longitude, 
        notes,
        autoTransition = false // Whether to automatically progress to the next logical status
      } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      // Get current delivery to check previous status
      const currentDelivery = await deliveryStorage.getDelivery(deliveryId);
      if (!currentDelivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
      
      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        'pending': ['accepted', 'cancelled'],
        'accepted': ['driver_en_route_to_pickup', 'cancelled'],
        'driver_en_route_to_pickup': ['at_pickup', 'cancelled'],
        'at_pickup': ['loading', 'cancelled'],
        'loading': ['in_transit', 'cancelled'],
        'in_transit': ['arriving', 'cancelled'],
        'arriving': ['at_dropoff', 'cancelled'],
        'at_dropoff': ['unloading', 'cancelled'],
        'unloading': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
      };
      
      // Check if the status transition is valid 
      // Skip for admin role (would need to be added with proper auth)
      const isValidTransition = validTransitions[currentDelivery.status]?.includes(status);
      if (!isValidTransition && currentDelivery.status !== status) {
        return res.status(400).json({ 
          error: `Invalid status transition from '${currentDelivery.status}' to '${status}'`,
          validTransitions: validTransitions[currentDelivery.status]
        });
      }
      
      // Get full delivery details for notifications
      const deliveryWithDetails = await deliveryStorage.getDeliveryWithItems(deliveryId);
      if (!deliveryWithDetails) {
        return res.status(404).json({ error: 'Delivery details not found' });
      }
      
      // Handle specific status changes with additional logic
      let shouldUpdateDriverStatus = false;
      let newDriverStatus: { isOnline?: boolean, isAvailable?: boolean } = {};
      let shouldUpdateLocation = false;
      let locationUpdate = null;
      
      // Additional action based on the status transition
      switch (status) {
        case 'accepted':
          // When a driver accepts a delivery
          shouldUpdateDriverStatus = true;
          newDriverStatus = { isAvailable: false };
          
          // Create message welcoming the customer
          if (deliveryWithDetails.driver && deliveryWithDetails.driver.user) {
            await deliveryStorage.createMessage({
              deliveryId,
              senderId: deliveryWithDetails.driver.userId,
              receiverId: deliveryWithDetails.customer.userId,
              content: `Hello, I'm ${deliveryWithDetails.driver.user.firstName} and I'll be your delivery driver today. I'll be heading to the pickup location soon.`,
              messageType: 'text'
            });
          }
          break;
          
        case 'driver_en_route_to_pickup':
          // When driver starts heading to pickup location
          shouldUpdateLocation = true;
          
          // Send a notification to the customer that driver is on the way
          if (deliveryWithDetails.driver && deliveryWithDetails.driver.user) {
            const estimatedPickupTime = new Date();
            estimatedPickupTime.setMinutes(estimatedPickupTime.getMinutes() + 15); // Simple estimate
            
            await deliveryStorage.createMessage({
              deliveryId,
              senderId: deliveryWithDetails.driver.userId,
              receiverId: deliveryWithDetails.customer.userId,
              content: `I'm now on my way to pick up your items. Estimated arrival at pickup location in about 15 minutes.`,
              messageType: 'text'
            });
          }
          break;
          
        case 'at_pickup':
          // When driver arrives at pickup location
          shouldUpdateLocation = true;
          
          // Send notification to customer
          await deliveryStorage.createMessage({
            deliveryId,
            senderId: deliveryWithDetails.driver.userId,
            receiverId: deliveryWithDetails.customer.userId,
            content: `I've arrived at the pickup location.${notes ? ' ' + notes : ''}`,
            messageType: 'text'
          });
          break;
          
        case 'loading':
          // Items are being loaded onto vehicle
          break;
          
        case 'in_transit':
          // Driver has started the journey to dropoff
          shouldUpdateLocation = true;
          
          // Notify customer
          await deliveryStorage.createMessage({
            deliveryId,
            senderId: deliveryWithDetails.driver.userId,
            receiverId: deliveryWithDetails.customer.userId,
            content: `Your items are now loaded and I'm on the way to your delivery location.`,
            messageType: 'text'
          });
          break;
          
        case 'arriving':
          // Driver is close to the dropoff location
          shouldUpdateLocation = true;
          
          // Notify customer of imminent arrival
          await deliveryStorage.createMessage({
            deliveryId,
            senderId: deliveryWithDetails.driver.userId,
            receiverId: deliveryWithDetails.customer.userId,
            content: `I'm arriving at your location shortly (within 5 minutes).${notes ? ' ' + notes : ''}`,
            messageType: 'text'
          });
          break;
          
        case 'at_dropoff':
          // Driver has arrived at dropoff location
          shouldUpdateLocation = true;
          
          // Notify customer
          await deliveryStorage.createMessage({
            deliveryId,
            senderId: deliveryWithDetails.driver.userId,
            receiverId: deliveryWithDetails.customer.userId,
            content: `I've arrived at your location.${notes ? ' ' + notes : ''}`,
            messageType: 'text'
          });
          break;
          
        case 'unloading':
          // Items are being unloaded
          break;
          
        case 'completed':
          // Delivery has been completed
          shouldUpdateDriverStatus = true;
          newDriverStatus = { isAvailable: true };
          
          // Update driver's current delivery ID to null
          if (deliveryWithDetails.driverId) {
            await deliveryStorage.updateDriver(deliveryWithDetails.driverId, { 
              currentDeliveryId: null 
            });
          }
          
          // Check if payment is complete and update if needed
          const payment = await deliveryStorage.getPaymentByDeliveryId(deliveryId);
          if (payment && payment.status !== 'completed') {
            await deliveryStorage.updatePaymentStatus(payment.id, 'completed');
          }
          
          // Send thank you message
          await deliveryStorage.createMessage({
            deliveryId,
            senderId: deliveryWithDetails.driver.userId,
            receiverId: deliveryWithDetails.customer.userId,
            content: `Thank you for using our service! Your delivery is now complete. It was a pleasure serving you.`,
            messageType: 'text'
          });
          break;
          
        case 'cancelled':
          // Delivery has been cancelled
          shouldUpdateDriverStatus = true;
          newDriverStatus = { isAvailable: true };
          
          // Update driver's current delivery ID to null
          if (deliveryWithDetails.driverId) {
            await deliveryStorage.updateDriver(deliveryWithDetails.driverId, { 
              currentDeliveryId: null 
            });
          }
          break;
      }
      
      // Update driver status if needed
      if (shouldUpdateDriverStatus && deliveryWithDetails.driverId) {
        await deliveryStorage.updateDriver(deliveryWithDetails.driverId, newDriverStatus);
      }
      
      // Update driver location if provided
      if (shouldUpdateLocation && latitude && longitude && deliveryWithDetails.driverId) {
        locationUpdate = await deliveryStorage.updateDriverLocation(
          deliveryWithDetails.driverId,
          parseFloat(latitude),
          parseFloat(longitude)
        );
      }
      
      // Add activity log entry
      const activityType = `status_${status}`;
      await db.insert(schema.deliveryActivities).values({
        deliveryId,
        activityType,
        details: JSON.stringify({
          prevStatus: currentDelivery.status,
          newStatus: status,
          notes,
          location: latitude && longitude ? { latitude, longitude } : null,
          timestamp: new Date().toISOString()
        }),
        createdAt: new Date()
      });
      
      // Update the delivery status
      const delivery = await deliveryStorage.updateDeliveryStatus(deliveryId, status);
      
      // Notify all clients subscribed to this delivery about the status change
      wsService.broadcastDeliveryStatusUpdate(deliveryId, status);
      
      // Also use the previous implementation to keep backwards compatibility
      wsService.broadcastToDelivery(deliveryId, {
        type: 'delivery_status_updated',
        payload: {
          deliveryId,
          status,
          prevStatus: currentDelivery.status,
          notes,
          location: latitude && longitude ? { latitude, longitude } : null,
          timestamp: new Date().toISOString()
        }
      });
      
      // Create a notification for the customer
      if (deliveryWithDetails) {
        const statusMessage = getStatusMessage(status);
        
        // Create in-app notification
        await deliveryStorage.createNotification({
          userId: deliveryWithDetails.customer.userId,
          title: 'Delivery Status Update',
          message: statusMessage,
          type: 'delivery_update',
          referenceId: deliveryId
        });
        
        // Send email notification for status update
        try {
          const customer = deliveryWithDetails.customer;
          if (customer && customer.email) {
            // Get addresses for the email
            const pickupAddress = deliveryWithDetails.pickupAddress;
            const dropoffAddress = deliveryWithDetails.dropoffAddress;
            
            if (pickupAddress && dropoffAddress) {
              // Format addresses
              const pickupAddressFormatted = `${pickupAddress.addressLine1}, ${pickupAddress.city}, ${pickupAddress.province}, ${pickupAddress.zipCode}`;
              const dropoffAddressFormatted = `${dropoffAddress.addressLine1}, ${dropoffAddress.city}, ${dropoffAddress.province}, ${dropoffAddress.zipCode}`;
              
              // Create tracking URL
              const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
              const trackingUrl = `${baseUrl}/customer/deliveries/${deliveryId}/track`;
              
              // Format update time
              const updateTime = new Date().toLocaleString('en-ZA', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
              
              // Format ETA if available
              const estimatedDeliveryTime = deliveryWithDetails.estimatedDeliveryTime 
                ? new Date(deliveryWithDetails.estimatedDeliveryTime).toLocaleString('en-ZA', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'To be determined';
              
              // Determine status color for email styling
              const statusColorMap: Record<string, string> = {
                'pending': '#f5a623',
                'accepted': '#0070f3',
                'driver_en_route_to_pickup': '#0070f3',
                'at_pickup': '#0070f3',
                'loading': '#0070f3',
                'in_transit': '#0070f3',
                'arriving': '#0070f3',
                'at_dropoff': '#0070f3',
                'unloading': '#0070f3',
                'completed': '#00c853',
                'cancelled': '#f44336',
              };
              const statusColor = statusColorMap[status] || '#0070f3';
              
              // Get driver info for the email if available
              let driverInfo = undefined;
              if (deliveryWithDetails.driver && deliveryWithDetails.driver.user) {
                const driver = deliveryWithDetails.driver;
                driverInfo = {
                  name: `${driver.user.firstName} ${driver.user.lastName}`,
                  phone: driver.user.phone,
                  vehicleType: driver.vehicleType,
                  vehicleColor: driver.vehicleColor,
                  vehicleMake: driver.vehicleMake,
                  vehicleModel: driver.vehicleModel,
                  licensePlate: driver.licensePlate
                };
              }
              
              // Clean status name for display
              const cleanStatusName = status.replace(/_/g, ' ').toUpperCase();
              
              // For completed deliveries, send completion email instead of status update
              if (status === 'completed') {
                // Get driver name if available
                let driverName = "Your delivery driver";
                if (deliveryWithDetails.driver && deliveryWithDetails.driver.user) {
                  driverName = `${deliveryWithDetails.driver.user.firstName} ${deliveryWithDetails.driver.user.lastName}`;
                }
                
                // Count delivery items
                const items = await deliveryStorage.getDeliveryItemsByDeliveryId(deliveryId);
                const itemCount = items.length || 1;
                
                // Format delivery date and time
                const now = new Date();
                const deliveryDate = now.toLocaleDateString('en-ZA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                
                const deliveryTime = now.toLocaleTimeString('en-ZA', {
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                });
                
                // Generate URLs for feedback
                const ratingUrl = `${baseUrl}/customer/deliveries/${deliveryId}/review`;
                const feedbackUrl = `${baseUrl}/customer/deliveries/${deliveryId}/feedback`;
                
                // Send completion email
                sendDeliveryCompleteEmail(
                  customer.email,
                  `${customer.firstName} ${customer.lastName}`,
                  deliveryId.toString(),
                  deliveryDate,
                  deliveryTime,
                  dropoffAddressFormatted,
                  itemCount,
                  driverName,
                  ratingUrl,
                  feedbackUrl
                ).catch(emailError => {
                  console.error('Error sending delivery completion email:', emailError);
                });
              } else {
                // Send the status update email for non-completed statuses
                sendDeliveryStatusEmail(
                  customer.email,
                  `${customer.firstName} ${customer.lastName}`,
                  deliveryId.toString(),
                  cleanStatusName,
                  statusMessage,
                  updateTime,
                  trackingUrl,
                  statusColor,
                  estimatedDeliveryTime,
                  driverInfo
                ).catch(emailError => {
                  console.error('Error sending delivery status email:', emailError);
                });
              }
            }
          }
        } catch (emailError) {
          console.error('Error preparing delivery status email:', emailError);
        }
      }
      
      // For auto-transition modes, check if we should auto-transition to the next status
      if (autoTransition && status !== 'completed' && status !== 'cancelled') {
        // Schedule the next status update (in a real system, this would be a background job)
        // For now, we'll just log that it would happen
        const nextStatusMap: Record<string, { status: string, delayMinutes: number }> = {
          'accepted': { status: 'driver_en_route_to_pickup', delayMinutes: 1 },
          'driver_en_route_to_pickup': { status: 'at_pickup', delayMinutes: 10 },
          'at_pickup': { status: 'loading', delayMinutes: 5 },
          'loading': { status: 'in_transit', delayMinutes: 5 },
          'in_transit': { status: 'arriving', delayMinutes: 15 },
          'arriving': { status: 'at_dropoff', delayMinutes: 5 },
          'at_dropoff': { status: 'unloading', delayMinutes: 5 },
          'unloading': { status: 'completed', delayMinutes: 5 }
        };
        
        const nextTransition = nextStatusMap[status];
        if (nextTransition) {
          console.log(`Auto-transition scheduled: Delivery ${deliveryId} will move from ${status} to ${nextTransition.status} in ${nextTransition.delayMinutes} minutes`);
          
          // In a production system, this would involve a background task scheduler
          // For demo purposes, we'll just acknowledge the intent to auto-transition
        }
      }
      
      // Return updated delivery with additional info
      res.json({
        ...delivery,
        locationUpdate,
        statusTransition: {
          from: currentDelivery.status,
          to: status,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ error: 'Failed to update delivery status' });
    }
  });

  // Endpoint for drivers to accept or reject delivery requests
  app.post('/api/deliveries/:id/driver-response', async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const { driverId, action, reason } = req.body;
      
      if (!driverId || !action) {
        return res.status(400).json({ error: 'Driver ID and action are required' });
      }
      
      if (action !== 'accept' && action !== 'reject') {
        return res.status(400).json({ error: "Action must be 'accept' or 'reject'" });
      }
      
      // Check if the delivery is still available
      const delivery = await deliveryStorage.getDelivery(deliveryId);
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
      
      if (delivery.driverId && delivery.driverId !== driverId && action === 'accept') {
        return res.status(409).json({ error: 'Delivery has already been assigned to another driver' });
      }
      
      // Process the driver's response
      if (action === 'accept') {
        // If accepting, assign the driver to the delivery
        const updatedDelivery = await deliveryStorage.assignDriverToDelivery(deliveryId, driverId);
        
        // Update driver status to busy
        await deliveryStorage.updateDriver(driverId, {
          isAvailable: false,
          currentDeliveryId: deliveryId
        });
        
        // Get the driver details
        const driver = await deliveryStorage.getDriver(driverId);
        if (driver) {
          // Notify all clients subscribed to this delivery about the driver assignment
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
            const customer = deliveryWithDetails.customer;
            
            // Create in-app notification
            await deliveryStorage.createNotification({
              userId: customer.id,
              title: 'Driver Assigned',
              message: `${driver.user?.firstName} ${driver.user?.lastName} has been assigned to your delivery.`,
              type: 'delivery_update',
              referenceId: deliveryId
            });
            
            // Email notification code can be reused from the existing endpoint
            try {
              if (customer && customer.email) {
                // Get addresses for the email
                const pickupAddress = deliveryWithDetails.pickupAddress;
                const dropoffAddress = deliveryWithDetails.dropoffAddress;
                
                if (pickupAddress && dropoffAddress) {
                  // Format addresses
                  const pickupAddressFormatted = `${pickupAddress.addressLine1}, ${pickupAddress.city}, ${pickupAddress.province}, ${pickupAddress.zipCode}`;
                  const dropoffAddressFormatted = `${dropoffAddress.addressLine1}, ${dropoffAddress.city}, ${dropoffAddress.province}, ${dropoffAddress.zipCode}`;
                  
                  // Create tracking URL
                  const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
                  const trackingUrl = `${baseUrl}/customer/deliveries/${deliveryId}/track`;
                  
                  // Format scheduled date
                  const scheduledDate = deliveryWithDetails.scheduledPickupTime 
                    ? new Date(deliveryWithDetails.scheduledPickupTime).toLocaleDateString('en-ZA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'To be scheduled';
                  
                  // Format time window
                  const timeWindow = 'Flexible'; // Since we don't have explicit time window fields
                  
                  // Get driver initials for profile circle
                  const driverFirstName = driver.user?.firstName || '';
                  const driverLastName = driver.user?.lastName || '';
                  const driverInitials = (driverFirstName.charAt(0) + driverLastName.charAt(0)).toUpperCase();
                  
                  // Get driver rating info
                  const rating = driver.rating || 0;
                  const ratingCount = driver.ratingCount || 0;
                  
                  // Send the driver assignment email
                  sendDriverAssignedEmail(
                    customer.email,
                    `${customer.firstName} ${customer.lastName}`,
                    deliveryId.toString(),
                    `${driverFirstName} ${driverLastName}`,
                    driverInitials,
                    driver.user?.phone || 'Not available',
                    driver.vehicleType || 'Standard vehicle',
                    driver.vehicleColor || 'Not specified',
                    driver.vehicleMake || 'Not specified',
                    driver.vehicleModel || 'Not specified',
                    driver.licensePlate || 'Not available',
                    scheduledDate,
                    timeWindow,
                    pickupAddressFormatted,
                    dropoffAddressFormatted,
                    trackingUrl,
                    ratingCount,
                    rating
                  ).catch(emailError => {
                    console.error('Error sending driver assignment email:', emailError);
                  });
                }
              }
            } catch (emailError) {
              console.error('Error preparing driver assignment email:', emailError);
            }
          }
        }
        
        res.json({ 
          success: true, 
          message: 'Delivery accepted and assigned',
          delivery: updatedDelivery
        });
      } else {
        // If rejecting, log the rejection reason and notify the customer
        console.log(`Driver ${driverId} rejected delivery ${deliveryId}. Reason: ${reason || 'Not provided'}`);
        
        // Create a notification for the customer if this was a direct request
        if (delivery.status === 'pending' && delivery.requestedDriverId === driverId) {
          const deliveryWithDetails = await deliveryStorage.getDeliveryWithItems(deliveryId);
          if (deliveryWithDetails && deliveryWithDetails.customer) {
            // Create in-app notification
            await deliveryStorage.createNotification({
              userId: deliveryWithDetails.customer.id,
              title: 'Delivery Request Declined',
              message: `A driver has declined your delivery request. We're looking for another driver.`,
              type: 'delivery_update',
              referenceId: deliveryId
            });
          }
        }
        
        // Let the customer know that a driver has rejected their request
        wsService.broadcastToDelivery(deliveryId, {
          type: 'driver_rejected',
          payload: {
            deliveryId,
            timestamp: new Date().toISOString()
          }
        });
        
        res.json({ 
          success: true, 
          message: 'Delivery rejection recorded'
        });
      }
    } catch (error) {
      console.error('Error processing driver response:', error);
      res.status(500).json({ error: 'Failed to process driver response' });
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
          const customer = deliveryWithDetails.customer;
          
          // Create in-app notification
          await deliveryStorage.createNotification({
            userId: customer.id,
            title: 'Driver Assigned',
            message: `${driver.user?.firstName} ${driver.user?.lastName} has been assigned to your delivery.`,
            type: 'delivery_update',
            referenceId: deliveryId
          });
          
          // Send driver assignment email notification
          try {
            if (customer && customer.email) {
              // Get addresses for the email
              const pickupAddress = deliveryWithDetails.pickupAddress;
              const dropoffAddress = deliveryWithDetails.dropoffAddress;
              
              if (pickupAddress && dropoffAddress) {
                // Format addresses
                const pickupAddressFormatted = `${pickupAddress.addressLine1}, ${pickupAddress.city}, ${pickupAddress.province}, ${pickupAddress.zipCode}`;
                const dropoffAddressFormatted = `${dropoffAddress.addressLine1}, ${dropoffAddress.city}, ${dropoffAddress.province}, ${dropoffAddress.zipCode}`;
                
                // Create tracking URL
                const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
                const trackingUrl = `${baseUrl}/customer/deliveries/${deliveryId}/track`;
                
                // Format scheduled date
                const scheduledDate = deliveryWithDetails.scheduledPickupTime 
                  ? new Date(deliveryWithDetails.scheduledPickupTime).toLocaleDateString('en-ZA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'To be scheduled';
                
                // Format time window
                const timeWindow = 'Flexible'; // Since we don't have explicit time window fields
                
                // Get driver initials for profile circle
                const driverFirstName = driver.user?.firstName || '';
                const driverLastName = driver.user?.lastName || '';
                const driverInitials = (driverFirstName.charAt(0) + driverLastName.charAt(0)).toUpperCase();
                
                // Get driver rating info
                const rating = driver.rating || 0;
                const ratingCount = driver.ratingCount || 0;
                
                // Send the driver assignment email
                sendDriverAssignedEmail(
                  customer.email,
                  `${customer.firstName} ${customer.lastName}`,
                  deliveryId.toString(),
                  `${driverFirstName} ${driverLastName}`,
                  driverInitials,
                  driver.user?.phone || 'Not available',
                  driver.vehicleType || 'Standard vehicle',
                  driver.vehicleColor || 'Not specified',
                  driver.vehicleMake || 'Not specified',
                  driver.vehicleModel || 'Not specified',
                  driver.licensePlate || 'Not available',
                  scheduledDate,
                  timeWindow,
                  pickupAddressFormatted,
                  dropoffAddressFormatted,
                  trackingUrl,
                  ratingCount,
                  rating
                ).catch(emailError => {
                  console.error('Error sending driver assignment email:', emailError);
                });
              }
            }
          } catch (emailError) {
            console.error('Error preparing driver assignment email:', emailError);
          }
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
        const customer = deliveryWithDetails.customer;
        
        // Create in-app notification for the customer
        await deliveryStorage.createNotification({
          userId: customer.id,
          title: 'Payment Update',
          message: `Your payment for delivery #${payment.deliveryId} is now ${status}.`,
          type: 'payment_update',
          referenceId: payment.deliveryId
        });
        
        // Send payment confirmation email to customer if the payment was successful
        if (status === 'paid' && customer && customer.email) {
          try {
            // Get the delivery details
            const dropoffAddress = deliveryWithDetails.dropoffAddress;
            if (dropoffAddress) {
              // Format address for email
              const deliveryAddressFormatted = `${dropoffAddress.addressLine1}, ${dropoffAddress.city}, ${dropoffAddress.province}, ${dropoffAddress.zipCode}`;
              
              // Create tracking URL
              const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
              const trackingUrl = `${baseUrl}/customer/deliveries/${payment.deliveryId}/track`;
              
              // Get all delivery items
              const items = await deliveryStorage.getDeliveryItemsByDeliveryId(payment.deliveryId);
              const formattedItems = await Promise.all(items.map(async (item) => {
                const furniture = await deliveryStorage.getFurniture(item.furnitureId);
                return {
                  name: furniture ? furniture.name : `Item #${item.id}`,
                  quantity: item.quantity || 1,
                  specialHandling: item.notes || 'Standard handling'
                };
              }));
              
              // If there are no items added yet, add a placeholder item
              if (formattedItems.length === 0) {
                formattedItems.push({
                  name: deliveryWithDetails.requiredVehicleType === 'truck' ? 'Furniture delivery' : 'Package delivery',
                  quantity: 1,
                  specialHandling: 'Standard handling'
                });
              }
              
              // Format scheduled date
              const scheduledDate = deliveryWithDetails.scheduledPickupTime 
                ? new Date(deliveryWithDetails.scheduledPickupTime).toLocaleDateString('en-ZA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'To be scheduled';
              
              // Format amount
              const formattedAmount = `R ${parseFloat(payment.amount).toFixed(2)}`;
              
              // Prepare pickup address
              const pickupAddress = deliveryWithDetails.pickupAddress;
              const pickupAddressFormatted = pickupAddress 
                ? `${pickupAddress.addressLine1}, ${pickupAddress.city}, ${pickupAddress.province}, ${pickupAddress.zipCode}`
                : 'Not available';
              
              // Send a payment confirmation email
              sendDeliveryConfirmationEmail(
                customer.email,
                `${customer.firstName} ${customer.lastName}`,
                payment.deliveryId.toString(),
                scheduledDate,
                'Flexible', // Time window
                pickupAddressFormatted,
                deliveryAddressFormatted,
                formattedAmount,
                'PAID', // Payment status
                formattedItems,
                trackingUrl
              ).catch(emailError => {
                console.error('Error sending payment confirmation email:', emailError);
              });
            }
          } catch (emailError) {
            console.error('Error preparing payment confirmation email:', emailError);
          }
        }
        
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
async function sendDeliveryConfirmationEmailWithDetails(deliveryId: number): Promise<void> {
  // Get delivery details needed for the email
  const delivery = await deliveryStorage.getDeliveryWithItems(deliveryId);
  if (!delivery) return;
  
  const customer = await deliveryStorage.getCustomerByUserId(delivery.customerId);
  if (!customer) return;
  
  const user = await deliveryStorage.getUser(customer.userId);
  const pickupAddress = await deliveryStorage.getAddress(delivery.pickupAddressId);
  const deliveryAddress = await deliveryStorage.getAddress(delivery.dropoffAddressId);
  
  if (!user || !pickupAddress || !deliveryAddress) return;
  
  const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const trackingUrl = `${baseUrl}/customer/deliveries/${delivery.id}/track`;
  
  // Format addresses
  const pickupAddressFormatted = `${pickupAddress.addressLine1}, ${pickupAddress.city}, ${pickupAddress.province}, ${pickupAddress.zipCode}`;
  const deliveryAddressFormatted = `${deliveryAddress.addressLine1}, ${deliveryAddress.city}, ${deliveryAddress.province}, ${deliveryAddress.zipCode}`;
  
  // Format scheduled date
  const scheduledDate = delivery.scheduledPickupTime 
    ? new Date(delivery.scheduledPickupTime).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'To be scheduled';
  
  // Format time window
  const timeWindow = 'Flexible'; // Since we don't have explicit time window fields
  
  // Get delivery items/packages
  let items = [];
  
  // Check for packages first (used for both furniture and parcel deliveries)
  const packages = await deliveryStorage.getPackagesByDeliveryId(delivery.id);
  if (packages.length > 0) {
    items = packages.map(pkg => ({
      name: pkg.name,
      quantity: 1,
      specialHandling: pkg.requiresSpecialHandling ? 'Special handling required' : 'Standard handling'
    }));
  } else {
    // If no packages, check for delivery items (legacy furniture items)
    const deliveryItems = await deliveryStorage.getDeliveryItemsByDeliveryId(delivery.id);
    if (deliveryItems.length > 0) {
      items = await Promise.all(deliveryItems.map(async (item) => {
        const furniture = await deliveryStorage.getFurniture(item.furnitureId);
        return {
          name: furniture ? furniture.name : `Item #${item.id}`,
          quantity: item.quantity || 1,
          specialHandling: item.notes || 'Standard handling'
        };
      }));
    }
  }
  
  // If there are no items added yet, add a placeholder item based on delivery type
  if (items.length === 0) {
    items.push({
      name: delivery.requiredVehicleType === 'motorbike' ? 'Package delivery' : 'Furniture delivery',
      quantity: 1,
      specialHandling: 'Standard handling'
    });
  }
  
  // Format payment status
  const payment = await deliveryStorage.getPaymentByDeliveryId(delivery.id);
  const paymentStatus = payment ? payment.status : 'pending';
  
  // Send the confirmation email
  await sendDeliveryConfirmationEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    delivery.id.toString(),
    scheduledDate,
    timeWindow,
    pickupAddressFormatted,
    deliveryAddressFormatted,
    `R ${parseFloat(delivery.price).toFixed(2)}`,
    paymentStatus,
    items,
    trackingUrl
  );
}

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