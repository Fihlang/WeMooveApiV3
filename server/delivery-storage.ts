import { and, eq, or, like, desc, lt, gt, gte, lte, isNull, sql } from 'drizzle-orm';
import { db } from './db';
import * as schema from '../shared/db-schema';
import bcrypt from 'bcrypt';

import {
  User, InsertUser,
  Driver, InsertDriver, DriverWithUser,
  Customer, InsertCustomer,
  Address, InsertAddress,
  Delivery, InsertDelivery, DeliveryWithDetails,
  Package, InsertPackage,
  Payment, InsertPayment,
  Review, InsertReview,
  Message, InsertMessage,
  Notification, InsertNotification,
  Furniture, InsertFurniture,
  DeliveryItem, InsertDeliveryItem
} from '../shared/db-schema';

export interface IDeliveryStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerByUserId(userId: number): Promise<Customer | undefined>;
  
  // Driver operations
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByUserId(userId: number): Promise<Driver | undefined>;
  getDriversNearby(latitude: number, longitude: number, radius: number): Promise<DriverWithUser[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver>;
  updateDriverLocation(id: number, latitude: number, longitude: number): Promise<Driver>;
  
  // Address operations
  createAddress(address: InsertAddress): Promise<Address>;
  getAddressesByUserId(userId: number): Promise<Address[]>;
  getAddress(id: number): Promise<Address | undefined>;
  
  // Package operations
  createPackage(packageData: InsertPackage): Promise<Package>;
  getPackagesByDeliveryId(deliveryId: number): Promise<Package[]>;
  
  // Furniture operations
  getFurniture(id: number): Promise<Furniture | undefined>;
  getAllFurniture(): Promise<Furniture[]>;
  getFurnitureByCategory(category: string): Promise<Furniture[]>;
  createFurniture(furniture: InsertFurniture): Promise<Furniture>;
  
  // Delivery operations
  getDelivery(id: number): Promise<Delivery | undefined>;
  getDeliveryWithItems(id: number): Promise<DeliveryWithDetails | undefined>;
  getDeliveriesByCustomerId(customerId: number): Promise<Delivery[]>;
  getDeliveriesByDriverId(driverId: number): Promise<Delivery[]>;
  getActiveDeliveriesByDriverId(driverId: number): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDeliveryStatus(id: number, status: string): Promise<Delivery>;
  assignDriverToDelivery(deliveryId: number, driverId: number): Promise<Delivery>;
  
  // Delivery Item operations
  createDeliveryItem(item: InsertDeliveryItem): Promise<DeliveryItem>;
  getDeliveryItemsByDeliveryId(deliveryId: number): Promise<DeliveryItem[]>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByDriverId(driverId: number): Promise<Review[]>;
  getReviewsByCustomerId(customerId: number): Promise<Review[]>;
  getAverageDriverRating(driverId: number): Promise<number>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByDeliveryId(deliveryId: number): Promise<Payment | undefined>;
  updatePaymentStatus(id: number, status: string): Promise<Payment>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByDeliveryId(deliveryId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
}

export class DeliveryDatabaseStorage implements IDeliveryStorage {
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return users[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return users[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.passwordHash, saltRounds);
    
    const [user] = await db.insert(schema.users).values({
      ...userData,
      passwordHash,
    }).returning();
    
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    // If password is included, hash it
    if (userData.passwordHash) {
      const saltRounds = 10;
      userData.passwordHash = await bcrypt.hash(userData.passwordHash, saltRounds);
    }
    
    const [user] = await db.update(schema.users)
      .set(userData)
      .where(eq(schema.users.id, id))
      .returning();
    
    return user;
  }
  
  // Customer operations
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(schema.customers).values(customerData).returning();
    return customer;
  }
  
  async getCustomerByUserId(userId: number): Promise<Customer | undefined> {
    const customers = await db.select().from(schema.customers).where(eq(schema.customers.userId, userId)).limit(1);
    return customers[0];
  }
  
  // Address operations
  async createAddress(addressData: InsertAddress): Promise<Address> {
    const [address] = await db.insert(schema.addresses).values(addressData).returning();
    return address;
  }
  
  async getAddressesByUserId(userId: number): Promise<Address[]> {
    return db.select().from(schema.addresses).where(eq(schema.addresses.userId, userId));
  }
  
  async getAddress(id: number): Promise<Address | undefined> {
    const addresses = await db.select().from(schema.addresses).where(eq(schema.addresses.id, id)).limit(1);
    return addresses[0];
  }
  
  // Package operations
  async createPackage(packageData: InsertPackage): Promise<Package> {
    const [pkg] = await db.insert(schema.packages).values(packageData).returning();
    return pkg;
  }
  
  async getPackagesByDeliveryId(deliveryId: number): Promise<Package[]> {
    return db.select().from(schema.packages).where(eq(schema.packages.deliveryId, deliveryId));
  }

  // Driver operations
  async getDriver(id: number): Promise<Driver | undefined> {
    const drivers = await db.select().from(schema.drivers).where(eq(schema.drivers.id, id)).limit(1);
    return drivers[0];
  }

  async getDriverByUserId(userId: number): Promise<Driver | undefined> {
    const drivers = await db.select().from(schema.drivers).where(eq(schema.drivers.userId, userId)).limit(1);
    return drivers[0];
  }

  async getDriversNearby(latitude: number, longitude: number, radius: number): Promise<DriverWithUser[]> {
    // Using the Haversine formula to calculate distances
    const haversineFormula = sql`(
      6371 * acos(
        cos(radians(${latitude})) * 
        cos(radians(${schema.drivers.latitude})) * 
        cos(radians(${schema.drivers.longitude}) - radians(${longitude})) + 
        sin(radians(${latitude})) * 
        sin(radians(${schema.drivers.latitude}))
      )
    )`;
    
    const driversWithUsers = await db
      .select({
        driver: schema.drivers,
        user: schema.users
      })
      .from(schema.drivers)
      .innerJoin(schema.users, eq(schema.drivers.userId, schema.users.id))
      .where(and(
        eq(schema.drivers.isAvailable, true),
        lte(haversineFormula, radius)
      ));
    
    // Merge driver and user data
    return driversWithUsers.map(row => ({
      ...row.driver,
      user: row.user
    }));
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(schema.drivers).values(driverData).returning();
    return driver;
  }

  async updateDriver(id: number, driverData: Partial<InsertDriver>): Promise<Driver> {
    const [driver] = await db.update(schema.drivers)
      .set(driverData)
      .where(eq(schema.drivers.id, id))
      .returning();
    
    return driver;
  }

  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<Driver> {
    const [driver] = await db.update(schema.drivers)
      .set({ 
        latitude, 
        longitude 
      })
      .where(eq(schema.drivers.id, id))
      .returning();
    
    return driver;
  }

  // Furniture operations
  async getFurniture(id: number): Promise<Furniture | undefined> {
    const furnitureItems = await db.select().from(schema.furniture).where(eq(schema.furniture.id, id)).limit(1);
    return furnitureItems[0];
  }

  async getAllFurniture(): Promise<Furniture[]> {
    return db.select().from(schema.furniture).where(eq(schema.furniture.isAvailable, true));
  }

  async getFurnitureByCategory(category: string): Promise<Furniture[]> {
    return db.select().from(schema.furniture)
      .where(and(
        eq(schema.furniture.isAvailable, true),
        eq(schema.furniture.category, category)
      ));
  }

  async createFurniture(furnitureData: InsertFurniture): Promise<Furniture> {
    const [furniture] = await db.insert(schema.furniture).values(furnitureData).returning();
    return furniture;
  }

  // Delivery operations
  async getDelivery(id: number): Promise<Delivery | undefined> {
    const deliveries = await db.select().from(schema.deliveries).where(eq(schema.deliveries.id, id)).limit(1);
    return deliveries[0];
  }

  async getDeliveryWithItems(id: number): Promise<DeliveryWithDetails | undefined> {
    const deliveries = await db.select().from(schema.deliveries).where(eq(schema.deliveries.id, id)).limit(1);
    if (!deliveries.length) return undefined;
    
    const delivery = deliveries[0];
    
    // Get customer information
    const customers = await db
      .select({
        customer: schema.customers,
        user: schema.users
      })
      .from(schema.customers)
      .innerJoin(schema.users, eq(schema.customers.userId, schema.users.id))
      .where(eq(schema.customers.id, delivery.customerId))
      .limit(1);
    
    if (!customers.length) return undefined;
    
    // Get driver information if assigned
    let driver: (Driver & { user: User }) | undefined;
    if (delivery.driverId) {
      const drivers = await db
        .select({
          driver: schema.drivers,
          user: schema.users
        })
        .from(schema.drivers)
        .innerJoin(schema.users, eq(schema.drivers.userId, schema.users.id))
        .where(eq(schema.drivers.id, delivery.driverId))
        .limit(1);
      
      if (drivers.length) {
        driver = {
          ...drivers[0].driver,
          user: drivers[0].user
        };
      }
    }
    
    // Get addresses
    const pickupAddresses = await db.select().from(schema.addresses).where(eq(schema.addresses.id, delivery.pickupAddressId)).limit(1);
    const dropoffAddresses = await db.select().from(schema.addresses).where(eq(schema.addresses.id, delivery.dropoffAddressId)).limit(1);
    
    if (!pickupAddresses.length || !dropoffAddresses.length) return undefined;
    
    // Get packages
    const packages = await db.select().from(schema.packages).where(eq(schema.packages.deliveryId, delivery.id));
    
    // Get payment information
    const payments = await db.select().from(schema.payments).where(eq(schema.payments.deliveryId, delivery.id)).limit(1);
    
    return {
      ...delivery,
      customer: customers[0].user,
      driver,
      packages,
      pickupAddress: pickupAddresses[0],
      dropoffAddress: dropoffAddresses[0],
      payment: payments[0]
    };
  }

  async getDeliveriesByCustomerId(customerId: number): Promise<Delivery[]> {
    return db.select().from(schema.deliveries).where(eq(schema.deliveries.customerId, customerId));
  }

  async getDeliveriesByDriverId(driverId: number): Promise<Delivery[]> {
    return db.select().from(schema.deliveries).where(eq(schema.deliveries.driverId, driverId));
  }

  async getActiveDeliveriesByDriverId(driverId: number): Promise<Delivery[]> {
    return db.select().from(schema.deliveries)
      .where(and(
        eq(schema.deliveries.driverId, driverId),
        or(
          eq(schema.deliveries.status, "accepted"),
          eq(schema.deliveries.status, "driver_en_route_to_pickup"),
          eq(schema.deliveries.status, "at_pickup"),
          eq(schema.deliveries.status, "loading"),
          eq(schema.deliveries.status, "in_transit"),
          eq(schema.deliveries.status, "arriving"),
          eq(schema.deliveries.status, "at_dropoff"),
          eq(schema.deliveries.status, "unloading")
        )
      ));
  }

  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    const [delivery] = await db.insert(schema.deliveries).values(deliveryData).returning();
    return delivery;
  }

  async updateDeliveryStatus(id: number, status: string): Promise<Delivery> {
    const now = new Date();
    const updates: any = { status };
    
    // Update timestamps based on status
    if (status === "at_pickup") {
      updates.actualPickupTime = now;
    } else if (status === "completed") {
      updates.actualDeliveryTime = now;
    }
    
    const [delivery] = await db.update(schema.deliveries)
      .set({ 
        ...updates,
        updatedAt: now 
      })
      .where(eq(schema.deliveries.id, id))
      .returning();
    
    return delivery;
  }

  async assignDriverToDelivery(deliveryId: number, driverId: number): Promise<Delivery> {
    const [delivery] = await db.update(schema.deliveries)
      .set({ 
        driverId,
        status: "accepted",
        updatedAt: new Date()
      })
      .where(eq(schema.deliveries.id, deliveryId))
      .returning();
    
    return delivery;
  }

  // Delivery Item operations
  async createDeliveryItem(itemData: InsertDeliveryItem): Promise<DeliveryItem> {
    const [item] = await db.insert(schema.deliveryItems).values(itemData).returning();
    return item;
  }

  async getDeliveryItemsByDeliveryId(deliveryId: number): Promise<DeliveryItem[]> {
    return db.select().from(schema.deliveryItems).where(eq(schema.deliveryItems.deliveryId, deliveryId));
  }

  // Review operations
  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(schema.reviews).values(reviewData).returning();
    
    // If this is a review for a driver, update their average rating
    if (reviewData.revieweeId) {
      const driver = await this.getDriverByUserId(reviewData.revieweeId);
      if (driver) {
        const avgRating = await this.getAverageDriverRating(driver.id);
        await this.updateDriver(driver.id, { 
          rating: avgRating, 
          ratingCount: driver.ratingCount + 1 
        });
      }
    }
    
    return review;
  }

  async getReviewsByDriverId(driverId: number): Promise<Review[]> {
    const driver = await this.getDriver(driverId);
    if (!driver) return [];
    
    return db.select().from(schema.reviews).where(eq(schema.reviews.revieweeId, driver.userId));
  }

  async getReviewsByCustomerId(customerId: number): Promise<Review[]> {
    const customer = await db.select().from(schema.customers).where(eq(schema.customers.id, customerId)).limit(1);
    if (!customer.length) return [];
    
    return db.select().from(schema.reviews).where(eq(schema.reviews.revieweeId, customer[0].userId));
  }

  async getAverageDriverRating(driverId: number): Promise<number> {
    const driver = await this.getDriver(driverId);
    if (!driver) return 0;
    
    const result = await db.select({
      avgRating: sql<number>`AVG(${schema.reviews.rating})` 
    })
    .from(schema.reviews)
    .where(eq(schema.reviews.revieweeId, driver.userId));
    
    return result[0]?.avgRating || 0;
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(schema.payments).values(paymentData).returning();
    return payment;
  }

  async getPaymentByDeliveryId(deliveryId: number): Promise<Payment | undefined> {
    const payments = await db.select().from(schema.payments).where(eq(schema.payments.deliveryId, deliveryId)).limit(1);
    return payments[0];
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    const updates: any = { status };
    
    // If payment is successful, record the payment date
    if (status === "paid") {
      updates.paymentDate = new Date();
    }
    
    const [payment] = await db.update(schema.payments)
      .set(updates)
      .where(eq(schema.payments.id, id))
      .returning();
    
    return payment;
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(schema.messages).values(messageData).returning();
    return message;
  }

  async getMessagesByDeliveryId(deliveryId: number): Promise<Message[]> {
    return db.select().from(schema.messages)
      .where(eq(schema.messages.deliveryId, deliveryId))
      .orderBy(schema.messages.createdAt);
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const [message] = await db.update(schema.messages)
      .set({ isRead: true })
      .where(eq(schema.messages.id, id))
      .returning();
    
    return message;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(schema.notifications).values(notificationData).returning();
    return notification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return db.select().from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    return db.select().from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false)
      ))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, id))
      .returning();
    
    return notification;
  }
}

export const deliveryStorage = new DeliveryDatabaseStorage();